"""
Models package — imports all models for Alembic auto-discovery.
"""
from app.models.base import Base, BaseModel
from app.models.core import (
    User, Department, Category, ESGConfiguration,
    Notification, ActivityLog,
    UserRole, StatusEnum, CategoryType, NotificationType,
)
from app.models.environmental import (
    EmissionFactor, CarbonTransaction, Product, ProductESGProfile,
    EnvironmentalGoal, GoalProgress,
    EmissionScope, SourceType, SustainabilityRating, GoalStatus,
)
from app.models.social import (
    CSRActivity, EmployeeParticipation, DiversityMetric, Training,
    CSRStatus, ApprovalStatus as CSRApprovalStatus,
)
from app.models.governance import (
    ESGPolicy, PolicyAcknowledgement, Audit, ComplianceIssue,
    PolicyStatus, AuditStatus, Severity, ComplianceStatus,
)
from app.models.gamification import (
    Challenge, ChallengeParticipation, Badge, UserBadge, Reward, RewardRedemption,
    ChallengeStatus, Difficulty, ApprovalStatus as ChallengeApprovalStatus,
    UnlockRuleType, RedemptionStatus,
)
from app.models.scoring import DepartmentScore

__all__ = [
    "Base", "BaseModel",
    # Core
    "User", "Department", "Category", "ESGConfiguration", "Notification", "ActivityLog",
    # Environmental
    "EmissionFactor", "CarbonTransaction", "Product", "ProductESGProfile",
    "EnvironmentalGoal", "GoalProgress",
    # Social
    "CSRActivity", "EmployeeParticipation", "DiversityMetric", "Training",
    # Governance
    "ESGPolicy", "PolicyAcknowledgement", "Audit", "ComplianceIssue",
    # Gamification
    "Challenge", "ChallengeParticipation", "Badge", "UserBadge", "Reward", "RewardRedemption",
    # Scoring
    "DepartmentScore",
]
