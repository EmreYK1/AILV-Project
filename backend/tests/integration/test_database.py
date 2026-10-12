import pytest
from sqlalchemy import select, text

from app.models.sql_models import Job, User
from conftest import _isolated_session


@pytest.mark.parametrize("iteration", [1, 2])
def test_database_writes_are_isolated_between_tests(db_session, iteration):
    assert db_session.scalar(select(User).where(User.username == "isolation_probe")) is None
    user = User(
        username="isolation_probe",
        email="isolation@example.invalid",
        password_hash="test-only-not-a-real-password",
    )
    db_session.add(user)
    db_session.commit()
    db_session.expire_all()
    stored = db_session.scalar(select(User).where(User.username == "isolation_probe"))
    assert stored.id == user.id
    assert stored.email == "isolation@example.invalid"


def test_commit_and_rollback_do_not_leak_into_the_next_session(db_connection):
    # Explicitly exercise the same lifecycle as db_session, without relying on
    # pytest test ordering (and still meaningful when running this test alone).
    with _isolated_session(db_connection) as first:
        first.add(Job(job_type="rolled-back"))
        first.flush()
        first.rollback()
        first.add(Job(job_type="committed"))
        first.commit()
        first.add(Job(job_type="committed-again"))
        first.commit()
        assert len(first.scalars(select(Job)).all()) == 2
    with _isolated_session(db_connection) as second:
        assert second.scalars(select(Job)).all() == []


def test_postgresql_jsonb_round_trip_and_contains(db_session):
    payload = {"topic": "Datenbanken", "types": ["multiple_choice"], "count": 2}
    job = Job(job_type="jsonb_probe", request_data=payload)
    db_session.add(job)
    db_session.commit()
    db_session.expire_all()

    stored = db_session.scalar(
        select(Job).where(Job.request_data.contains({"types": ["multiple_choice"]}))
    )
    assert stored.id == job.id
    assert stored.request_data == payload
    assert db_session.scalar(text("SELECT pg_typeof(request_data)::text FROM jobs")) == "jsonb"


def test_connection_uses_only_private_schema(db_session, test_database_url):
    assert db_session.scalar(text("SELECT current_database()")) == test_database_url.database
    assert db_session.scalar(text("SELECT current_schema()")).startswith("pytest_")
    assert "public" not in db_session.scalar(text("SHOW search_path"))
