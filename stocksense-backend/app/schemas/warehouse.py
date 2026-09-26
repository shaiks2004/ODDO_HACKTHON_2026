from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class WarehouseCreate(BaseModel): name: str = Field(min_length=1, max_length=150); code: str = Field(min_length=1, max_length=50); address: str | None = None
class WarehouseUpdate(BaseModel): name: str | None = Field(default=None, min_length=1, max_length=150); address: str | None = None; is_active: bool | None = None
class WarehouseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID; name: str; code: str; address: str | None; is_active: bool; created_at: datetime; updated_at: datetime
