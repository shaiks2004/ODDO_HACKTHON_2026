"""Authenticated, read-only stock ledger history endpoint."""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.auth_dependencies import get_current_user
from app.api.v1.dependencies import db_session
from app.models import User
from app.schemas.stock_ledger import StockLedgerResponse
from app.services.stock_ledger_service import stock_ledger_service
from app.utils.enums import MovementType
from app.utils.pagination import Page, pagination

router = APIRouter(prefix="/stock-ledger", tags=["Stock Ledger"])


@router.get("", response_model=Page[StockLedgerResponse])
def list_stock_ledger(
	product_id: UUID | None = None,
	location_id: UUID | None = None,
	movement_type: MovementType | None = None,
	date_from: datetime | None = None,
	date_to: datetime | None = None,
	reference_id: UUID | None = None,
	page_data: tuple[int, int] = Depends(pagination),
	db: Session = Depends(db_session),
	_user: User = Depends(get_current_user),
):
	page, page_size = page_data
	rows, total = stock_ledger_service.get_history(
		db,
		page=page,
		page_size=page_size,
		product_id=product_id,
		location_id=location_id,
		movement_type=movement_type,
		date_from=date_from,
		date_to=date_to,
		reference_id=reference_id,
	)
	return {"items": rows, "page": page, "page_size": page_size, "total": total}