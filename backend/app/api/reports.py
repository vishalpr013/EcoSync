"""Data-backed ESG reports with real CSV, Excel, and PDF exports."""
import csv
import io
from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles
from app.core.exceptions import BadRequestError
from app.core.security import UserRole
from app.database.session import get_db
from app.models.core import Department, ESGConfiguration, User
from app.models.environmental import CarbonTransaction, EmissionFactor
from app.models.governance import Audit, ComplianceIssue, PolicyAcknowledgement
from app.models.scoring import DepartmentScore
from app.models.social import CSRActivity, DiversityMetric, EmployeeParticipation, Training

router = APIRouter()
REPORT_ROLES = (UserRole.ADMIN, UserRole.ESG_MANAGER, UserRole.DEPARTMENT_HEAD, UserRole.AUDITOR)


@router.get("/options")
async def get_report_options(db: AsyncSession = Depends(get_db),
                             current_user: User = Depends(require_roles(*REPORT_ROLES))):
    departments = (await db.execute(select(Department).order_by(Department.name))).scalars().all()
    return {"departments": [{"label": item.name, "value": str(item.id)} for item in departments],
            "modules": ["environmental", "social", "governance"]}


def _date_filter(query, column, start_date, end_date):
    if start_date:
        query = query.where(column >= start_date)
    if end_date:
        query = query.where(column <= end_date)
    return query


async def _environmental(db, department_id=None, start_date=None, end_date=None):
    query = (
        select(CarbonTransaction, Department.name, EmissionFactor.scope)
        .join(Department, Department.id == CarbonTransaction.department_id)
        .join(EmissionFactor, EmissionFactor.id == CarbonTransaction.emission_factor_id)
        .order_by(CarbonTransaction.transaction_date.desc())
    )
    if department_id:
        query = query.where(CarbonTransaction.department_id == department_id)
    query = _date_filter(query, CarbonTransaction.transaction_date, start_date, end_date)
    rows = (await db.execute(query)).all()
    totals = {"scope_1": 0.0, "scope_2": 0.0, "scope_3": 0.0}
    timeline = {}
    records = []
    for transaction, department, scope in rows:
        amount = float(transaction.calculated_emission)
        scope_value = getattr(scope, "value", scope)
        totals[scope_value] = totals.get(scope_value, 0) + amount
        month = transaction.transaction_date.strftime("%Y-%m")
        timeline[month] = timeline.get(month, 0) + amount
        records.append({
            "date": transaction.transaction_date.isoformat(),
            "item": transaction.description or transaction.source_reference or "Carbon transaction",
            "department": department,
            "scope": scope_value.replace("_", " ").title(),
            "source": transaction.source_type.value,
            "quantity": float(transaction.quantity),
            "unit": transaction.unit,
            "emissions": round(amount, 4),
        })
    total = sum(totals.values())
    return {
        "report_type": "Environmental Carbon Ledger",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {"total_emissions": round(total, 4), **{k: round(v, 4) for k, v in totals.items()}},
        "chart_data": [{"date": month, "emissions": round(value, 4)} for month, value in sorted(timeline.items())],
        "table_rows": records,
    }


async def _social(db, department_id=None, start_date=None, end_date=None):
    participation_query = (
        select(EmployeeParticipation, CSRActivity.title, Department.name)
        .join(CSRActivity, CSRActivity.id == EmployeeParticipation.activity_id)
        .outerjoin(Department, Department.id == CSRActivity.department_id)
        .order_by(EmployeeParticipation.created_at.desc())
    )
    if department_id:
        participation_query = participation_query.where(CSRActivity.department_id == department_id)
    participation_query = _date_filter(participation_query, EmployeeParticipation.created_at, start_date, end_date)
    participations = (await db.execute(participation_query)).all()
    training_query = select(func.avg(Training.completion_rate))
    diversity_query = select(func.count(DiversityMetric.id))
    if department_id:
        training_query = training_query.where(Training.department_id == department_id)
        diversity_query = diversity_query.where(DiversityMetric.department_id == department_id)
    training_rate = float((await db.execute(training_query)).scalar() or 0)
    diversity_metrics = int((await db.execute(diversity_query)).scalar() or 0)
    approved = sum(1 for p, _, _ in participations if p.approval_status.value == "approved")
    records = [{
        "date": p.created_at.date().isoformat(), "item": title, "department": department or "Organization-wide",
        "status": p.approval_status.value, "points": p.points_earned, "evidence": bool(p.proof_url),
    } for p, title, department in participations]
    return {
        "report_type": "Social Impact Report", "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {"total_participations": len(records), "approved_participations": approved,
                    "training_completion_rate": round(training_rate, 2), "diversity_metrics": diversity_metrics},
        "table_rows": records,
    }


