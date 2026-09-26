"""Integration tests for Phase 3 reporting analytics APIs."""

from decimal import Decimal

WAREHOUSE_ID = "20000000-0000-0000-0000-000000000001"
CATEGORY_ID = "10000000-0000-0000-0000-000000000001"
PRODUCT_ID = "40000000-0000-0000-0000-000000000001"


def test_stock_valuation_by_warehouse_report(auth_context):
    client = auth_context["client"]
    headers = auth_context["headers"]

    res = client.get("/api/v1/reports/stock-valuation", headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()

    # Shared Page[T] contract check
    assert "items" in data
    assert "page" in data
    assert "page_size" in data
    assert "total" in data
    assert data["total"] >= 1
    assert len(data["items"]) >= 1

    item = data["items"][0]
    assert "warehouse_id" in item
    assert "warehouse_name" in item
    assert "warehouse_code" in item
    assert "total_products" in item
    assert "total_quantity_on_hand" in item
    assert "total_quantity_reserved" in item
    assert "total_quantity_free" in item
    assert "total_stock_value" in item
    assert Decimal(str(item["total_stock_value"])) >= Decimal("0")

    # Filtered by warehouse
    res_wh = client.get(f"/api/v1/reports/stock-valuation?warehouse_id={WAREHOUSE_ID}", headers=headers)
    assert res_wh.status_code == 200
    assert res_wh.json()["total"] == 1
    assert res_wh.json()["items"][0]["warehouse_id"] == WAREHOUSE_ID


def test_movement_volume_by_date_range_report(auth_context):
    client = auth_context["client"]
    headers = auth_context["headers"]

    res = client.get("/api/v1/reports/movement-volume", headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()

    # Shared Page[T] contract check
    assert "items" in data
    assert "page" in data
    assert "page_size" in data
    assert "total" in data
    assert data["total"] >= 1

    item = data["items"][0]
    assert "movement_date" in item
    assert "movement_type" in item
    assert "total_movements" in item
    assert "total_quantity" in item
    assert item["total_movements"] >= 1

    # Filtered by product_id
    res_prod = client.get(f"/api/v1/reports/movement-volume?product_id={PRODUCT_ID}", headers=headers)
    assert res_prod.status_code == 200
    assert res_prod.json()["total"] >= 1


def test_top_slow_moving_products_report(auth_context):
    client = auth_context["client"]
    headers = auth_context["headers"]

    # Top moving products
    res_top = client.get("/api/v1/reports/top-slow-moving?ranking=top", headers=headers)
    assert res_top.status_code == 200, res_top.text
    data_top = res_top.json()

    assert "items" in data_top
    assert "total" in data_top
    assert data_top["total"] >= 1
    item_top = data_top["items"][0]
    assert "product_id" in item_top
    assert "product_name" in item_top
    assert "sku" in item_top
    assert "category_name" in item_top
    assert "movement_count" in item_top
    assert "total_quantity_moved" in item_top
    assert "current_on_hand" in item_top
    assert item_top["classification"] == "TOP_MOVING"

    # Slow moving products
    res_slow = client.get("/api/v1/reports/top-slow-moving?ranking=slow", headers=headers)
    assert res_slow.status_code == 200, res_slow.text
    data_slow = res_slow.json()
    assert data_slow["total"] >= 1
    item_slow = data_slow["items"][0]
    assert item_slow["classification"] == "SLOW_MOVING"

    # Filtered by category_id
    res_cat = client.get(f"/api/v1/reports/top-slow-moving?category_id={CATEGORY_ID}", headers=headers)
    assert res_cat.status_code == 200
    for itm in res_cat.json()["items"]:
        assert itm["category_name"] == "Raw Materials"


def test_reporting_requires_authentication(client):
    assert client.get("/api/v1/reports/stock-valuation").status_code == 401
    assert client.get("/api/v1/reports/movement-volume").status_code == 401
    assert client.get("/api/v1/reports/top-slow-moving").status_code == 401
