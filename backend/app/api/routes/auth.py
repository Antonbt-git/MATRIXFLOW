from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
import os
from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.core.security import SecurityHandler
from app.models.business_models import Usuario, AuditoriaEvento, RegistroFacial, VerificacionBiometrica
from app.schemas.business_schemas import UsuarioResponse, LoginBiometrico
from app.services.geoip import ip_del_cliente, resolver_ubicacion
from app.services.math_engine import MathEngine
from app.services import biometric_service

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

# Umbral de acceso por rostro: más exigente que la verificación simple
UMBRAL_LOGIN = float(os.getenv("BIOMETRIC_LOGIN_THRESHOLD", "0.55"))

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(),
          request: Request = None, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.username == form_data.username).first()
    ip = ip_del_cliente(request)

    if not usuario or not SecurityHandler.verify_password(form_data.password, usuario.password_hash):
        # §13: auditoría de intento fallido con IP, estado y resultado
        db.add(AuditoriaEvento(usuario_id=usuario.id if usuario else None, accion="LOGIN",
                               modulo="AUTH", detalle=f"Intento fallido: {form_data.username}",
                               ip=ip, estado="ERROR", resultado="Credenciales inválidas"))
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = SecurityHandler.create_access_token(
        data={"sub": usuario.username, "rol": usuario.rol, "empresa_id": usuario.empresa_id}
    )

    # §13: registrar LOGIN exitoso (usuario, acción, módulo, fecha, IP, estado,
    # resultado) + ubicación desde la que se conecta (carnet de auditoría)
    ubicacion = resolver_ubicacion(ip)
    db.add(AuditoriaEvento(usuario_id=usuario.id, accion="LOGIN", modulo="AUTH",
                           detalle="Login exitoso", ip=ip, estado="OK", resultado="Token emitido",
                           departamento=ubicacion.get("departamento"),
                           distrito=ubicacion.get("distrito"),
                           direccion=ubicacion.get("direccion")))
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": usuario.id,
            "username": usuario.username,
            "rol": usuario.rol,
            "empresa_id": usuario.empresa_id
        }
    }

@router.get("/me", response_model=UsuarioResponse)
def get_current_user_info(current_user: Usuario = Depends(get_current_user)):
    return current_user


@router.post("/login-biometrico")
def login_biometrico(data: LoginBiometrico, request: Request = None,
                     db: Session = Depends(get_db)):
    """Inicio de sesión con DNI + rostro: identifica a la persona con el
    descriptor facial almacenado y emite el JWT si la coincidencia supera el
    umbral (distancia euclidiana, MathEngine)."""
    ip = ip_del_cliente(request)
    dni = data.dni.strip()

    try:
        descriptor = biometric_service.validar_descriptor(data.descriptor)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    registro = db.query(RegistroFacial).filter(RegistroFacial.dni == dni).first()
    usuario = db.get(Usuario, registro.usuario_id) if registro else None
    match = MathEngine.match_descriptor(registro.descriptor, descriptor.tolist(),
                                        UMBRAL_LOGIN) if registro else None
    ubicacion = resolver_ubicacion(ip)
    geo = {"departamento": ubicacion.get("departamento"),
           "distrito": ubicacion.get("distrito"),
           "direccion": ubicacion.get("direccion")}

    # Historial de intentos biométricos (§13/§15)
    db.add(VerificacionBiometrica(
        usuario_id=registro.usuario_id if registro else None, dni_intentado=dni,
        resultado=("MATCH" if match and match["coincide"]
                   else "NO_MATCH" if match else "NO_ENCONTRADO"),
        distancia=round(match["distancia"], 4) if match else None,
        umbral=UMBRAL_LOGIN, ip=ip))

    if not registro or not usuario:
        db.add(AuditoriaEvento(usuario_id=None, accion="LOGIN", modulo="AUTH",
                               detalle=f"Login facial sin registro: {dni}", ip=ip,
                               estado="ERROR", resultado="DNI sin registro facial", **geo))
        db.commit()
        raise HTTPException(status_code=401,
                            detail=f"No existe registro facial para el DNI {dni}",
                            headers={"WWW-Authenticate": "Bearer"})

    if not match["coincide"]:
        db.add(AuditoriaEvento(usuario_id=usuario.id, accion="LOGIN", modulo="AUTH",
                               detalle=f"Login facial rechazado (DNI {dni})", ip=ip,
                               estado="ERROR",
                               resultado=f"Rostro no coincide (d={match['distancia']:.3f})",
                               **geo))
        db.commit()
        raise HTTPException(status_code=401,
                            detail="El rostro no coincide con el DNI indicado",
                            headers={"WWW-Authenticate": "Bearer"})

    # Identificado: mismo JWT que el login por contraseña (§13 + ubicación)
    access_token = SecurityHandler.create_access_token(
        data={"sub": usuario.username, "rol": usuario.rol, "empresa_id": usuario.empresa_id}
    )
    db.add(AuditoriaEvento(usuario_id=usuario.id, accion="LOGIN", modulo="AUTH",
                           detalle=f"Login facial exitoso (DNI {dni})", ip=ip,
                           estado="OK", resultado="Token emitido (biométrico)", **geo))
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": usuario.id, "username": usuario.username,
                 "rol": usuario.rol, "empresa_id": usuario.empresa_id},
        "coincidencia": {"distancia": round(match["distancia"], 4),
                         "confianza": match["confianza"],
                         "similitud": round(match["similitud"], 4),
                         "umbral": UMBRAL_LOGIN},
    }
