"""Authenticated internal transfer endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.auth_dependencies import get_current_user
from app.api.v1.dependencies import db_session, error
from app.models import User
from app.schemas.transfer import TransferCreate, TransferResponse
from app.services.transfer_service import transfer_service
from app.utils.enums import OperationStatus
from app.utils.pagination import Page, pagination

router = APIRouter(prefix="/transfers", tags=["Transfers"])


@router.get("", response_model=Page[TransferResponse])
def list_transfers(
	status: OperationStatus | None = None,
	search: str | None = None,
	page_data: tuple[int, int] = Depends(pagination),
	db: Session = Depends(db_session),
	_user: User = Depends(get_current_user),
):
	page, page_size = page_data
	rows, total = transfer_service.list(db, page, page_size, status, search)
	return {"items": rows, "page": page, "page_size": page_size, "total": total}


@router.get("/{transfer_id}", response_model=TransferResponse)
def get_transfer(transfer_id: UUID, db: Session = Depends(db_session), _user: User = Depends(get_current_user)):
	try:
		return transfer_service.get(db, transfer_id)
	except Exception as exc:
		error(exc)


@router.post("", response_model=TransferResponse, status_code=status.HTTP_201_CREATED)
def create_transfer(payload: TransferCreate, db: Session = Depends(db_session), user: User = Depends(get_current_user)):
	try:
		values = payload.model_dump(exclude={"items"})
		values["items"] = [item.model_dump() for item in payload.items]
		return transfer_service.create_transfer(db, values, user.id)
	except Exception as exc:
		db.rollback()
		error(exc)


@router.post("/{transfer_id}/validate", response_model=TransferResponse)
def validate_transfer(transfer_id: UUID, db: Session = Depends(db_session), _user: User = Depends(get_current_user)):
	try:
		return transfer_service.validate_transfer(db, transfer_id)
	except Exception as exc:
		error(exc)


@router.post("/{transfer_id}/cancel", response_model=TransferResponse)
def cancel_transfer(transfer_id: UUID, db: Session = Depends(db_session), _user: User = Depends(get_current_user)):
	try:
		return transfer_service.cancel_transfer(db, transfer_id)
	except Exception as exc:
		error(exc)