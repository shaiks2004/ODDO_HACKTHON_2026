"""Dashboard summary integration tests."""


def test_dashboard_summary_contains_seeded_counts(auth_context):
	client = auth_context["client"]
	response = client.get("/api/v1/dashboard", headers=auth_context["headers"])
	assert response.status_code == 200, response.text
	body = response.json()
	assert body["total_products_in_stock"] > 0
	assert body["low_stock_count"] >= 0
	assert body["out_of_stock_count"] >= 0
	assert body["pending_receipts"]["pending"] >= body["pending_receipts"]["waiting"]
	assert body["pending_deliveries"]["pending"] >= body["pending_deliveries"]["waiting"]
	assert body["scheduled_transfers"] >= 0


def test_dashboard_requires_authentication(client):
	assert client.get("/api/v1/dashboard").status_code == 401