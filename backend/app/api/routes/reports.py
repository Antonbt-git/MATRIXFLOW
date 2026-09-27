from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, timezone
from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.models.business_models import Usuario, Empresa, Venta, AuditoriaEvento, MetaEmpresarial, MathOperationLog
from app.schemas.business_schemas import (
    ReporteMetasResponse, AuditoriaResponse, VentaResponse, MetaCreate, MetaResponse,
    CarnetResponse, CarnetActividadDia, CarnetUsuarioActivo, CarnetUbicacion,
)
from app.services.business_service import BusinessService
from app.services.geoip import ip_del_cliente, resolver_ubicacion

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


def _utc(ts) -> datetime | None:
    """Normaliza timestamps (Postgres con zona, SQLite sin ella) a UTC."""
    if ts is None:
        return None
    return ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)


@router.get("/carnet", response_model=CarnetResponse)
def carnet_auditoria(request: Request, db: Session = Depends(get_db),
                     current_user: Usuario = Depends(get_current_user)):
    """Carnet de auditoría (Historial): actividad de los últimos 7 días,
    usuarios más activos y ubicación desde la que se inició sesión."""
    if current_user.rol == "consulta":
        raise HTTPException(status_code=403, detail="Solo admin o analista")

    ahora = datetime.now(timezone.utc)
    desde = (ahora - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)

    # Últimos eventos y operaciones; el filtro de ventana se hace en Python
    # para que funcione igual en Postgres (con zona) y SQLite (sin ella).
    eventos = db.query(AuditoriaEvento).order_by(AuditoriaEvento.id.desc()).limit(2000).all()
    eventos = [e for e in eventos if (t := _utc(e.timestamp)) and t >= desde]
    ops = db.query(MathOperationLog).order_by(MathOperationLog.id.desc()).limit(2000).all()
    ops = [o for o in ops if (t := _utc(o.timestamp)) and t >= desde]

    dias = [(desde + timedelta(days=i)).date() for i in range(7)]
    actividad = {d: {"eventos": 0, "operaciones": 0, "logins": 0} for d in dias}
    for e in eventos:
        d = _utc(e.timestamp).date()
        if d in actividad:
            actividad[d]["eventos"] += 1
            if e.accion == "LOGIN" and e.estado == "OK":
                actividad[d]["logins"] += 1
    for o in ops:
        d = _utc(o.timestamp).date()
        if d in actividad:
            actividad[d]["operaciones"] += 1

    # Usuarios más activos (por eventos de auditoría en la ventana)
    conteo: dict = {}
    for e in eventos:
        if e.usuario_id:
            conteo[e.usuario_id] = conteo.get(e.usuario_id, 0) + 1
    ids = list(conteo.keys())
    usuarios = {u.id: u for u in db.query(Usuario).filter(Usuario.id.in_(ids)).all()} if ids else {}
    top = sorted(conteo.items(), key=lambda kv: kv[1], reverse=True)[:5]

    # Ubicación: la del último login registrado; si no, la de la IP actual
    ultimo = next((e for e in eventos
                   if e.usuario_id == current_user.id and e.accion == "LOGIN"
                   and e.estado == "OK" and e.departamento), None)
    if ultimo:
        ubicacion = CarnetUbicacion(departamento=ultimo.departamento, distrito=ultimo.distrito,
                                    direccion=ultimo.direccion, ip=ultimo.ip,
                                    fecha=_utc(ultimo.timestamp), fuente="registro de auditoría")
    else:
        geo = resolver_ubicacion(ip_del_cliente(request))
        ubicacion = CarnetUbicacion(departamento=geo.get("departamento"),
                                    distrito=geo.get("distrito"),
                                    direccion=geo.get("direccion"), ip=geo.get("ip"),
                                    fecha=None, fuente=geo.get("fuente"))

    empresa = db.get(Empresa, current_user.empresa_id) if current_user.empresa_id else None

    return CarnetResponse(
        usuario={"id": current_user.id, "username": current_user.username,
                 "rol": current_user.rol, "empresa": empresa.nombre if empresa else None},
        actividad_7_dias=[
            CarnetActividadDia(fecha=d.isoformat(), eventos=actividad[d]["eventos"],
                               operaciones=actividad[d]["operaciones"],
                               logins=actividad[d]["logins"]) for d in dias],
        usuarios_activos=[
            CarnetUsuarioActivo(usuario_id=uid,
                                username=usuarios[uid].username if uid in usuarios else f"usuario #{uid}",
                                rol=usuarios[uid].rol if uid in usuarios else None,
                                total=total) for uid, total in top],
        ubicacion=ubicacion,
        resumen={"eventos_7d": len(eventos), "operaciones_7d": len(ops),
                 "logins_7d": sum(1 for e in eventos
                                  if e.accion == "LOGIN" and e.estado == "OK"),
                 "usuarios_activos_7d": len(conteo),
                 "dias_con_actividad": sum(1 for d in dias
                                           if actividad[d]["eventos"] or actividad[d]["operaciones"])},
    )
