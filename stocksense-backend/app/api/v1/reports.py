"""Authenticated reporting APIs for warehouse analytics and velocity."""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.auth_dependencies import get_current_user
from app.api.v1.dependencies import db_session
from app.models import User
from app.schemas.reporting import (
	MovementVolumeItem,
	ProductMovementVelocityItem,
	WarehouseStockValuation,
)
from app.services.reporting_service import reporting_service
from app.utils.enums import MovementType
from app.utils.pagination import Page, pagination

router = APIRouter(prefix="/reports", tags=["Reporting"])


@router.get(
	"/stock-valuation",
	response_model=Page[WarehouseStockValuation],
	summary="Stock valuation by warehouse",
	description="Returns paginated stock valuation and inventory totals grouped by warehouse.",
)
@router.get(
	"/stock-valuation-by-warehouse",
	response_model=Page[WarehouseStockValuation],
	include_in_schema=False,
)
def get_stock_valuation(
	warehouse_id: UUID | None = Query(default=None, description="Optional warehouse filter"),
	page_data: tuple[int, int] = Depends(pagination),
	db: Session = Depends(db_session),
	_user: User = Depends(get_current_user),
) -> dict:
	page, page_size = page_data
	items, total = reporting_service.get_stock_valuation(db, page, page_size, warehouse_id=warehouse_id)
	return {"items": items, "page": page, "page_size": page_size, "total": total}


@router.get(
	"/movement-volume",
	response_model=Page[MovementVolumeItem],
	summary="Movement volume by date range",
	description="Returns aggregated stock movement quantities and counts across a date range.",
)
def get_movement_volume(
	start_date: datetime | None = Query(default=None, description="Start date/time filter (inclusive)"),
	end_date: datetime | None = Query(default=None, description="End date/time filter (inclusive)"),
	movement_type: MovementType | None = Query(default=None, description="Optional movement type filter"),
	product_id: UUID | None = Query(default=None, description="Optional product filter"),
	page_data: tuple[int, int] = Depends(pagination),
	db: Session = Depends(db_session),
	_user: User = Depends(get_current_user),
) -> dict:
	page, page_size = page_data
	items, total = reporting_service.get_movement_volume(
		db,
		page,
		page_size,
		start_date=start_date,
		end_date=end_date,
		movement_type=movement_type,
		product_id=product_id,
	)
	return {"items": items, "page": page, "page_size": page_size, "total": total}


@router.get(
	"/top-slow-moving",
	response_model=Page[ProductMovementVelocityItem],
	summary="Top/slow-moving products",
	description="Returns products ranked by movement velocity (top-moving or slow-moving).",
)
@router.get(
	"/product-velocity",
	response_model=Page[ProductMovementVelocityItem],
	include_in_schema=False,
)
def get_top_slow_moving(
	ranking: str = Query(default="top", description="Ranking mode: 'top' (fastest moving) or 'slow' (least moved)"),
	start_date: datetime | None = Query(default=None, description="Start date/time filter"),
	end_date: datetime | None = Query(default=None, description="End date/time filter"),
	category_id: UUID | None = Query(default=None, description="Optional category filter"),
	page_data: tuple[int, int] = Depends(pagination),
	db: Session = Depends(db_session),
	_user: User = Depends(get_current_user),
) -> dict:
	page, page_size = page_data
	items, total = reporting_service.get_top_slow_moving(
		db,
		page,
		page_size,
		ranking=ranking,
		start_date=start_date,
		end_date=end_date,
		category_id=category_id,
	)
	return {"items": items, "page": page, "page_size": page_size, "total": total}
