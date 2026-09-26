from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, computed_field

class InventoryCreate(BaseModel): product_id: UUID; location_id: UUID; on_hand: Decimal = Decimal("0"); reserved: Decimal = Decimal("0")
class InventoryUpdate(BaseModel): reserved: Decimal | None = None
class InventoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID; product_id: UUID; location_id: UUID; on_hand: Decimal; reserved: Decimal; created_at: datetime; updated_at: datetime
    @computed_field
    @property
    def free_to_use(self) -> Decimal: return self.on_hand - self.reserved