async def _governance(db, department_id=None, start_date=None, end_date=None):
    query = (
        select(ComplianceIssue, Audit.title, Department.name)
        .join(Audit, Audit.id == ComplianceIssue.audit_id)
        .join(Department, Department.id == Audit.department_id)
        .order_by(ComplianceIssue.due_date)
    )
    if department_id:
        query = query.where(Audit.department_id == department_id)
    query = _date_filter(query, ComplianceIssue.created_at, start_date, end_date)
    issues = (await db.execute(query)).all()
    today = date.today()
    records = []
    for issue, audit_title, department in issues:
        status = issue.status.value
        if status in {"open", "in_progress"} and issue.due_date < today:
            status = "overdue"
        records.append({"date": issue.created_at.date().isoformat(), "item": issue.title,
                        "audit": audit_title, "department": department, "severity": issue.severity.value,
                        "owner_id": str(issue.owner_id), "due_date": issue.due_date.isoformat(), "status": status})
    audit_count = int((await db.execute(select(func.count(Audit.id)))).scalar() or 0)
    acknowledgements = int((await db.execute(select(func.count(PolicyAcknowledgement.id)))).scalar() or 0)
    return {
        "report_type": "Governance & Compliance Report", "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {"total_issues": len(records), "open_issues": sum(r["status"] == "open" for r in records),
                    "overdue_issues": sum(r["status"] == "overdue" for r in records),
                    "audits": audit_count, "policy_acknowledgements": acknowledgements},
        "table_rows": records,
    }


async def _executive(db):
    configs = {c.key: c.value for c in (await db.execute(select(ESGConfiguration))).scalars()}
    weights = {"environmental": int(configs.get("env_weight", 40)),
               "social": int(configs.get("social_weight", 30)),
               "governance": int(configs.get("governance_weight", 30))}
    if sum(weights.values()) != 100:
        raise BadRequestError("ESG weights must total 100")
    latest = (
        select(DepartmentScore.department_id, func.max(DepartmentScore.period).label("period"))
        .group_by(DepartmentScore.department_id).subquery()
    )
    rows = (await db.execute(
        select(Department.name, DepartmentScore)
        .join(latest, (latest.c.department_id == DepartmentScore.department_id) & (latest.c.period == DepartmentScore.period))
        .join(Department, Department.id == DepartmentScore.department_id)
        .order_by(DepartmentScore.total_score.desc())
    )).all()
    records = [{"department": name, "environmental": float(score.environmental_score),
                "social": float(score.social_score), "governance": float(score.governance_score),
                "overall": round(float(score.environmental_score) * weights["environmental"] / 100
                                 + float(score.social_score) * weights["social"] / 100
                                 + float(score.governance_score) * weights["governance"] / 100, 2)} for name, score in rows]
    averages = {key: round(sum(r[key] for r in records) / len(records), 2) if records else 0 for key in ("environmental", "social", "governance", "overall")}
    return {"report_type": "Executive ESG Summary", "generated_at": datetime.now(timezone.utc).isoformat(),
            "summary": averages, "weights": weights, "table_rows": records}


@router.get("/environmental")
async def get_environmental_report(department_id: Optional[UUID] = None, start_date: Optional[date] = None,
                                   end_date: Optional[date] = None, db: AsyncSession = Depends(get_db),
                                   current_user: User = Depends(require_roles(*REPORT_ROLES))):
    return await _environmental(db, department_id, start_date, end_date)


@router.get("/social")
async def get_social_report(department_id: Optional[UUID] = None, start_date: Optional[date] = None,
                            end_date: Optional[date] = None, db: AsyncSession = Depends(get_db),
                            current_user: User = Depends(require_roles(*REPORT_ROLES))):
    return await _social(db, department_id, start_date, end_date)


@router.get("/governance")
async def get_governance_report(department_id: Optional[UUID] = None, start_date: Optional[date] = None,
                                end_date: Optional[date] = None, db: AsyncSession = Depends(get_db),
                                current_user: User = Depends(require_roles(*REPORT_ROLES))):
    return await _governance(db, department_id, start_date, end_date)


@router.get("/executive-summary")
async def get_executive_summary_report(db: AsyncSession = Depends(get_db),
                                       current_user: User = Depends(require_roles(*REPORT_ROLES))):
    return await _executive(db)


