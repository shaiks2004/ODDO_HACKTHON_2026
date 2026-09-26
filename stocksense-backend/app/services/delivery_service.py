"""Delivery service contract placeholder."""

from typing import Any


class DeliveryService:
    """Future transactional owner of delivery workflows."""

    def create_delivery(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError

    def check_availability(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError

    def prepare_delivery(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError

    def validate_delivery(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError

    def cancel_delivery(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError