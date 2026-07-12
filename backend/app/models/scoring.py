"""
Scoring model: DepartmentScore for aggregated ESG performance per department.
"""
from sqlalchemy import Column, Date, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from app.models.base import BaseModel, GUID


class DepartmentScore(BaseModel):
    __tablename__ = "department_scores"

    department_id = Column(GUID, ForeignKey("departments.id"), nullable=False, index=True)
    environmental_score = Column(Numeric(5, 2), default=0, nullable=False)
    social_score = Column(Numeric(5, 2), default=0, nullable=False)
    governance_score = Column(Numeric(5, 2), default=0, nullable=False)
    total_score = Column(Numeric(5, 2), default=0, nullable=False)
    period = Column(Date, nullable=False)

    # Relationships
    department = relationship("Department", back_populates="scores")
