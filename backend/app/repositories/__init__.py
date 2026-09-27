"""Capa repositories (Fase 2): queries aisladas del servicio."""
from sqlalchemy.orm import Session
from app.models import business_models as M


class BusinessRepository:
    @staticmethod
    def list_empresas(db: Session):
        return db.query(M.Empresa).all()

    @staticmethod
    def list_sucursales(db: Session, empresa_id: int | None = None):
        q = db.query(M.Sucursal)
        if empresa_id is not None:
            q = q.filter(M.Sucursal.empresa_id == empresa_id)
        return q.all()

    @staticmethod
    def list_productos(db: Session):
        return db.query(M.Producto).all()

    @staticmethod
    def list_ventas(db: Session, sucursal_id: int | None = None):
        q = db.query(M.Venta)
        if sucursal_id is not None:
            q = q.filter(M.Venta.sucursal_id == sucursal_id)
        return q.order_by(M.Venta.id.desc()).limit(200).all()
