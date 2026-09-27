"""§15: pruebas del carnet de auditoría (Historial).

Cubre: actividad de los últimos 7 días, usuarios más activos, ubicación de
inicio de sesión (departamento, distrito, dirección), RBAC y el servicio de
geolocalización sin salir a la red.
"""
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.main import app
from app.database.connection import SessionLocal
from app.models.business_models import Usuario, AuditoriaEvento
from app.core.security import SecurityHandler
from app.services import geoip

c = TestClient(app)


def login(user="admin", pw="admin123"):
    r = c.post("/api/v1/auth/login", data={"username": user, "password": pw})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


# --- Geolocalización (sin red) ---

def test_geo_local_sin_red():
    for ip in (None, "127.0.0.1", "192.168.1.10", "testclient"):
        g = geoip.resolver_ubicacion(ip)
        assert g["departamento"] and g["distrito"] and g["direccion"]
        assert g["fuente"] in ("local", "sin-datos")


def test_geo_ip_publica_validada():
    assert geoip._ip_publica("8.8.8.8") == "8.8.8.8"
    assert geoip._ip_publica("10.0.0.5") is None      # red privada
    assert geoip._ip_publica("no-es-ip") is None      # cadenas raras
    assert geoip._ip_publica("169.254.1.1") is None   # link-local


def test_geo_extrae_ip_de_xff():
    class Req:
        headers = {"x-forwarded-for": "203.0.113.7, 10.0.0.1"}
        client = None
    assert geoip.ip_del_cliente(Req()) == "203.0.113.7"
    assert geoip.ip_del_cliente(None) is None


# --- Endpoint /reports/carnet ---

def test_carnet_401_sin_token():
    assert c.get("/api/v1/reports/carnet").status_code == 401


def test_carnet_estructura_y_siete_dias():
    h = login()
    r = c.get("/api/v1/reports/carnet", headers=h)
    assert r.status_code == 200, r.text
    body = r.json()

    # 1) actividad de los últimos 7 días (7 fechas, la última = hoy, ascendente)
    dias = body["actividad_7_dias"]
    assert len(dias) == 7
    hoy = datetime.now(timezone.utc).date().isoformat()
    assert dias[-1]["fecha"] == hoy
    assert dias[0]["fecha"] == (
        datetime.now(timezone.utc).date() - timedelta(days=6)).isoformat()
    assert all({"eventos", "operaciones", "logins"} <= set(d) for d in dias)
    assert dias[-1]["logins"] >= 1  # su propio login de este test

    # 2) usuarios más activos
    top = body["usuarios_activos"]
    assert len(top) >= 1
    assert top[0]["username"] == "admin"
    assert top[0]["total"] >= 1
    assert all(u["total"] >= top[i + 1]["total"] for i, u in enumerate(top[:-1]))

    # 3) ubicación de inicio de sesión
    ubi = body["ubicacion"]
    assert ubi["departamento"] and ubi["distrito"] and ubi["direccion"]

    # extras
    assert body["usuario"]["username"] == "admin"
    assert body["resumen"]["eventos_7d"] >= 1
    assert body["resumen"]["dias_con_actividad"] >= 1


def test_carnet_ubicacion_viene_del_login_registrado():
    h = login()
    db = SessionLocal()
    try:
        # eventos de LOGIN del admin con ubicación guardada (sin red: "Local")
        logins = (db.query(AuditoriaEvento)
                  .filter(AuditoriaEvento.accion == "LOGIN",
                          AuditoriaEvento.usuario_id.isnot(None))
                  .order_by(AuditoriaEvento.id.desc()).all())
        assert logins and logins[0].departamento == "Local"
        assert logins[0].distrito == "Local"
        assert logins[0].direccion == "Entorno local / red privada"
    finally:
        db.close()
    ubi = c.get("/api/v1/reports/carnet", headers=h).json()["ubicacion"]
    assert ubi["fuente"] == "registro de auditoría"
    assert ubi["fecha"] is not None


def test_carnet_rbac():
    db = SessionLocal()
    try:
        if not db.query(Usuario).filter(Usuario.username == "cons_carnet").first():
            db.add(Usuario(username="cons_carnet",
                           password_hash=SecurityHandler.get_password_hash("cons123"),
                           rol="consulta", empresa_id=1))
            db.commit()
        if not db.query(Usuario).filter(Usuario.username == "ana_carnet").first():
            db.add(Usuario(username="ana_carnet",
                           password_hash=SecurityHandler.get_password_hash("ana123"),
                           rol="analista", empresa_id=1))
            db.commit()
    finally:
        db.close()

    # consulta: 403 (no puede ver auditoría)
    hc = login("cons_carnet", "cons123")
    assert c.get("/api/v1/reports/carnet", headers=hc).status_code == 403
    # analista: 200
    ha = login("ana_carnet", "ana123")
    assert c.get("/api/v1/reports/carnet", headers=ha).status_code == 200
