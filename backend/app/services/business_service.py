from sqlalchemy.orm import Session
import numpy as np
from app.database.connection import Base
from app.models.business_models import (
    Empresa, Sucursal, Producto, Venta, VectorDato,
    MatrizDato, MathOperationLog, Usuario, Categoria,
    Inventario, MetaEmpresarial, AuditoriaEvento,
    Rol, SaleDetail, InventoryMovement, VectorValue,
    MatrixValue, OperationInput, OperationResult
)
from app.services.math_engine import MathEngine

class BusinessService:
    """Servicio de lógica de negocio completa para MatrixFlow Enterprise"""

    # --- RF-02: Usuarios y Roles ---
    @staticmethod
    def create_usuario(db: Session, username: str, password_hash: str, rol: str, empresa_id: int):
        usuario = Usuario(username=username, password_hash=password_hash, rol=rol, empresa_id=empresa_id)
        db.add(usuario)
        db.commit()
        db.refresh(usuario)
        return usuario

    # --- RF-03: Empresas y Sucursales ---
    @staticmethod
    def create_empresa(db: Session, nombre: str, nit: str, sector: str):
        empresa = Empresa(nombre=nombre, nit=nit, sector=sector)
        db.add(empresa)
        db.commit()
        db.refresh(empresa)
        return empresa

    @staticmethod
    def create_sucursal(db: Session, empresa_id: int, nombre: str, ciudad: str, codigo: str):
        sucursal = Sucursal(empresa_id=empresa_id, nombre=nombre, ciudad=ciudad, codigo_sucursal=codigo)
        db.add(sucursal)
        db.commit()
        db.refresh(sucursal)
        return sucursal

    # --- RF-04: Productos y Categorías ---
    @staticmethod
    def create_categoria(db: Session, nombre: str):
        cat = Categoria(nombre=nombre)
        db.add(cat)
        db.commit()
        db.refresh(cat)
        return cat

    @staticmethod
    def create_producto(db: Session, nombre: str, categoria_id: int, precio: float, sku: str):
        producto = Producto(nombre=nombre, categoria_id=categoria_id, precio_base=precio, sku=sku)
        db.add(producto)
        db.commit()
        db.refresh(producto)
        return producto

    # --- RF-05 & RF-06: Ventas e Inventario ---
    @staticmethod
    def register_venta(db: Session, sucursal_id: int, producto_id: int, cantidad: float, usuario_id: int):
        producto = db.query(Producto).filter(Producto.id == producto_id).first()
        if not producto: raise ValueError("Producto no encontrado")

        # Validar Inventario (RF-06)
        inv = db.query(Inventario).filter(
            Inventario.sucursal_id == sucursal_id,
            Inventario.producto_id == producto_id
        ).first()

        if not inv or inv.stock_actual < cantidad:
            raise ValueError("Stock insuficiente en la sucursal")

        monto = cantidad * producto.precio_base
        venta = Venta(sucursal_id=sucursal_id, producto_id=producto_id, cantidad=cantidad, monto_total=monto)

        # Actualizar Inventario
        inv.stock_actual -= cantidad

        db.add(venta)
        db.flush()  # obtenemos venta.id para el detalle

        # sale_details (§10): detalle del producto vendido
        db.add(SaleDetail(venta_id=venta.id, producto_id=producto_id, cantidad=cantidad,
                          precio_unitario=producto.precio_base, subtotal=monto))
        # inventory_movements (§10): salida de stock
        db.add(InventoryMovement(inventario_id=inv.id, tipo="SALIDA", cantidad=cantidad,
                                 detalle=f"Venta #{venta.id}"))
        db.add(AuditoriaEvento(usuario_id=usuario_id, accion="VENTA", modulo="VENTAS",
                               detalle=f"Venta de {cantidad} {producto.nombre}",
                               estado="OK", resultado=f"Monto {monto}"))
        db.commit()
        db.refresh(venta)
        return venta

    # --- RF-07: Metas ---
    @staticmethod
    def set_meta(db: Session, sucursal_id: int, producto_id: int, valor: float, periodo: str):
        meta = MetaEmpresarial(sucursal_id=sucursal_id, producto_id=producto_id, valor_meta=valor, periodo=periodo)
        db.add(meta)
        db.commit()
        db.refresh(meta)
        return meta

    # --- RF-08, 09, 10, 11, 12: Álgebra Lineal ---
    # Helpers genéricos de actualización/eliminación (CRUD)
    @staticmethod
    def _update(db: Session, model, obj_id: int, data: dict):
        obj = db.get(model, obj_id)
        if not obj:
            raise ValueError(f"{model.__name__} no encontrado (id {obj_id})")
        for k, v in data.items():
            if v is not None:
                setattr(obj, k, v)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def _delete(db: Session, model, obj_id: int):
        obj = db.get(model, obj_id)
        if not obj:
            raise ValueError(f"{model.__name__} no encontrado (id {obj_id})")
        try:
            db.delete(obj)
            db.commit()
            return True
        except Exception:
            db.rollback()
            raise ValueError("No se puede eliminar: registros relacionados existen")

    @staticmethod
    def create_vector(db: Session, nombre: str, valores: list, descripcion: str = ""):
        v = VectorDato(nombre_vector=nombre, valores=valores, descripcion=descripcion)
        db.add(v)
        db.flush()
        # vector_values (§10): cada valor en su propia fila
        for i, val in enumerate(valores):
            db.add(VectorValue(vector_id=v.id, posicion=i, valor=float(val)))
        db.commit()
        db.refresh(v)
        return v

    @staticmethod
    def create_matriz(db: Session, nombre: str, valores: list, dimensiones: str = ""):
        m = MatrizDato(nombre_matriz=nombre, valores=valores, dimensiones=dimensiones)
        db.add(m)
        db.flush()
        # matrix_values (§10): cada celda en su propia fila
        for fila, row in enumerate(valores):
            for col, val in enumerate(row):
                db.add(MatrixValue(matriz_id=m.id, fila=fila, columna=col, valor=float(val)))
        db.commit()
        db.refresh(m)
        return m

    @staticmethod
    def list_vectors(db: Session):
        return db.query(VectorDato).all()

    @staticmethod
    def list_matrices(db: Session):
        return db.query(MatrizDato).all()

    @staticmethod
    def adjust_inventory(db: Session, sucursal_id: int, producto_id: int, cantidad: float, stock_minimo=None):
        """Crea o ajusta stock (RF-06). Cantidad positiva suma, negativa resta."""
        inv = db.query(Inventario).filter(
            Inventario.sucursal_id == sucursal_id,
            Inventario.producto_id == producto_id
        ).first()
        if not inv:
            inv = Inventario(sucursal_id=sucursal_id, producto_id=producto_id,
                             stock_actual=cantidad, stock_minimo=stock_minimo or 0.0)
            db.add(inv)
            db.flush()
            tipo = "ENTRADA"
        else:
            inv.stock_actual = (inv.stock_actual or 0.0) + cantidad
            if stock_minimo is not None:
                inv.stock_minimo = stock_minimo
            tipo = "ENTRADA" if cantidad >= 0 else "SALIDA"
        # inventory_movements (§10)
        db.add(InventoryMovement(inventario_id=inv.id, tipo=tipo, cantidad=cantidad,
                                 detalle="Ajuste manual"))
        db.commit()
        db.refresh(inv)
        return inv

    @staticmethod
    def list_inventory(db: Session, sucursal_id: int | None = None):
        q = db.query(Inventario)
        if sucursal_id is not None:
            q = q.filter(Inventario.sucursal_id == sucursal_id)
        return q.all()

    @staticmethod
    def ejecutar_operacion_matricial(db: Session, m1_id: int, m2_id: int | None, op_type: str, usuario_id: int):
        m1 = db.query(MatrizDato).filter(MatrizDato.id == m1_id).first()
        if not m1:
            raise ValueError("Matriz 1 no encontrada")
        m2 = db.query(MatrizDato).filter(MatrizDato.id == m2_id).first() if m2_id else None

        val1 = np.array(m1.valores)
        val2 = np.array(m2.valores) if m2 else None

        if op_type == "multiply":
            if val2 is None:
                raise ValueError("multiply requiere m2_id")
            res = MathEngine.matrix_multiply(val1, val2)
        elif op_type == "sum":
            if val2 is None:
                raise ValueError("sum requiere m2_id")
            res = MathEngine.sum_vectors(val1, val2)
        elif op_type == "subtract":
            if val2 is None:
                raise ValueError("subtract requiere m2_id")
            res = MathEngine.subtract_vectors(val1, val2)
        elif op_type == "transpose":
            res = MathEngine.transpose_matrix(val1)
        else:
            raise ValueError("Operación no soportada (use: multiply|sum|subtract|transpose)")

        log = MathOperationLog(
            operacion=op_type,
            entrada_a=val1.tolist(),
            entrada_b=val2.tolist() if val2 is not None else None,
            resultado=res.tolist(),
            usuario_id=usuario_id
        )
        db.add(log)
        db.flush()
        # operation_inputs / operation_results (§10)
        db.add(OperationInput(operacion_id=log.id, nombre="m1", valor=val1.tolist()))
        if val2 is not None:
            db.add(OperationInput(operacion_id=log.id, nombre="m2", valor=val2.tolist()))
        db.add(OperationResult(operacion_id=log.id, valor=res.tolist(), formato="json"))
        db.commit()
        return res.tolist()

    # --- RF-10: Ingresos totales vía Producto Punto (usado por el Dashboard) ---
    @staticmethod
    def calcular_ingresos_totales(db: Session, sucursal_id: int):
        ventas = db.query(Venta).filter(Venta.sucursal_id == sucursal_id).all()

        if not ventas:
            return {"ingresos_totales": 0.0, "cantidades": [], "precios": []}

        cantidades = []
        precios = []
        for v in ventas:
            producto = db.query(Producto).filter(Producto.id == v.producto_id).first()
            cantidades.append(v.cantidad)
            precios.append(producto.precio_base if producto else 0.0)

        vec_cantidades = np.array(cantidades)
        vec_precios = np.array(precios)
        ingresos = MathEngine.dot_product(vec_cantidades, vec_precios)

        return {
            "ingresos_totales": ingresos,
            "cantidades": vec_cantidades.tolist(),
            "precios": vec_precios.tolist(),
        }

    # --- RF-14: Reportes ---
    @staticmethod
    def generar_reporte_metas(db: Session, sucursal_id: int, periodo: str):
        """Calcula la diferencia Ventas vs Metas usando Álgebra Lineal"""
        ventas = db.query(Venta).filter(Venta.sucursal_id == sucursal_id).all()
        metas = db.query(MetaEmpresarial).filter(MetaEmpresarial.sucursal_id == sucursal_id, MetaEmpresarial.periodo == periodo).all()

        # Vector de ventas reales
        v_ventas = np.array([v.monto_total for v in ventas])
        # Vector de metas
        v_metas = np.array([m.valor_meta for m in metas])

        # Asegurar misma dimensión para la resta (RF-10)
        min_len = min(len(v_ventas), len(v_metas))
        diff = MathEngine.subtract_vectors(v_ventas[:min_len], v_metas[:min_len])

        return {
            "ventas_reales": v_ventas[:min_len].tolist(),
            "metas": v_metas[:min_len].tolist(),
            "desviacion": diff.tolist()
        }
