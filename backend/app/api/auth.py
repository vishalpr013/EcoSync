"""
Auth API routes: login, refresh, me, change-password.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.core import User
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest, ChangePasswordRequest, UserBrief
from app.schemas.common import MessageResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT tokens."""
    service = AuthService(db)
    return await service.login(request)


@router.post("/refresh")
async def refresh_token(request: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Refresh access token using refresh token."""
    service = AuthService(db)
    return await service.refresh_token(request.refresh_token)


@router.get("/me", response_model=UserBrief)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return UserBrief.model_validate(current_user)


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change current user's password."""
    service = AuthService(db)
    await service.change_password(current_user, request.current_password, request.new_password)
    return MessageResponse(message="Password changed successfully")
