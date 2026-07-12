"""
Core schemas: User, Department, Category, Notification CRUD schemas.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import datetime


# ──────────────── User Schemas ────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str = "employee"
    department_id: Optional[UUID] = None


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    department_id: Optional[UUID] = None
    is_active: Optional[bool] = None
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    first_name: str
    last_name: str
    role: str
    department_id: Optional[UUID] = None
    avatar_url: Optional[str] = None
    xp_points: int = 0
    is_active: bool = True
    last_login: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ──────────────── Department Schemas ────────────────

class DepartmentCreate(BaseModel):
    name: str
    code: str
    head_id: Optional[UUID] = None
    parent_department_id: Optional[UUID] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    head_id: Optional[UUID] = None
    parent_department_id: Optional[UUID] = None
    status: Optional[str] = None


class DepartmentResponse(BaseModel):
    id: UUID
    name: str
    code: str
    head_id: Optional[UUID] = None
    parent_department_id: Optional[UUID] = None
    employee_count: int = 0
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ──────────────── Category Schemas ────────────────

class CategoryCreate(BaseModel):
    name: str
    type: str  # csr_activity | challenge
    description: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class CategoryResponse(BaseModel):
    id: UUID
    name: str
    type: str
    description: Optional[str] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ──────────────── Notification Schemas ────────────────

class NotificationResponse(BaseModel):
    id: UUID
    title: str
    message: str
    type: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
