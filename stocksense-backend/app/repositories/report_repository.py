"""SQL aggregation and streaming queries shared by JSON and CSV reports."""

from collections.abc import Iterator, Mapping
from datetime import datetime
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, aliased

from app.models import (
    Adjustment,
    Delivery,
    DeliveryItem,
    Inventory,
    Location,
    Product,
    Receipt,
    ReceiptItem,
    StockLedger,
    Transfer,
    TransferItem,
    Warehouse,
)
from app.utils.enums import MovementType


class ReportRepository:
    @staticmethod
    def _ledger_source(filters: Mapping, *, include_initial_stock: bool = False):
        source = aliased(Location)
        destination = aliased(Location)
        query = (
            select(StockLedger)
            .select_from(StockLedger)
            .outerjoin(source, source.id == StockLedger.source_location_id)
            .outerjoin(destination, destination.id == StockLedger.destination_location_id)
        )
        if not include_initial_stock:
            query = query.where(StockLedger.movement_type != MovementType.INITIAL_STOCK)
        if filters.get("date_from"):
            query = query.where(StockLedger.created_at >= filters["date_from"])
        if filters.get("date_to"):
            query = query.where(StockLedger.created_at <= filters["date_to"])
        if filters.get("movement_type") is not None:
            query = query.where(StockLedger.movement_type == filters["movement_type"])
        if filters.get("product_id") is not None:
            query = query.where(StockLedger.product_id == filters["product_id"])
        if filters.get("location_id") is not None:
            query = query.where(
                or_(
                    StockLedger.source_location_id == filters["location_id"],
                    StockLedger.destination_location_id == filters["location_id"],
                )
            )
        if filters.get("warehouse_id") is not None:
            query = query.where(
                or_(
                    source.warehouse_id == filters["warehouse_id"],
                    destination.warehouse_id == filters["warehouse_id"],
                )
            )
        return query

    def stock_valuation_query(self, warehouse_id: UUID | None = None, category_id: UUID | None = None):
        query = (
            select(
                Warehouse.id.label("warehouse_id"),
                Warehouse.name.label("warehouse_name"),
                func.coalesce(func.sum(Inventory.on_hand), 0).label("total_on_hand"),
                func.coalesce(func.sum(Inventory.reserved), 0).label("total_reserved"),
                func.coalesce(func.sum(Inventory.on_hand - Inventory.reserved), 0).label("total_free_to_use"),
                func.count(func.distinct(Product.id)).label("distinct_products"),
                func.coalesce(func.sum(Inventory.on_hand * Product.unit_cost), 0).label("total_stock_value"),
            )
            .select_from(Warehouse)
            .outerjoin(Location, Location.warehouse_id == Warehouse.id)
            .outerjoin(Inventory, Inventory.location_id == Location.id)
            .outerjoin(Product, Product.id == Inventory.product_id)
        )
        if warehouse_id is not None:
            query = query.where(Warehouse.id == warehouse_id)
        if category_id is not None:
            query = query.where(Product.category_id == category_id)
        return query.group_by(Warehouse.id, Warehouse.name).order_by(Warehouse.name)

    def movement_volume_query(self, filters: Mapping):
        source = aliased(Location)
        destination = aliased(Location)
        query = (
            select(
                StockLedger.movement_type.label("movement_type"),
                func.count(StockLedger.id).label("movement_count"),
                func.coalesce(func.sum(func.abs(StockLedger.quantity)), 0).label("quantity_volume"),
            )
            .select_from(StockLedger)
            .outerjoin(source, source.id == StockLedger.source_location_id)
            .outerjoin(destination, destination.id == StockLedger.destination_location_id)
            .where(StockLedger.movement_type != MovementType.INITIAL_STOCK)
        )
        if filters.get("date_from"):
            query = query.where(StockLedger.created_at >= filters["date_from"])
        if filters.get("date_to"):
            query = query.where(StockLedger.created_at <= filters["date_to"])
        if filters.get("movement_type") is not None:
            query = query.where(StockLedger.movement_type == filters["movement_type"])
        if filters.get("product_id") is not None:
            query = query.where(StockLedger.product_id == filters["product_id"])
        if filters.get("location_id") is not None:
            query = query.where(or_(StockLedger.source_location_id == filters["location_id"], StockLedger.destination_location_id == filters["location_id"]))
        if filters.get("warehouse_id") is not None:
            query = query.where(or_(source.warehouse_id == filters["warehouse_id"], destination.warehouse_id == filters["warehouse_id"]))
        return query.group_by(StockLedger.movement_type).order_by(StockLedger.movement_type)

    def top_slow_query(self, filters: Mapping, ranking: str):
        ledger_query = self._ledger_source(filters, include_initial_stock=False).with_only_columns(
            StockLedger.product_id.label("product_id"),
            func.count(StockLedger.id).label("movement_count"),
            func.coalesce(func.sum(func.abs(StockLedger.quantity)), 0).label("movement_volume"),
        ).group_by(StockLedger.product_id)
        movement_totals = ledger_query.subquery()
        order = (
            (movement_totals.c.movement_volume.asc(), movement_totals.c.movement_count.asc())
            if ranking == "slow"
            else (movement_totals.c.movement_volume.desc(), movement_totals.c.movement_count.desc())
        )
        return (
            select(
                Product.id.label("product_id"),
                Product.name.label("product_name"),
                Product.sku.label("sku"),
                Product.unit_of_measure.label("unit_of_measure"),
                func.coalesce(movement_totals.c.movement_count, 0).label("movement_count"),
                func.coalesce(movement_totals.c.movement_volume, 0).label("movement_volume"),
            )
            .select_from(Product)
            .outerjoin(movement_totals, movement_totals.c.product_id == Product.id)
            .order_by(*order, Product.sku)
        )

    @staticmethod
    def page(db: Session, query, page: int, page_size: int):
        total = db.scalar(select(func.count()).select_from(query.order_by(None).subquery())) or 0
        rows = db.execute(query.offset((page - 1) * page_size).limit(page_size)).mappings().all()
        return [dict(row) for row in rows], int(total)

    @staticmethod
    def iter_mappings(db: Session, query, *, chunk_size: int = 500) -> Iterator[Mapping[str, object]]:
        result = db.execute(query.execution_options(stream_results=True)).mappings().yield_per(chunk_size)
        for row in result:
            yield row

    @staticmethod
    def operation_export_query(report_name: str, filters: Mapping):
        if report_name == "receipts":
            document, items, item_fk = Receipt, ReceiptItem, ReceiptItem.receipt_id
            dimensions = (Receipt.reference, Receipt.supplier_name, Receipt.destination_location_id, Receipt.scheduled_date, Receipt.status)
        elif report_name == "deliveries":
            document, items, item_fk = Delivery, DeliveryItem, DeliveryItem.delivery_id
            dimensions = (Delivery.reference, Delivery.customer_name, Delivery.source_location_id, Delivery.scheduled_date, Delivery.status)
        elif report_name == "transfers":
            document, items, item_fk = Transfer, TransferItem, TransferItem.transfer_id
            dimensions = (Transfer.reference, Transfer.source_location_id, Transfer.destination_location_id, Transfer.scheduled_date, Transfer.status)
        elif report_name == "adjustments":
            query = select(
                Adjustment.reference.label("reference"), Adjustment.product_id.label("product_id"),
                Adjustment.location_id.label("location_id"), Adjustment.system_quantity.label("system_quantity"),
                Adjustment.physical_quantity.label("physical_quantity"), Adjustment.difference.label("difference"),
                Adjustment.reason.label("reason"), Adjustment.status.label("status"),
                Adjustment.created_at.label("created_at"),
            ).select_from(Adjustment)
            if filters.get("product_id"):
                query = query.where(Adjustment.product_id == filters["product_id"])
            if filters.get("date_from"):
                query = query.where(Adjustment.created_at >= filters["date_from"])
            if filters.get("date_to"):
                query = query.where(Adjustment.created_at <= filters["date_to"])
            return query.order_by(Adjustment.created_at.desc())
        else:
            raise ValueError(f"Unsupported operation report: {report_name}")

        query = (
            select(
                dimensions[0].label("reference"),
                dimensions[1].label("party_or_source"),
                dimensions[2].label("location_or_destination"),
                dimensions[3].label("scheduled_date"),
                dimensions[4].label("status"),
                func.count(items.id).label("item_count"),
                func.coalesce(func.sum(items.quantity), 0).label("quantity_total"),
                document.created_at.label("created_at"),
            )
            .select_from(document)
            .outerjoin(items, item_fk == document.id)
        )
        if filters.get("status"):
            query = query.where(document.status == filters["status"])
        if filters.get("date_from"):
            query = query.where(document.created_at >= filters["date_from"])
        if filters.get("date_to"):
            query = query.where(document.created_at <= filters["date_to"])
        return query.group_by(document.id).order_by(document.created_at.desc())