import numpy as np
from typing import List, Tuple, Union

class MathEngine:
    """
    Motor Matemático MatrixFlow Enterprise - Versión Completa.
    Implementa RF-10, RF-11 y RF-12.
    """

    @staticmethod
    def validate_dimensions(v1: np.ndarray, v2: np.ndarray) -> bool:
        return v1.shape == v2.shape

    # --- RF-10: Operaciones Vectoriales ---
    @staticmethod
    def sum_vectors(v1: np.ndarray, v2: np.ndarray) -> np.ndarray:
        if not MathEngine.validate_dimensions(v1, v2):
            raise ValueError("Dimensiones incompatibles para suma.")
        return np.add(v1, v2)

    @staticmethod
    def subtract_vectors(v1: np.ndarray, v2: np.ndarray) -> np.ndarray:
        if not MathEngine.validate_dimensions(v1, v2):
            raise ValueError("Dimensiones incompatibles para resta.")
        return np.subtract(v1, v2)

    @staticmethod
    def dot_product(v1: np.ndarray, v2: np.ndarray) -> float:
        if not MathEngine.validate_dimensions(v1, v2):
            raise ValueError("Dimensiones incompatibles para producto punto.")
        return float(np.dot(v1, v2))

    @staticmethod
    def scalar_multiply(vector: np.ndarray, scalar: float) -> np.ndarray:
        return np.multiply(vector, scalar)

    # --- RF-11: Operaciones Matriciales ---
    @staticmethod
    def matrix_multiply(m1: np.ndarray, m2: np.ndarray) -> np.ndarray:
        """Multiplicación de matrices para indicadores complejos."""
        return np.matmul(m1, m2)

    @staticmethod
    def transpose_matrix(m: np.ndarray) -> np.ndarray:
        return m.T

    @staticmethod
    def matrix_inverse(m: np.ndarray) -> np.ndarray:
        """Cálculo de matriz inversa para resolución de sistemas de metas."""
        return np.linalg.inv(m)

    # --- RF-12: Combinaciones Lineales ---
    @staticmethod
    def linear_combination(vectors: List[np.ndarray], weights: List[float]) -> np.ndarray:
        """Calcula el indicador ponderado: sum(v_i * w_i)"""
        if len(vectors) != len(weights):
            raise ValueError("La cantidad de vectores debe coincidir con la de pesos.")

        result = np.zeros_like(vectors[0])
        for v, w in zip(vectors, weights):
            result += MathEngine.scalar_multiply(v, w)
        return result

    @staticmethod
    def calculate_euclidean_distance(v1: np.ndarray, v2: np.ndarray) -> float:
        return float(np.linalg.norm(v1 - v2))

    # --- Extensión biométrica: cotejo de descriptores faciales ---
    @staticmethod
    def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
        """Similitud coseno entre dos descriptores: 1.0 = idénticos, 0 = ortogonales."""
        if not MathEngine.validate_dimensions(v1, v2):
            raise ValueError("Dimensiones incompatibles para similitud coseno.")
        n1, n2 = np.linalg.norm(v1), np.linalg.norm(v2)
        if n1 == 0 or n2 == 0:
            return 0.0
        return float(np.dot(v1, v2) / (n1 * n2))

    @staticmethod
    def match_descriptor(descriptor_a, descriptor_b, umbral: float = 0.6) -> dict:
        """Cotejo biométrico: distancia euclidiana (§RF-10) + similitud coseno.

        Coincidencia cuando la distancia euclidiana es <= umbral.
        """
        a = np.asarray(descriptor_a, dtype=np.float64)
        b = np.asarray(descriptor_b, dtype=np.float64)
        if a.shape != b.shape:
            raise ValueError("Descriptores de distinta dimensión.")
        distancia = MathEngine.calculate_euclidean_distance(a, b)
        similitud = MathEngine.cosine_similarity(a, b)
        return {
            "coincide": bool(distancia <= umbral),
            "distancia": distancia,
            "similitud": similitud,
            "umbral": umbral,
            "confianza": round(max(0.0, min(1.0, 1.0 - distancia / (2 * umbral))) * 100, 2),
        }
