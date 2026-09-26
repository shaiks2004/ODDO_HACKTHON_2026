"""Authenticated stock adjustment endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.auth_dependencies import get_current_user
from app.api.v1.authorization import require_inventory_management
from app.api.v1.dependencies import db_session, error
from app.models import User
from app.schemas.adjustment import AdjustmentCreate, AdjustmentResponse
from app.services.adjustment_service import adjustment_service
from app.utils.enums import OperationStatus
from app.utils.pagination import Page, pagination

router = APIRouter(prefix="/adjustments", tags=["Adjustments"])


@router.get("", response_model=Page[AdjustmentResponse])
def list_adjustments(
	status: OperationStatus | None = None,
	product_id: UUID | None = None,
	search: str | None = None,
	page_data: tuple[int, int] = Depends(pagination),
	db: Session = Depends(db_session),
	_user: User = Depends(get_current_user),
):
	page, page_size = page_data
	rows, total = adjustment_service.list(db, page, page_size, status, product_id, search)
	return {"items": rows, "page": page, "page_size": page_size, "total": total}


@router.get("/{adjustment_id}", response_model=AdjustmentResponse)
def get_adjustment(adjustment_id: UUID, db: Session = Depends(db_session), _user: User = Depends(get_current_user)):
	try:
		return adjustment_service.get(db, adjustment_id)
	except Exception as exc:
		error(exc)


@router.post("", response_model=AdjustmentResponse, status_code=status.HTTP_201_CREATED)
def create_adjustment(payload: AdjustmentCreate, db: Session = Depends(db_session), user: User = Depends(get_current_user)):
	try:
		return adjustment_service.create_adjustment(db, payload.model_dump(), user.id)
	except Exception as exc:
		db.rollback()
		error(exc)


@router.post("/{adjustment_id}/validate", response_model=AdjustmentResponse, dependencies=[Depends(require_inventory_management)])
def validate_adjustment(adjustment_id: UUID, db: Session = Depends(db_session), _user: User = Depends(get_current_user)):
	try:
		return adjustment_service.validate_adjustment(db, adjustment_id)
	except Exception as exc:
		error(exc)


@router.post("/{adjustment_id}/cancel", response_model=AdjustmentResponse, dependencies=[Depends(require_inventory_management)])
def cancel_adjustment(adjustment_id: UUID, db: Session = Depends(db_session), _user: User = Depends(get_current_user)):
	try:
		return adjustment_service.cancel_adjustment(db, adjustment_id)
	except Exception as exc:
		error(exc)