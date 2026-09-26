from sqlalchemy import select
from app.models import Category, Inventory, Location, Product, Warehouse


class InventoryRepository:
    def rows(self, db, **f):
        q = (
            select(Inventory, Product, Category, Location, Warehouse)
            .select_from(Inventory)
            .join(Product, Inventory.product_id == Product.id)
            .join(Category, Product.category_id == Category.id)
            .join(Location, Inventory.location_id == Location.id)
            .join(Warehouse, Location.warehouse_id == Warehouse.id)
        )
        for key, col in [
            ("product_id", Product.id),
            ("warehouse_id", Warehouse.id),
            ("location_id", Location.id),
            ("category_id", Category.id),
        ]:
            if f.get(key):
                q = q.where(col == f[key])

        if f.get("category"):
            q = q.where(Category.name.ilike(f"%{f['category']}%"))
        if f.get("warehouse"):
            w_search = f"%{f['warehouse']}%"
            q = q.where((Warehouse.name.ilike(w_search)) | (Warehouse.code.ilike(w_search)))

        min_val = f.get("min_stock_value") if f.get("min_stock_value") is not None else f.get("min_value")
        if min_val is not None:
            q = q.where((Inventory.on_hand * Product.unit_cost) >= min_val)

        max_val = f.get("max_stock_value") if f.get("max_stock_value") is not None else f.get("max_value")
        if max_val is not None:
            q = q.where((Inventory.on_hand * Product.unit_cost) <= max_val)

        if f.get("low_stock"):
            q = q.where(Inventory.on_hand > 0, Inventory.on_hand <= Product.reorder_level)
        if f.get("out_of_stock"):
            q = q.where(Inventory.on_hand == 0)
        if f.get("search"):
            term = f"%{f['search']}%"
            q = q.where((Product.name.ilike(term)) | (Product.sku.ilike(term)))

        return list(db.execute(q.order_by(Product.sku, Location.code)).all())
