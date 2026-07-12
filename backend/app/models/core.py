"""
Core models: User, Department, Category, ESGConfiguration, Notification, ActivityLog.
"""
from sqlalchemy import Column, String, Integer, Boolean, Text, Enum, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from app.models.base import BaseModel, GUID


# ──────────────────────────────────────────────
# Enums
# ──────────────────────────────────────────────

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    ESG_MANAGER = "esg_manager"
    DEPARTMENT_HEAD = "department_head"
    EMPLOYEE = "employee"
    AUDITOR = "auditor"


class StatusEnum(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class CategoryType(str, enum.Enum):
    CSR_ACTIVITY = "csr_activity"
    CHALLENGE = "challenge"


class NotificationType(str, enum.Enum):
    COMPLIANCE_ISSUE = "compliance_issue"
    CSR_APPROVAL = "csr_approval"
    CHALLENGE_UPDATE = "challenge_update"
    BADGE_UNLOCK = "badge_unlock"
    POLICY_REMINDER = "policy_reminder"
    REWARD_REDEEMED = "reward_redeemed"
    SYSTEM = "system"


# ──────────────────────────────────────────────
# Models
# ──────────────────────────────────────────────

class User(BaseModel):
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.EMPLOYEE)
    department_id = Column(GUID, ForeignKey("departments.id"), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    xp_points = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    department = relationship("Department", back_populates="employees", foreign_keys=[department_id])
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")
    badges = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Department(BaseModel):
    __tablename__ = "departments"

    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    head_id = Column(GUID, ForeignKey("users.id"), nullable=True)
    parent_department_id = Column(GUID, ForeignKey("departments.id"), nullable=True)
    employee_count = Column(Integer, default=0, nullable=False)
    status = Column(Enum(StatusEnum), default=StatusEnum.ACTIVE, nullable=False)

    # Relationships
    head = relationship("User", foreign_keys=[head_id])
    parent = relationship("Department", remote_side="Department.id")
    employees = relationship("User", back_populates="department", foreign_keys=[User.department_id])
    scores = relationship("DepartmentScore", back_populates="department", cascade="all, delete-orphan")


class Category(BaseModel):
    __tablename__ = "categories"

    name = Column(String(100), nullable=False)
    type = Column(Enum(CategoryType), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(StatusEnum), default=StatusEnum.ACTIVE, nullable=False)


class ESGConfiguration(BaseModel):
    __tablename__ = "esg_configurations"

    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    updated_by = Column(GUID, ForeignKey("users.id"), nullable=True)


class Notification(BaseModel):
    __tablename__ = "notifications"

    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    link = Column(String(500), nullable=True)

    # Relationships
    user = relationship("User", back_populates="notifications")


class ActivityLog(BaseModel):
    __tablename__ = "activity_logs"

    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(GUID, nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)

    # Relationships
    user = relationship("User", back_populates="activity_logs")
