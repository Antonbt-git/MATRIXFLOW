from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.connection import get_db
from app.schemas.business_schemas import InventarioResponse, InventarioAdjust, InventarioUpdate
from app.services.business_service import BusinessService
from app.core.dependencies import get_current_user
from app.models.business_models import Usuario, Inventario, InventoryMovement

router = APIRouter(prefix="/api/v1/inventory", tags=["Inventory"])


@router.get("/", response_model=List[InventarioResponse])
def list_inventory(sucursal_id: Optional[int] = None, db: Session = Depends(get_db),
                   current_user: Usuario = Depends(get_current_user)):
    return BusinessService.list_inventory(db, sucursal_id)


@router.post("/adjust", response_model=InventarioResponse)
def adjust_inventory(data: InventarioAdjust, db: Session = Depends(get_db),
                     current_user: Usuario = Depends(get_current_user)):
    if current_user.rol not in ("admin", "analista"):
        raise HTTPException(status_code=403, detail="Solo admin/analista")
    return BusinessService.adjust_inventory(db, data.sucursal_id, data.producto_id,
                                            data.cantidad, data.stock_minimo)


@router.put("/{inv_id}", response_model=InventarioResponse)
def update_inventory(inv_id: int, data: InventarioUpdate, db: Session = Depends(get_db),
                     current_user: Usuario = Depends(get_current_user)):
    if current_user.rol not in ("admin", "analista"):
        raise HTTPException(status_code=403, detail="Solo admin/analista")
    try:
        inv = BusinessService._update(db, Inventario, inv_id, data.model_dump())
        db.add(InventoryMovement(inventario_id=inv.id, tipo="AJUSTE",
                                 cantidad=data.stock_actual or 0.0, detalle="Edición manual"))
        db.commit()
        return inv
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{inv_id}")
def delete_inventory(inv_id: int, db: Session = Depends(get_db),
                     current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    try:
        BusinessService._delete(db, Inventario, inv_id)
        return {"ok": True, "id": inv_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
