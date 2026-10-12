"""Safety checks that run without a configured or reachable PostgreSQL server."""

import pytest
from sqlalchemy import create_engine

from app.db import engine as application_engine
from conftest import _validate_test_database_url


REGULAR_URL = "postgresql://app:secret@db:5432/aildb"


@pytest.mark.parametrize("url", [
    None,
    "",
    "   ",
    "not-a-url",
    "sqlite:///aildb_test",
    "postgresql://tester:secret@localhost/aildb",
    "postgresql://tester:secret@localhost/production",
    "postgresql://tester:secret@localhost/aildb_test?dbname=aildb",
    "postgresql://tester:secret@localhost/aildb_test?service=production",
    "postgresql://tester:secret@localhost/aildb_test?options=-csearch_path=public",
    "postgresql://tester:secret@localhost:invalid/aildb_test",
    "postgresql:///aildb_test",
])
def test_unsafe_test_database_urls_are_rejected(url):
    with pytest.raises(ValueError):
        _validate_test_database_url(url, REGULAR_URL)


def test_same_database_is_rejected_despite_different_host_user_or_driver():
    with pytest.raises(ValueError, match="unterschiedliche Namen"):
        _validate_test_database_url(
            "postgresql+psycopg2://tester:secret@localhost/aildb_test",
            "postgresql://app:secret@db/aildb_test",
        )


def test_explicit_postgresql_test_database_is_accepted():
    url = _validate_test_database_url(
        "postgresql+psycopg2://tester:secret@localhost/aildb_test?sslmode=require",
        REGULAR_URL,
    )
    assert url.database == "aildb_test"


def test_application_database_connection_is_blocked_before_network_access():
    with pytest.raises(RuntimeError, match="Zugriff auf die Datenbank gesperrt"):
        application_engine.connect()


def test_unapproved_engines_cannot_bypass_the_fixtures():
    engine = create_engine(REGULAR_URL)
    try:
        with pytest.raises(RuntimeError, match="Zugriff auf die Datenbank gesperrt"):
            engine.connect()
    finally:
        engine.dispose()