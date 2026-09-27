"""Seed idempotente para producción (Render/Supabase).

Crea los datos mínimos para que la aplicación arranque operativa: roles RBAC
(§13), empresa demo, sucursales, categoría, productos, inventario y usuario
administrador. Cada entidad se comprueba por separado, de modo que también
repara un seed a medias (p. ej. si se interrumpió creando el admin).

- Seguro de ejecutar en cada arranque: lo que ya existe no se toca.
- Credenciales del admin: env vars ADMIN_USERNAME / ADMIN_PASSWORD
  (por defecto solo para desarrollo local: admin / admin123).
"""
import os

from app.database.connection import SessionLocal, engine, Base
from app.models import business_models as M
from app.core.security import SecurityHandler

ROLES = [
    ("admin", ["*"]),
    ("analista", ["ventas", "inventario", "matrices", "vectores", "operaciones", "reportes"]),
    ("consulta", ["dashboard", "reportes"]),
]


def run_seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1) Roles RBAC (§13)
        for nombre, permisos in ROLES:
            if not db.query(M.Rol).filter(M.Rol.nombre == nombre).first():
                db.add(M.Rol(nombre=nombre, permisos=permisos))
        db.commit()

        # 2) Empresa demo
        emp = db.query(M.Empresa).first()
        if not emp:
            emp = M.Empresa(nombre="MatrixFlow Demo", nit="123456789", sector="Tecnología")
            db.add(emp)
            db.commit()
            db.refresh(emp)

        # 3) Sucursales
        if not db.query(M.Sucursal).filter(M.Sucursal.empresa_id == emp.id).count():
            for i, ciudad in enumerate(["Lima", "Arequipa", "Trujillo"], start=1):
                db.add(M.Sucursal(empresa_id=emp.id, nombre=f"Sucursal {ciudad}",
                                  ciudad=ciudad, codigo_sucursal=f"SUC-00{i}"))
            db.commit()

        # 4) Categoría y productos
        cat = db.query(M.Categoria).first()
        if not cat:
            cat = M.Categoria(nombre="Cómputo")
            db.add(cat)
            db.commit()
            db.refresh(cat)
        if not db.query(M.Producto).count():
            for nombre, precio, sku in [("Laptop", 2500, "LAP-001"),
                                        ("Monitor", 800, "MON-001"),
                                        ("Teclado", 120, "TEC-001")]:
                db.add(M.Producto(nombre=nombre, categoria_id=cat.id,
                                  precio_base=precio, sku=sku))
            db.commit()

        # 5) Usuario administrador
        admin_user = os.getenv("ADMIN_USERNAME", "admin")
        if not db.query(M.Usuario).filter(M.Usuario.username == admin_user).first():
            admin_pass = os.getenv("ADMIN_PASSWORD", "admin123")
            db.add(M.Usuario(username=admin_user,
                             password_hash=SecurityHandler.get_password_hash(admin_pass),
                             rol="admin", empresa_id=emp.id))
            db.commit()
            print(f"Seed: usuario admin '{admin_user}' creado.")

        # 6) Inventario inicial (solo para pares sucursal/producto sin fila)
        for s in db.query(M.Sucursal).all():
            for p in db.query(M.Producto).all():
                existe = db.query(M.Inventario).filter(
                    M.Inventario.sucursal_id == s.id,
                    M.Inventario.producto_id == p.id,
                ).first()
                if not existe:
                    db.add(M.Inventario(sucursal_id=s.id, producto_id=p.id,
                                        stock_actual=100, stock_minimo=10))
        db.commit()

        usuarios = db.query(M.Usuario).count()
        print(f"Seed OK: {usuarios} usuario(s), empresa '{emp.nombre}'.")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
