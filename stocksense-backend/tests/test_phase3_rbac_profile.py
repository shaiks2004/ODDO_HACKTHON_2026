"""Phase 3 role authorization and safe profile API coverage."""

from uuid import uuid4

from app.core.security import create_access_token, hash_password
from app.models import User
from app.utils.enums import UserRole


def make_user(db_session, role: UserRole) -> dict[str, str]:
    user = User(
        name=f"Phase Three {role.value}",
        email=f"phase3-{role.value.lower()}-{uuid4().hex}@example.test",
        password_hash=hash_password("StrongPass@123"),
        role=role,
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()
    return {"Authorization": f"Bearer {create_access_token(str(user.id))}"}


def test_signup_cannot_choose_privileged_role_and_gets_safe_default(client, db_session):
    from sqlalchemy import select
    from app.models import OtpCode

    privileged = client.post(
        "/api/v1/auth/signup",
        json={
            "name": "Attempted Admin",
            "email": "attempted-admin@example.test",
            "password": "StrongPass@123",
            "role": "ADMIN",
        },
    )
    assert privileged.status_code == 422

    signup = client.post(
        "/api/v1/auth/signup",
        json={
            "name": "Normal User",
            "email": "normal-role@example.test",
            "password": "StrongPass@123",
        },
    )
    assert signup.status_code == 201
    assert signup.json()["requires_verification"] is True

    db_session.expire_all()
    otp = db_session.scalar(select(OtpCode).where(OtpCode.is_used.is_(False)).order_by(OtpCode.expires_at.desc()))
    verify = client.post(
        "/api/v1/auth/verify-signup",
        json={"email": "normal-role@example.test", "otp_code": otp.otp_code},
    )
    assert verify.status_code == 200
    headers = {"Authorization": f"Bearer {verify.json()['access_token']}"}
    profile = client.get("/api/v1/users/me", headers=headers)
    assert profile.status_code == 200
    assert profile.json()["role"] == "WAREHOUSE_STAFF"
    assert "password_hash" not in profile.json()


def test_profile_update_only_accepts_name_and_email(client, db_session):
    from sqlalchemy import select
    from app.models import OtpCode

    signup = client.post(
        "/api/v1/auth/signup",
        json={"name": "Profile User", "email": "profile-user@example.test", "password": "StrongPass@123"},
    )
    assert signup.status_code == 201
    db_session.expire_all()
    otp = db_session.scalar(select(OtpCode).where(OtpCode.is_used.is_(False)).order_by(OtpCode.expires_at.desc()))
    verify = client.post(
        "/api/v1/auth/verify-signup",
        json={"email": "profile-user@example.test", "otp_code": otp.otp_code},
    )
    assert verify.status_code == 200
    headers = {"Authorization": f"Bearer {verify.json()['access_token']}"}
    updated = client.patch(
        "/api/v1/users/me",
        headers=headers,
        json={"name": "Updated Profile", "email": "UPDATED@example.test"},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Updated Profile"
    assert updated.json()["email"] == "updated@example.test"
    assert updated.json()["role"] == "WAREHOUSE_STAFF"

    role_change = client.patch("/api/v1/users/me", headers=headers, json={"role": "ADMIN"})
    assert role_change.status_code == 422
    password_hash_change = client.patch("/api/v1/users/me", headers=headers, json={"password_hash": "bad"})
    assert password_hash_change.status_code == 422
    duplicate = client.patch("/api/v1/users/me", headers=headers, json={"email": "admin@stocksense.demo"})
    assert duplicate.status_code == 409
    assert client.get("/api/v1/users/me").status_code == 401


def test_staff_cannot_mutate_master_data_or_validate_stock(db_session, client):
    staff_headers = make_user(db_session, UserRole.WAREHOUSE_STAFF)
    product = {
        "name": "RBAC restricted product",
        "sku": f"RBAC-{uuid4().hex[:8]}",
        "category_id": "10000000-0000-0000-0000-000000000001",
        "unit_of_measure": "UNIT",
    }
    assert client.post("/api/v1/products", headers=staff_headers, json=product).status_code == 403

    transfer_id = "70000000-0000-0000-0000-000000000002"
    assert client.post(
        f"/api/v1/transfers/{transfer_id}/validate", headers=staff_headers
    ).status_code == 403


def test_inventory_manager_can_validate_stock_operation(db_session, client):
    manager_headers = make_user(db_session, UserRole.INVENTORY_MANAGER)
    transfer_id = "70000000-0000-0000-0000-000000000002"
    response = client.post(f"/api/v1/transfers/{transfer_id}/validate", headers=manager_headers)
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "DONE"


def test_advanced_inventory_filters_and_pagination(client, db_session):
    headers = make_user(db_session, UserRole.WAREHOUSE_STAFF)
    response = client.get(
        "/api/v1/inventory?warehouse_code=WH-MAIN&category_name=Raw&min_stock_value=100000&page=1&page_size=5",
        headers=headers,
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["page"] == 1
    assert body["page_size"] == 5
    assert body["total"] >= 1
    assert all(item["warehouse_name"] == "Main Warehouse" for item in body["items"])
    assert all(item["category_name"] == "Raw Materials" for item in body["items"])


def test_adjustment_cancel_is_document_only_and_draft_only(db_session, client):
    admin_headers = make_user(db_session, UserRole.ADMIN)
    draft_id = "80000000-0000-0000-0000-000000000003"
    before_ledger = client.get("/api/v1/stock-ledger", headers=admin_headers).json()["total"]
    canceled = client.post(f"/api/v1/adjustments/{draft_id}/cancel", headers=admin_headers)
    assert canceled.status_code == 200
    assert canceled.json()["status"] == "CANCELED"

    repeated = client.post(f"/api/v1/adjustments/{draft_id}/cancel", headers=admin_headers)
    assert repeated.status_code == 409
    done_id = "80000000-0000-0000-0000-000000000001"
    assert client.post(f"/api/v1/adjustments/{done_id}/cancel", headers=admin_headers).status_code == 409
    after_ledger = client.get("/api/v1/stock-ledger", headers=admin_headers).json()["total"]
    assert after_ledger == before_ledger