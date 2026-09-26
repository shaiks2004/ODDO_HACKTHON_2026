"""Profile endpoint integration tests for GET and PATCH /users/me."""

from uuid import uuid4


def test_get_current_user_profile(auth_context):
    client = auth_context["client"]
    headers = auth_context["headers"]

    # Both /api/v1/users/me and /users/me work
    res = client.get("/api/v1/users/me", headers=headers)
    assert res.status_code == 200, res.text
    profile = res.json()
    assert profile["email"] == auth_context["email"]
    assert profile["name"] == "Phase Two Tester"
    assert profile["role"] == "ADMIN"
    assert profile["is_active"] is True
    assert "id" in profile
    assert "created_at" in profile
    assert "updated_at" in profile
    assert "password" not in profile
    assert "password_hash" not in profile

    res_root = client.get("/users/me", headers=headers)
    assert res_root.status_code == 200
    assert res_root.json()["id"] == profile["id"]


def test_update_current_user_profile(auth_context):
    client = auth_context["client"]
    headers = auth_context["headers"]

    new_name = "Updated Tester Name"
    res = client.patch(
        "/api/v1/users/me",
        headers=headers,
        json={"name": new_name},
    )
    assert res.status_code == 200, res.text
    assert res.json()["name"] == new_name

    # Update email
    new_email = f"updated-{uuid4().hex[:6]}@example.test"
    res2 = client.patch(
        "/users/me",
        headers=headers,
        json={"email": new_email},
    )
    assert res2.status_code == 200, res2.text
    assert res2.json()["email"] == new_email


def test_profile_duplicate_email_conflict(auth_context, staff_auth_context):
    client = auth_context["client"]
    headers = auth_context["headers"]

    # Try setting email to another existing user's email
    res = client.patch(
        "/api/v1/users/me",
        headers=headers,
        json={"email": staff_auth_context["email"]},
    )
    assert res.status_code == 409, res.text


def test_profile_requires_authentication(client):
    assert client.get("/api/v1/users/me").status_code == 401
    assert client.get("/users/me").status_code == 401
    assert client.patch("/api/v1/users/me", json={"name": "No Auth"}).status_code == 401
