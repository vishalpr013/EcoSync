"""
Gamification models: Challenge, ChallengeParticipation, Badge, UserBadge, Reward, RewardRedemption.
"""
from sqlalchemy import Column, String, Integer, Boolean, Text, Enum, ForeignKey, Date, DateTime, Numeric
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel, GUID


class ChallengeStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    UNDER_REVIEW = "under_review"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class UnlockRuleType(str, enum.Enum):
    XP_THRESHOLD = "xp_threshold"
    CHALLENGE_COUNT = "challenge_count"
    CUSTOM = "custom"


class RedemptionStatus(str, enum.Enum):
    PENDING = "pending"
    FULFILLED = "fulfilled"
    CANCELLED = "cancelled"


class Challenge(BaseModel):
    __tablename__ = "challenges"

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category_id = Column(GUID, ForeignKey("categories.id"), nullable=False)
    xp_reward = Column(Integer, nullable=False)
    difficulty = Column(Enum(Difficulty), nullable=False)
    evidence_required = Column(Boolean, default=False, nullable=False)
    deadline = Column(Date, nullable=True)
    max_participants = Column(Integer, nullable=True)
    status = Column(Enum(ChallengeStatus), default=ChallengeStatus.DRAFT, nullable=False)
    created_by = Column(GUID, ForeignKey("users.id"), nullable=False)

    # Relationships
    category = relationship("Category")
    creator = relationship("User", foreign_keys=[created_by])
    participations = relationship("ChallengeParticipation", back_populates="challenge", cascade="all, delete-orphan")


class ChallengeParticipation(BaseModel):
    __tablename__ = "challenge_participations"

    challenge_id = Column(GUID, ForeignKey("challenges.id"), nullable=False, index=True)
    employee_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    progress = Column(Numeric(5, 2), default=0, nullable=False)
    proof_url = Column(String(500), nullable=True)
    approval_status = Column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING, nullable=False)
    approved_by = Column(GUID, ForeignKey("users.id"), nullable=True)
    xp_awarded = Column(Integer, default=0, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    challenge = relationship("Challenge", back_populates="participations")
    employee = relationship("User", foreign_keys=[employee_id])
    approver = relationship("User", foreign_keys=[approved_by])


class Badge(BaseModel):
    __tablename__ = "badges"

    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(200), nullable=False)
    unlock_rule_type = Column(Enum(UnlockRuleType), nullable=False)
    unlock_rule_value = Column(Integer, nullable=False)
    status = Column(String(20), default="active", nullable=False)

    # Relationships
    user_badges = relationship("UserBadge", back_populates="badge", cascade="all, delete-orphan")


class UserBadge(BaseModel):
    __tablename__ = "user_badges"

    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    badge_id = Column(GUID, ForeignKey("badges.id"), nullable=False, index=True)
    awarded_at = Column(DateTime(timezone=True), nullable=False)

    # Relationships
    user = relationship("User", back_populates="badges")
    badge = relationship("Badge", back_populates="user_badges")


class Reward(BaseModel):
    __tablename__ = "rewards"

    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    points_required = Column(Integer, nullable=False)
    stock = Column(Integer, default=0, nullable=False)
    image_url = Column(String(500), nullable=True)
    status = Column(String(20), default="active", nullable=False)

    # Relationships
    redemptions = relationship("RewardRedemption", back_populates="reward", cascade="all, delete-orphan")


class RewardRedemption(BaseModel):
    __tablename__ = "reward_redemptions"

    reward_id = Column(GUID, ForeignKey("rewards.id"), nullable=False, index=True)
    employee_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    points_spent = Column(Integer, nullable=False)
    status = Column(Enum(RedemptionStatus), default=RedemptionStatus.PENDING, nullable=False)

    # Relationships
    reward = relationship("Reward", back_populates="redemptions")
    employee = relationship("User")
