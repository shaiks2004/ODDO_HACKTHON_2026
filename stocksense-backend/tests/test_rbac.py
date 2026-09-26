"""RBAC integration tests for role-guarded and open-read endpoints."""

from uuid import uuid4

LOCATION_ID = "30000000-0000-0000-0000-000000000001"
DEST_LOCATION_ID = "30000000-0000-0000-0000-000000000002"
PRODUCT_ID = "40000000-0000-0000-0000-000000000001"
CATEGORY_ID = "10000000-0000-0000-0000-000000000001"
WAREHOUSE_ID = "20000000-0000-0000-0000-000000000001"


def test_products_rbac_create_update(auth_context, staff_auth_context):
    client = auth_context["client"]
    sku = f"SKU-{uuid4().hex[:8].upper()}"

    # Staff cannot create products -> 403
    staff_create = client.post(
        "/api/v1/products",
        headers=staff_auth_context["headers"],
        json={
            "sku": sku,
            "name": "Staff Created Product",
            "category_id": CATEGORY_ID,
            "unit_of_measure": "UNIT",
            "unit_cost": "10.00",
        },
    )
    assert staff_create.status_code == 403, staff_create.text

    # Admin can create products -> 201
    admin_create = client.post(
        "/api/v1/products",
        headers=auth_context["headers"],
        json={
            "sku": sku,
            "name": "Admin Created Product",
            "category_id": CATEGORY_ID,
            "unit_of_measure": "UNIT",
            "unit_cost": "10.00",
        },
    )
    assert admin_create.status_code == 201
    created_id = admin_create.json()["id"]

    # Staff cannot update products -> 403
    staff_patch = client.patch(
        f"/api/v1/products/{created_id}",
        headers=staff_auth_context["headers"],
        json={"name": "Hacked Product Name"},
    )
    assert staff_patch.status_code == 403

    # Admin can update products -> 200
    admin_patch = client.patch(
        f"/api/v1/products/{created_id}",
        headers=auth_context["headers"],
        json={"name": "Updated Product Name"},
    )
    assert admin_patch.status_code == 200
    assert admin_patch.json()["name"] == "Updated Product Name"


def test_warehouses_and_locations_rbac(auth_context, staff_auth_context):
    client = auth_context["client"]
    wh_code = f"WH-{uuid4().hex[:6].upper()}"

    # Staff cannot create warehouse -> 403
    staff_wh = client.post(
        "/api/v1/warehouses",
        headers=staff_auth_context["headers"],
        json={"name": "Staff Warehouse", "code": wh_code},
    )
    assert staff_wh.status_code == 403

    # Admin can create warehouse -> 201
    admin_wh = client.post(
        "/api/v1/warehouses",
        headers=auth_context["headers"],
        json={"name": "Admin Warehouse", "code": wh_code},
    )
    assert admin_wh.status_code == 201
    wh_id = admin_wh.json()["id"]

    # Staff cannot update warehouse -> 403
    staff_wh_patch = client.patch(
        f"/api/v1/warehouses/{wh_id}",
        headers=staff_auth_context["headers"],
        json={"name": "Staff Modified Warehouse"},
    )
    assert staff_wh_patch.status_code == 403

    # Staff cannot create location -> 403
    loc_code = f"LOC-{uuid4().hex[:6].upper()}"
    staff_loc = client.post(
        "/api/v1/locations",
        headers=staff_auth_context["headers"],
        json={"warehouse_id": wh_id, "name": "Staff Location", "code": loc_code},
    )
    assert staff_loc.status_code == 403

    # Admin can create location -> 201
    admin_loc = client.post(
        "/api/v1/locations",
        headers=auth_context["headers"],
        json={"warehouse_id": wh_id, "name": "Admin Location", "code": loc_code},
    )
    assert admin_loc.status_code == 201
    loc_id = admin_loc.json()["id"]

    # Staff cannot update location -> 403
    staff_loc_patch = client.patch(
        f"/api/v1/locations/{loc_id}",
        headers=staff_auth_context["headers"],
        json={"name": "Staff Mod Location"},
    )
    assert staff_loc_patch.status_code == 403


