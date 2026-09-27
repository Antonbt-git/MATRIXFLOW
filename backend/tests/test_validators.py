"""§15 Fase 8: validadores (validate_vector/validate_matrix) usados por el servicio."""
from app.algorithms.linalg import validate_vector, validate_matrix, validate_dimensions


def test_validate_vector():
    assert validate_vector([1, 2, 3]) is True
    assert validate_vector([]) is False
    assert validate_vector([[1, 2]]) is False


def test_validate_matrix():
    assert validate_matrix([[1, 2], [3, 4]]) is True
    assert validate_matrix([[]]) is False


def test_validate_dimensions():
    assert validate_dimensions([1, 2], [3, 4]) is True
    assert validate_dimensions([1, 2], [1, 2, 3]) is False
