from uuid import uuid4

import pytest
from passlib.hash import bcrypt

from app.models.sql_models import GenerationRequest, User


@pytest.fixture
def test_password():
    return "TestPassword-123!"


@pytest.fixture
def user_factory(db_session, test_password):
    def create_user(**overrides):
        identifier = uuid4().hex
        values = {
            "username": f"user_{identifier}",
            "email": f"user_{identifier}@example.com",
            "password_hash": bcrypt.hash(test_password),
        }
        values.update(overrides)
        user = User(**values)
        db_session.add(user)
        db_session.flush()
        return user

    return create_user


@pytest.fixture
def test_user(user_factory):
    return user_factory()


@pytest.fixture
def request_data():
    return {
        "topic": "Relationale Datenbanken",
        "language": "de",
        "count": 2,
        "types": ["SCQ"],
        "difficulty_distribution": {"easy": 100, "medium": 0, "hard": 0},
    }


@pytest.fixture
def test_generation_request(db_session, test_user, request_data):
    generation_request = GenerationRequest(user_id=test_user.id, **request_data)
    db_session.add(generation_request)
    db_session.flush()
    return generation_request
