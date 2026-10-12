import socket

import psycopg2
import pytest


@pytest.fixture(autouse=True)
def block_network(monkeypatch):
    """Gilt bereits beim App-Import, Startup und Shutdown dieses Smoke-Tests."""
    def blocked(*args, **kwargs):
        pytest.fail("Der Smoke-Test darf keine Netzwerkverbindung öffnen.")

    monkeypatch.setattr(socket.socket, "connect", blocked)
    monkeypatch.setattr(socket.socket, "connect_ex", blocked)
    monkeypatch.setattr(socket, "getaddrinfo", blocked)
    monkeypatch.setattr(psycopg2, "connect", blocked)


def test_health_starts_without_external_services(smoke_client):
    response = smoke_client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
