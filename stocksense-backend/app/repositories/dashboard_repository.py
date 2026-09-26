"""SQL aggregate queries for dashboard summaries."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, aliased

from app.models import Delivery, Inventory, Location, Product, Receipt, StockLedger, Transfer, Warehouse
from app.utils.enums import OperationStatus


class DashboardRepository:
    @staticmethod
    def _inventory_scope(query, warehouse_id: UUID | None):
        if warehouse_id is not None:
            query = query.where(Location.warehouse_id == warehouse_id)
        return query

    def inventory_totals(self, db: Session, warehouse_id: UUID | None = None) -> dict:
        query = (
            select(
                func.coalesce(func.sum(Inventory.on_hand), 0),
                func.coalesce(func.sum(Inventory.reserved), 0),
                func.coalesce(func.sum(Inventory.on_hand - Inventory.reserved), 0),
                func.coalesce(func.sum(Inventory.on_hand * Product.unit_cost), 0),
            )
            .select_from(Inventory)
            .join(Product, Product.id == Inventory.product_id)
            .join(Location, Location.id == Inventory.location_id)
        )
        values = db.execute(self._inventory_scope(query, warehouse_id)).one()
        return {
            "total_on_hand": values[0],
            "total_reserved": values[1],
            "total_free_to_use": values[2],
            "total_stock_value": values[3],
        }

    def product_counts(self, db: Session, warehouse_id: UUID | None = None) -> tuple[int, int]:
        if warehouse_id is None:
            total = db.scalar(select(func.count(Product.id))) or 0
            active = db.scalar(select(func.count(Product.id)).where(Product.is_active.is_(True))) or 0
            return total, active
        query = (
            select(
                func.count(func.distinct(Product.id)),
                func.count(func.distinct(Product.id)).filter(Product.is_active.is_(True)),
            )
            .select_from(Product)
            .join(Inventory, Inventory.product_id == Product.id)
            .join(Location, Location.id == Inventory.location_id)
            .where(Location.warehouse_id == warehouse_id)
        )
        total, active = db.execute(query).one()
        return int(total or 0), int(active or 0)

    def warehouse_totals(self, db: Session, warehouse_id: UUID | None = None) -> list[dict]:
        query = (
            select(
                Warehouse.id,
                Warehouse.name,
                func.count(func.distinct(Location.id)),
                func.count(func.distinct(Product.id)),
                func.coalesce(func.sum(Inventory.on_hand), 0),
                func.coalesce(func.sum(Inventory.reserved), 0),
                func.coalesce(func.sum(Inventory.on_hand - Inventory.reserved), 0),
                func.coalesce(func.sum(Inventory.on_hand * Product.unit_cost), 0),
            )
            .select_from(Warehouse)
            .outerjoin(Location, Location.warehouse_id == Warehouse.id)
            .outerjoin(Inventory, Inventory.location_id == Location.id)
            .outerjoin(Product, Product.id == Inventory.product_id)
            .group_by(Warehouse.id, Warehouse.name)
            .order_by(Warehouse.name)
        )
        if warehouse_id is not None:
            query = query.where(Warehouse.id == warehouse_id)
        return [
            {
                "warehouse_id": row[0],
                "warehouse_name": row[1],
                "location_count": row[2],
                "product_count": row[3],
                "on_hand": row[4],
                "reserved": row[5],
                "free_to_use": row[6],
                "stock_value": row[7],
            }
            for row in db.execute(query).all()
        ]

    def location_totals(self, db: Session, warehouse_id: UUID | None = None) -> list[dict]:
        query = (
            select(
                Location.id,
                Location.name,
                Location.code,
                Warehouse.id,
                Warehouse.name,
                func.count(func.distinct(Product.id)),
                func.coalesce(func.sum(Inventory.on_hand), 0),
                func.coalesce(func.sum(Inventory.reserved), 0),
                func.coalesce(func.sum(Inventory.on_hand - Inventory.reserved), 0),
                func.coalesce(func.sum(Inventory.on_hand * Product.unit_cost), 0),
            )
            .select_from(Location)
            .join(Warehouse, Warehouse.id == Location.warehouse_id)
            .outerjoin(Inventory, Inventory.location_id == Location.id)
            .outerjoin(Product, Product.id == Inventory.product_id)
            .group_by(Location.id, Location.name, Location.code, Warehouse.id, Warehouse.name)
            .order_by(Warehouse.name, Location.code)
        )
        if warehouse_id is not None:
            query = query.where(Location.warehouse_id == warehouse_id)
        return [
            {
                "location_id": row[0],
                "location_name": row[1],
                "location_code": row[2],
                "warehouse_id": row[3],
                "warehouse_name": row[4],
                "product_count": row[5],
                "on_hand": row[6],
                "reserved": row[7],
                "free_to_use": row[8],
                "stock_value": row[9],
            }
            for row in db.execute(query).all()
        ]

    @staticmethod
    def _operation_counts(db: Session, model, now: datetime, warehouse_id: UUID | None, location_id_column) -> dict[str, int]:
        query = select(
            func.count().filter(model.status.in_((OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY))),
            func.count().filter(model.status.in_((OperationStatus.DRAFT, OperationStatus.READY))),
            func.count().filter(model.status.in_((OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY)), model.scheduled_date < now),
            func.count().filter(model.status == OperationStatus.WAITING),
        ).select_from(model)
        if warehouse_id is not None:
            query = query.join(Location, Location.id == location_id_column).where(Location.warehouse_id == warehouse_id)
        pending, active, late, waiting = db.execute(query).one()
        return {"pending": int(pending or 0), "active": int(active or 0), "late": int(late or 0), "waiting": int(waiting or 0)}

    def operation_counts(self, db: Session, now: datetime, warehouse_id: UUID | None = None) -> dict[str, dict[str, int]]:
        counts = {
            "receipts": self._operation_counts(db, Receipt, now, warehouse_id, Receipt.destination_location_id),
            "deliveries": self._operation_counts(db, Delivery, now, warehouse_id, Delivery.source_location_id),
        }
        source = aliased(Location)
        destination = aliased(Location)
        transfer_query = (
            select(
                func.count().filter(Transfer.status.in_((OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY))),
                func.count().filter(Transfer.status.in_((OperationStatus.DRAFT, OperationStatus.READY))),
                func.count().filter(Transfer.status.in_((OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY)), Transfer.scheduled_date < now),
                func.count().filter(Transfer.status == OperationStatus.WAITING),
            )
            .select_from(Transfer)
        )
        if warehouse_id is not None:
            transfer_query = (
                transfer_query.join(source, source.id == Transfer.source_location_id)
                .join(destination, destination.id == Transfer.destination_location_id)
                .where(or_(source.warehouse_id == warehouse_id, destination.warehouse_id == warehouse_id))
            )
        pending, ready, late, waiting = db.execute(transfer_query).one()
        counts["transfers"] = {"pending": int(pending or 0), "active": int(ready or 0), "late": int(late or 0), "waiting": int(waiting or 0)}
        return counts

    def scheduled_transfer_count(self, db: Session, warehouse_id: UUID | None = None) -> int:
        query = select(func.count()).select_from(Transfer).where(
            Transfer.status.in_((OperationStatus.DRAFT, OperationStatus.READY, OperationStatus.WAITING)),
            Transfer.scheduled_date.is_not(None),
        )
        if warehouse_id is not None:
            source = aliased(Location)
            destination = aliased(Location)
            query = (
                query.join(source, source.id == Transfer.source_location_id)
                .join(destination, destination.id == Transfer.destination_location_id)
                .where(or_(source.warehouse_id == warehouse_id, destination.warehouse_id == warehouse_id))
            )
        return int(db.scalar(query) or 0)

    def recent_movements(self, db: Session, warehouse_id: UUID | None = None, limit: int = 10) -> list[StockLedger]:
        query = select(StockLedger).order_by(StockLedger.created_at.desc(), StockLedger.id.desc())
        if warehouse_id is not None:
            source = aliased(Location)
            destination = aliased(Location)
            query = (
                query.outerjoin(source, source.id == StockLedger.source_location_id)
                .outerjoin(destination, destination.id == StockLedger.destination_location_id)
                .where(or_(source.warehouse_id == warehouse_id, destination.warehouse_id == warehouse_id))
            )
        return list(db.scalars(query.limit(limit)))