"""Authenticated dashboard summary and advanced KPI endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.auth_dependencies import get_current_user
from app.api.v1.dependencies import db_session
from app.models import User
from app.schemas.dashboard import AdvancedDashboardMetrics, DashboardSummary
from app.services.dashboard_service import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardSummary, summary="Get dashboard inventory and operation summary")
def get_dashboard(
	warehouse_id: UUID | None = None,
	db: Session = Depends(db_session),
	_user: User = Depends(get_current_user),
) -> DashboardSummary:
	"""Return inventory KPIs, operation breakdowns, and stock valuation, optionally filtered by warehouse."""
	return dashboard_service.summary(db, warehouse_id=warehouse_id)


@router.get("/advanced", response_model=AdvancedDashboardMetrics, summary="Get advanced dashboard metrics")
def get_advanced_dashboard(
	warehouse_id: UUID | None = None,
	db: Session = Depends(db_session),
	_user: User = Depends(get_current_user),
) -> AdvancedDashboardMetrics:
	"""Return comprehensive dashboard metrics including per-warehouse valuation and health indicators."""
	return dashboard_service.advanced_summary(db, warehouse_id=warehouse_id)
