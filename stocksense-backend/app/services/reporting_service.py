"""Service layer for Phase 3 reporting analytics."""

from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.repositories.reporting_repository import ReportingRepository, reporting_repository
from app.utils.enums import MovementType


class ReportingService:
    def __init__(self, repository: ReportingRepository | None = None) -> None:
        self.repository = repository or reporting_repository

    def get_stock_valuation(
        self,
        db: Session,
        page: int,
        page_size: int,
        warehouse_id: UUID | None = None,
    ) -> tuple[list[dict], int]:
        all_rows = self.repository.stock_valuation_by_warehouse(db, warehouse_id=warehouse_id)
        total = len(all_rows)
        start = (page - 1) * page_size
        return all_rows[start : start + page_size], total

    def get_movement_volume(
        self,
        db: Session,
        page: int,
        page_size: int,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        movement_type: MovementType | None = None,
        product_id: UUID | None = None,
    ) -> tuple[list[dict], int]:
        all_rows = self.repository.movement_volume_by_date_range(
            db,
            start_date=start_date,
            end_date=end_date,
            movement_type=movement_type,
            product_id=product_id,
        )
        total = len(all_rows)
        start = (page - 1) * page_size
        return all_rows[start : start + page_size], total

    def get_top_slow_moving(
        self,
        db: Session,
        page: int,
        page_size: int,
        ranking: str = "top",
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        category_id: UUID | None = None,
    ) -> tuple[list[dict], int]:
        all_rows = self.repository.top_slow_moving_products(
            db,
            ranking=ranking,
            start_date=start_date,
            end_date=end_date,
            category_id=category_id,
        )
        total = len(all_rows)
        start = (page - 1) * page_size
        return all_rows[start : start + page_size], total


reporting_service = ReportingService()
