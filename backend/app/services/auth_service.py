"""
Authentication service: login, token creation, user validation.
"""
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.core import User
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.exceptions import NotFoundError, BadRequestError
from app.schemas.auth import LoginRequest, TokenResponse, UserBrief


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def login(self, request: LoginRequest) -> TokenResponse:
        result = await self.db.execute(select(User).where(User.email == request.email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(request.password, user.password_hash):
            raise BadRequestError("Invalid email or password")
        if not user.is_active:
            raise BadRequestError("Account is deactivated")

        # Update last login
        user.last_login = datetime.now(timezone.utc)
        await self.db.flush()

        # Create tokens
        token_data = {"sub": str(user.id), "role": user.role.value if hasattr(user.role, 'value') else user.role}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserBrief.model_validate(user),
        )

    async def refresh_token(self, refresh_token_str: str) -> dict:
        payload = decode_token(refresh_token_str)
        if payload.get("type") != "refresh":
            raise BadRequestError("Invalid refresh token")

        user_id = payload.get("sub")
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise BadRequestError("User not found or inactive")

        token_data = {"sub": str(user.id), "role": user.role.value if hasattr(user.role, 'value') else user.role}
        return {
            "access_token": create_access_token(token_data),
            "refresh_token": create_refresh_token(token_data),
            "token_type": "bearer",
        }

    async def change_password(self, user: User, current_password: str, new_password: str) -> bool:
        if not verify_password(current_password, user.password_hash):
            raise BadRequestError("Current password is incorrect")
        user.password_hash = hash_password(new_password)
        await self.db.flush()
        return True
