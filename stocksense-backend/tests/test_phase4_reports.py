"""CSV report-provider integration seam tests."""


class SmallReportProvider:
    def __init__(self):
        self.filters = None

    def columns(self, report_name):
        assert report_name == "stock"
        return ["sku", "on_hand"]

    def iter_rows(self, db, report_name, filters):
        self.filters = dict(filters)
        yield {"sku": "TEST-SKU", "on_hand": "12.500"}


def test_csv_export_streams_provider_rows_and_preserves_filters(auth_context, monkeypatch):
    client = auth_context["client"]
    provider = SmallReportProvider()
    monkeypatch.setattr(client.app.state, "report_export_provider", provider, raising=False)
    response = client.get(
        "/api/v1/reports/stock/export?format=csv&warehouse_id=warehouse-1",
        headers=auth_context["headers"],
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment; filename=\"stocksense_stock_report.csv\"" in response.headers["content-disposition"]
    assert response.text.splitlines() == ["sku,on_hand", "TEST-SKU,12.500"]
    assert provider.filters == {"warehouse_id": "warehouse-1"}


def test_csv_export_works_with_phase_three_reporting_service(auth_context):
    response = auth_context["client"].get(
        "/api/v1/reports/stock/export?format=csv",
        headers=auth_context["headers"],
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    lines = response.text.splitlines()
    assert lines[0] == "warehouse_id,warehouse_name,total_on_hand,total_reserved,total_free_to_use,distinct_products,total_stock_value"


def test_invalid_report_name_is_rejected(auth_context):
    response = auth_context["client"].get(
        "/api/v1/reports/unknown/export?format=csv",
        headers=auth_context["headers"],
    )
    assert response.status_code == 422


def test_empty_report_still_streams_csv_header(auth_context, monkeypatch):
    class EmptyProvider(SmallReportProvider):
        def iter_rows(self, db, report_name, filters):
            yield from ()

    monkeypatch.setattr(auth_context["client"].app.state, "report_export_provider", EmptyProvider(), raising=False)
    response = auth_context["client"].get(
        "/api/v1/reports/stock/export?format=csv",
        headers=auth_context["headers"],
    )
    assert response.status_code == 200
    assert response.text.splitlines() == ["sku,on_hand"]