from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.schemas.business_schemas import VentaCreate, VentaResponse
from app.services.business_service import BusinessService
from app.repositories import BusinessRepository
from app.core.dependencies import get_current_user
from app.models.business_models import Usuario, Venta

router = APIRouter(prefix="/api/v1/sales", tags=["Sales & Inventory"])

@router.post("/register/", response_model=VentaResponse)
def register_venta(
    data: VentaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        # El usuario_id se toma del token para mayor seguridad en lugar de confiar en el body
        return BusinessService.register_venta(
            db,
            data.sucursal_id,
            data.producto_id,
            data.cantidad,
            current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[VentaResponse])
def list_ventas(sucursal_id: int | None = None, db: Session = Depends(get_db),
                current_user: Usuario = Depends(get_current_user)):
    return BusinessRepository.list_ventas(db, sucursal_id)


@router.put("/{venta_id}", response_model=VentaResponse)
def update_venta(venta_id: int, data: VentaCreate, db: Session = Depends(get_db),
                 current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="Solo administradores")
    try:
        venta = BusinessService._update(db, Venta, venta_id, {
            "sucursal_id": data.sucursal_id, "producto_id": data.producto_id,
            "cantidad": data.cantidad,
        })
        return venta
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{venta_id}")
def delete_venta(venta_id: int, db: Session = Depends(get_db),
                 current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="Solo administradores")
    try:
        BusinessService._delete(db, Venta, venta_id)
        return {"ok": True, "id": venta_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
