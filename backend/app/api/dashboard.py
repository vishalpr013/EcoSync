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
from app.models.core import User, Department, ActivityLog
from app.models.scoring import DepartmentScore
from app.models.environmental import CarbonTransaction
from app.models.social import CSRActivity, EmployeeParticipation, DiversityMetric, Training
from app.models.governance import Audit, ComplianceIssue, ESGPolicy, PolicyAcknowledgement

router = APIRouter()


def _score_band(score: float) -> dict:
    if score >= 90:
        return {"grade": "A", "label": "ESG Leader", "next_target": 100}
    if score >= 80:
        return {"grade": "B", "label": "Advanced", "next_target": 90}
    if score >= 70:
        return {"grade": "C", "label": "Progressing", "next_target": 80}
    if score >= 60:
        return {"grade": "D", "label": "Developing", "next_target": 70}
    return {"grade": "E", "label": "At Risk", "next_target": 60}


def _improvement_plan(environmental: float, social: float, governance: float, weights: dict) -> list[dict]:
    pillars = {
        "environmental": {"score": environmental, "weight": weights["environmental"],
                          "title": "Reduce operational emissions",
                          "action": "Close the highest-emission reduction goal and increase auto-calculated Scope 1-3 coverage.",
                          "route": "/environmental"},
        "social": {"score": social, "weight": weights["social"],
                   "title": "Increase workforce participation",
                   "action": "Raise training completion and approve evidence-backed CSR participation across departments.",
                   "route": "/social"},
        "governance": {"score": governance, "weight": weights["governance"],
                       "title": "Resolve compliance exposure",
                       "action": "Resolve overdue issues and complete outstanding policy acknowledgements before their due dates.",
                       "route": "/governance"},
    }
    ranked = sorted(pillars.items(), key=lambda item: item[1]["score"])
    plan = []
    for priority, (pillar, detail) in enumerate(ranked, start=1):
        attainable_gain = min(8.0, max(2.0, (90 - detail["score"]) * 0.35))
        projected_impact = attainable_gain * detail["weight"] / 100
        plan.append({"priority": priority, "pillar": pillar, "current_score": round(detail["score"], 2),
                     "title": detail["title"], "action": detail["action"], "route": detail["route"],
                     "projected_pillar_gain": round(attainable_gain, 1),
                     "projected_overall_impact": round(projected_impact, 1)})
    return plan

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

    band = _score_band(total_score)
    weights = {"environmental": env_w, "social": soc_w, "governance": gov_w}
    improvement_plan = _improvement_plan(env_avg, soc_avg, gov_avg, weights)

    return {
        "esg_score": {
            "overall": round(total_score, 2),
            "environmental": round(env_avg, 2),
            "social": round(soc_avg, 2),
            "governance": round(gov_avg, 2),
            "weights": weights,
            "grade": band["grade"],
            "band": band["label"],
            "next_target": band["next_target"],
            "points_to_next_band": round(max(0, band["next_target"] - total_score), 2),
            "methodology": "Weighted average of the latest departmental Environmental, Social, and Governance scores",
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
        "improvement_plan": improvement_plan,
        "projected_score": round(min(100, total_score + sum(item["projected_overall_impact"] for item in improvement_plan)), 2),
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
    row = (await db.execute(select(
        func.count(EmployeeParticipation.id).label("participations"),
        func.sum(case((EmployeeParticipation.approval_status == "approved", 1), else_=0)).label("approved"),
        func.sum(EmployeeParticipation.points_earned).label("points"),
    ))).one()
    training_rate = float((await db.execute(select(func.avg(Training.completion_rate)))).scalar() or 0)
    diversity_count = int((await db.execute(select(func.count(DiversityMetric.id)))).scalar() or 0)
    activities = int((await db.execute(select(func.count(CSRActivity.id)))).scalar() or 0)
    return {"csr_activities": activities, "participations": int(row.participations or 0),
            "approved_participations": int(row.approved or 0), "points_awarded": int(row.points or 0),
            "training_completion_rate": round(training_rate, 2), "diversity_metrics": diversity_count}

@router.get("/governance")
async def get_governance_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER, UserRole.AUDITOR))
):
    """Detailed Governance metrics dashboard."""
    issue_row = (await db.execute(select(
        func.count(ComplianceIssue.id).label("total"),
        func.sum(case((ComplianceIssue.status.in_(["open", "in_progress"]), 1), else_=0)).label("open"),
        func.sum(case(((ComplianceIssue.due_date < date.today()) & ComplianceIssue.status.in_(["open", "in_progress"]), 1), else_=0)).label("overdue"),
    ))).one()
    return {"policies": int((await db.execute(select(func.count(ESGPolicy.id)))).scalar() or 0),
            "policy_acknowledgements": int((await db.execute(select(func.count(PolicyAcknowledgement.id)))).scalar() or 0),
            "audits": int((await db.execute(select(func.count(Audit.id)))).scalar() or 0),
            "compliance_issues": {"total": int(issue_row.total or 0), "open": int(issue_row.open or 0),
                                  "overdue": int(issue_row.overdue or 0)}}

@router.get("/department/{dept_id}")
async def get_department_dashboard(
    dept_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER, UserRole.DEPARTMENT_HEAD))
):
    """Dashboard metrics for a specific department."""
    department = (await db.execute(select(Department).where(Department.id == dept_id))).scalar_one_or_none()
    if not department:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Department", str(dept_id))
    score = (await db.execute(select(DepartmentScore).where(DepartmentScore.department_id == dept_id)
                              .order_by(DepartmentScore.period.desc()).limit(1))).scalar_one_or_none()
    emissions = float((await db.execute(select(func.sum(CarbonTransaction.calculated_emission))
                                        .where(CarbonTransaction.department_id == dept_id))).scalar() or 0)
    participations = int((await db.execute(select(func.count(EmployeeParticipation.id)).join(
        CSRActivity, CSRActivity.id == EmployeeParticipation.activity_id).where(CSRActivity.department_id == dept_id))).scalar() or 0)
    return {"department": {"id": str(department.id), "name": department.name, "code": department.code},
            "score": {"environmental": float(score.environmental_score), "social": float(score.social_score),
                      "governance": float(score.governance_score), "overall": float(score.total_score),
                      "period": score.period.isoformat()} if score else None,
            "total_carbon_emissions": emissions, "csr_participations": participations}


@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (await db.execute(select(ActivityLog, User).join(User, User.id == ActivityLog.user_id)
                             .order_by(ActivityLog.created_at.desc()).limit(limit))).all()
    return [{"id": str(log.id), "action": log.action, "entity_type": log.entity_type,
             "user": user.full_name, "timestamp": log.created_at.isoformat(), "details": log.details or {}}
            for log, user in rows]

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
