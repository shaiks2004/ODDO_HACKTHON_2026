import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import func, select, text
from app.core.database import SessionLocal
from app.models import Category, Inventory, Location, Product, StockLedger, Warehouse
from app.services.inventory_service import InventoryService
from app.services.alert_service import AlertService
from app.services.dashboard_service import DashboardService
from app.services.report_service import ReportService

def verify_all():
    db = SessionLocal()
    try:
        print("=" * 60)
        print("STOCKSENSE TEST DATA VALIDATION SUITE")
        print("=" * 60)

        # 1. Total test products
        test_prod_count = db.query(Product).filter(Product.sku.like("TEST-%")).count()
        print(f"1. Test Products Count (sku LIKE 'TEST-%'): {test_prod_count} (Expected: 100)")
        assert test_prod_count == 100, f"Expected 100 test products, got {test_prod_count}"

        total_prod_count = db.query(Product).count()
        print(f"   Total Products Count (including demo): {total_prod_count}")

        # 2. Category Distribution for Test Products
        print("\n2. Category Distribution for Test Products:")
        cat_dist = (
            db.query(Category.name, func.count(Product.id))
            .join(Product, Product.category_id == Category.id)
            .filter(Product.sku.like("TEST-%"))
            .group_by(Category.name)
            .order_by(Category.name)
            .all()
        )
        for cat_name, count in cat_dist:
            print(f"   - {cat_name}: {count} products (Expected: 20)")
            assert count == 20, f"Expected 20 products for {cat_name}, got {count}"

        # 3. Inventory Records for Test Products
        test_inv_count = (
            db.query(Inventory)
            .join(Product, Inventory.product_id == Product.id)
            .filter(Product.sku.like("TEST-%"))
            .count()
        )
        print(f"\n3. Test Inventory Records: {test_inv_count} (Expected: 100)")
        assert test_inv_count == 100, f"Expected 100 inventory records, got {test_inv_count}"

        # 4. Warehouse Distribution for Test Products
        print("\n4. Warehouse Distribution for Test Products:")
        wh_dist = (
            db.query(Warehouse.name, Warehouse.code, func.count(Inventory.id))
            .join(Location, Location.warehouse_id == Warehouse.id)
            .join(Inventory, Inventory.location_id == Location.id)
            .join(Product, Inventory.product_id == Product.id)
            .filter(Product.sku.like("TEST-%"))
            .group_by(Warehouse.name, Warehouse.code)
            .order_by(Warehouse.code)
            .all()
        )
        for wh_name, wh_code, count in wh_dist:
            print(f"   - {wh_name} ({wh_code}): {count} inventory rows")

        # 5. Stock Health Analysis for Test Products
        healthy = (
            db.query(Inventory)
            .join(Product, Inventory.product_id == Product.id)
            .filter(Product.sku.like("TEST-%"), Inventory.on_hand > Product.reorder_level, Inventory.reserved == 0)
            .count()
        )
        low_stock = (
            db.query(Inventory)
            .join(Product, Inventory.product_id == Product.id)
            .filter(Product.sku.like("TEST-%"), Inventory.on_hand > 0, Inventory.on_hand <= Product.reorder_level)
            .count()
        )
        out_of_stock = (
            db.query(Inventory)
            .join(Product, Inventory.product_id == Product.id)
            .filter(Product.sku.like("TEST-%"), Inventory.on_hand == 0)
            .count()
        )
        reserved_stock = (
            db.query(Inventory)
            .join(Product, Inventory.product_id == Product.id)
            .filter(Product.sku.like("TEST-%"), Inventory.reserved > 0)
            .count()
        )

        print("\n5. Stock Status Breakdown for Test Products:")
        print(f"   - Healthy Stock (on_hand > reorder_level, reserved=0): {healthy} (Expected: 60)")
        print(f"   - Low Stock (0 < on_hand <= reorder_level): {low_stock} (Expected: 20)")
        print(f"   - Out of Stock (on_hand = 0): {out_of_stock} (Expected: 10)")
        print(f"   - Reserved Stock (reserved > 0): {reserved_stock} (Expected: 10)")

        assert healthy == 60, f"Expected 60 healthy, got {healthy}"
        assert low_stock == 20, f"Expected 20 low stock, got {low_stock}"
        assert out_of_stock == 10, f"Expected 10 out of stock, got {out_of_stock}"
        assert reserved_stock == 10, f"Expected 10 reserved, got {reserved_stock}"

        # 6. Integrity Constraints Verification
        print("\n6. Database Integrity Checks:")
        # Check negative on_hand
        neg_on_hand = db.query(Inventory).filter(Inventory.on_hand < 0).count()
        print(f"   - Negative on_hand rows: {neg_on_hand} (Expected: 0)")
        assert neg_on_hand == 0, "Found negative on_hand"

        # Check reserved > on_hand
        invalid_reserved = db.query(Inventory).filter(Inventory.reserved > Inventory.on_hand).count()
        print(f"   - Rows where reserved > on_hand: {invalid_reserved} (Expected: 0)")
        assert invalid_reserved == 0, "Found reserved > on_hand"

        # Check duplicate SKUs
        dup_skus = db.query(Product.sku).group_by(Product.sku).having(func.count(Product.id) > 1).all()
        print(f"   - Duplicate SKUs: {len(dup_skus)} (Expected: 0)")
        assert len(dup_skus) == 0, "Found duplicate SKUs"

        # Check duplicate Barcodes
        dup_barcodes = db.query(Product.barcode).filter(Product.barcode.isnot(None)).group_by(Product.barcode).having(func.count(Product.id) > 1).all()
        print(f"   - Duplicate Barcodes: {len(dup_barcodes)} (Expected: 0)")
        assert len(dup_barcodes) == 0, "Found duplicate Barcodes"

        # 7. Services & Reports verification
        print("\n7. Backend Services & Reports Verification:")
        inv_service = InventoryService()
        alert_srv = AlertService()
        dash_service = DashboardService()
        rep_service = ReportService()

        # Inventory pagination
        rows, total = inv_service.page(db, page=1, page_size=20)
        print(f"   - Inventory Paged (Page 1, size 20): returned {len(rows)} rows, total {total} items")

        # Low stock alerts query
        alerts = alert_srv.low_stock(db)
        print(f"   - Low Stock / Out of Stock alerts detected: {len(alerts)} alerts")

        # Advanced Dashboard summary
        summary = dash_service.advanced_summary(db)
        print(f"   - Dashboard Total Products: {summary.total_products}")
        print(f"   - Dashboard Total Stock Value: INR {summary.total_stock_value:,.2f}")
        print(f"   - Dashboard Total On Hand: {summary.total_on_hand:,.2f}")
        print(f"   - Dashboard Total Reserved: {summary.total_reserved:,.2f}")
        print(f"   - Dashboard Total Free-To-Use: {summary.total_free_to_use:,.2f}")
        print(f"   - Dashboard Warehouse Breakdowns: {len(summary.warehouses)} warehouses")

        # Stock Valuation Report
        stock_val, total_val = rep_service.stock_valuation(db, page=1, page_size=50)
        print(f"   - Stock Valuation Report returned {len(stock_val)} rows (total: {total_val})")

        print("\n" + "=" * 60)
        print("ALL 100 TEST DATA VERIFICATION CHECKS PASSED SUCCESSFULLY!")
        print("=" * 60)
    finally:
        db.close()

if __name__ == "__main__":
    verify_all()
