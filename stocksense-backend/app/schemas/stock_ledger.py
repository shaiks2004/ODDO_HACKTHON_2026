"""Read-only stock ledger response schema."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.utils.enums import MovementType


class StockLedgerResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: UUID
	product_id: UUID
	source_location_id: UUID | None
	destination_location_id: UUID | None
	movement_type: MovementType
	quantity: Decimal
	reference_type: str
	reference_id: UUID | None
	created_by: UUID | None
	created_at: datetime