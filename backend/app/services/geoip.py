
import ipaddress
import json
import urllib.request
from typing import Optional

_TIMEOUT = 3  # segundos: nunca bloqueamos el login más de esto
_CACHE: dict = {}


def ip_del_cliente(request) -> Optional[str]:
    """IP real del cliente: Render/Supabase pasan por proxy (X-Forwarded-For)."""
    if request is None:
        return None
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else None


def _ip_publica(ip: str) -> Optional[str]:
    """Devuelve la IP solo si es una dirección pública válida (evita SSRF)."""
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return None
    if addr.is_loopback or addr.is_private or addr.is_link_local or addr.is_reserved:
        return None
    return str(addr)


def _get_json(url: str) -> Optional[dict]:
    req = urllib.request.Request(url, headers={"User-Agent": "MatrixFlow/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None


def _direccion(*partes: str) -> Optional[str]:
    vals = [p.strip() for p in partes if p and str(p).strip()]
    return ", ".join(vals) if vals else None


def _desde_ip_api(ip: str) -> Optional[dict]:
    """ip-api.com (gratis, sin key): trae también 'district' (distrito)."""
    campos = "status,country,regionName,city,district,zip,query,lat,lon"
    data = _get_json(f"http://ip-api.com/json/{ip}?lang=es&fields={campos}")
    if not data or data.get("status") != "success":
        return None
    ciudad = data.get("city")
    distrito = data.get("district")
    return {
        "departamento": data.get("regionName"),
        "distrito": distrito or ciudad,
        "direccion": _direccion(distrito, ciudad, data.get("zip"), data.get("country")),
        "pais": data.get("country"),
        "latitud": data.get("lat"),
        "longitud": data.get("lon"),
        "fuente": "ip-api.com",
    }


def _desde_ipwho(ip: str) -> Optional[dict]:
    """ipwho.is (respaldo HTTPS gratuito)."""
    data = _get_json(f"https://ipwho.is/{ip}")
    if not data or not data.get("success", True):
        return None
    ciudad = data.get("city")
    return {
        "departamento": data.get("region"),
        "distrito": ciudad,
        "direccion": _direccion(ciudad, data.get("postal"), data.get("country")),
        "pais": data.get("country"),
        "latitud": data.get("latitude"),
        "longitud": data.get("longitude"),
        "fuente": "ipwho.is",
    }


def resolver_ubicacion(ip: Optional[str]) -> dict:
    """→ {departamento, distrito, direccion, ip, fuente} (nunca lanza excepción)."""
    base = {"ip": ip, "departamento": None, "distrito": None,
            "direccion": None, "pais": None, "latitud": None,
            "longitud": None, "fuente": None}

    if not ip:
        return {**base, "departamento": "Desconocido", "distrito": "Desconocido",
                "direccion": "Sin IP disponible", "fuente": "sin-datos"}

    publica = _ip_publica(ip)
    if not publica:
        # desarrollo local o red privada: no tiene sentido geolocalizar
        return {**base, "departamento": "Local", "distrito": "Local",
                "direccion": "Entorno local / red privada", "fuente": "local"}

    if publica in _CACHE:
        return {**_CACHE[publica], "ip": ip}

    data = _desde_ip_api(publica) or _desde_ipwho(publica) or {}
    resultado = {**base, **data}
    if not data:
        resultado = {**base, "departamento": "No disponible",
                     "distrito": "No disponible",
                     "direccion": "Servicio de geolocalización no disponible",
                     "fuente": "sin-datos"}
    else:
        resultado["ip"] = ip
        _CACHE[publica] = resultado
    return resultado
