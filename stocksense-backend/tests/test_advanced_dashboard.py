"""Advanced dashboard API integration tests."""

from decimal import Decimal

WAREHOUSE_ID = "20000000-0000-0000-0000-000000000001"


def test_dashboard_extended_summary(auth_context):
    client = auth_context["client"]
    headers = auth_context["headers"]

    res = client.get("/api/v1/dashboard", headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()

    # Original fields verified
    assert data["total_products_in_stock"] > 0
    assert "pending_receipts" in data
    assert "pending_deliveries" in data

    # Extended Phase 3 fields verified
    assert Decimal(str(data["total_stock_value"])) > Decimal("0")
    assert data["total_warehouses"] >= 1
    assert data["total_locations"] >= 1


def test_dashboard_filtered_by_warehouse(auth_context):
    client = auth_context["client"]
    headers = auth_context["headers"]

    res = client.get(f"/api/v1/dashboard?warehouse_id={WAREHOUSE_ID}", headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["total_products_in_stock"] > 0
    assert Decimal(str(data["total_stock_value"])) > Decimal("0")


def test_advanced_dashboard_metrics(auth_context):
    client = auth_context["client"]
    headers = auth_context["headers"]

    res = client.get("/api/v1/dashboard/advanced", headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()

    assert "summary" in data
    assert "warehouses_breakdown" in data
    assert len(data["warehouses_breakdown"]) >= 1
    first_wh = data["warehouses_breakdown"][0]
    assert "warehouse_id" in first_wh
    assert "warehouse_name" in first_wh
    assert "stock_value" in first_wh
    assert data["healthy_stock_count"] >= 0
    assert data["recent_activity_count"] >= 0


def test_advanced_dashboard_requires_authentication(client):
    assert client.get("/api/v1/dashboard/advanced").status_code == 401
