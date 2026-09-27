"""Servicio biométrico: registro facial y verificación por DNI.

El rostro se representa como un descriptor de 128 dimensiones (face-api.js en
el navegador). La identificación coteja el descriptor almacenado contra el
escaneado usando el MathEngine del plan (distancia euclidiana + similitud
coseno), y registra cada intento en verificaciones_biometricas y en la
auditoría §13.
"""
import os
from typing import Optional

import numpy as np
from sqlalchemy.orm import Session

from app.models.business_models import (
    Usuario, Empresa, RegistroFacial, VerificacionBiometrica,
    MathOperationLog, AuditoriaEvento,
)
from app.services.math_engine import MathEngine

# Umbral de decisión: distancia euclidiana máxima aceptada (face-api usa 0.6)
UMBRAL = float(os.getenv("BIOMETRIC_THRESHOLD", "0.6"))
DIMENSION_DESCRIPTOR = 128


def validar_descriptor(descriptor) -> np.ndarray:
    """Valida que sea un vector numérico de 128 dimensiones con valores finitos."""
    arr = np.asarray(descriptor, dtype=np.float64)
    if arr.shape != (DIMENSION_DESCRIPTOR,):
        raise ValueError(f"El descriptor debe tener {DIMENSION_DESCRIPTOR} dimensiones "
                         f"(recibido: {arr.shape}).")
    if not np.all(np.isfinite(arr)):
        raise ValueError("El descriptor contiene valores no válidos.")
    return arr


def registrar_rostro(db: Session, usuario_id: int, dni: str, descriptor,
                     registrado_por: Optional[int] = None) -> RegistroFacial:
    """Crea o actualiza el registro facial de un usuario (vinculado a usuarios)."""
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise ValueError("Usuario no encontrado")
    dni = dni.strip()
    if not dni:
        raise ValueError("El DNI es obligatorio")

    # El DNI debe ser único: si pertenece a otro usuario, se rechaza
    existente_dni = db.query(RegistroFacial).filter(RegistroFacial.dni == dni).first()
    if existente_dni and existente_dni.usuario_id != usuario_id:
        raise ValueError(f"El DNI {dni} ya está registrado a otro usuario")

    arr = validar_descriptor(descriptor)
    registro = db.query(RegistroFacial).filter(RegistroFacial.usuario_id == usuario_id).first()
    if registro:
        registro.dni = dni
        registro.descriptor = arr.tolist()
        registro.registrado_por = registrado_por
    else:
        registro = RegistroFacial(usuario_id=usuario_id, dni=dni,
                                  descriptor=arr.tolist(), registrado_por=registrado_por)
        db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro


def _persona(db: Session, usuario: Usuario, registro: RegistroFacial) -> dict:
    empresa = db.get(Empresa, usuario.empresa_id) if usuario.empresa_id else None
    return {
        "usuario_id": usuario.id,
        "username": usuario.username,
        "rol": usuario.rol,
        "dni": registro.dni,
        "empresa": empresa.nombre if empresa else None,
        "registrado_desde": registro.creado_en.isoformat() if registro.creado_en else None,
    }


def actividad(db: Session, usuario_id: int) -> dict:
    """Resumen de lo que la persona ha hecho en la página (§13/§15)."""
    ops = (db.query(MathOperationLog)
           .filter(MathOperationLog.usuario_id == usuario_id)
           .order_by(MathOperationLog.timestamp.desc()).all())
    eventos = (db.query(AuditoriaEvento)
               .filter(AuditoriaEvento.usuario_id == usuario_id)
               .order_by(AuditoriaEvento.timestamp.desc()).all())
    ventas = [e for e in eventos if e.accion == "VENTA"]
    logins = [e for e in eventos if e.accion == "LOGIN"]

    return {
        "operaciones_matematicas": {
            "total": len(ops),
            "ultimas": [{"operacion": o.operacion, "estado": o.estado,
                         "timestamp": o.timestamp.isoformat() if o.timestamp else None}
                        for o in ops[:5]],
        },
        "ventas": {"total": len(ventas),
                   "ultimas": [{"detalle": v.detalle, "resultado": v.resultado,
                                "timestamp": v.timestamp.isoformat() if v.timestamp else None}
                               for v in ventas[:5]]},
        "sesiones": {"total": len(logins),
                     "ultima": logins[0].timestamp.isoformat() if logins else None},
        "eventos_auditoria": {"total": len(eventos),
                              "ultimos": [{"accion": e.accion, "modulo": e.modulo,
                                           "estado": e.estado,
                                           "timestamp": e.timestamp.isoformat() if e.timestamp else None}
                                          for e in eventos[:5]]},
    }


def verificar(db: Session, dni: str, descriptor, ip: Optional[str] = None) -> dict:
    """Identifica a la persona por DNI + rostro y devuelve sus datos y actividad."""
    dni = (dni or "").strip()
    arr = validar_descriptor(descriptor)
    registro = db.query(RegistroFacial).filter(RegistroFacial.dni == dni).first()

    if not registro:
        resultado = {
            "resultado": "NO_ENCONTRADO",
            "coincide": False,
            "mensaje": f"No existe registro facial para el DNI {dni}",
            "distancia": None, "umbral": UMBRAL, "confianza": 0.0, "similitud": 0.0,
            "persona": None, "actividad": None,
        }
    else:
        usuario = db.get(Usuario, registro.usuario_id)
        match = MathEngine.match_descriptor(registro.descriptor, arr.tolist(), UMBRAL)
        resultado = {
            "resultado": "MATCH" if match["coincide"] else "NO_MATCH",
            "coincide": match["coincide"],
            "mensaje": ("Identidad confirmada" if match["coincide"]
                        else "El rostro no coincide con el DNI indicado"),
            "distancia": round(match["distancia"], 4),
            "umbral": match["umbral"],
            "confianza": match["confianza"],
            "similitud": round(match["similitud"], 4),
            "persona": _persona(db, usuario, registro) if usuario else None,
            "actividad": actividad(db, registro.usuario_id) if usuario else None,
        }

    # Auditoría §13: cada intento queda registrado
    db.add(VerificacionBiometrica(
        usuario_id=registro.usuario_id if registro else None,
        dni_intentado=dni, resultado=resultado["resultado"],
        distancia=resultado["distancia"], umbral=UMBRAL, ip=ip))
    db.add(AuditoriaEvento(
        usuario_id=registro.usuario_id if registro else None,
        accion="VERIFICACION_BIOMETRICA", modulo="BIOMETRIA",
        detalle=f"DNI {dni}", ip=ip,
        estado="OK" if resultado["coincide"] else "RECHAZO",
        resultado=resultado["resultado"]))
    db.commit()
    return resultado


def listar_registros(db: Session) -> list:
    return (db.query(RegistroFacial, Usuario)
            .join(Usuario, RegistroFacial.usuario_id == Usuario.id)
            .order_by(RegistroFacial.id.desc()).all())


def eliminar_registro(db: Session, registro_id: int) -> bool:
    registro = db.get(RegistroFacial, registro_id)
    if not registro:
        return False
    db.delete(registro)
    db.commit()
    return True


def historial(db: Session, limite: int = 100) -> list:
    return (db.query(VerificacionBiometrica)
            .order_by(VerificacionBiometrica.id.desc())
            .limit(limite).all())
