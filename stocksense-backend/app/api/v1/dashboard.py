"""Authenticated dashboard summary endpoint."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.auth_dependencies import get_current_user
from app.api.v1.dependencies import db_session
from app.models import User
from app.schemas.dashboard import AdvancedDashboardSummary, DashboardSummary
from app.services.dashboard_service import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardSummary)
def get_dashboard(
	warehouse_id: UUID | None = None,
	db: Session = Depends(db_session),
	_user: User = Depends(get_current_user),
) -> DashboardSummary:
	return dashboard_service.summary(db, warehouse_id)


@router.get("/advanced", response_model=AdvancedDashboardSummary)
def get_advanced_dashboard(
	warehouse_id: UUID | None = None,
	db: Session = Depends(db_session),
	_user: User = Depends(get_current_user),
) -> AdvancedDashboardSummary:
	return dashboard_service.advanced_summary(db, warehouse_id)