"""
Social models: CSRActivity, EmployeeParticipation, DiversityMetric, Training.
"""
from sqlalchemy import Column, String, Integer, Boolean, Text, Enum, ForeignKey, Date, Numeric
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel, GUID


class CSRStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class CSRActivity(BaseModel):
    __tablename__ = "csr_activities"

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category_id = Column(GUID, ForeignKey("categories.id"), nullable=False)
    department_id = Column(GUID, ForeignKey("departments.id"), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    max_participants = Column(Integer, nullable=True)
    points_awarded = Column(Integer, default=0, nullable=False)
    evidence_required = Column(Boolean, default=False, nullable=False)
    status = Column(Enum(CSRStatus), default=CSRStatus.DRAFT, nullable=False)
    created_by = Column(GUID, ForeignKey("users.id"), nullable=False)

    # Relationships
    category = relationship("Category")
    department = relationship("Department")
    creator = relationship("User", foreign_keys=[created_by])
    participations = relationship("EmployeeParticipation", back_populates="activity", cascade="all, delete-orphan")


class EmployeeParticipation(BaseModel):
    __tablename__ = "employee_participations"

    employee_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    activity_id = Column(GUID, ForeignKey("csr_activities.id"), nullable=False, index=True)
    proof_url = Column(String(500), nullable=True)
    approval_status = Column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING, nullable=False)
    approved_by = Column(GUID, ForeignKey("users.id"), nullable=True)
    points_earned = Column(Integer, default=0, nullable=False)
    completion_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    employee = relationship("User", foreign_keys=[employee_id])
    approver = relationship("User", foreign_keys=[approved_by])
    activity = relationship("CSRActivity", back_populates="participations")


class DiversityMetric(BaseModel):
    __tablename__ = "diversity_metrics"

    department_id = Column(GUID, ForeignKey("departments.id"), nullable=False)
    metric_type = Column(String(100), nullable=False)
    metric_value = Column(String(100), nullable=False)
    count = Column(Integer, nullable=False)
    period = Column(Date, nullable=False)

    # Relationships
    department = relationship("Department")


class Training(BaseModel):
    __tablename__ = "trainings"

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    department_id = Column(GUID, ForeignKey("departments.id"), nullable=True)
    completion_rate = Column(Numeric(5, 2), default=0, nullable=False)
    due_date = Column(Date, nullable=True)
    status = Column(String(20), default="active", nullable=False)

    # Relationships
    department = relationship("Department")
