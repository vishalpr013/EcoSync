"""
Reports API routes: Environmental, Social, Governance, Executive, Custom reports.
Supports PDF, Excel, and CSV export formats.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from uuid import UUID
from datetime import date
import io
import csv

from app.database.session import get_db
from app.api.deps import get_current_user, require_roles
from app.core.security import UserRole
from app.models.core import User

router = APIRouter()

@router.get("/environmental")
async def get_environmental_report(
    department_id: Optional[UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER))
):
    """Retrieve environmental report data (carbon emissions, scope breakdown)."""
    return {"report_type": "Environmental", "data": []}

@router.get("/social")
async def get_social_report(
    department_id: Optional[UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER))
):
    """Retrieve social report data (diversity, CSR participation, trainings)."""
    return {"report_type": "Social", "data": []}

@router.get("/governance")
async def get_governance_report(
    department_id: Optional[UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER, UserRole.AUDITOR))
):
    """Retrieve governance report data (audit compliance, issues raised, resolutions)."""
    return {"report_type": "Governance", "data": []}

@router.get("/executive-summary")
async def get_executive_summary_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER))
):
    """Retrieve overall executive level summary dashboard data."""
    return {"report_type": "Executive Summary", "data": []}

@router.post("/custom")
async def generate_custom_report(
    filters: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER))
):
    """Custom Report Builder endpoint that filters and outputs matching data."""
    # Build dynamic query on modules based on categories/filters
    return {"custom_report_filters": filters, "data": []}

@router.get("/{report_id}/export")
async def export_report(
    report_id: str,
    format: str = Query("csv", regex="^(csv|excel|pdf)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER, UserRole.AUDITOR))
):
    """Export standard reports into requested format (CSV, Excel, PDF)."""
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Report ID", "Module", "Score", "Timestamp"])
        writer.writerow([report_id, "Environmental", "82.5", "2026-07-12"])
        
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=report_{report_id}.csv"}
        )
        
    elif format in ("excel", "pdf"):
        # Placeholder binary stream
        stream = io.BytesIO(b"Excel/PDF Export placeholder data binary stream")
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if format == "excel" else "application/pdf"
        ext = "xlsx" if format == "excel" else "pdf"
        return StreamingResponse(
            stream,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename=report_{report_id}.{ext}"}
        )

    raise HTTPException(status_code=400, detail="Invalid format specified")
