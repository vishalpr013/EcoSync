"""
Admin API routes: Users CRUD, Departments, Categories, Settings.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from uuid import UUID

from app.database.session import get_db
from app.api.deps import get_current_user, require_roles
from app.core.security import UserRole, hash_password
from app.core.exceptions import NotFoundError, DuplicateError
from app.models.core import User, Department, Category, ESGConfiguration
from app.schemas.core import (
    UserCreate, UserUpdate, UserResponse,
    DepartmentCreate, DepartmentUpdate, DepartmentResponse,
    CategoryCreate, CategoryUpdate, CategoryResponse,
)
from app.schemas.common import PaginatedResponse, MessageResponse, IDResponse
from app.repositories.base import BaseRepository

router = APIRouter()


# ──────────────── Users ────────────────

@router.get("/users", response_model=PaginatedResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    repo = BaseRepository(User, db)
    filters = {}
    if role:
        filters["role"] = role
    result = await repo.paginate(
        page=page, page_size=page_size, filters=filters,
        search_columns=["email", "first_name", "last_name"], search_term=search,
    )
    result["items"] = [UserResponse.model_validate(u) for u in result["items"]]
    return result


@router.post("/users", response_model=IDResponse, status_code=201)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise DuplicateError("User", "email")
    repo = BaseRepository(User, db)
    user = await repo.create(
        email=data.email,
        password_hash=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        role=data.role,
        department_id=data.department_id,
    )
    return IDResponse(id=user.id, message="User created successfully")


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    repo = BaseRepository(User, db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise NotFoundError("User", str(user_id))
    return UserResponse.model_validate(user)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    repo = BaseRepository(User, db)
    user = await repo.update(user_id, **data.model_dump(exclude_unset=True))
    if not user:
        raise NotFoundError("User", str(user_id))
    return UserResponse.model_validate(user)


@router.delete("/users/{user_id}", response_model=MessageResponse)
async def deactivate_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    repo = BaseRepository(User, db)
    user = await repo.update(user_id, is_active=False)
    if not user:
        raise NotFoundError("User", str(user_id))
    return MessageResponse(message="User deactivated")


# ──────────────── Departments ────────────────

@router.get("/departments", response_model=PaginatedResponse)
async def list_departments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = BaseRepository(Department, db)
    result = await repo.paginate(
        page=page, page_size=page_size,
        search_columns=["name", "code"], search_term=search,
    )
    result["items"] = [DepartmentResponse.model_validate(d) for d in result["items"]]
    return result


@router.post("/departments", response_model=IDResponse, status_code=201)
async def create_department(
    data: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    repo = BaseRepository(Department, db)
    dept = await repo.create(**data.model_dump())
    return IDResponse(id=dept.id, message="Department created successfully")


@router.put("/departments/{dept_id}", response_model=DepartmentResponse)
async def update_department(
    dept_id: UUID,
    data: DepartmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    repo = BaseRepository(Department, db)
    dept = await repo.update(dept_id, **data.model_dump(exclude_unset=True))
    if not dept:
        raise NotFoundError("Department", str(dept_id))
    return DepartmentResponse.model_validate(dept)


@router.delete("/departments/{dept_id}", response_model=MessageResponse)
async def delete_department(
    dept_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    repo = BaseRepository(Department, db)
    await repo.update(dept_id, status="inactive")
    return MessageResponse(message="Department deactivated")


# ──────────────── Categories ────────────────

@router.get("/categories", response_model=PaginatedResponse)
async def list_categories(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = BaseRepository(Category, db)
    filters = {}
    if type:
        filters["type"] = type
    result = await repo.paginate(
        page=page, page_size=page_size, filters=filters,
        search_columns=["name"], search_term=None,
    )
    result["items"] = [CategoryResponse.model_validate(c) for c in result["items"]]
    return result


@router.post("/categories", response_model=IDResponse, status_code=201)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    repo = BaseRepository(Category, db)
    cat = await repo.create(**data.model_dump())
    return IDResponse(id=cat.id, message="Category created successfully")


@router.put("/categories/{cat_id}", response_model=CategoryResponse)
async def update_category(
    cat_id: UUID,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    repo = BaseRepository(Category, db)
    cat = await repo.update(cat_id, **data.model_dump(exclude_unset=True))
    if not cat:
        raise NotFoundError("Category", str(cat_id))
    return CategoryResponse.model_validate(cat)


# ──────────────── Settings ────────────────

@router.get("/settings")
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    result = await db.execute(select(ESGConfiguration))
    configs = result.scalars().all()
    return {c.key: c.value for c in configs}


@router.put("/settings", response_model=MessageResponse)
async def update_settings(
    settings_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    weight_keys = ("env_weight", "social_weight", "governance_weight")
    if any(key in settings_data for key in weight_keys):
        existing = {c.key: c.value for c in (await db.execute(select(ESGConfiguration))).scalars()}
        merged = {key: settings_data.get(key, existing.get(key, 0)) for key in weight_keys}
        try:
            weights = {key: int(value) for key, value in merged.items()}
        except (TypeError, ValueError):
            from app.core.exceptions import BadRequestError
            raise BadRequestError("ESG weights must be whole-number percentages")
        if any(value < 0 or value > 100 for value in weights.values()) or sum(weights.values()) != 100:
            from app.core.exceptions import BadRequestError
            raise BadRequestError("Environmental, social, and governance weights must total 100")
    for key, value in settings_data.items():
        result = await db.execute(select(ESGConfiguration).where(ESGConfiguration.key == key))
        config = result.scalar_one_or_none()
        if config:
            config.value = str(value)
            config.updated_by = current_user.id
        else:
            db.add(ESGConfiguration(key=key, value=str(value), updated_by=current_user.id))
    await db.flush()
    return MessageResponse(message="Settings updated successfully")
