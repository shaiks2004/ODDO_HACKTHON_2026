"""Advanced inventory query integration tests with rich category, warehouse, and value range filters."""

from decimal import Decimal

CATEGORY_ID = "10000000-0000-0000-0000-000000000001"
WAREHOUSE_ID = "20000000-0000-0000-0000-000000000001"


def test_inventory_filter_by_category_id_and_name(client):
    # Filter by category_id
    res_id = client.get(f"/api/v1/inventory?category_id={CATEGORY_ID}")
    assert res_id.status_code == 200, res_id.text
    data_id = res_id.json()
    assert data_id["total"] > 0
    for item in data_id["items"]:
        assert item["category_id"] == CATEGORY_ID

    # Filter by category name string
    res_name = client.get("/api/v1/inventory?category=Raw")
    assert res_name.status_code == 200, res_name.text
    data_name = res_name.json()
    assert data_name["total"] > 0
    for item in data_name["items"]:
        assert "Raw" in item["category_name"]


def test_inventory_filter_by_warehouse_id_and_name(client):
    # Filter by warehouse_id
    res_id = client.get(f"/api/v1/inventory?warehouse_id={WAREHOUSE_ID}")
    assert res_id.status_code == 200, res_id.text
    data_id = res_id.json()
    assert data_id["total"] > 0
    for item in data_id["items"]:
        assert item["warehouse_id"] == WAREHOUSE_ID

    # Filter by warehouse name/code
    res_name = client.get("/api/v1/inventory?warehouse=Main")
    assert res_name.status_code == 200, res_name.text
    data_name = res_name.json()
    assert data_name["total"] > 0
    for item in data_name["items"]:
        assert "Main" in item["warehouse_name"] or "MAIN" in item["location_code"]


def test_inventory_filter_by_stock_value_range(client):
    # Minimum stock value filter
    res_min = client.get("/api/v1/inventory?min_stock_value=1000.00")
    assert res_min.status_code == 200, res_min.text
    data_min = res_min.json()
    assert data_min["total"] > 0
    for item in data_min["items"]:
        assert Decimal(str(item["stock_value"])) >= Decimal("1000.00")

    # Value range: min_value and max_value
    res_range = client.get("/api/v1/inventory?min_value=50.00&max_value=5000.00")
    assert res_range.status_code == 200, res_range.text
    data_range = res_range.json()
    for item in data_range["items"]:
        val = Decimal(str(item["stock_value"]))
        assert Decimal("50.00") <= val <= Decimal("5000.00")


def test_inventory_page_contract_preserved(client):
    res = client.get("/api/v1/inventory?page=1&page_size=2")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "page" in data
    assert "page_size" in data
    assert "total" in data
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert len(data["items"]) <= 2
    assert "stock_value" in data["items"][0]
