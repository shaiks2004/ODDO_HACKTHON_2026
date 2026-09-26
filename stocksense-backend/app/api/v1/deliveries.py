"""Authenticated delivery document endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.auth_dependencies import get_current_user
from app.api.v1.authorization import require_inventory_management
from app.api.v1.dependencies import db_session, error
from app.models import User
from app.schemas.delivery import DeliveryCreate, DeliveryResponse
from app.services.delivery_service import delivery_service
from app.utils.enums import OperationStatus
from app.utils.pagination import Page, pagination

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])


@router.get("", response_model=Page[DeliveryResponse])
def list_deliveries(
	status: OperationStatus | None = None,
	search: str | None = None,
	page_data: tuple[int, int] = Depends(pagination),
	db: Session = Depends(db_session),
	_user: User = Depends(get_current_user),
):
	page, page_size = page_data
	rows, total = delivery_service.list(db, page, page_size, status, search)
	return {"items": rows, "page": page, "page_size": page_size, "total": total}


@router.get("/{delivery_id}", response_model=DeliveryResponse)
def get_delivery(delivery_id: UUID, db: Session = Depends(db_session), _user: User = Depends(get_current_user)):
	try:
		return delivery_service.get(db, delivery_id)
	except Exception as exc:
		error(exc)


@router.post("", response_model=DeliveryResponse, status_code=status.HTTP_201_CREATED)
def create_delivery(payload: DeliveryCreate, db: Session = Depends(db_session), user: User = Depends(get_current_user)):
	try:
		values = payload.model_dump(exclude={"items"})
		values["items"] = [item.model_dump() for item in payload.items]
		return delivery_service.create_delivery(db, values, user.id)
	except Exception as exc:
		db.rollback()
		error(exc)


@router.post("/{delivery_id}/prepare", response_model=DeliveryResponse)
def prepare_delivery(delivery_id: UUID, db: Session = Depends(db_session), _user: User = Depends(get_current_user)):
	try:
		return delivery_service.prepare_delivery(db, delivery_id)
	except Exception as exc:
		error(exc)


@router.post("/{delivery_id}/validate", response_model=DeliveryResponse, dependencies=[Depends(require_inventory_management)])
def validate_delivery(delivery_id: UUID, db: Session = Depends(db_session), _user: User = Depends(get_current_user)):
	try:
		return delivery_service.validate_delivery(db, delivery_id)
	except Exception as exc:
		error(exc)


@router.post("/{delivery_id}/cancel", response_model=DeliveryResponse, dependencies=[Depends(require_inventory_management)])
def cancel_delivery(delivery_id: UUID, db: Session = Depends(db_session), _user: User = Depends(get_current_user)):
	try:
		return delivery_service.cancel_delivery(db, delivery_id)
	except Exception as exc:
		error(exc)


@router.get("/{delivery_id}/print")
def print_delivery(delivery_id: UUID, db: Session = Depends(db_session), _user: User = Depends(get_current_user)):
	from fastapi.responses import HTMLResponse
	try:
		html = delivery_service.print_delivery(db, delivery_id)
		return HTMLResponse(content=html, status_code=200)
	except Exception as exc:
		error(exc)