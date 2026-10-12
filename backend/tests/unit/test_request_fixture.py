from app.models.generate_models import GenerateRequest


def test_request_data_is_valid_without_database(request_data):
    request = GenerateRequest.model_validate(request_data)

    assert request.types == ["SCQ"]
    assert sum(request.difficulty_distribution.values()) == 100
