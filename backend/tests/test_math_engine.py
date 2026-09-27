import numpy as np
from app.services.math_engine import MathEngine
from app.algorithms.linalg import validate_dimensions, validate_vector, validate_matrix


def test_sum_vectors():
    assert MathEngine.sum_vectors(np.array([1, 2]), np.array([3, 4])).tolist() == [4, 6]


def test_dot_product_ingresos():
    # CA-07: Cantidades x precios = ingresos
    assert MathEngine.dot_product(np.array([120, 85, 200]), np.array([2500, 3000, 1500])) == 855000.0


def test_dimensions_rejected():
    # CA-06: dimensiones incompatibles rechazadas
    try:
        MathEngine.sum_vectors(np.array([1, 2]), np.array([1, 2, 3]))
        assert False, "debió fallar"
    except ValueError:
        pass


def test_transpose_and_linear_combination():
    m = np.array([[120, 50], [85, 40]])
    assert MathEngine.transpose_matrix(m).tolist() == [[120, 85], [50, 40]]
    res = MathEngine.linear_combination([np.array([1.0, 2.0]), np.array([3.0, 4.0])], [0.5, 0.5])
    assert res.tolist() == [2.0, 3.0]


def test_validators():
    assert validate_dimensions([1, 2], [3, 4]) is True
    assert validate_vector([1, 2, 3]) is True
    assert validate_matrix([[1, 2], [3, 4]]) is True
