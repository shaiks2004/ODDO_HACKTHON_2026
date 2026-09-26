"""Shared domain enumerations."""

from enum import StrEnum


class OperationStatus(StrEnum):
    """Lifecycle states shared by operation documents."""

    DRAFT = "draft"
    WAITING = "waiting"
    READY = "ready"
    DONE = "done"
    CANCELED = "canceled"


class MovementType(StrEnum):
    """Types of stock ledger movements."""

    RECEIPT = "receipt"
    DELIVERY = "delivery"
    TRANSFER_IN = "transfer_in"
    TRANSFER_OUT = "transfer_out"
    ADJUSTMENT = "adjustment"