def test_receipt_rbac_validate_and_cancel(auth_context, staff_auth_context, manager_auth_context):
    client = auth_context["client"]

    # Staff creates receipt -> 201
    created = client.post(
        "/api/v1/receipts",
        headers=staff_auth_context["headers"],
        json={
            "supplier_name": "Test Supplier",
            "destination_location_id": LOCATION_ID,
            "items": [{"product_id": PRODUCT_ID, "quantity": "1.000"}],
        },
    )
    assert created.status_code == 201
    receipt_id = created.json()["id"]

    # Staff can read receipt (reads stay open to any authenticated user) -> 200
    read_res = client.get(f"/api/v1/receipts/{receipt_id}", headers=staff_auth_context["headers"])
    assert read_res.status_code == 200

    # Staff cannot validate receipt -> 403
    staff_validate = client.post(f"/api/v1/receipts/{receipt_id}/validate", headers=staff_auth_context["headers"])
    assert staff_validate.status_code == 403

    # Staff cannot cancel receipt -> 403
    staff_cancel = client.post(f"/api/v1/receipts/{receipt_id}/cancel", headers=staff_auth_context["headers"])
    assert staff_cancel.status_code == 403

    # Inventory manager CAN validate -> 200
    mgr_validate = client.post(f"/api/v1/receipts/{receipt_id}/validate", headers=manager_auth_context["headers"])
    assert mgr_validate.status_code == 200
    assert mgr_validate.json()["status"] == "DONE"


def test_delivery_and_transfer_and_adjustment_rbac(auth_context, staff_auth_context, manager_auth_context):
    client = auth_context["client"]

    # 1. Delivery
    deliv = client.post(
        "/api/v1/deliveries",
        headers=staff_auth_context["headers"],
        json={
            "customer_name": "Cust",
            "source_location_id": LOCATION_ID,
            "items": [{"product_id": PRODUCT_ID, "quantity": "1.000"}],
        },
    )
    deliv_id = deliv.json()["id"]
    client.post(f"/api/v1/deliveries/{deliv_id}/prepare", headers=staff_auth_context["headers"])

    # Staff validate delivery -> 403
    assert client.post(f"/api/v1/deliveries/{deliv_id}/validate", headers=staff_auth_context["headers"]).status_code == 403
    # Staff cancel delivery -> 403
    assert client.post(f"/api/v1/deliveries/{deliv_id}/cancel", headers=staff_auth_context["headers"]).status_code == 403

    # 2. Transfer
    trans = client.post(
        "/api/v1/transfers",
        headers=staff_auth_context["headers"],
        json={
            "source_location_id": LOCATION_ID,
            "destination_location_id": DEST_LOCATION_ID,
            "items": [{"product_id": PRODUCT_ID, "quantity": "1.000"}],
        },
    )
    trans_id = trans.json()["id"]

    # Staff validate transfer -> 403
    assert client.post(f"/api/v1/transfers/{trans_id}/validate", headers=staff_auth_context["headers"]).status_code == 403
    # Staff cancel transfer -> 403
    assert client.post(f"/api/v1/transfers/{trans_id}/cancel", headers=staff_auth_context["headers"]).status_code == 403

    # 3. Adjustment
    adj = client.post(
        "/api/v1/adjustments",
        headers=staff_auth_context["headers"],
        json={
            "product_id": PRODUCT_ID,
            "location_id": LOCATION_ID,
            "physical_quantity": "100.000",
            "reason": "Routine count check",
        },
    )
    adj_id = adj.json()["id"]

    # Staff validate adjustment -> 403
    assert client.post(f"/api/v1/adjustments/{adj_id}/validate", headers=staff_auth_context["headers"]).status_code == 403
    # Staff cancel adjustment -> 403
    assert client.post(f"/api/v1/adjustments/{adj_id}/cancel", headers=staff_auth_context["headers"]).status_code == 403

    # Admin CAN cancel adjustment -> 200
    admin_cancel = client.post(f"/api/v1/adjustments/{adj_id}/cancel", headers=auth_context["headers"])
    assert admin_cancel.status_code == 200
    assert admin_cancel.json()["status"] == "CANCELED"
