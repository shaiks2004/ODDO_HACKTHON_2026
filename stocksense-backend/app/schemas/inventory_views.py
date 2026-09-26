from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel

class InventoryListItem(BaseModel):
    product_id: UUID; product_name: str; sku: str; category_id: UUID; category_name: str; warehouse_id: UUID; warehouse_name: str; location_id: UUID; location_name: str; location_code: str; on_hand: Decimal; reserved: Decimal; free_to_use: Decimal

class InventoryProductSummary(BaseModel):
    product_id: UUID; product_name: str; sku: str; locations: list[InventoryListItem]; total_on_hand: Decimal; total_reserved: Decimal; total_free_to_use: Decimal
