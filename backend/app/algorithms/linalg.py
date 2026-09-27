"""Álgebra lineal: combinaciones + validaciones (Fase 4)."""
import numpy as np
from app.services.math_engine import MathEngine

linear_combination = MathEngine.linear_combination


def validate_dimensions(a, b) -> bool:
    return np.array(a).shape == np.array(b).shape


def validate_vector(v) -> bool:
    arr = np.array(v)
    return arr.ndim == 1 and len(arr) > 0


def validate_matrix(m) -> bool:
    arr = np.array(m)
    return arr.ndim == 2 and arr.shape[0] > 0 and arr.shape[1] > 0
