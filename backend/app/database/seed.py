import asyncio
from datetime import date, datetime, timezone
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import AsyncSessionLocal, engine
from app.core.security import hash_password, UserRole
from app.models.core import User, Department, Category, ESGConfiguration, CategoryType, StatusEnum
from app.models.environmental import EmissionFactor, Product, ProductESGProfile, EnvironmentalGoal, EmissionScope, GoalStatus
from app.models.gamification import Badge, Reward, Challenge, ChallengeStatus, Difficulty
from app.models.scoring import DepartmentScore

async def seed_db():
    print("Initializing database seeding...")
    async with AsyncSessionLocal() as session:
        # Check if users already seeded
        res = await session.execute(select(User).limit(1))
        if res.scalar():
            print("Database already seeded. Skipping.")
            return

        # 1. ESG Configurations
        configs = [
            ESGConfiguration(key="env_weight", value="40", description="Environmental score percentage weight"),
            ESGConfiguration(key="social_weight", value="30", description="Social score percentage weight"),
            ESGConfiguration(key="governance_weight", value="30", description="Governance score percentage weight"),
            ESGConfiguration(key="auto_emission", value="true", description="Automatically compute carbon footprint"),
            ESGConfiguration(key="evidence_required", value="true", description="Enforce evidence upload constraint"),
            ESGConfiguration(key="badge_auto_award", value="true", description="Auto award badges on XP threshold check"),
        ]
        session.add_all(configs)
        
        # 2. Departments
        depts = {
            "mfg": Department(id=uuid.uuid4(), name="Manufacturing", code="MFG", employee_count=2, status=StatusEnum.ACTIVE),
            "log": Department(id=uuid.uuid4(), name="Logistics & Supply", code="LOG", employee_count=1, status=StatusEnum.ACTIVE),
            "des": Department(id=uuid.uuid4(), name="Product Design", code="DES", employee_count=1, status=StatusEnum.ACTIVE),
            "corp": Department(id=uuid.uuid4(), name="Corporate Governance", code="COR", employee_count=1, status=StatusEnum.ACTIVE),
        }
        for d in depts.values():
            session.add(d)
        await session.flush()

        # 3. Users (Seeding 5 Demo Accounts)
        users = [
            User(email="admin@ecosync.com", password_hash=hash_password("password"), first_name="Super", last_name="Admin", role=UserRole.ADMIN, is_active=True),
            User(email="manager@ecosync.com", password_hash=hash_password("password"), first_name="Alice", last_name="Vance", role=UserRole.ESG_MANAGER, is_active=True),
            User(email="head@ecosync.com", password_hash=hash_password("password"), first_name="Sarah", last_name="Jenkins", role=UserRole.DEPARTMENT_HEAD, department_id=depts["mfg"].id, is_active=True),
            User(email="employee@ecosync.com", password_hash=hash_password("password"), first_name="John", last_name="Doe", role=UserRole.EMPLOYEE, department_id=depts["mfg"].id, is_active=True),
            User(email="auditor@ecosync.com", password_hash=hash_password("password"), first_name="David", last_name="Miller", role=UserRole.AUDITOR, is_active=True),
        ]
        for u in users:
            session.add(u)
        await session.flush()

        # Assign department head relation
        depts["mfg"].head_id = next(u.id for u in users if u.email == "head@ecosync.com")
        
        # 4. Categories
        cat_csr = Category(id=uuid.uuid4(), name="Community Service", type=CategoryType.CSR_ACTIVITY, description="CSR activities related to helping local community", status=StatusEnum.ACTIVE)
        cat_ch = Category(id=uuid.uuid4(), name="Eco Commuter", type=CategoryType.CHALLENGE, description="Commuting challenges related to carbon reductions", status=StatusEnum.ACTIVE)
        session.add(cat_csr)
        session.add(cat_ch)
        await session.flush()

        # 5. Emission Factors
        factors = [
            EmissionFactor(name="Grid Electricity", category="Electricity", unit="kg CO2/kWh", factor_value=0.85, scope=EmissionScope.SCOPE_2, source="EPA"),
            EmissionFactor(name="Diesel Fuel", category="Fuel", unit="kg CO2/Liter", factor_value=2.7, scope=EmissionScope.SCOPE_1, source="DEFRA"),
            EmissionFactor(name="Air Travel (Short)", category="Transport", unit="kg CO2/km", factor_value=0.15, scope=EmissionScope.SCOPE_3, source="ICAO"),
        ]
        session.add_all(factors)

        # 6. Products
        prod1 = Product(id=uuid.uuid4(), name="Eco-Smart Thermostat", sku="THM-ECO-01", department_id=depts["mfg"].id, status="active")
        session.add(prod1)
        await session.flush()
        
        profile1 = ProductESGProfile(product_id=prod1.id, carbon_footprint=12.5, recyclability_score=95.0, sustainability_rating="A", notes="High quality smart green device")
        session.add(profile1)

        # 7. Goals
        goal1 = EnvironmentalGoal(title="Reduce Manufacturing Power Emissions by 15%", target_value=5000, current_value=1200, unit="kg CO2e", department_id=depts["mfg"].id, start_date=date(2026, 1, 1), end_date=date(2026, 12, 31), status=GoalStatus.ACTIVE, created_by=users[1].id)
        session.add(goal1)

        # 8. Badges
        badges = [
            Badge(name="Carbon Saver I", description="Log first carbon transaction in emissions ledger.", icon="Leaf", unlock_rule_type="xp_threshold", unlock_rule_value=100),
            Badge(name="Community Pioneer", description="Participated in first CSR activity.", icon="Users", unlock_rule_type="challenge_count", unlock_rule_value=1),
            Badge(name="Compliance Enforcer", description="Acknowledge all core ESG policies.", icon="ShieldCheck", unlock_rule_type="custom", unlock_rule_value=0),
        ]
        session.add_all(badges)

        # 9. Rewards
        rewards = [
            Reward(name="Sustainable Coffee Mug", description="Reusable stainless steel double-walled travel cup.", points_required=200, stock=12, status="active"),
            Reward(name="Plant a Tree in Your Name", description="We will plant a native tree and send you a certificate map.", points_required=300, stock=95, status="active"),
            Reward(name="Extra Half-Day Off", description="Deduct points to request half-day holiday allowance.", points_required=1000, stock=4, status="active"),
        ]
        session.add_all(rewards)

        # 10. Challenges
        challenge1 = Challenge(title="Zero Waste Week", description="Avoid single-use plastics for 7 days and log daily packaging counts.", category_id=cat_ch.id, xp_reward=100, difficulty=Difficulty.MEDIUM, evidence_required=True, deadline=date(2026, 7, 20), status=ChallengeStatus.ACTIVE, created_by=users[1].id)
        session.add(challenge1)

        # 11. Department Scores
        score1 = DepartmentScore(department_id=depts["mfg"].id, environmental_score=89.0, social_score=80.5, governance_score=85.0, total_score=85.2, period=date(2026, 6, 30))
        session.add(score1)

        await session.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_db())
