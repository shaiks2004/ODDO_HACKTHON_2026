"""Authenticated dashboard summary endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.auth_dependencies import get_current_user
from app.api.v1.dependencies import db_session
from app.models import User
from app.schemas.dashboard import DashboardSummary
from app.services.dashboard_service import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardSummary)
def get_dashboard(db: Session = Depends(db_session), _user: User = Depends(get_current_user)) -> DashboardSummary:
	return dashboard_service.summary(db)