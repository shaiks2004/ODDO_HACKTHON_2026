"""Low-stock alert response contracts."""

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class LowStockAlert(BaseModel):
    product_id: UUID
    product_name: str
    sku: str
    location_id: UUID
    location_name: str
    location_code: str
    warehouse_id: UUID
    warehouse_name: str
    on_hand: Decimal
    reserved: Decimal
    free_to_use: Decimal
    reorder_level: Decimal
    reorder_quantity: Decimal
    suggested_reorder_quantity: Decimal
    stock_status: str