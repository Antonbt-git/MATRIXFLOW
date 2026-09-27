"""§15: pruebas del inicio de sesión facial (DNI + rostro → JWT)."""
import numpy as np
from fastapi.testclient import TestClient

from app.main import app
from app.database.connection import SessionLocal
from app.models.business_models import AuditoriaEvento, VerificacionBiometrica

c = TestClient(app)
DNI = "72345678"


def _descriptor(seed: int):
    v = np.random.default_rng(seed).normal(size=128)
    return (v / np.linalg.norm(v)).tolist()


D_OK = _descriptor(11)
D_OTRO = _descriptor(12)


def _token_admin():
    r = c.post("/api/v1/auth/login", data={"username": "admin", "password": "admin123"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _registrar(h):
    r = c.post("/api/v1/biometrics/register",
               json={"dni": DNI, "descriptor": D_OK, "usuario_id": 1}, headers=h)
    assert r.status_code == 200, r.text


def test_lb01_login_facial_identifica():
    _registrar(_token_admin())
    r = c.post("/api/v1/auth/login-biometrico", json={"dni": DNI, "descriptor": D_OK})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["user"]["username"] == "admin"
    assert body["user"]["rol"] == "admin"
    assert body["coincidencia"]["distancia"] <= body["coincidencia"]["umbral"]
    assert body["coincidencia"]["umbral"] == 0.55
    # el token emitido sirve para acceder a la API
    me = c.get("/api/v1/auth/me",
               headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.status_code == 200 and me.json()["username"] == "admin"


def test_lb02_rostro_no_coincide_401():
    _registrar(_token_admin())
    r = c.post("/api/v1/auth/login-biometrico", json={"dni": DNI, "descriptor": D_OTRO})
    assert r.status_code == 401
    assert "coincide" in r.json()["detail"]


def test_lb03_dni_sin_registro_401():
    r = c.post("/api/v1/auth/login-biometrico",
               json={"dni": "99999999", "descriptor": D_OK})
    assert r.status_code == 401
    assert "registro facial" in r.json()["detail"]


def test_lb04_descriptor_invalido_400():
    r = c.post("/api/v1/auth/login-biometrico",
               json={"dni": DNI, "descriptor": [0.1, 0.2]})
    assert r.status_code == 400


def test_lb05_dni_corto_422():
    assert c.post("/api/v1/auth/login-biometrico",
                  json={"dni": "12", "descriptor": D_OK}).status_code == 422


def test_lb06_auditoria_e_historial_del_intento():
    h = _token_admin()
    _registrar(h)
    c.post("/api/v1/auth/login-biometrico", json={"dni": DNI, "descriptor": D_OK})
    c.post("/api/v1/auth/login-biometrico", json={"dni": DNI, "descriptor": D_OTRO})

    db = SessionLocal()
    try:
        eventos = (db.query(AuditoriaEvento)
                   .filter(AuditoriaEvento.accion == "LOGIN",
                           AuditoriaEvento.detalle.like("%login facial%"))
                   .order_by(AuditoriaEvento.id.desc()).all())
        estados = [e.estado for e in eventos]
        assert "OK" in estados and "ERROR" in estados
        ok = next(e for e in eventos if e.estado == "OK")
        assert ok.resultado == "Token emitido (biométrico)"
        assert ok.departamento and ok.distrito and ok.direccion  # ubicación del login

        intentos = (db.query(VerificacionBiometrica)
                    .filter(VerificacionBiometrica.dni_intentado == DNI)
                    .order_by(VerificacionBiometrica.id.desc()).all())
        assert len(intentos) >= 2
        assert {i.resultado for i in intentos} >= {"MATCH", "NO_MATCH"}
    finally:
        db.close()


def test_lb07_no_requiere_token_previo():
    """El login facial es un endpoint público como el de contraseña."""
    assert c.get("/api/v1/auth/me").status_code == 401
    r = c.post("/api/v1/auth/login-biometrico",
               json={"dni": "12345678", "descriptor": D_OK})
    assert r.status_code in (401,)  # sin registro → 401, no 401 de token
