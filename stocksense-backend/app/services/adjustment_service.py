"""Adjustment service contract placeholder."""

from typing import Any


class AdjustmentService:
    """Future transactional owner of physical stock adjustments."""

    def create_adjustment(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError

    def validate_adjustment(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError