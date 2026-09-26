"""Authenticated delivery document endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.api.v1.auth_dependencies import get_current_user, require_role
from app.api.v1.dependencies import db_session, error
from app.models import User
from app.schemas.delivery import DeliveryCreate, DeliveryResponse
from app.services.delivery_service import delivery_service
from app.utils.enums import OperationStatus, UserRole
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


@router.get(
	"/{delivery_id}/print",
	response_class=HTMLResponse,
	summary="Print delivery document as server-rendered HTML",
	responses={
		200: {"content": {"text/html": {}}, "description": "Server-rendered HTML delivery document"},
		400: {"description": "Document status is not DONE"},
		404: {"description": "Delivery not found"},
	},
)
def print_delivery(delivery_id: UUID, db: Session = Depends(db_session), _user: User = Depends(get_current_user)):
	try:
		html = delivery_service.render_print_document(db, delivery_id)
		return HTMLResponse(content=html, status_code=status.HTTP_200_OK)
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


@router.post("/{delivery_id}/validate", response_model=DeliveryResponse)
def validate_delivery(
	delivery_id: UUID,
	db: Session = Depends(db_session),
	_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)),
):
	try:
		return delivery_service.validate_delivery(db, delivery_id)
	except Exception as exc:
		error(exc)


@router.post("/{delivery_id}/cancel", response_model=DeliveryResponse)
def cancel_delivery(
	delivery_id: UUID,
	db: Session = Depends(db_session),
	_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)),
):
	try:
		return delivery_service.cancel_delivery(db, delivery_id)
	except Exception as exc:
		error(exc)
