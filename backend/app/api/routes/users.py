from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.schemas.business_schemas import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from app.services.business_service import BusinessService
from app.core.security import SecurityHandler
from app.core.dependencies import get_current_user
from app.models.business_models import Usuario

router = APIRouter(prefix="/api/v1/users", tags=["User Management"])

@router.post("/", response_model=UsuarioResponse)
def create_usuario(
    data: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    # Fase 6: solo admin puede crear usuarios (evita registro abierto)
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear usuarios")
    # Importante: nunca se guarda la contraseña en texto plano, se hashea con bcrypt
    password_hash = SecurityHandler.get_password_hash(data.password)
    return BusinessService.create_usuario(db, data.username, password_hash, data.rol, data.empresa_id)


@router.get("/", response_model=List[UsuarioResponse])
def list_usuarios(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    return db.query(Usuario).all()


@router.put("/{user_id}", response_model=UsuarioResponse)
def update_usuario(user_id: int, data: UsuarioUpdate, db: Session = Depends(get_db),
                   current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    try:
        return BusinessService._update(db, Usuario, user_id, data.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{user_id}")
def delete_usuario(user_id: int, db: Session = Depends(get_db),
                   current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propio usuario")
    try:
        BusinessService._delete(db, Usuario, user_id)
        return {"ok": True, "id": user_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
