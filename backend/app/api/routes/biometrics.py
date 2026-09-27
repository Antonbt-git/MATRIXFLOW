"""RF-ext: Verificación biométrica (registro facial + identificación por DNI).

Flujo:
  1. POST /register  → guarda el descriptor facial del rostro de un usuario.
  2. POST /verify    → el usuario introduce su DNI, escanea el rostro y el
                       sistema lo identifica, devolviendo sus datos y su
                       actividad en la página.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.models.business_models import Usuario
from app.schemas.business_schemas import (
    BiometricoRegistroCreate, BiometricoVerificacionCreate,
    BiometricoVerificacionResponse, RegistroFacialResponse,
    VerificacionBiometricaResponse,
)
from app.services import biometric_service as svc

router = APIRouter(prefix="/api/v1/biometrics", tags=["Biometrics"])


@router.post("/register", response_model=RegistroFacialResponse)
def registrar_rostro(data: BiometricoRegistroCreate, db: Session = Depends(get_db),
                     current_user: Usuario = Depends(get_current_user)):
    """Registra el rostro de un usuario. El admin puede registrar a cualquier
    usuario; los demás roles solo pueden registrar el suyo propio."""
    objetivo = data.usuario_id or current_user.id
    if current_user.rol != "admin" and objetivo != current_user.id:
        raise HTTPException(status_code=403, detail="Solo administradores pueden "
                                                    "registrar rostros de otros usuarios")
    try:
        registro = svc.registrar_rostro(db, objetivo, data.dni, data.descriptor,
                                        registrado_por=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    usuario = db.get(Usuario, registro.usuario_id)
    return RegistroFacialResponse(id=registro.id, usuario_id=registro.usuario_id,
                                  dni=registro.dni, modelo=registro.modelo or "face-api-v1",
                                  username=usuario.username if usuario else None,
                                  rol=usuario.rol if usuario else None,
                                  creado_en=registro.creado_en)


@router.post("/verify", response_model=BiometricoVerificacionResponse)
def verificar(data: BiometricoVerificacionCreate, request: Request,
              db: Session = Depends(get_db),
              current_user: Usuario = Depends(get_current_user)):
    """Identifica a la persona por DNI + rostro y devuelve datos y actividad."""
    ip = request.client.host if request.client else None
    try:
        return svc.verificar(db, data.dni, data.descriptor, ip)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/records", response_model=List[RegistroFacialResponse])
def listar_registros(db: Session = Depends(get_db),
                     current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    return [RegistroFacialResponse(id=r.id, usuario_id=r.usuario_id, dni=r.dni,
                                   modelo=r.modelo or "face-api-v1",
                                   username=u.username, rol=u.rol, creado_en=r.creado_en)
            for r, u in svc.listar_registros(db)]


@router.delete("/records/{registro_id}")
def eliminar_registro(registro_id: int, db: Session = Depends(get_db),
                      current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    if not svc.eliminar_registro(db, registro_id):
        raise HTTPException(status_code=404, detail="Registro facial no encontrado")
    return {"ok": True, "id": registro_id}


@router.get("/logs", response_model=List[VerificacionBiometricaResponse])
def historial(db: Session = Depends(get_db),
              current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    return svc.historial(db)
