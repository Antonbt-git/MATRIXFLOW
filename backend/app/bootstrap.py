"""Seed idempotente para producción (Render/Supabase).

Crea los datos mínimos necesarios para que la aplicación arranque operativa:
roles RBAC (§13), una empresa demo, sucursales, categorías, productos,
inventario inicial y el usuario administrador.

- Seguro de ejecutar en cada arranque: si los datos ya existen, no hace nada.
- La contraseña del admin viene de la variable de entorno ADMIN_PASSWORD
  (por defecto solo para desarrollo local: admin123).
"""
import os

from app.database.connection import SessionLocal, engine, Base
from app.models import business_models as M
from app.core.security import SecurityHandler


def run_seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Roles base (§10 tabla roles) — permisos RBAC §13
        for nombre, permisos in [
            ("admin", ["*"]),
            ("analista", ["ventas", "inventario", "matrices", "vectores", "operaciones", "reportes"]),
            ("consulta", ["dashboard", "reportes"]),
        ]:
            if not db.query(M.Rol).filter(M.Rol.nombre == nombre).first():
                db.add(M.Rol(nombre=nombre, permisos=permisos))
        db.commit()

        if db.query(M.Empresa).first():
            print("Seed: los datos ya existen, nada que hacer.")
            return

        emp = M.Empresa(nombre="MatrixFlow Demo", nit="123456789", sector="Tecnología")
        db.add(emp)
        db.commit()
        db.refresh(emp)

        for i, ciudad in enumerate(["Lima", "Arequipa", "Trujillo"], start=1):
            db.add(M.Sucursal(empresa_id=emp.id, nombre=f"Sucursal {ciudad}",
                              ciudad=ciudad, codigo_sucursal=f"SUC-00{i}"))
        cat = M.Categoria(nombre="Cómputo")
        db.add(cat)
        db.commit()
        db.refresh(cat)
        for nombre, precio, sku in [("Laptop", 2500, "LAP-001"),
                                    ("Monitor", 800, "MON-001"),
                                    ("Teclado", 120, "TEC-001")]:
            db.add(M.Producto(nombre=nombre, categoria_id=cat.id,
                              precio_base=precio, sku=sku))
        db.commit()

        admin_user = os.getenv("ADMIN_USERNAME", "admin")
        admin_pass = os.getenv("ADMIN_PASSWORD", "admin123")
        db.add(M.Usuario(username=admin_user,
                         password_hash=SecurityHandler.get_password_hash(admin_pass),
                         rol="admin", empresa_id=emp.id))
        db.commit()

        for s in db.query(M.Sucursal).all():
            for p in db.query(M.Producto).all():
                db.add(M.Inventario(sucursal_id=s.id, producto_id=p.id,
                                    stock_actual=100, stock_minimo=10))
        db.commit()
        print(f"Seed OK: usuario '{admin_user}' creado.")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
