"""Shared domain enumerations."""

from enum import StrEnum


class OperationStatus(StrEnum):
    """Lifecycle states shared by operation documents."""

    DRAFT = "DRAFT"
    WAITING = "WAITING"
    READY = "READY"
    DONE = "DONE"
    CANCELED = "CANCELED"


class MovementType(StrEnum):
    """Types of stock ledger movements."""

    INITIAL_STOCK = "INITIAL_STOCK"
    RECEIPT = "RECEIPT"
    DELIVERY = "DELIVERY"
    TRANSFER_IN = "TRANSFER_IN"
    TRANSFER_OUT = "TRANSFER_OUT"
    ADJUSTMENT = "ADJUSTMENT"


class UserRole(StrEnum):
    ADMIN = "ADMIN"
    INVENTORY_MANAGER = "INVENTORY_MANAGER"
    WAREHOUSE_MANAGER = "WAREHOUSE_MANAGER"
    WAREHOUSE_STAFF = "WAREHOUSE_STAFF"
    OPERATIONS_STAFF = "OPERATIONS_STAFF"


class UnitOfMeasure(StrEnum):
    UNIT = "UNIT"
    KG = "KG"
    METER = "METER"
    LITER = "LITER"
    PAIR = "PAIR"
    PACK = "PACK"
