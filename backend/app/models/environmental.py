"""
Environmental models: EmissionFactor, CarbonTransaction, Product, ProductESGProfile,
EnvironmentalGoal, GoalProgress.
"""
from sqlalchemy import Column, String, Integer, Boolean, Text, Enum, ForeignKey, Date, Numeric
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel, GUID


class EmissionScope(str, enum.Enum):
    SCOPE_1 = "scope_1"
    SCOPE_2 = "scope_2"
    SCOPE_3 = "scope_3"


class SourceType(str, enum.Enum):
    PURCHASE = "purchase"
    MANUFACTURING = "manufacturing"
    EXPENSE = "expense"
    FLEET = "fleet"
    MANUAL = "manual"


class SustainabilityRating(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    F = "F"


class GoalStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    MISSED = "missed"


class EmissionFactor(BaseModel):
    __tablename__ = "emission_factors"

    name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)
    unit = Column(String(50), nullable=False)
    factor_value = Column(Numeric(12, 6), nullable=False)
    scope = Column(Enum(EmissionScope), nullable=False)
    source = Column(String(200), nullable=True)
    valid_from = Column(Date, nullable=True)
    valid_to = Column(Date, nullable=True)
    status = Column(String(20), default="active", nullable=False)


class CarbonTransaction(BaseModel):
    __tablename__ = "carbon_transactions"

    department_id = Column(GUID, ForeignKey("departments.id"), nullable=False, index=True)
    emission_factor_id = Column(GUID, ForeignKey("emission_factors.id"), nullable=False)
    source_type = Column(Enum(SourceType), nullable=False)
    source_reference = Column(String(200), nullable=True)
    quantity = Column(Numeric(12, 4), nullable=False)
    unit = Column(String(50), nullable=False)
    calculated_emission = Column(Numeric(12, 4), nullable=False)
    transaction_date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)
    is_auto_calculated = Column(Boolean, default=False, nullable=False)
    created_by = Column(GUID, ForeignKey("users.id"), nullable=False)

    # Relationships
    department = relationship("Department")
    emission_factor = relationship("EmissionFactor")
    creator = relationship("User", foreign_keys=[created_by])


class Product(BaseModel):
    __tablename__ = "products"

    name = Column(String(200), nullable=False)
    sku = Column(String(50), unique=True, nullable=True)
    department_id = Column(GUID, ForeignKey("departments.id"), nullable=True)
    status = Column(String(20), default="active", nullable=False)

    # Relationships
    department = relationship("Department")
    esg_profile = relationship("ProductESGProfile", back_populates="product", uselist=False, cascade="all, delete-orphan")


class ProductESGProfile(BaseModel):
    __tablename__ = "product_esg_profiles"

    product_id = Column(GUID, ForeignKey("products.id"), unique=True, nullable=False)
    carbon_footprint = Column(Numeric(12, 4), nullable=True)
    recyclability_score = Column(Numeric(5, 2), nullable=True)
    sustainability_rating = Column(Enum(SustainabilityRating), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    product = relationship("Product", back_populates="esg_profile")


class EnvironmentalGoal(BaseModel):
    __tablename__ = "environmental_goals"

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    target_value = Column(Numeric(12, 4), nullable=False)
    current_value = Column(Numeric(12, 4), default=0, nullable=False)
    unit = Column(String(50), nullable=False)
    department_id = Column(GUID, ForeignKey("departments.id"), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(Enum(GoalStatus), default=GoalStatus.ACTIVE, nullable=False)
    created_by = Column(GUID, ForeignKey("users.id"), nullable=False)

    # Relationships
    department = relationship("Department")
    creator = relationship("User", foreign_keys=[created_by])
    progress_entries = relationship("GoalProgress", back_populates="goal", cascade="all, delete-orphan")


class GoalProgress(BaseModel):
    __tablename__ = "goal_progress"

    goal_id = Column(GUID, ForeignKey("environmental_goals.id"), nullable=False)
    recorded_value = Column(Numeric(12, 4), nullable=False)
    recorded_date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)

    # Relationships
    goal = relationship("EnvironmentalGoal", back_populates="progress_entries")
