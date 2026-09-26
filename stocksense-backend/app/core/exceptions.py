"""Central exception types for future domain error handling."""


class StockSenseError(Exception):
    """Base exception for application errors."""


class ResourceNotFoundError(StockSenseError):
    """Requested resource does not exist."""


class ConflictError(StockSenseError):
    """A unique business key is already in use."""


class DuplicateSKUError(StockSenseError):
    """Product SKU already exists."""


class InvalidOperationStatusError(StockSenseError):
    """Operation status transition is invalid."""


class InsufficientStockError(StockSenseError):
    """Free stock is insufficient for an operation."""


class InvalidTransferLocationError(StockSenseError):
    """Transfer source and destination are invalid."""


class InvalidQuantityError(StockSenseError):
    """Quantity is invalid for the requested operation."""


class UnauthorizedOperationError(StockSenseError):
    """User is not authorized for an operation."""


class ForbiddenOperationError(StockSenseError):
    """Authenticated user does not have the required role."""
