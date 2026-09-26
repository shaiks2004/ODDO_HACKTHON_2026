"""Receipt service contract placeholder."""

from typing import Any


class ReceiptService:
    """Future transactional owner of receipt workflows."""

    def create_receipt(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError

    def validate_receipt(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError

    def cancel_receipt(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError