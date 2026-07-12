"""
Gamification API routes: Challenges, Participation, Badges, Rewards, Leaderboard.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from uuid import UUID
from datetime import datetime, timezone

from app.database.session import get_db
from app.api.deps import get_current_user, require_roles
from app.core.security import UserRole
from app.core.exceptions import NotFoundError, InsufficientXPError, OutOfStockError
from app.models.gamification import (
    Challenge, ChallengeParticipation, Badge, UserBadge, Reward, RewardRedemption,
)
from app.models.core import User, ESGConfiguration, NotificationType
from app.models.gamification import ChallengeStatus
from app.core.exceptions import BadRequestError, EvidenceRequiredError
from app.services.notifications import notify_user
from app.schemas.common import PaginatedResponse, MessageResponse, IDResponse
from app.repositories.base import BaseRepository

router = APIRouter()


def validate_challenge_transition(current_status, requested_status) -> ChallengeStatus:
    """Validate the official Draft -> Active -> Review -> Completed lifecycle."""
    try:
        current = ChallengeStatus(current_status)
        target = ChallengeStatus(requested_status)
    except (TypeError, ValueError):
        raise BadRequestError("A valid challenge status is required")
    allowed = {
        ChallengeStatus.DRAFT: {ChallengeStatus.ACTIVE, ChallengeStatus.ARCHIVED},
        ChallengeStatus.ACTIVE: {ChallengeStatus.UNDER_REVIEW, ChallengeStatus.ARCHIVED},
        ChallengeStatus.UNDER_REVIEW: {ChallengeStatus.COMPLETED, ChallengeStatus.ACTIVE, ChallengeStatus.ARCHIVED},
        ChallengeStatus.COMPLETED: {ChallengeStatus.ARCHIVED},
        ChallengeStatus.ARCHIVED: set(),
    }
    if target not in allowed[current]:
        raise BadRequestError(f"Invalid challenge transition: {current.value} -> {target.value}")
    return target


# ──────────────── Challenges ────────────────

@router.get("/challenges", response_model=PaginatedResponse)
async def list_challenges(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    difficulty: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = BaseRepository(Challenge, db)
    filters = {}
    if status:
        filters["status"] = status
    if difficulty:
        filters["difficulty"] = difficulty
    return await repo.paginate(page=page, page_size=page_size, filters=filters,
                                search_columns=["title", "description"])


@router.post("/challenges", response_model=IDResponse, status_code=201)
async def create_challenge(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER)),
):
    data["created_by"] = current_user.id
    repo = BaseRepository(Challenge, db)
    challenge = await repo.create(**data)
    return IDResponse(id=challenge.id, message="Challenge created")


@router.put("/challenges/{challenge_id}")
async def update_challenge(
    challenge_id: UUID, data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER)),
):
    repo = BaseRepository(Challenge, db)
    challenge = await repo.update(challenge_id, **data)
    if not challenge:
        raise NotFoundError("Challenge", str(challenge_id))
    return {"message": "Updated"}


@router.put("/challenges/{challenge_id}/status", response_model=MessageResponse)
async def change_challenge_status(
    challenge_id: UUID,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER)),
):
    repo = BaseRepository(Challenge, db)
    challenge = await repo.get_by_id(challenge_id)
    if not challenge:
        raise NotFoundError("Challenge", str(challenge_id))
    target = validate_challenge_transition(challenge.status, data.get("status"))
    challenge.status = target
    await db.flush()
    return MessageResponse(message=f"Challenge status updated to {target.value}")


# ──────────────── Challenge Participation ────────────────

@router.post("/challenges/{challenge_id}/join", response_model=IDResponse, status_code=201)
async def join_challenge(
    challenge_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.EMPLOYEE)),
):
    challenge_repo = BaseRepository(Challenge, db)
    challenge = await challenge_repo.get_by_id(challenge_id)
    if not challenge:
        raise NotFoundError("Challenge", str(challenge_id))
    if challenge.status != ChallengeStatus.ACTIVE:
        raise BadRequestError("Only active challenges can be joined")
    existing = await db.execute(
        select(ChallengeParticipation).where(
            ChallengeParticipation.challenge_id == challenge_id,
            ChallengeParticipation.employee_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise BadRequestError("You already joined this challenge")

    repo = BaseRepository(ChallengeParticipation, db)
    participation = await repo.create(
        challenge_id=challenge_id,
        employee_id=current_user.id,
    )
    return IDResponse(id=participation.id, message="Joined challenge")


@router.put("/challenge-participations/{cp_id}/approve", response_model=MessageResponse)
async def approve_challenge_participation(
    cp_id: UUID,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER)),
):
    repo = BaseRepository(ChallengeParticipation, db)
    cp = await repo.get_by_id(cp_id)
    if not cp:
        raise NotFoundError("Challenge Participation", str(cp_id))

    new_status = data.get("approval_status", "approved")
    if new_status not in {"approved", "rejected"}:
        raise BadRequestError("approval_status must be approved or rejected")
    if cp.approval_status.value != "pending":
        raise BadRequestError("This participation has already been reviewed")
    cp.approval_status = new_status
    cp.approved_by = current_user.id

    if new_status == "approved":
        # Award XP
        challenge_repo = BaseRepository(Challenge, db)
        challenge = await challenge_repo.get_by_id(cp.challenge_id)
        if challenge:
            if challenge.evidence_required and not cp.proof_url:
                raise EvidenceRequiredError()
            cp.xp_awarded = challenge.xp_reward
            cp.completed_at = datetime.now(timezone.utc)

            # Update user XP
            user_result = await db.execute(select(User).where(User.id == cp.employee_id))
            user = user_result.scalar_one_or_none()
            if user:
                user.xp_points += challenge.xp_reward

                # Check badge auto-award
                await _check_badge_auto_award(db, user)

                await notify_user(
                    db, user.id, "Challenge approved",
                    f"Your challenge submission earned {challenge.xp_reward} XP.",
                    NotificationType.CHALLENGE_UPDATE, "/gamification",
                )

    await db.flush()
    return MessageResponse(message=f"Challenge participation {new_status}")


async def _check_badge_auto_award(db: AsyncSession, user: User):
    """Auto-award badges when user meets unlock criteria (if enabled)."""
    config_result = await db.execute(
        select(ESGConfiguration).where(ESGConfiguration.key == "badge_auto_award")
    )
    config = config_result.scalar_one_or_none()
    if not config or config.value.lower() != "true":
        return

    # Get all badges not yet awarded to user
    awarded_result = await db.execute(
        select(UserBadge.badge_id).where(UserBadge.user_id == user.id)
    )
    awarded_ids = {row[0] for row in awarded_result.all()}

    all_badges_result = await db.execute(select(Badge).where(Badge.status == "active"))
    all_badges = all_badges_result.scalars().all()

    # Count completed challenges
    completed_result = await db.execute(
        select(func.count()).select_from(ChallengeParticipation)
        .where(ChallengeParticipation.employee_id == user.id)
        .where(ChallengeParticipation.approval_status == "approved")
    )
    completed_count = completed_result.scalar() or 0

    for badge in all_badges:
        if badge.id in awarded_ids:
            continue

        should_award = False
        if badge.unlock_rule_type.value == "xp_threshold" and user.xp_points >= badge.unlock_rule_value:
            should_award = True
        elif badge.unlock_rule_type.value == "challenge_count" and completed_count >= badge.unlock_rule_value:
            should_award = True

        if should_award:
            db.add(UserBadge(
                user_id=user.id,
                badge_id=badge.id,
                awarded_at=datetime.now(timezone.utc),
            ))
            await notify_user(
                db, user.id, "Badge unlocked",
                f"You unlocked the {badge.name} badge.",
                NotificationType.BADGE_UNLOCK, "/gamification",
            )


# ──────────────── Badges ────────────────

@router.get("/badges", response_model=PaginatedResponse)
async def list_badges(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = BaseRepository(Badge, db)
    return await repo.paginate(page=page, page_size=page_size)


@router.post("/badges", response_model=IDResponse, status_code=201)
async def create_badge(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    repo = BaseRepository(Badge, db)
    badge = await repo.create(**data)
    return IDResponse(id=badge.id, message="Badge created")


@router.get("/badges/my")
async def my_badges(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UserBadge).where(UserBadge.user_id == current_user.id)
    )
    return list(result.scalars().all())


# ──────────────── Rewards ────────────────

@router.get("/rewards", response_model=PaginatedResponse)
async def list_rewards(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = BaseRepository(Reward, db)
    return await repo.paginate(page=page, page_size=page_size, filters={"status": "active"})


@router.post("/rewards", response_model=IDResponse, status_code=201)
async def create_reward(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    repo = BaseRepository(Reward, db)
    reward = await repo.create(**data)
    return IDResponse(id=reward.id, message="Reward created")


@router.post("/rewards/{reward_id}/redeem", response_model=MessageResponse)
async def redeem_reward(
    reward_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.EMPLOYEE)),
):
    reward_repo = BaseRepository(Reward, db)
    reward = await reward_repo.get_by_id(reward_id)
    if not reward:
        raise NotFoundError("Reward", str(reward_id))

    # Check stock
    if reward.stock <= 0:
        raise OutOfStockError(reward.name)

    # Check XP balance
    if current_user.xp_points < reward.points_required:
        raise InsufficientXPError(reward.points_required, current_user.xp_points)

    # Deduct XP and stock
    current_user.xp_points -= reward.points_required
    reward.stock -= 1

    # Create redemption record
    redemption_repo = BaseRepository(RewardRedemption, db)
    await redemption_repo.create(
        reward_id=reward_id,
        employee_id=current_user.id,
        points_spent=reward.points_required,
    )
    await notify_user(
        db, current_user.id, "Reward redeemed",
        f"{reward.name} was redeemed for {reward.points_required} XP.",
        NotificationType.REWARD_REDEEMED, "/gamification",
    )
    await db.flush()

    return MessageResponse(message=f"Reward '{reward.name}' redeemed successfully")


# ──────────────── Leaderboard ────────────────

@router.get("/leaderboard")
async def global_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(User)
        .where(User.is_active == True)
        .where(User.role == "employee")
        .order_by(User.xp_points.desc())
        .limit(limit)
    )
    users = result.scalars().all()
    return [
        {
            "rank": i + 1,
            "id": str(u.id),
            "name": f"{u.first_name} {u.last_name}",
            "xp_points": u.xp_points,
            "department_id": str(u.department_id) if u.department_id else None,
        }
        for i, u in enumerate(users)
    ]


@router.get("/leaderboard/department/{dept_id}")
async def department_leaderboard(
    dept_id: UUID,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(User)
        .where(User.is_active == True)
        .where(User.department_id == dept_id)
        .order_by(User.xp_points.desc())
        .limit(limit)
    )
    users = result.scalars().all()
    return [
        {
            "rank": i + 1,
            "id": str(u.id),
            "name": f"{u.first_name} {u.last_name}",
            "xp_points": u.xp_points,
        }
        for i, u in enumerate(users)
    ]
