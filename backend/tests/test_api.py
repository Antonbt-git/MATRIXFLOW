"""§15 Fase 8: pruebas API de endpoints (CA-01, CA-06..CA-10)."""
import pytest
from fastapi.testclient import TestClient
from app.main import app

c = TestClient(app)


def login(user="admin", pw="admin123"):
    r = c.post("/api/v1/auth/login", data={"username": user, "password": pw})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


H = None


@pytest.fixture(autouse=True)
def _auth():
    global H
    H = login()
    yield


def test_ca01_login_y_rechazo():
    assert c.post("/api/v1/auth/login", data={"username": "admin", "password": "mala"}).status_code == 401


def test_sin_token_401():
    assert c.get("/api/v1/vectors/").status_code == 401


def test_ca08_crud_vector_y_historial():
    r = c.post("/api/v1/vectors/", json={"nombre": "t", "valores": [1, 2], "descripcion": ""}, headers=H)
    assert r.status_code == 200
    assert any(v["nombre_vector"] == "t" for v in c.get("/api/v1/vectors/", headers=H).json())


def test_ca06_dimensiones_rechazadas():
    r = c.post("/api/v1/operations/vectors/sum", json={"v1": [1, 2], "v2": [1, 2, 3]}, headers=H)
    assert r.status_code == 400


def test_ca07_operacion_valida():
    r = c.post("/api/v1/operations/vectors/dot",
               json={"v1": [120, 85, 200], "v2": [2500, 3000, 1500]}, headers=H)
    assert r.status_code == 200 and r.json()["resultado"] == 855000.0


def test_ca08_historial_registra():
    c.post("/api/v1/operations/vectors/sum", json={"v1": [1, 2], "v2": [3, 4]}, headers=H)
    hist = c.get("/api/v1/operations/history", headers=H).json()
    assert any(h["operacion"] == "vector_sum" for h in hist)


def test_seguridad_auditoria_solo_admin():
    assert c.get("/api/v1/reports/auditoria", headers=H).status_code == 200


def test_seguridad_users_solo_admin():
    # sin headers -> 401 (RBAC)
    assert c.get("/api/v1/users/").status_code == 401


def test_reporte_metas_ca10():
    r = c.get("/api/v1/reports/metas/1/2026-09", headers=H)
    assert r.status_code == 200
    assert "desviacion" in r.json()
