"""Phase 3 reporting service and Phase 4 CSV provider implementation."""

from collections.abc import Iterable, Mapping, Sequence
from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.repositories.report_repository import ReportRepository
from app.schemas.reports import MovementVolumeRow, ProductMovementRank, Ranking, StockValuationRow
from app.utils.enums import MovementType


class ReportService:
    """Shared report query orchestration used by JSON APIs and CSV streaming."""

    def __init__(self, repository: ReportRepository | None = None) -> None:
        self.repository = repository or ReportRepository()

    def stock_valuation(self, db: Session, page: int, page_size: int, warehouse_id: UUID | None = None, category_id: UUID | None = None):
        rows, total = self.repository.page(
            db, self.repository.stock_valuation_query(warehouse_id, category_id), page, page_size
        )
        return [StockValuationRow.model_validate(row) for row in rows], total

    def movement_volume(
        self,
        db: Session,
        page: int,
        page_size: int,
        *,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        movement_type: MovementType | None = None,
        product_id: UUID | None = None,
        warehouse_id: UUID | None = None,
        location_id: UUID | None = None,
    ):
        filters = {
            "date_from": date_from,
            "date_to": date_to,
            "movement_type": movement_type,
            "product_id": product_id,
            "warehouse_id": warehouse_id,
            "location_id": location_id,
        }
        rows, total = self.repository.page(db, self.repository.movement_volume_query(filters), page, page_size)
        return [MovementVolumeRow.model_validate(row) for row in rows], total

    def top_slow_moving(
        self,
        db: Session,
        page: int,
        page_size: int,
        ranking: Ranking = "top",
        *,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        warehouse_id: UUID | None = None,
        location_id: UUID | None = None,
    ):
        filters = {"date_from": date_from, "date_to": date_to, "warehouse_id": warehouse_id, "location_id": location_id}
        rows, total = self.repository.page(db, self.repository.top_slow_query(filters, ranking), page, page_size)
        return [ProductMovementRank.model_validate(row) for row in rows], total

    @staticmethod
    def columns(report_name: str) -> Sequence[str]:
        columns = {
            "stock": ("warehouse_id", "warehouse_name", "total_on_hand", "total_reserved", "total_free_to_use", "distinct_products", "total_stock_value"),
            "movements": ("movement_type", "movement_count", "quantity_volume"),
            "receipts": ("reference", "party_or_source", "location_or_destination", "scheduled_date", "status", "item_count", "quantity_total", "created_at"),
            "deliveries": ("reference", "party_or_source", "location_or_destination", "scheduled_date", "status", "item_count", "quantity_total", "created_at"),
            "transfers": ("reference", "party_or_source", "location_or_destination", "scheduled_date", "status", "item_count", "quantity_total", "created_at"),
            "adjustments": ("reference", "product_id", "location_id", "system_quantity", "physical_quantity", "difference", "reason", "status", "created_at"),
        }
        try:
            return columns[report_name]
        except KeyError as exc:
            raise ValueError(f"Unsupported report: {report_name}") from exc

    @staticmethod
    def _csv_filters(filters: Mapping[str, str]) -> dict:
        values: dict[str, object] = {}
        for key in ("product_id", "warehouse_id", "location_id", "category_id"):
            if filters.get(key):
                try:
                    values[key] = UUID(filters[key])
                except (ValueError, TypeError):
                    values[key] = filters[key]
        for key in ("date_from", "date_to"):
            if filters.get(key):
                try:
                    raw = filters[key].replace("Z", "+00:00")
                    values[key] = datetime.fromisoformat(raw)
                except (ValueError, TypeError):
                    pass
        if filters.get("movement_type"):
            try:
                values["movement_type"] = MovementType(filters["movement_type"])
            except (ValueError, KeyError):
                pass
        if filters.get("status"):
            values["status"] = filters["status"]
        return values

    def iter_rows(self, db: Session, report_name: str, filters: Mapping[str, str]) -> Iterable[Mapping[str, object]]:
        values = self._csv_filters(filters)
        if report_name == "stock":
            query = self.repository.stock_valuation_query(values.get("warehouse_id"), values.get("category_id"))
        elif report_name == "movements":
            query = self.repository.movement_volume_query(values)
        else:
            query = self.repository.operation_export_query(report_name, values)
        return self.repository.iter_mappings(db, query)


report_service = ReportService()