import pytest

from app.models.sql_models import GenerationRequest


def test_login_uses_fixture_user(client, test_user, test_password):
    response = client.post("/api/auth/login", json={
        "username": test_user.username,
        "password": test_password,
    })

    assert response.status_code == 200
    assert response.json()["access_token"]


@pytest.mark.parametrize("run", [1, 2])
def test_registration_commits_are_isolated(client, test_password, run):
    # Beide Tests müssen dieselben eindeutigen Daten neu anlegen können.
    response = client.post("/api/auth/register", json={
        "username": "registration_probe",
        "email": "registration@example.com",
        "password": test_password,
    })

    assert response.status_code == 200
    assert response.json()["username"] == "registration_probe"


def test_request_fixture_belongs_to_user(db_session, test_user, test_generation_request):
    stored = db_session.get(GenerationRequest, test_generation_request.id)

    assert stored.user_id == test_user.id
    assert stored.types == ["SCQ"]
