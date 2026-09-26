"""CSV export adapter for Phase 3 report services, when available."""

from enum import StrEnum

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.v1.auth_dependencies import get_current_user
from app.api.v1.dependencies import db_session
from app.models import User
from app.services.report_export_service import ReportExportProvider, csv_response


class ReportName(StrEnum):
    STOCK = "stock"
    MOVEMENTS = "movements"
    RECEIPTS = "receipts"
    DELIVERIES = "deliveries"
    TRANSFERS = "transfers"
    ADJUSTMENTS = "adjustments"


router = APIRouter(prefix="/reports", tags=["Report Exports"])


@router.get("/{report_name}/export")
def export_report(
    report_name: ReportName,
    request: Request,
    format: str = "csv",
    db: Session = Depends(db_session),
    _user: User = Depends(get_current_user),
):
    if format.lower() != "csv":
        raise HTTPException(status_code=422, detail="Only CSV export is supported")
    provider: ReportExportProvider | None = getattr(request.app.state, "report_export_provider", None)
    if provider is None:
        raise HTTPException(status_code=503, detail="Phase 3 reporting service is not available")
    filters = {key: value for key, value in request.query_params.items() if key != "format"}
    return csv_response(db, report_name.value, filters, provider)