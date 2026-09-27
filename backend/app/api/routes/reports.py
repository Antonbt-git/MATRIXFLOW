from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.models.business_models import Usuario, Venta, AuditoriaEvento, MetaEmpresarial
from app.schemas.business_schemas import ReporteMetasResponse, AuditoriaResponse, VentaResponse, MetaCreate, MetaResponse
from app.services.business_service import BusinessService

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


@router.post("/metas/")
def create_meta(data: MetaCreate, db: Session = Depends(get_db),
                current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden definir metas")
    return BusinessService.set_meta(db, data.sucursal_id, data.producto_id, data.valor_meta, data.periodo)


@router.put("/metas/{meta_id}", response_model=MetaResponse)
def update_meta(meta_id: int, data: MetaCreate, db: Session = Depends(get_db),
                current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    try:
        return BusinessService._update(db, MetaEmpresarial, meta_id, data.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/metas/{meta_id}")
def delete_meta(meta_id: int, db: Session = Depends(get_db),
                current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    try:
        BusinessService._delete(db, MetaEmpresarial, meta_id)
        return {"ok": True, "id": meta_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/ingresos/{sucursal_id}")
def reporte_ingresos(sucursal_id: int, db: Session = Depends(get_db),
                     current_user: Usuario = Depends(get_current_user)):
    """Ingresos = cantidades · precios (dot_product). Reemplaza al legacy /math/ingresos."""
    return BusinessService.calcular_ingresos_totales(db, sucursal_id)


@router.get("/metas/{sucursal_id}/{periodo}", response_model=ReporteMetasResponse)
def reporte_metas(sucursal_id: int, periodo: str, db: Session = Depends(get_db),
                  current_user: Usuario = Depends(get_current_user)):
    if current_user.rol not in ("admin", "analista", "consulta"):
        raise HTTPException(status_code=403, detail="Sin permiso")
    r = BusinessService.generar_reporte_metas(db, sucursal_id, periodo)
    return {"sucursal_id": sucursal_id, "periodo": periodo, **r}


@router.get("/ventas", response_model=List[VentaResponse])
def reporte_ventas(sucursal_id: int | None = None, db: Session = Depends(get_db),
                   current_user: Usuario = Depends(get_current_user)):
    q = db.query(Venta)
    if sucursal_id is not None:
        q = q.filter(Venta.sucursal_id == sucursal_id)
    return q.order_by(Venta.id.desc()).limit(200).all()


@router.get("/auditoria", response_model=List[AuditoriaResponse])
def reporte_auditoria(limit: int = 100, db: Session = Depends(get_db),
                      current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo admin")
    return db.query(AuditoriaEvento).order_by(AuditoriaEvento.id.desc()).limit(limit).all()
