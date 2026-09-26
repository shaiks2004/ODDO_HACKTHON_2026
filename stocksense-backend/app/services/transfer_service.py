"""Transfer service contract placeholder."""

from typing import Any


class TransferService:
    """Future transactional owner of internal transfers."""

    def create_transfer(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError

    def validate_transfer(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError

    def cancel_transfer(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError