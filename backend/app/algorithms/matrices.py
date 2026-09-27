"""Operaciones matriciales (Fase 4)."""
from app.services.math_engine import MathEngine

add_matrix = MathEngine.sum_vectors
subtract_matrix = MathEngine.subtract_vectors
multiply_matrix = MathEngine.matrix_multiply
transpose_matrix = MathEngine.transpose_matrix
scalar_multiply_matrix = lambda m, s: __import__("numpy").multiply(m, s)
