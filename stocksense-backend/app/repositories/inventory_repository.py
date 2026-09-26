from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import Category, Inventory, Location, Product, Warehouse


class InventoryRepository:
    @staticmethod
    def _query(**filters):
        query = (
            select(Inventory, Product, Category, Location, Warehouse)
            .select_from(Inventory)
            .join(Product, Inventory.product_id == Product.id)
            .join(Category, Product.category_id == Category.id)
            .join(Location, Inventory.location_id == Location.id)
            .join(Warehouse, Location.warehouse_id == Warehouse.id)
        )
        for key, column in (
            ("product_id", Product.id),
            ("warehouse_id", Warehouse.id),
            ("location_id", Location.id),
            ("category_id", Category.id),
        ):
            if filters.get(key) is not None:
                query = query.where(column == filters[key])
        if filters.get("category_name"):
            query = query.where(Category.name.ilike(f"%{filters['category_name']}%"))
        if filters.get("warehouse_name"):
            query = query.where(Warehouse.name.ilike(f"%{filters['warehouse_name']}%"))
        if filters.get("warehouse_code"):
            query = query.where(Warehouse.code.ilike(f"%{filters['warehouse_code']}%"))
        if filters.get("active") is not None:
            query = query.where(Product.is_active == filters["active"])
        if filters.get("low_stock"):
            query = query.where(Inventory.on_hand > 0, Inventory.on_hand <= Product.reorder_level)
        if filters.get("out_of_stock"):
            query = query.where(Inventory.on_hand == 0)
        if filters.get("in_stock"):
            query = query.where(Inventory.on_hand > 0)
        stock_value = Inventory.on_hand * Product.unit_cost
        if filters.get("min_stock_value") is not None:
            query = query.where(stock_value >= filters["min_stock_value"])
        if filters.get("max_stock_value") is not None:
            query = query.where(stock_value <= filters["max_stock_value"])
        if filters.get("search"):
            term = f"%{filters['search']}%"
            query = query.where(
                or_(
                    Product.name.ilike(term),
                    Product.sku.ilike(term),
                    Product.barcode.ilike(term),
                    Category.name.ilike(term),
                    Warehouse.name.ilike(term),
                    Warehouse.code.ilike(term),
                    Location.name.ilike(term),
                    Location.code.ilike(term),
                )
            )
        return query

    def rows(self, db: Session, **filters):
        query = self._query(**filters)
        return list(db.execute(query.order_by(Product.sku, Location.code)).all())

    def page_rows(self, db: Session, page: int, page_size: int, **filters):
        query = self._query(**filters)
        total = db.scalar(select(func.count()).select_from(query.order_by(None).subquery())) or 0
        rows = db.execute(
            query.order_by(Product.sku, Location.code)
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return list(rows), total

    def count_distinct_products(self, db: Session, *, stock_status: str, warehouse_id=None) -> int:
        filters = {"warehouse_id": warehouse_id}
        if stock_status == "low_stock":
            filters["low_stock"] = True
        elif stock_status == "out_of_stock":
            filters["out_of_stock"] = True
        elif stock_status == "in_stock":
            filters["in_stock"] = True
        else:
            filters["active"] = True
        query = self._query(**filters).with_only_columns(func.count(func.distinct(Product.id)))
        return int(db.scalar(query) or 0)
