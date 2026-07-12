"""
Governance models: ESGPolicy, PolicyAcknowledgement, Audit, ComplianceIssue.
"""
from sqlalchemy import Column, String, Integer, Text, Enum, ForeignKey, Date, DateTime, Numeric
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel, GUID


class PolicyStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class AuditStatus(str, enum.Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CLOSED = "closed"


class Severity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ComplianceStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    OVERDUE = "overdue"


class ESGPolicy(BaseModel):
    __tablename__ = "esg_policies"

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    version = Column(String(20), default="1.0", nullable=False)
    effective_date = Column(Date, nullable=False)
    review_date = Column(Date, nullable=True)
    status = Column(Enum(PolicyStatus), default=PolicyStatus.DRAFT, nullable=False)
    created_by = Column(GUID, ForeignKey("users.id"), nullable=False)

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    acknowledgements = relationship("PolicyAcknowledgement", back_populates="policy", cascade="all, delete-orphan")


class PolicyAcknowledgement(BaseModel):
    __tablename__ = "policy_acknowledgements"

    policy_id = Column(GUID, ForeignKey("esg_policies.id"), nullable=False, index=True)
    employee_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=False)
    ip_address = Column(String(45), nullable=True)

    # Relationships
    policy = relationship("ESGPolicy", back_populates="acknowledgements")
    employee = relationship("User")


class Audit(BaseModel):
    __tablename__ = "audits"

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    department_id = Column(GUID, ForeignKey("departments.id"), nullable=False)
    auditor_id = Column(GUID, ForeignKey("users.id"), nullable=False)
    audit_date = Column(Date, nullable=False)
    findings = Column(Text, nullable=True)
    status = Column(Enum(AuditStatus), default=AuditStatus.PLANNED, nullable=False)
    score = Column(Numeric(5, 2), nullable=True)

    # Relationships
    department = relationship("Department")
    auditor = relationship("User", foreign_keys=[auditor_id])
    compliance_issues = relationship("ComplianceIssue", back_populates="audit", cascade="all, delete-orphan")


class ComplianceIssue(BaseModel):
    __tablename__ = "compliance_issues"

    audit_id = Column(GUID, ForeignKey("audits.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(Enum(Severity), nullable=False)
    # Mandatory fields per problem statement
    owner_id = Column(GUID, ForeignKey("users.id"), nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(Enum(ComplianceStatus), default=ComplianceStatus.OPEN, nullable=False)
    resolution = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(GUID, ForeignKey("users.id"), nullable=False)

    # Relationships
    audit = relationship("Audit", back_populates="compliance_issues")
    owner = relationship("User", foreign_keys=[owner_id])
    creator = relationship("User", foreign_keys=[created_by])
