"""Repository queries for StockSense Phase 3 reporting analytics."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select, cast, Date
from sqlalchemy.orm import Session

from app.models import Category, Inventory, Location, Product, StockLedger, Warehouse
from app.utils.enums import MovementType


class ReportingRepository:
    def stock_valuation_by_warehouse(
        self, db: Session, warehouse_id: UUID | None = None
    ) -> list[dict]:
        q = (
            select(
                Warehouse.id.label("warehouse_id"),
                Warehouse.name.label("warehouse_name"),
                Warehouse.code.label("warehouse_code"),
                func.count(func.distinct(Inventory.product_id)).filter(Inventory.on_hand > 0).label("total_products"),
                func.coalesce(func.sum(Inventory.on_hand), 0).label("total_quantity_on_hand"),
                func.coalesce(func.sum(Inventory.reserved), 0).label("total_quantity_reserved"),
                func.coalesce(func.sum(Inventory.on_hand - Inventory.reserved), 0).label("total_quantity_free"),
                func.coalesce(func.sum(Inventory.on_hand * Product.unit_cost), 0).label("total_stock_value"),
            )
            .select_from(Warehouse)
            .outerjoin(Location, Location.warehouse_id == Warehouse.id)
            .outerjoin(Inventory, Inventory.location_id == Location.id)
            .outerjoin(Product, Inventory.product_id == Product.id)
        )
        if warehouse_id:
            q = q.where(Warehouse.id == warehouse_id)

        q = q.group_by(Warehouse.id, Warehouse.name, Warehouse.code).order_by(
            func.coalesce(func.sum(Inventory.on_hand * Product.unit_cost), 0).desc(),
            Warehouse.name.asc(),
        )

        rows = db.execute(q).all()
        return [
            {
                "warehouse_id": row.warehouse_id,
                "warehouse_name": row.warehouse_name,
                "warehouse_code": row.warehouse_code,
                "total_products": row.total_products,
                "total_quantity_on_hand": Decimal(str(row.total_quantity_on_hand)),
                "total_quantity_reserved": Decimal(str(row.total_quantity_reserved)),
                "total_quantity_free": Decimal(str(row.total_quantity_free)),
                "total_stock_value": Decimal(str(row.total_stock_value)),
            }
            for row in rows
        ]

    def movement_volume_by_date_range(
        self,
        db: Session,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        movement_type: MovementType | None = None,
        product_id: UUID | None = None,
    ) -> list[dict]:
        movement_date_col = cast(StockLedger.created_at, Date)
        q = (
            select(
                movement_date_col.label("movement_date"),
                StockLedger.movement_type.label("movement_type"),
                func.count().label("total_movements"),
                func.coalesce(func.sum(func.abs(StockLedger.quantity)), 0).label("total_quantity"),
            )
            .select_from(StockLedger)
        )
        if start_date:
            q = q.where(StockLedger.created_at >= start_date)
        if end_date:
            q = q.where(StockLedger.created_at <= end_date)
        if movement_type:
            q = q.where(StockLedger.movement_type == movement_type)
        if product_id:
            q = q.where(StockLedger.product_id == product_id)

        q = q.group_by(movement_date_col, StockLedger.movement_type).order_by(
            movement_date_col.desc(),
            StockLedger.movement_type.asc(),
        )

        rows = db.execute(q).all()
        return [
            {
                "movement_date": str(row.movement_date),
                "movement_type": row.movement_type,
                "total_movements": row.total_movements,
                "total_quantity": Decimal(str(row.total_quantity)),
            }
            for row in rows
        ]

    def top_slow_moving_products(
        self,
        db: Session,
        ranking: str = "top",
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        category_id: UUID | None = None,
    ) -> list[dict]:
        # Subquery for stock movements in date range
        ledger_sub_q = select(
            StockLedger.product_id,
            func.count().label("movement_count"),
            func.coalesce(func.sum(func.abs(StockLedger.quantity)), 0).label("total_moved"),
        )
        if start_date:
            ledger_sub_q = ledger_sub_q.where(StockLedger.created_at >= start_date)
        if end_date:
            ledger_sub_q = ledger_sub_q.where(StockLedger.created_at <= end_date)
        ledger_sub = ledger_sub_q.group_by(StockLedger.product_id).subquery()

        # Subquery for on-hand stock per product
        inv_sub = (
            select(
                Inventory.product_id,
                func.coalesce(func.sum(Inventory.on_hand), 0).label("on_hand_total"),
            )
            .group_by(Inventory.product_id)
            .subquery()
        )

        q = (
            select(
                Product.id.label("product_id"),
                Product.name.label("product_name"),
                Product.sku.label("sku"),
                Category.name.label("category_name"),
                func.coalesce(ledger_sub.c.movement_count, 0).label("movement_count"),
                func.coalesce(ledger_sub.c.total_moved, 0).label("total_quantity_moved"),
                func.coalesce(inv_sub.c.on_hand_total, 0).label("current_on_hand"),
            )
            .select_from(Product)
            .join(Category, Product.category_id == Category.id)
            .outerjoin(ledger_sub, ledger_sub.c.product_id == Product.id)
            .outerjoin(inv_sub, inv_sub.c.product_id == Product.id)
        )

        if category_id:
            q = q.where(Product.category_id == category_id)

        is_slow = ranking.lower().strip() == "slow"
        if is_slow:
            q = q.order_by(
                func.coalesce(ledger_sub.c.total_moved, 0).asc(),
                func.coalesce(ledger_sub.c.movement_count, 0).asc(),
                Product.name.asc(),
            )
        else:
            q = q.order_by(
                func.coalesce(ledger_sub.c.total_moved, 0).desc(),
                func.coalesce(ledger_sub.c.movement_count, 0).desc(),
                Product.name.asc(),
            )

        rows = db.execute(q).all()
        classification = "SLOW_MOVING" if is_slow else "TOP_MOVING"

        return [
            {
                "product_id": row.product_id,
                "product_name": row.product_name,
                "sku": row.sku,
                "category_name": row.category_name,
                "movement_count": row.movement_count,
                "total_quantity_moved": Decimal(str(row.total_quantity_moved)),
                "current_on_hand": Decimal(str(row.current_on_hand)),
                "classification": classification,
            }
            for row in rows
        ]


reporting_repository = ReportingRepository()
