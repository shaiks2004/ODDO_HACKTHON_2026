"""Stock adjustment request and response schemas."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.utils.enums import OperationStatus


class AdjustmentCreate(BaseModel):
	product_id: UUID
	location_id: UUID
	physical_quantity: Decimal = Field(ge=0)
	reason: str = Field(min_length=1)


class AdjustmentResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: UUID
	reference: str
	product_id: UUID
	location_id: UUID
	system_quantity: Decimal
	physical_quantity: Decimal
	difference: Decimal
	reason: str
	status: OperationStatus
	created_by: UUID
	created_at: datetime
	updated_at: datetime