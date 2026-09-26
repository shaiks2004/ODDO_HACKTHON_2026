"""Authenticated receipt document endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.auth_dependencies import get_current_user
from app.api.v1.authorization import require_inventory_management
from app.api.v1.dependencies import db_session, error
from app.models import User
from app.schemas.receipt import ReceiptCreate, ReceiptResponse
from app.services.receipt_service import receipt_service
from app.utils.enums import OperationStatus
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


@router.post("", response_model=ReceiptResponse, status_code=status.HTTP_201_CREATED)
def create_receipt(payload: ReceiptCreate, db: Session = Depends(db_session), user: User = Depends(get_current_user)):
	try:
		values = payload.model_dump(exclude={"items"})
		values["items"] = [item.model_dump() for item in payload.items]
		return receipt_service.create_receipt(db, values, user.id)
	except Exception as exc:
		db.rollback()
		error(exc)


@router.post("/{receipt_id}/validate", response_model=ReceiptResponse, dependencies=[Depends(require_inventory_management)])
def validate_receipt(receipt_id: UUID, db: Session = Depends(db_session), _user: User = Depends(get_current_user)):
	try:
		return receipt_service.validate_receipt(db, receipt_id)
	except Exception as exc:
		error(exc)


@router.post("/{receipt_id}/cancel", response_model=ReceiptResponse, dependencies=[Depends(require_inventory_management)])
def cancel_receipt(receipt_id: UUID, db: Session = Depends(db_session), _user: User = Depends(get_current_user)):
	try:
		return receipt_service.cancel_receipt(db, receipt_id)
	except Exception as exc:
		error(exc)


@router.get("/{receipt_id}/print")
def print_receipt(receipt_id: UUID, db: Session = Depends(db_session), _user: User = Depends(get_current_user)):
	from fastapi.responses import HTMLResponse
	try:
		html = receipt_service.print_receipt(db, receipt_id)
		return HTMLResponse(content=html, status_code=200)
	except Exception as exc:
		error(exc)