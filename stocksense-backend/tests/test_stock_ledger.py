"""Read-only stock ledger integration tests."""


def test_stock_ledger_filters_and_page_contract(auth_context):
	client = auth_context["client"]
	headers = auth_context["headers"]
	response = client.get(
		"/api/v1/stock-ledger?product_id=40000000-0000-0000-0000-000000000001&page=1&page_size=5",
		headers=headers,
	)
	assert response.status_code == 200, response.text
	body = response.json()
	assert body["total"] > 0
	assert body["page"] == 1
	assert body["page_size"] == 5
	assert len(body["items"]) <= 5
	assert all(item["product_id"] == "40000000-0000-0000-0000-000000000001" for item in body["items"])


def test_stock_ledger_requires_authentication(client):
	assert client.get("/api/v1/stock-ledger").status_code == 401