@router.post("/custom")
async def generate_custom_report(filters: dict, db: AsyncSession = Depends(get_db),
                                 current_user: User = Depends(require_roles(*REPORT_ROLES))):
    values = filters.get("filters", filters)
    module = values.get("module") or values.get("report_type") or "environmental"
    department_id = UUID(values["department_id"]) if values.get("department_id") not in (None, "", "all") else None
    start = date.fromisoformat(values["start_date"]) if values.get("start_date") else None
    end = date.fromisoformat(values["end_date"]) if values.get("end_date") else None
    builders = {"environmental": _environmental, "social": _social, "governance": _governance}
    if module not in builders:
        raise BadRequestError("module must be environmental, social, or governance")
    result = await builders[module](db, department_id, start, end)
    result["custom_report_filters"] = values
    return result


def _tabular(report):
    rows = report.get("table_rows", [])
    headers = list(rows[0].keys()) if rows else ["metric", "value"]
    data = [[r.get(h, "") for h in headers] for r in rows] if rows else [[k, v] for k, v in report.get("summary", {}).items()]
    return headers, data


def _csv_bytes(report):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([report["report_type"]])
    writer.writerow([])
    writer.writerow(["Summary"])
    writer.writerows(report.get("summary", {}).items())
    writer.writerow([])
    headers, rows = _tabular(report)
    writer.writerow(headers)
    writer.writerows(rows)
    return output.getvalue().encode("utf-8")


def _excel_bytes(report):
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "ESG Report"
    sheet.append([report["report_type"]])
    sheet.append([])
    sheet.append(["Summary"])
    for item in report.get("summary", {}).items():
        sheet.append(list(item))
    sheet.append([])
    headers, rows = _tabular(report)
    sheet.append(headers)
    for row in rows:
        sheet.append(row)
    sheet.freeze_panes = f"A{sheet.max_row - len(rows)}"
    for column in sheet.columns:
        sheet.column_dimensions[column[0].column_letter].width = min(42, max(12, max(len(str(c.value or "")) for c in column) + 2))
    output = io.BytesIO()
    workbook.save(output)
    return output.getvalue()


def _pdf_bytes(report):
    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=landscape(A4), rightMargin=12 * mm, leftMargin=12 * mm,
                            topMargin=12 * mm, bottomMargin=12 * mm, title=report["report_type"])
    styles = getSampleStyleSheet()
    story = [Paragraph(report["report_type"], styles["Title"]),
             Paragraph(f"Generated {report.get('generated_at', '')}", styles["Normal"]), Spacer(1, 5 * mm)]
    summary = [[k.replace("_", " ").title(), str(v)] for k, v in report.get("summary", {}).items()]
    if summary:
        summary_table = Table(summary, colWidths=[60 * mm, 45 * mm])
        summary_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#ecfdf5")),
                                           ("GRID", (0, 0), (-1, -1), .4, colors.HexColor("#d1d5db")),
                                           ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"), ("PADDING", (0, 0), (-1, -1), 6)]))
        story.extend([summary_table, Spacer(1, 6 * mm)])
    headers, rows = _tabular(report)
    table_data = [[Paragraph(str(h).replace("_", " ").title(), styles["BodyText"]) for h in headers]]
    table_data += [[Paragraph(str(value), styles["BodyText"]) for value in row] for row in rows[:100]]
    table = Table(table_data, repeatRows=1)
    table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#064e3b")),
                               ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("GRID", (0, 0), (-1, -1), .3, colors.grey),
                               ("VALIGN", (0, 0), (-1, -1), "TOP"), ("FONTSIZE", (0, 0), (-1, -1), 7),
                               ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")])]))
    story.append(table)
    doc.build(story)
    return output.getvalue()


@router.get("/{report_id}/export")
async def export_report(report_id: str, format: str = Query("csv", pattern="^(csv|excel|pdf)$"),
                        db: AsyncSession = Depends(get_db), current_user: User = Depends(require_roles(*REPORT_ROLES))):
    builders = {"environmental": _environmental, "social": _social, "governance": _governance, "executive": _executive}
    if report_id not in builders:
        raise BadRequestError("Unknown report type")
    report = await builders[report_id](db)
    content, media_type, extension = {
        "csv": (_csv_bytes, "text/csv; charset=utf-8", "csv"),
        "excel": (_excel_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"),
        "pdf": (_pdf_bytes, "application/pdf", "pdf"),
    }[format]
    return StreamingResponse(io.BytesIO(content(report)), media_type=media_type,
                             headers={"Content-Disposition": f'attachment; filename="ecosync_{report_id}_report.{extension}"'})
