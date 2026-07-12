"""
Social API routes: CSR Activities, Employee Participation, Diversity Metrics, Training.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID

from app.database.session import get_db
from app.api.deps import get_current_user, require_roles
from app.core.security import UserRole
from app.core.exceptions import NotFoundError, EvidenceRequiredError, BadRequestError
from app.models.social import CSRActivity, EmployeeParticipation, DiversityMetric, Training, ApprovalStatus
from app.models.core import User, ESGConfiguration, NotificationType
from app.services.notifications import notify_user
from app.schemas.common import PaginatedResponse, MessageResponse, IDResponse
from app.repositories.base import BaseRepository

router = APIRouter()


# ──────────────── CSR Activities ────────────────

@router.get("/csr-activities", response_model=PaginatedResponse)
async def list_csr_activities(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    category_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = BaseRepository(CSRActivity, db)
    filters = {}
    if status:
        filters["status"] = status
    if category_id:
        filters["category_id"] = category_id
    return await repo.paginate(page=page, page_size=page_size, filters=filters,
                                search_columns=["title", "description"])


@router.post("/csr-activities", response_model=IDResponse, status_code=201)
async def create_csr_activity(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER)),
):
    data["created_by"] = current_user.id
    repo = BaseRepository(CSRActivity, db)
    activity = await repo.create(**data)
    return IDResponse(id=activity.id, message="CSR Activity created")


@router.get("/csr-activities/{activity_id}")
async def get_csr_activity(
    activity_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = BaseRepository(CSRActivity, db)
    activity = await repo.get_by_id(activity_id)
    if not activity:
        raise NotFoundError("CSR Activity", str(activity_id))
    return activity


@router.put("/csr-activities/{activity_id}")
async def update_csr_activity(
    activity_id: UUID, data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER)),
):
    repo = BaseRepository(CSRActivity, db)
    activity = await repo.update(activity_id, **data)
    if not activity:
        raise NotFoundError("CSR Activity", str(activity_id))
    return {"message": "Updated"}


# ──────────────── Employee Participation ────────────────

@router.get("/participations", response_model=PaginatedResponse)
async def list_participations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    activity_id: Optional[UUID] = None,
    approval_status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(
        UserRole.ADMIN, UserRole.ESG_MANAGER, UserRole.DEPARTMENT_HEAD
    )),
):
    repo = BaseRepository(EmployeeParticipation, db)
    filters = {}
    if activity_id:
        filters["activity_id"] = activity_id
    if approval_status:
        filters["approval_status"] = approval_status
    return await repo.paginate(page=page, page_size=page_size, filters=filters)


@router.post("/participations", response_model=IDResponse, status_code=201)
async def join_activity(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.EMPLOYEE)),
):
    data["employee_id"] = current_user.id
    repo = BaseRepository(EmployeeParticipation, db)
    participation = await repo.create(**data)
    return IDResponse(id=participation.id, message="Joined activity")


@router.put("/participations/{p_id}/approve", response_model=MessageResponse)
async def approve_participation(
    p_id: UUID,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(
        UserRole.ADMIN, UserRole.ESG_MANAGER, UserRole.DEPARTMENT_HEAD
    )),
):
    repo = BaseRepository(EmployeeParticipation, db)
    participation = await repo.get_by_id(p_id)
    if not participation:
        raise NotFoundError("Participation", str(p_id))

    new_status = data.get("approval_status", "approved")

    # Check evidence requirement if approving
    if new_status == "approved":
        from sqlalchemy import select
        config_result = await db.execute(
            select(ESGConfiguration).where(ESGConfiguration.key == "evidence_required")
        )
        config = config_result.scalar_one_or_none()
        evidence_required = config and config.value.lower() == "true"
        if evidence_required and not participation.proof_url:
            raise EvidenceRequiredError()

        # Award points
        activity_repo = BaseRepository(CSRActivity, db)
        activity = await activity_repo.get_by_id(participation.activity_id)
        if activity:
            participation.points_earned = activity.points_awarded
            # Update user XP
            user_repo = BaseRepository(User, db)
            user = await user_repo.get_by_id(participation.employee_id)
            if user:
                user.xp_points += activity.points_awarded
                await db.flush()

    participation.approval_status = new_status
    participation.approved_by = current_user.id
    await notify_user(
        db, participation.employee_id, "CSR participation reviewed",
        f"Your CSR participation was {new_status}.",
        NotificationType.CSR_APPROVAL, "/social",
    )
    await db.flush()

    return MessageResponse(message=f"Participation {new_status}")


@router.get("/participations/my", response_model=PaginatedResponse)
async def my_participations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = BaseRepository(EmployeeParticipation, db)
    return await repo.paginate(
        page=page, page_size=page_size,
        filters={"employee_id": current_user.id},
    )


# ──────────────── Diversity Metrics ────────────────

@router.get("/diversity-metrics", response_model=PaginatedResponse)
async def list_diversity_metrics(
    page: int = Query(1, ge=1),
    department_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(
        UserRole.ADMIN, UserRole.ESG_MANAGER, UserRole.DEPARTMENT_HEAD
    )),
):
    repo = BaseRepository(DiversityMetric, db)
    filters = {}
    if department_id:
        filters["department_id"] = department_id
    return await repo.paginate(page=page, filters=filters)


@router.post("/diversity-metrics", response_model=IDResponse, status_code=201)
async def create_diversity_metric(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER)),
):
    repo = BaseRepository(DiversityMetric, db)
    metric = await repo.create(**data)
    return IDResponse(id=metric.id, message="Diversity metric created")


# ──────────────── Training ────────────────

@router.get("/trainings", response_model=PaginatedResponse)
async def list_trainings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = BaseRepository(Training, db)
    return await repo.paginate(page=page, page_size=page_size)


@router.post("/trainings", response_model=IDResponse, status_code=201)
async def create_training(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER)),
):
    repo = BaseRepository(Training, db)
    training = await repo.create(**data)
    return IDResponse(id=training.id, message="Training created")
