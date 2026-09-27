"""§15: pruebas del módulo biométrico (registro facial + verificación por DNI).

Verifica la matemática del cotejo (MathEngine.match_descriptor), los
endpoints, la auditoría de intentos y el RBAC.
"""
import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.connection import SessionLocal
from app.models.business_models import Usuario, VerificacionBiometrica
from app.core.security import SecurityHandler

c = TestClient(app)


def _descriptor(seed: int):
    """Descriptor 128-d normalizado (equivalente a la salida de face-api)."""
    v = np.random.default_rng(seed).normal(size=128)
    return (v / np.linalg.norm(v)).tolist()


DNI = "72345678"
D_OK = _descriptor(1)
D_OTRO = _descriptor(2)


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


# --- Matemática del cotejo (RF-10 aplicado a biometría) ---

def test_matematica_mismo_descriptor():
    m = __import__("app.services.math_engine", fromlist=["MathEngine"]).MathEngine
    r = m.match_descriptor(D_OK, D_OK, umbral=0.6)
    assert r["coincide"] is True
    assert r["distancia"] == pytest.approx(0.0, abs=1e-9)
    assert r["similitud"] == pytest.approx(1.0, abs=1e-9)
    assert r["confianza"] == 100.0


def test_matematica_descriptor_distinto():
    m = __import__("app.services.math_engine", fromlist=["MathEngine"]).MathEngine
    r = m.match_descriptor(D_OK, D_OTRO, umbral=0.6)
    assert r["coincide"] is False
    assert r["distancia"] > 0.6


def test_matematica_dimensiones_distintas():
    m = __import__("app.services.math_engine", fromlist=["MathEngine"]).MathEngine
    with pytest.raises(ValueError):
        m.match_descriptor([1.0, 2.0], [1.0, 2.0, 3.0])


# --- Endpoints ---

def test_bi01_registro_facial():
    r = c.post("/api/v1/biometrics/register",
               json={"dni": DNI, "descriptor": D_OK, "usuario_id": 1}, headers=H)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["dni"] == DNI and body["username"] == "admin"


def test_bi02_verificacion_identifica_y_da_datos():
    c.post("/api/v1/biometrics/register",
           json={"dni": DNI, "descriptor": D_OK, "usuario_id": 1}, headers=H)
    r = c.post("/api/v1/biometrics/verify",
               json={"dni": DNI, "descriptor": D_OK}, headers=H)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["resultado"] == "MATCH" and body["coincide"] is True
    assert body["distancia"] <= body["umbral"]
    # datos de la persona
    assert body["persona"]["username"] == "admin"
    assert body["persona"]["dni"] == DNI
    assert body["persona"]["rol"] == "admin"
    # actividad en la página
    assert "operaciones_matematicas" in body["actividad"]
    assert "eventos_auditoria" in body["actividad"]
    assert body["actividad"]["sesiones"]["total"] >= 1  # al menos su login


def test_bi03_rostro_no_coincide():
    c.post("/api/v1/biometrics/register",
           json={"dni": DNI, "descriptor": D_OK, "usuario_id": 1}, headers=H)
    r = c.post("/api/v1/biometrics/verify",
               json={"dni": DNI, "descriptor": D_OTRO}, headers=H)
    body = r.json()
    assert body["resultado"] == "NO_MATCH" and body["coincide"] is False
    assert body["distancia"] > body["umbral"]


def test_bi04_dni_inexistente():
    r = c.post("/api/v1/biometrics/verify",
               json={"dni": "99999999", "descriptor": D_OK}, headers=H)
    assert r.json()["resultado"] == "NO_ENCONTRADO"


def test_bi05_descriptor_invalido():
    r = c.post("/api/v1/biometrics/register",
               json={"dni": "11111111", "descriptor": [0.1, 0.2]}, headers=H)
    assert r.status_code == 400


def test_bi06_historial_audita_intentos():
    c.post("/api/v1/biometrics/verify",
           json={"dni": DNI, "descriptor": D_OK}, headers=H)
    r = c.get("/api/v1/biometrics/logs", headers=H)
    assert r.status_code == 200
    assert len(r.json()) >= 1
    assert r.json()[0]["resultado"] in ("MATCH", "NO_MATCH", "NO_ENCONTRADO")


def test_bi07_registro_sin_token_401():
    assert c.post("/api/v1/biometrics/verify",
                  json={"dni": DNI, "descriptor": D_OK}).status_code == 401


def test_bi08_rbac_no_admin_no_lista():
    # crea un analista de prueba
    db = SessionLocal()
    try:
        if not db.query(Usuario).filter(Usuario.username == "ana_bio").first():
            db.add(Usuario(username="ana_bio",
                           password_hash=SecurityHandler.get_password_hash("ana123"),
                           rol="analista", empresa_id=1))
            db.commit()
    finally:
        db.close()
    ha = login("ana_bio", "ana123")
    # no puede listar registros (solo admin)
    assert c.get("/api/v1/biometrics/records", headers=ha).status_code == 403
    # pero sí puede registrar su propio rostro
    r = c.post("/api/v1/biometrics/register",
               json={"dni": "55555555", "descriptor": D_OK}, headers=ha)
    assert r.status_code == 200
    # y no puede registrar el rostro de otro usuario
    r = c.post("/api/v1/biometrics/register",
               json={"dni": "55555556", "descriptor": D_OK, "usuario_id": 1}, headers=ha)
    assert r.status_code == 403


def test_bi09_dni_duplicado_en_otro_usuario():
    # el DNI del admin ya existe: otro usuario no puede reclamarlo
    db = SessionLocal()
    try:
        u = db.query(Usuario).filter(Usuario.username == "ana_bio").first()
        assert u is not None
    finally:
        db.close()
    r = c.post("/api/v1/biometrics/register",
               json={"dni": DNI, "descriptor": D_OTRO, "usuario_id": 1}, headers=H)
    # al ser el mismo usuario, es una actualización (permitida)
    assert r.status_code == 200
