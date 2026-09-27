from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.core.security import SecurityHandler
from app.models.business_models import Usuario, AuditoriaEvento
from app.schemas.business_schemas import UsuarioResponse

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(),
          request: Request = None, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.username == form_data.username).first()
    ip = request.client.host if request and request.client else None

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

    # §13: registrar LOGIN exitoso (usuario, acción, módulo, fecha, IP, estado, resultado)
    db.add(AuditoriaEvento(usuario_id=usuario.id, accion="LOGIN", modulo="AUTH",
                           detalle="Login exitoso", ip=ip, estado="OK", resultado="Token emitido"))
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "username": usuario.username,
            "rol": usuario.rol,
            "empresa_id": usuario.empresa_id
        }
    }

@router.get("/me", response_model=UsuarioResponse)
def get_current_user_info(current_user: Usuario = Depends(get_current_user)):
    return current_user
