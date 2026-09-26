"""Phase 3 paginated reporting response schemas."""

from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

from app.utils.enums import MovementType, UnitOfMeasure


class StockValuationRow(BaseModel):
    warehouse_id: UUID
    warehouse_name: str
    total_on_hand: Decimal
    total_reserved: Decimal
    total_free_to_use: Decimal
    distinct_products: int
    total_stock_value: Decimal


class MovementVolumeRow(BaseModel):
    movement_type: MovementType
    movement_count: int
    quantity_volume: Decimal


class ProductMovementRank(BaseModel):
    product_id: UUID
    product_name: str
    sku: str
    unit_of_measure: UnitOfMeasure
    movement_count: int
    movement_volume: Decimal


class ReportFilters(BaseModel):
    date_from: datetime | None = None
    date_to: datetime | None = None
    movement_type: MovementType | None = None
    product_id: UUID | None = None
    warehouse_id: UUID | None = None
    location_id: UUID | None = None


Ranking = Literal["top", "slow"]