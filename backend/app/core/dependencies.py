from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import SecurityHandler
from app.models.business_models import Usuario

# Configuración de OAuth2 para el frontend
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Dependencia para obtener el usuario actual y validar el token.

    Vive en su propio módulo (en vez de en main.py) para evitar el import
    circular: main.py necesita las rutas, y las rutas necesitan esta función.
    """
    payload = SecurityHandler.decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    usuario = db.query(Usuario).filter(Usuario.username == payload.get("sub")).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return usuario
