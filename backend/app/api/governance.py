"""
Governance API routes: Policies, Acknowledgements, Audits, Compliance Issues.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID
from datetime import datetime, timezone

from app.database.session import get_db
from app.api.deps import get_current_user, require_roles
from app.core.security import UserRole
from app.core.exceptions import NotFoundError
from app.models.governance import ESGPolicy, PolicyAcknowledgement, Audit, ComplianceIssue
from app.models.core import User, NotificationType
from app.services.notifications import notify_user
from app.schemas.common import PaginatedResponse, MessageResponse, IDResponse
from app.repositories.base import BaseRepository

router = APIRouter()


# ──────────────── Policies ────────────────

@router.get("/policies", response_model=PaginatedResponse)
async def list_policies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = BaseRepository(ESGPolicy, db)
    filters = {}
    if status:
        filters["status"] = status
    return await repo.paginate(page=page, page_size=page_size, filters=filters,
                                search_columns=["title"])


@router.post("/policies", response_model=IDResponse, status_code=201)
async def create_policy(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER)),
):
    data["created_by"] = current_user.id
    repo = BaseRepository(ESGPolicy, db)
    policy = await repo.create(**data)
    return IDResponse(id=policy.id, message="Policy created")


@router.get("/policies/{policy_id}")
async def get_policy(
    policy_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = BaseRepository(ESGPolicy, db)
    policy = await repo.get_by_id(policy_id)
    if not policy:
        raise NotFoundError("Policy", str(policy_id))
    return policy


@router.put("/policies/{policy_id}")
async def update_policy(
    policy_id: UUID, data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER)),
):
    repo = BaseRepository(ESGPolicy, db)
    policy = await repo.update(policy_id, **data)
    if not policy:
        raise NotFoundError("Policy", str(policy_id))
    return {"message": "Updated"}


@router.post("/policies/{policy_id}/acknowledge", response_model=MessageResponse)
async def acknowledge_policy(
    policy_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify policy exists
    policy_repo = BaseRepository(ESGPolicy, db)
    policy = await policy_repo.get_by_id(policy_id)
    if not policy:
        raise NotFoundError("Policy", str(policy_id))

    repo = BaseRepository(PolicyAcknowledgement, db)
    await repo.create(
        policy_id=policy_id,
        employee_id=current_user.id,
        acknowledged_at=datetime.now(timezone.utc),
    )
    return MessageResponse(message="Policy acknowledged")


@router.get("/policies/{policy_id}/acknowledgements", response_model=PaginatedResponse)
async def list_acknowledgements(
    policy_id: UUID,
    page: int = Query(1, ge=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER)),
):
    repo = BaseRepository(PolicyAcknowledgement, db)
    return await repo.paginate(page=page, filters={"policy_id": policy_id})


# ──────────────── Audits ────────────────

@router.get("/audits", response_model=PaginatedResponse)
async def list_audits(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    department_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(
        UserRole.ADMIN, UserRole.ESG_MANAGER, UserRole.AUDITOR
    )),
):
    repo = BaseRepository(Audit, db)
    filters = {}
    if status:
        filters["status"] = status
    if department_id:
        filters["department_id"] = department_id
    return await repo.paginate(page=page, page_size=page_size, filters=filters,
                                search_columns=["title"])


@router.post("/audits", response_model=IDResponse, status_code=201)
async def create_audit(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.AUDITOR)),
):
    data["auditor_id"] = current_user.id
    repo = BaseRepository(Audit, db)
    audit = await repo.create(**data)
    return IDResponse(id=audit.id, message="Audit created")


@router.put("/audits/{audit_id}")
async def update_audit(
    audit_id: UUID, data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.AUDITOR)),
):
    repo = BaseRepository(Audit, db)
    audit = await repo.update(audit_id, **data)
    if not audit:
        raise NotFoundError("Audit", str(audit_id))
    return {"message": "Updated"}


@router.put("/audits/{audit_id}/close", response_model=MessageResponse)
async def close_audit(
    audit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.AUDITOR)),
):
    repo = BaseRepository(Audit, db)
    audit = await repo.update(audit_id, status="closed")
    if not audit:
        raise NotFoundError("Audit", str(audit_id))
    return MessageResponse(message="Audit closed")


# ──────────────── Compliance Issues ────────────────

@router.get("/compliance-issues", response_model=PaginatedResponse)
async def list_compliance_issues(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    severity: Optional[str] = None,
    status: Optional[str] = None,
    audit_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(
        UserRole.ADMIN, UserRole.ESG_MANAGER, UserRole.AUDITOR
    )),
):
    repo = BaseRepository(ComplianceIssue, db)
    filters = {}
    if severity:
        filters["severity"] = severity
    if status:
        filters["status"] = status
    if audit_id:
        filters["audit_id"] = audit_id
    return await repo.paginate(page=page, page_size=page_size, filters=filters,
                                search_columns=["title", "description"])


@router.post("/compliance-issues", response_model=IDResponse, status_code=201)
async def create_compliance_issue(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.AUDITOR)),
):
    # owner_id and due_date are mandatory per problem statement
    if "owner_id" not in data or "due_date" not in data:
        from app.core.exceptions import BadRequestError
        raise BadRequestError("owner_id and due_date are required for compliance issues")
    data["created_by"] = current_user.id
    repo = BaseRepository(ComplianceIssue, db)
    issue = await repo.create(**data)
    await notify_user(
        db, issue.owner_id, "New compliance issue assigned",
        f"{issue.title} is due on {issue.due_date}.",
        NotificationType.COMPLIANCE_ISSUE, "/governance",
    )
    return IDResponse(id=issue.id, message="Compliance issue raised")


@router.put("/compliance-issues/{issue_id}/resolve", response_model=MessageResponse)
async def resolve_compliance_issue(
    issue_id: UUID,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.AUDITOR)),
):
    repo = BaseRepository(ComplianceIssue, db)
    issue = await repo.get_by_id(issue_id)
    if not issue:
        raise NotFoundError("Compliance Issue", str(issue_id))
    issue.status = "resolved"
    issue.resolution = data.get("resolution", "")
    issue.resolved_at = datetime.now(timezone.utc)
    await db.flush()
    return MessageResponse(message="Issue resolved")
