"""Authenticated low-stock alert query endpoint."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.auth_dependencies import get_current_user
from app.api.v1.dependencies import db_session
from app.models import User
from app.schemas.alert import LowStockAlert
from app.services.alert_service import alert_service

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/low-stock", response_model=list[LowStockAlert])
def get_low_stock_alerts(
    product_id: UUID | None = None,
    warehouse_id: UUID | None = None,
    location_id: UUID | None = None,
    category_id: UUID | None = None,
    search: str | None = None,
    db: Session = Depends(db_session),
    _user: User = Depends(get_current_user),
):
    return alert_service.low_stock(
        db,
        product_id=product_id,
        warehouse_id=warehouse_id,
        location_id=location_id,
        category_id=category_id,
        search=search,
    )