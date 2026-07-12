"""
Environmental API routes: Emission Factors, Carbon Transactions, Products, Goals.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from uuid import UUID
from decimal import Decimal

from app.database.session import get_db
from app.api.deps import get_current_user, require_roles
from app.core.security import UserRole
from app.core.exceptions import NotFoundError
from app.models.environmental import (
    EmissionFactor, CarbonTransaction, Product, ProductESGProfile,
    EnvironmentalGoal, GoalProgress,
)
from app.models.core import User, ESGConfiguration
from app.core.exceptions import BadRequestError
from app.schemas.common import PaginatedResponse, MessageResponse, IDResponse
from app.repositories.base import BaseRepository

router = APIRouter()


# ──────────────── Emission Factors ────────────────

@router.get("/emission-factors", response_model=PaginatedResponse)
async def list_emission_factors(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    scope: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER)),
):
    repo = BaseRepository(EmissionFactor, db)
    filters = {}
    if scope:
        filters["scope"] = scope
    result = await repo.paginate(
        page=page, page_size=page_size, filters=filters,
        search_columns=["name", "category"], search_term=search,
    )
    return result


@router.post("/emission-factors", response_model=IDResponse, status_code=201)
async def create_emission_factor(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    repo = BaseRepository(EmissionFactor, db)
    ef = await repo.create(**data)
    return IDResponse(id=ef.id, message="Emission factor created")


@router.put("/emission-factors/{ef_id}")
async def update_emission_factor(
    ef_id: UUID, data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    repo = BaseRepository(EmissionFactor, db)
    ef = await repo.update(ef_id, **data)
    if not ef:
        raise NotFoundError("Emission Factor", str(ef_id))
    return {"message": "Updated"}


@router.delete("/emission-factors/{ef_id}", response_model=MessageResponse)
async def delete_emission_factor(
    ef_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    repo = BaseRepository(EmissionFactor, db)
    await repo.update(ef_id, status="inactive")
    return MessageResponse(message="Emission factor deactivated")


# ──────────────── Carbon Transactions ────────────────

@router.get("/carbon-transactions", response_model=PaginatedResponse)
async def list_carbon_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    department_id: Optional[UUID] = None,
    source_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(
        UserRole.ADMIN, UserRole.ESG_MANAGER, UserRole.DEPARTMENT_HEAD
    )),
):
    repo = BaseRepository(CarbonTransaction, db)
    filters = {}
    if department_id:
        filters["department_id"] = department_id
    if source_type:
        filters["source_type"] = source_type
    result = await repo.paginate(page=page, page_size=page_size, filters=filters)
    return result


@router.post("/carbon-transactions", response_model=IDResponse, status_code=201)
async def create_carbon_transaction(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER)),
):
    config_result = await db.execute(
        select(ESGConfiguration).where(ESGConfiguration.key.in_(["auto_emission_calculation", "auto_emission"]))
        .order_by(ESGConfiguration.key.desc()).limit(1)
    )
    config = config_result.scalar_one_or_none()
    auto_enabled = not config or config.value.lower() == "true"

    # Auto-calculate from the linked factor when enabled; otherwise require an explicit value.
    if "emission_factor_id" in data and "quantity" in data:
        ef_repo = BaseRepository(EmissionFactor, db)
        ef = await ef_repo.get_by_id(data["emission_factor_id"])
        if ef:
            if auto_enabled:
                data["calculated_emission"] = float(Decimal(str(data["quantity"])) * ef.factor_value)
                data["is_auto_calculated"] = True
            elif "calculated_emission" not in data:
                raise BadRequestError("calculated_emission is required when automatic calculation is disabled")
    data["created_by"] = current_user.id
    repo = BaseRepository(CarbonTransaction, db)
    ct = await repo.create(**data)
    return IDResponse(id=ct.id, message="Carbon transaction created")


@router.get("/carbon-transactions/summary")
async def carbon_summary(
    department_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(
        UserRole.ADMIN, UserRole.ESG_MANAGER, UserRole.DEPARTMENT_HEAD
    )),
):
    from sqlalchemy import func, select as sa_select
    query = sa_select(
        func.sum(CarbonTransaction.calculated_emission).label("total_emissions"),
        func.count(CarbonTransaction.id).label("transaction_count"),
    )
    if department_id:
        query = query.where(CarbonTransaction.department_id == department_id)
    result = await db.execute(query)
    row = result.one()
    return {
        "total_emissions": float(row.total_emissions or 0),
        "transaction_count": row.transaction_count,
    }


# ──────────────── Products ────────────────

@router.get("/products", response_model=PaginatedResponse)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER)),
):
    repo = BaseRepository(Product, db)
    return await repo.paginate(page=page, page_size=page_size)


@router.post("/products", response_model=IDResponse, status_code=201)
async def create_product(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    repo = BaseRepository(Product, db)
    product = await repo.create(**data)
    return IDResponse(id=product.id, message="Product created")


# ──────────────── Environmental Goals ────────────────

@router.get("/goals", response_model=PaginatedResponse)
async def list_goals(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    department_id: Optional[UUID] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(
        UserRole.ADMIN, UserRole.ESG_MANAGER, UserRole.DEPARTMENT_HEAD
    )),
):
    repo = BaseRepository(EnvironmentalGoal, db)
    filters = {}
    if department_id:
        filters["department_id"] = department_id
    if status:
        filters["status"] = status
    return await repo.paginate(page=page, page_size=page_size, filters=filters)


@router.post("/goals", response_model=IDResponse, status_code=201)
async def create_goal(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER)),
):
    data["created_by"] = current_user.id
    repo = BaseRepository(EnvironmentalGoal, db)
    goal = await repo.create(**data)
    return IDResponse(id=goal.id, message="Goal created")


@router.post("/goals/{goal_id}/progress", response_model=MessageResponse)
async def record_progress(
    goal_id: UUID,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER)),
):
    # Verify goal exists
    goal_repo = BaseRepository(EnvironmentalGoal, db)
    goal = await goal_repo.get_by_id(goal_id)
    if not goal:
        raise NotFoundError("Goal", str(goal_id))

    # Record progress
    progress_repo = BaseRepository(GoalProgress, db)
    await progress_repo.create(goal_id=goal_id, **data)

    # Update current value on goal
    goal.current_value = data.get("recorded_value", goal.current_value)
    await db.flush()

    return MessageResponse(message="Progress recorded")
