"""Read-only stock movement history service."""

from app.repositories.stock_ledger_repository import StockLedgerRepository


class StockLedgerService:
    def __init__(self, repository: StockLedgerRepository | None = None) -> None:
        self.repository = repository or StockLedgerRepository()

    def get_history(self, db, **filters):
        return self.repository.list(db, **filters)


stock_ledger_service = StockLedgerService()