"""
Dashboard API routes: Overview, Environmental, Social, Governance, Department, Employee dashboards.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from typing import Optional
from uuid import UUID
from datetime import date

from app.database.session import get_db
from app.api.deps import get_current_user, require_roles
from app.core.security import UserRole
from app.models.core import User, Department
from app.models.scoring import DepartmentScore
from app.models.environmental import CarbonTransaction
from app.models.social import EmployeeParticipation
from app.models.governance import ComplianceIssue

router = APIRouter()

@router.get("/overview")
async def get_overview_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER))
):
    """
    Get organization-wide overall ESG summary:
    Weighted ESG Score (default: Env 40%, Social 30%, Gov 30%)
    Department Rankings, Carbon Emissions, CSR Participation, Compliance Status.
    """
    # Fetch weights or use defaults
    from app.models.core import ESGConfiguration
    config_result = await db.execute(select(ESGConfiguration))
    configs = {c.key: c.value for c in config_result.scalars().all()}
    
    env_w = int(configs.get("env_weight", 40))
    soc_w = int(configs.get("social_weight", 30))
    gov_w = int(configs.get("governance_weight", 30))

    # Calculate average scores
    scores_query = select(
        func.avg(DepartmentScore.environmental_score).label("env_avg"),
        func.avg(DepartmentScore.social_score).label("soc_avg"),
        func.avg(DepartmentScore.governance_score).label("gov_avg")
    )
    scores_res = await db.execute(scores_query)
    scores_row = scores_res.one()
    
    env_avg = float(scores_row.env_avg or 0)
    soc_avg = float(scores_row.soc_avg or 0)
    gov_avg = float(scores_row.gov_avg or 0)
    
    total_score = (env_avg * env_w + soc_avg * soc_w + gov_avg * gov_w) / 100

    # Carbon emissions summary
    carbon_query = select(func.sum(CarbonTransaction.calculated_emission).label("total_emissions"))
    carbon_res = await db.execute(carbon_query)
    total_emissions = float(carbon_res.scalar() or 0)

    # CSR participations summary
    csr_query = select(func.count(EmployeeParticipation.id).label("total_participations"))
    csr_res = await db.execute(csr_query)
    total_participations = int(csr_res.scalar() or 0)

    # Compliance summary
    comp_query = select(
        func.count(ComplianceIssue.id).label("total_issues"),
        func.sum(case((ComplianceIssue.status == 'open', 1), else_=0)).label("open_issues")
    )
    comp_res = await db.execute(comp_query)
    comp_row = comp_res.one()
    total_issues = int(comp_row.total_issues or 0)
    open_issues = int(comp_row.open_issues or 0)

    # Department scores list
    dept_scores_query = select(
        Department.name,
        DepartmentScore.total_score
    ).join(DepartmentScore, Department.id == DepartmentScore.department_id).order_by(DepartmentScore.total_score.desc()).limit(5)
    dept_scores_res = await db.execute(dept_scores_query)
    rankings = [{"department_name": row[0], "score": float(row[1])} for row in dept_scores_res.all()]

    # Calculate emissions timeline dynamically
    timeline_query = select(
        CarbonTransaction.transaction_date,
        func.sum(CarbonTransaction.calculated_emission).label("emissions")
    ).group_by(CarbonTransaction.transaction_date).order_by(CarbonTransaction.transaction_date.asc())
    timeline_res = await db.execute(timeline_query)
    months_map = {1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'}
    timeline_dict = {}
    for row in timeline_res.all():
        m_num = row[0].month
        timeline_dict[m_num] = timeline_dict.get(m_num, 0) + float(row[1])
    
    emissions_timeline = []
    for m in range(1, 8):  # January to July
        emissions_timeline.append({
            "date": months_map[m],
            "emissions": round(timeline_dict.get(m, 0), 1)
        })

    # Recent activities (dynamic from database transactions)
    tx_query = select(CarbonTransaction).order_by(CarbonTransaction.transaction_date.desc()).limit(2)
    tx_res = await db.execute(tx_query)
    recent_activity = []
    for tx in tx_res.scalars().all():
        recent_activity.append({
            "id": f"tx-{tx.id}",
            "action": f"Logged emission: {tx.description} ({float(tx.calculated_emission)} kg CO2e)",
            "user": "ESG Manager",
            "time": f"{tx.transaction_date.strftime('%b %d')}"
        })
    
    recent_activity.append({
        "id": "sys-1",
        "action": "Seeded department scores and targets",
        "user": "Super Admin",
        "time": "Just now"
    })

    return {
        "esg_score": {
            "overall": round(total_score, 2),
            "environmental": round(env_avg, 2),
            "social": round(soc_avg, 2),
            "governance": round(gov_avg, 2),
            "weights": {
                "environmental": env_w,
                "social": soc_w,
                "governance": gov_w
            }
        },
        "metrics": {
            "total_carbon_emissions": total_emissions,
            "total_csr_participations": total_participations,
            "compliance_issues": {
                "total": total_issues,
                "open": open_issues
            }
        },
        "department_rankings": rankings,
        "emissions_timeline": emissions_timeline,
        "recent_activity": recent_activity
    }

@router.get("/environmental")
async def get_environmental_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER, UserRole.DEPARTMENT_HEAD))
):
    """Detailed Environmental metrics dashboard."""
    # Group carbon emissions by date or category
    emissions_query = select(
        CarbonTransaction.transaction_date,
        func.sum(CarbonTransaction.calculated_emission).label("emissions")
    ).group_by(CarbonTransaction.transaction_date).order_by(CarbonTransaction.transaction_date.desc()).limit(30)
    
    res = await db.execute(emissions_query)
    timeline = [{"date": str(row[0]), "emissions": float(row[1])} for row in res.all()]

    return {
        "emissions_timeline": timeline[::-1]
    }

@router.get("/social")
async def get_social_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER, UserRole.DEPARTMENT_HEAD))
):
    """Detailed Social metrics dashboard."""
    # CSR Activity progress and diversity stats
    return {"message": "Social Dashboard metrics stub"}

@router.get("/governance")
async def get_governance_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER, UserRole.AUDITOR))
):
    """Detailed Governance metrics dashboard."""
    # Policy acknowledgements status, open compliance issues
    return {"message": "Governance Dashboard metrics stub"}

@router.get("/department/{dept_id}")
async def get_department_dashboard(
    dept_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER, UserRole.DEPARTMENT_HEAD))
):
    """Dashboard metrics for a specific department."""
    # Filtered ESG scores and metrics
    return {"department_id": str(dept_id), "message": "Department dashboard stub"}

@router.get("/employee")
async def get_employee_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.EMPLOYEE))
):
    """Personalized employee ESG dashboard showing challenges, badges, XP."""
    # Fetch employee specific XP, joined challenges, badges
    from app.models.gamification import ChallengeParticipation, UserBadge
    
    # Get active/joined challenges count
    ch_query = select(func.count(ChallengeParticipation.id)).where(
        ChallengeParticipation.employee_id == current_user.id
    )
    ch_res = await db.execute(ch_query)
    joined_challenges = ch_res.scalar() or 0

    # Get badge count
    badge_query = select(func.count(UserBadge.id)).where(
        UserBadge.user_id == current_user.id
    )
    badge_res = await db.execute(badge_query)
    badges_count = badge_res.scalar() or 0

    return {
        "employee": {
            "name": f"{current_user.first_name} {current_user.last_name}",
            "xp_points": current_user.xp_points,
            "joined_challenges": joined_challenges,
            "badges_count": badges_count
        }
    }
