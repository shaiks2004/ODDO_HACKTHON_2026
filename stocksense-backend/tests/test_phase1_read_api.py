"""Safe, read-only Phase 1 coverage against the seeded demo database."""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
STEEL = "40000000-0000-0000-0000-000000000001"

def test_master_data_lists_and_filters() -> None:
    assert client.get('/api/v1/categories?search=Raw').json()['total'] == 1
    assert client.get('/api/v1/products?search=steel').json()['items'][0]['sku'] == 'SS-STEEL-001'
    assert client.get('/api/v1/products?is_active=true').status_code == 200
    assert client.get('/api/v1/warehouses?is_active=true').json()['total'] == 2
    warehouse_id = client.get('/api/v1/warehouses').json()['items'][0]['id']
    assert client.get(f'/api/v1/locations?warehouse_id={warehouse_id}').status_code == 200

def test_inventory_filters_and_product_summary() -> None:
    assert client.get(f'/api/v1/inventory?product_id={STEEL}').json()['total'] == 3
    assert client.get('/api/v1/inventory?low_stock=true').json()['total'] > 0
    summary = client.get(f'/api/v1/inventory/{STEEL}')
    assert summary.status_code == 200
    assert summary.json()['total_free_to_use'] == '1825.000'

def test_not_found_resources() -> None:
    missing = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
    assert client.get(f'/api/v1/products/{missing}').status_code == 404
    assert client.get(f'/api/v1/locations/{missing}').status_code == 404
