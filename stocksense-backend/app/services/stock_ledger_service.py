"""Stock ledger service contract placeholder."""

from typing import Any


class StockLedgerService:
    """Future owner of audit movement creation and history queries."""

    def create_movement(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError

    def get_history(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError