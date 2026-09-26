"""Authenticated receipt document endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.api.v1.auth_dependencies import get_current_user, require_role
from app.api.v1.dependencies import db_session, error
from app.models import User
from app.schemas.receipt import ReceiptCreate, ReceiptResponse
from app.services.receipt_service import receipt_service
from app.utils.enums import OperationStatus, UserRole
from app.utils.pagination import Page, pagination

router = APIRouter(prefix="/receipts", tags=["Receipts"])


@router.get("", response_model=Page[ReceiptResponse])
def list_receipts(
	status: OperationStatus | None = None,
	search: str | None = None,
	page_data: tuple[int, int] = Depends(pagination),
	db: Session = Depends(db_session),
	_user: User = Depends(get_current_user),
):
	page, page_size = page_data
	rows, total = receipt_service.list(db, page, page_size, status, search)
	return {"items": rows, "page": page, "page_size": page_size, "total": total}


@router.get("/{receipt_id}", response_model=ReceiptResponse)
def get_receipt(receipt_id: UUID, db: Session = Depends(db_session), _user: User = Depends(get_current_user)):
	try:
		return receipt_service.get(db, receipt_id)
	except Exception as exc:
		error(exc)


@router.get(
	"/{receipt_id}/print",
	response_class=HTMLResponse,
	summary="Print receipt document as server-rendered HTML",
	responses={
		200: {"content": {"text/html": {}}, "description": "Server-rendered HTML receipt document"},
		400: {"description": "Document status is not DONE"},
		404: {"description": "Receipt not found"},
	},
)
def print_receipt(receipt_id: UUID, db: Session = Depends(db_session), _user: User = Depends(get_current_user)):
	try:
		html = receipt_service.render_print_document(db, receipt_id)
		return HTMLResponse(content=html, status_code=status.HTTP_200_OK)
	except Exception as exc:
		error(exc)


@router.post("", response_model=ReceiptResponse, status_code=status.HTTP_201_CREATED)
def create_receipt(payload: ReceiptCreate, db: Session = Depends(db_session), user: User = Depends(get_current_user)):
	try:
		values = payload.model_dump(exclude={"items"})
		values["items"] = [item.model_dump() for item in payload.items]
		return receipt_service.create_receipt(db, values, user.id)
	except Exception as exc:
		db.rollback()
		error(exc)


@router.post("/{receipt_id}/validate", response_model=ReceiptResponse)
def validate_receipt(
	receipt_id: UUID,
	db: Session = Depends(db_session),
	_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)),
):
	try:
		return receipt_service.validate_receipt(db, receipt_id)
	except Exception as exc:
		error(exc)


@router.post("/{receipt_id}/cancel", response_model=ReceiptResponse)
def cancel_receipt(
	receipt_id: UUID,
	db: Session = Depends(db_session),
	_user: User = Depends(require_role(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)),
):
	try:
		return receipt_service.cancel_receipt(db, receipt_id)
	except Exception as exc:
		error(exc)
