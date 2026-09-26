"""Phase 3 JSON reports and Phase 4 CSV exports backed by one report service."""

from datetime import datetime
from enum import StrEnum
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.v1.auth_dependencies import get_current_user
from app.api.v1.dependencies import db_session
from app.models import User
from app.schemas.reports import MovementVolumeRow, ProductMovementRank, Ranking, StockValuationRow
from app.services.report_export_service import ReportExportProvider, csv_response
from app.services.report_service import report_service
from app.utils.enums import MovementType
from app.utils.pagination import Page, pagination


class ReportName(StrEnum):
    STOCK = "stock"
    MOVEMENTS = "movements"
    RECEIPTS = "receipts"
    DELIVERIES = "deliveries"
    TRANSFERS = "transfers"
    ADJUSTMENTS = "adjustments"


router = APIRouter(prefix="/reports", tags=["Report Exports"])


@router.get("/stock-valuation", response_model=Page[StockValuationRow], tags=["Reports"])
def get_stock_valuation(
    warehouse_id: UUID | None = None,
    category_id: UUID | None = None,
    page_data: tuple[int, int] = Depends(pagination),
    db: Session = Depends(db_session),
    _user: User = Depends(get_current_user),
):
    page, page_size = page_data
    items, total = report_service.stock_valuation(db, page, page_size, warehouse_id, category_id)
    return {"items": items, "page": page, "page_size": page_size, "total": total}


@router.get("/movement-volume", response_model=Page[MovementVolumeRow], tags=["Reports"])
def get_movement_volume(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    movement_type: MovementType | None = None,
    product_id: UUID | None = None,
    warehouse_id: UUID | None = None,
    location_id: UUID | None = None,
    page_data: tuple[int, int] = Depends(pagination),
    db: Session = Depends(db_session),
    _user: User = Depends(get_current_user),
):
    page, page_size = page_data
    items, total = report_service.movement_volume(
        db,
        page,
        page_size,
        date_from=date_from,
        date_to=date_to,
        movement_type=movement_type,
        product_id=product_id,
        warehouse_id=warehouse_id,
        location_id=location_id,
    )
    return {"items": items, "page": page, "page_size": page_size, "total": total}


@router.get("/top-slow-moving", response_model=Page[ProductMovementRank], tags=["Reports"])
def get_top_slow_moving(
    ranking: Ranking = "top",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    warehouse_id: UUID | None = None,
    location_id: UUID | None = None,
    page_data: tuple[int, int] = Depends(pagination),
    db: Session = Depends(db_session),
    _user: User = Depends(get_current_user),
):
    page, page_size = page_data
    items, total = report_service.top_slow_moving(
        db,
        page,
        page_size,
        ranking,
        date_from=date_from,
        date_to=date_to,
        warehouse_id=warehouse_id,
        location_id=location_id,
    )
    return {"items": items, "page": page, "page_size": page_size, "total": total}


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
    provider: ReportExportProvider = getattr(request.app.state, "report_export_provider", None) or report_service
    filters = {key: value for key, value in request.query_params.items() if key != "format"}
    return csv_response(db, report_name.value, filters, provider)