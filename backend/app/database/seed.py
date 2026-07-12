import asyncio
from datetime import date, datetime, timezone
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import AsyncSessionLocal, engine
from app.core.security import hash_password, UserRole
from app.models.core import User, Department, Category, ESGConfiguration, CategoryType, StatusEnum
from app.models.environmental import EmissionFactor, Product, ProductESGProfile, EnvironmentalGoal, EmissionScope, GoalStatus, CarbonTransaction, SourceType
from app.models.gamification import Badge, Reward, Challenge, ChallengeStatus, Difficulty
from app.models.scoring import DepartmentScore
from app.models.social import CSRActivity, CSRStatus, EmployeeParticipation, ApprovalStatus
from app.models.governance import ESGPolicy, PolicyAcknowledgement, Audit, AuditStatus, ComplianceIssue, ComplianceStatus, Severity, PolicyStatus

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
            "mfg": Department(id=uuid.uuid4(), name="Manufacturing", code="MFG", employee_count=5, status=StatusEnum.ACTIVE),
            "log": Department(id=uuid.uuid4(), name="Logistics & Supply", code="LOG", employee_count=3, status=StatusEnum.ACTIVE),
            "des": Department(id=uuid.uuid4(), name="Product Design", code="DES", employee_count=2, status=StatusEnum.ACTIVE),
            "corp": Department(id=uuid.uuid4(), name="Corporate Governance", code="COR", employee_count=2, status=StatusEnum.ACTIVE),
        }
        for d in depts.values():
            session.add(d)
        await session.flush()

        # 3. Users (Seeding 5 Demo Accounts)
        users = [
            User(email="admin@ecosync.com", password_hash=hash_password("password"), first_name="Super", last_name="Admin", role=UserRole.ADMIN, is_active=True),
            User(email="manager@ecosync.com", password_hash=hash_password("password"), first_name="Alice", last_name="Vance", role=UserRole.ESG_MANAGER, is_active=True),
            User(email="head@ecosync.com", password_hash=hash_password("password"), first_name="Sarah", last_name="Jenkins", role=UserRole.DEPARTMENT_HEAD, department_id=depts["mfg"].id, is_active=True),
            User(email="employee@ecosync.com", password_hash=hash_password("password"), first_name="John", last_name="Doe", role=UserRole.EMPLOYEE, department_id=depts["mfg"].id, xp_points=380, is_active=True),
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
        await session.flush()

        # 6. Products
        prod1 = Product(id=uuid.uuid4(), name="Eco-Smart Thermostat", sku="THM-ECO-01", department_id=depts["mfg"].id, status="active")
        prod2 = Product(id=uuid.uuid4(), name="Solar Charging Case", sku="SOL-CHG-02", department_id=depts["des"].id, status="active")
        session.add_all([prod1, prod2])
        await session.flush()
        
        profile1 = ProductESGProfile(product_id=prod1.id, carbon_footprint=12.5, recyclability_score=95.0, sustainability_rating="A", notes="High quality smart green device")
        profile2 = ProductESGProfile(product_id=prod2.id, carbon_footprint=8.2, recyclability_score=98.0, sustainability_rating="A", notes="Eco-friendly design using recycled plastics")
        session.add_all([profile1, profile2])

        # 7. Goals
        goal1 = EnvironmentalGoal(title="Reduce Manufacturing Power Emissions by 15%", target_value=5000, current_value=1200, unit="kg CO2e", department_id=depts["mfg"].id, start_date=date(2026, 1, 1), end_date=date(2026, 12, 31), status=GoalStatus.ACTIVE, created_by=users[1].id)
        goal2 = EnvironmentalGoal(title="Optimize Delivery Routes to reduce fuel use by 10%", target_value=3000, current_value=900, unit="kg CO2e", department_id=depts["log"].id, start_date=date(2026, 1, 1), end_date=date(2026, 12, 31), status=GoalStatus.ACTIVE, created_by=users[1].id)
        session.add_all([goal1, goal2])

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
        challenge2 = Challenge(title="Eco-commuter Challenge", description="Cycle, walk, or carpool to work for 5 days.", category_id=cat_ch.id, xp_reward=150, difficulty=Difficulty.HARD, evidence_required=True, deadline=date(2026, 7, 25), status=ChallengeStatus.ACTIVE, created_by=users[1].id)
        session.add_all([challenge1, challenge2])

        # 11. Department Scores (Seeding multiple departments so the rankings list is full)
        score1 = DepartmentScore(department_id=depts["mfg"].id, environmental_score=89.0, social_score=80.5, governance_score=85.0, total_score=85.2, period=date(2026, 6, 30))
        score2 = DepartmentScore(department_id=depts["log"].id, environmental_score=75.0, social_score=82.0, governance_score=83.0, total_score=79.8, period=date(2026, 6, 30))
        score3 = DepartmentScore(department_id=depts["des"].id, environmental_score=70.0, social_score=78.5, governance_score=75.0, total_score=74.0, period=date(2026, 6, 30))
        score4 = DepartmentScore(department_id=depts["corp"].id, environmental_score=80.0, social_score=85.0, governance_score=83.5, total_score=82.5, period=date(2026, 6, 30))
        session.add_all([score1, score2, score3, score4])

        # 12. Carbon Transactions (For visual timeline/line charts on dashboard)
        txs = [
            CarbonTransaction(department_id=depts["mfg"].id, emission_factor_id=factors[0].id, source_type=SourceType.PURCHASE, quantity=2800, unit="kWh", calculated_emission=2380, transaction_date=date(2026, 1, 15), description="Grid electricity bill January", created_by=users[1].id),
            CarbonTransaction(department_id=depts["mfg"].id, emission_factor_id=factors[0].id, source_type=SourceType.PURCHASE, quantity=2600, unit="kWh", calculated_emission=2210, transaction_date=date(2026, 2, 14), description="Grid electricity bill February", created_by=users[1].id),
            CarbonTransaction(department_id=depts["mfg"].id, emission_factor_id=factors[0].id, source_type=SourceType.PURCHASE, quantity=2900, unit="kWh", calculated_emission=2465, transaction_date=date(2026, 3, 15), description="Grid electricity bill March", created_by=users[1].id),
            CarbonTransaction(department_id=depts["mfg"].id, emission_factor_id=factors[0].id, source_type=SourceType.PURCHASE, quantity=2100, unit="kWh", calculated_emission=1785, transaction_date=date(2026, 4, 12), description="Grid electricity bill April", created_by=users[1].id),
            CarbonTransaction(department_id=depts["mfg"].id, emission_factor_id=factors[0].id, source_type=SourceType.PURCHASE, quantity=1900, unit="kWh", calculated_emission=1615, transaction_date=date(2026, 5, 10), description="Grid electricity bill May", created_by=users[1].id),
            CarbonTransaction(department_id=depts["mfg"].id, emission_factor_id=factors[0].id, source_type=SourceType.PURCHASE, quantity=1675, unit="kWh", calculated_emission=1423, transaction_date=date(2026, 6, 8), description="Grid electricity bill June", created_by=users[1].id),
            
            CarbonTransaction(department_id=depts["log"].id, emission_factor_id=factors[1].id, source_type=SourceType.FLEET, quantity=500, unit="Liters", calculated_emission=1350, transaction_date=date(2026, 5, 20), description="Fleet fuel refill May", created_by=users[1].id),
            CarbonTransaction(department_id=depts["log"].id, emission_factor_id=factors[1].id, source_type=SourceType.FLEET, quantity=400, unit="Liters", calculated_emission=1080, transaction_date=date(2026, 6, 25), description="Fleet fuel refill June", created_by=users[1].id),
        ]
        session.add_all(txs)

        # 13. CSR Activities
        csr1 = CSRActivity(title="Coastal Beach Cleanup", description="Join team members to pick up marine debris at the local public beach.", category_id=cat_csr.id, department_id=depts["mfg"].id, start_date=date(2026, 7, 10), end_date=date(2026, 7, 11), max_participants=20, points_awarded=50, evidence_required=True, status=CSRStatus.ACTIVE, created_by=users[1].id)
        csr2 = CSRActivity(title="Annual Reforestation Program", description="Tree planting campaign in the regional ecological park.", category_id=cat_csr.id, department_id=depts["corp"].id, start_date=date(2026, 6, 1), end_date=date(2026, 6, 2), max_participants=50, points_awarded=80, evidence_required=True, status=CSRStatus.COMPLETED, created_by=users[1].id)
        session.add_all([csr1, csr2])
        await session.flush()

        # 14. CSR Employee Participation
        part1 = EmployeeParticipation(employee_id=users[3].id, activity_id=csr1.id, proof_url="beach_cleanup_proof.jpg", approval_status=ApprovalStatus.PENDING, notes="Spent 4 hours collecting waste. Uploaded evidence.")
        part2 = EmployeeParticipation(employee_id=users[3].id, activity_id=csr2.id, proof_url="tree_planting_proof.jpg", approval_status=ApprovalStatus.APPROVED, approved_by=users[2].id, points_earned=80, completion_date=date(2026, 6, 2), notes="Planted 5 native pine trees.")
        session.add_all([part1, part2])

        # 15. Governance Policies
        policy1 = ESGPolicy(title="Carbon Neutral Policy 2026", description="Corporate commitment and rules to achieve net zero scope 1 & 2 emissions by end of year.", content="This policy requires all facilities to limit power consumption, optimize logistics routes, and transition to sustainable vendors...", effective_date=date(2026, 1, 1), status=PolicyStatus.ACTIVE, created_by=users[1].id)
        session.add(policy1)
        await session.flush()

        # 16. Policy Acknowledgements
        ack1 = PolicyAcknowledgement(policy_id=policy1.id, employee_id=users[3].id, acknowledged_at=datetime.now(timezone.utc), ip_address="192.168.1.50")
        session.add(ack1)

        # 17. Audits & Compliance Issues
        audit1 = Audit(title="Q2 Environmental Audit", description="Verify chemicals logging and solid waste management.", department_id=depts["mfg"].id, auditor_id=users[4].id, audit_date=date(2026, 6, 15), findings="Minor issue found regarding solid waste tracking logs.", status=AuditStatus.COMPLETED, score=88.5)
        audit2 = Audit(title="Logistics Safety & Fuel Audit", description="Inspect driver hours and fleet fuel logs.", department_id=depts["log"].id, auditor_id=users[4].id, audit_date=date(2026, 7, 10), findings="All safety systems up-to-date. Driver fatigue logs missing some entries.", status=AuditStatus.COMPLETED, score=92.0)
        audit3 = Audit(title="Q3 ESG Policy Review", description="Review policy acknowledgements progress across all departments.", department_id=depts["corp"].id, auditor_id=users[4].id, audit_date=date(2026, 7, 20), status=AuditStatus.PLANNED)
        session.add_all([audit1, audit2, audit3])
        await session.flush()

        issue1 = ComplianceIssue(audit_id=audit1.id, title="Waste chemical logs incomplete", description="Logs of chemical waste disposals for May 2026 are missing required validator signatures.", severity=Severity.HIGH, owner_id=users[2].id, due_date=date(2026, 7, 25), status=ComplianceStatus.OPEN, created_by=users[4].id)
        issue2 = ComplianceIssue(audit_id=audit2.id, title="Driver fatigue reports missing", description="Weekly driver rest duration sheets are missing for 2 routes.", severity=Severity.MEDIUM, owner_id=users[2].id, due_date=date(2026, 7, 30), status=ComplianceStatus.OPEN, created_by=users[4].id)
        session.add_all([issue1, issue2])

        await session.commit()
        print("Database seeded successfully with rich transactional data!")

if __name__ == "__main__":
    asyncio.run(seed_db())
