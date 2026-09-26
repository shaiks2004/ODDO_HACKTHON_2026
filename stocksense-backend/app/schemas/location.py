from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class LocationCreate(BaseModel): warehouse_id: UUID; name: str = Field(min_length=1, max_length=150); code: str = Field(min_length=1, max_length=80)
class LocationUpdate(BaseModel): name: str | None = Field(default=None, min_length=1, max_length=150); code: str | None = Field(default=None, min_length=1, max_length=80); is_active: bool | None = None
class LocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID; warehouse_id: UUID; name: str; code: str; is_active: bool; created_at: datetime
