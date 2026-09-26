"""Inventory service contract placeholder."""

from typing import Any


class InventoryService:
    """Future owner of location-aware stock operations."""

    def get_stock(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError

    def get_stock_by_location(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError

    def calculate_free_to_use(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError