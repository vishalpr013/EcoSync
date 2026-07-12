"""
Auth schemas: login request, token response, password change.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserBrief"


class RefreshRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UserBrief(BaseModel):
    id: UUID
    email: str
    first_name: str
    last_name: str
    role: str
    department_id: Optional[UUID] = None
    avatar_url: Optional[str] = None
    xp_points: int = 0

    model_config = {"from_attributes": True}


# Resolve forward reference
TokenResponse.model_rebuild()
