from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.utils.enums import UnitOfMeasure

class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200); sku: str = Field(min_length=1, max_length=100); category_id: UUID; unit_of_measure: UnitOfMeasure; unit_cost: Decimal = Field(default=Decimal("0"), ge=0); reorder_level: Decimal = Field(default=Decimal("0"), ge=0); reorder_quantity: Decimal = Field(default=Decimal("0"), ge=0); barcode: str | None = Field(default=None, max_length=100)
class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200); sku: str | None = Field(default=None, min_length=1, max_length=100); category_id: UUID | None = None; unit_cost: Decimal | None = Field(default=None, ge=0); reorder_level: Decimal | None = Field(default=None, ge=0); reorder_quantity: Decimal | None = Field(default=None, ge=0); barcode: str | None = Field(default=None, max_length=100); is_active: bool | None = None
class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID; name: str; sku: str; category_id: UUID; unit_of_measure: UnitOfMeasure; unit_cost: Decimal; reorder_level: Decimal; reorder_quantity: Decimal; barcode: str | None; is_active: bool; created_at: datetime; updated_at: datetime
