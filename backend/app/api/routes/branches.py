"""§9.1: branches.py — endpoints de sucursales."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.schemas.business_schemas import SucursalCreate, SucursalResponse, SucursalUpdate
from app.services.business_service import BusinessService
from app.repositories import BusinessRepository
from app.core.dependencies import get_current_user
from app.models.business_models import Usuario, Sucursal

router = APIRouter(prefix="/api/v1/branches", tags=["Branches"])

@router.post("/", response_model=SucursalResponse)
def create_sucursal(data: SucursalCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="Solo los administradores pueden crear sucursales")
    return BusinessService.create_sucursal(db, data.empresa_id, data.nombre, data.ciudad, data.codigo)

@router.get("/", response_model=List[SucursalResponse])
def list_sucursales(empresa_id: int | None = None, db: Session = Depends(get_db),
                    current_user: Usuario = Depends(get_current_user)):
    return BusinessRepository.list_sucursales(db, empresa_id)


@router.put("/{sucursal_id}", response_model=SucursalResponse)
def update_sucursal(sucursal_id: int, data: SucursalUpdate, db: Session = Depends(get_db),
                    current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="Solo administradores")
    payload = data.model_dump()
    if payload.get("codigo") is not None:
        payload["codigo_sucursal"] = payload.pop("codigo")
    try:
        return BusinessService._update(db, Sucursal, sucursal_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{sucursal_id}")
def delete_sucursal(sucursal_id: int, db: Session = Depends(get_db),
                    current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="Solo administradores")
    try:
        BusinessService._delete(db, Sucursal, sucursal_id)
        return {"ok": True, "id": sucursal_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
