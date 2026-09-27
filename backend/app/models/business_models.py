from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.connection import Base

# RF-02: Gestión de Usuarios y Roles
class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    rol = Column(String) # 'admin', 'analista', 'consulta'
    empresa_id = Column(Integer, ForeignKey("empresas.id"))

# RF-03: Gestión de Empresas y Sucursales
class Empresa(Base):
    __tablename__ = "empresas"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    nit = Column(String, unique=True, index=True)
    sector = Column(String)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

class Sucursal(Base):
    __tablename__ = "sucursales"
    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"))
    nombre = Column(String, nullable=False)
    ciudad = Column(String)
    codigo_sucursal = Column(String, unique=True)

# RF-04: Gestión de Productos y Categorías
class Categoria(Base):
    __tablename__ = "categorias"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)

class Producto(Base):
    __tablename__ = "productos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias.id"))
    precio_base = Column(Float, default=0.0)
    sku = Column(String, unique=True)

# RF-05 y RF-06: Ventas e Inventario
class Inventario(Base):
    __tablename__ = "inventario"
    id = Column(Integer, primary_key=True, index=True)
    sucursal_id = Column(Integer, ForeignKey("sucursales.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    stock_actual = Column(Float, default=0.0)
    stock_minimo = Column(Float, default=0.0)
    ultima_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())

class Venta(Base):
    __tablename__ = "ventas"
    id = Column(Integer, primary_key=True, index=True)
    sucursal_id = Column(Integer, ForeignKey("sucursales.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Float, nullable=False)
    monto_total = Column(Float)
    fecha = Column(DateTime(timezone=True), server_default=func.now())

# RF-07: Registro de Metas
class MetaEmpresarial(Base):
    __tablename__ = "metas_empresariales"
    id = Column(Integer, primary_key=True, index=True)
    sucursal_id = Column(Integer, ForeignKey("sucursales.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=True)
    valor_meta = Column(Float, nullable=False)
    periodo = Column(String) # e.g., "2026-09"
    fecha_limite = Column(DateTime)

# RF-08 y RF-09: Vectores y Matrices
class VectorDato(Base):
    __tablename__ = "vectores_datos"
    id = Column(Integer, primary_key=True, index=True)
    nombre_vector = Column(String)
    valores = Column(JSON, nullable=False)
    descripcion = Column(String)

class MatrizDato(Base):
    __tablename__ = "matrices_datos"
    id = Column(Integer, primary_key=True, index=True)
    nombre_matriz = Column(String)
    valores = Column(JSON, nullable=False)
    dimensiones = Column(String)

# RF-13 y RF-15: Historial y Auditoría
class MathOperationLog(Base):
    __tablename__ = "math_operation_logs"
    id = Column(Integer, primary_key=True, index=True)
    operacion = Column(String)
    entrada_a = Column(JSON)
    entrada_b = Column(JSON)
    resultado = Column(JSON)
    estado = Column(String, default="OK")  # §13: estado de la operación
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class AuditoriaEvento(Base):
    __tablename__ = "auditoria_eventos"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    accion = Column(String) # e.g., "LOGIN", "UPDATE_INVENTORY"
    modulo = Column(String)
    detalle = Column(String)
    ip = Column(String)      # §13: IP cuando corresponda
    estado = Column(String, default="OK")  # §13: estado
    resultado = Column(String)  # §13: resultado
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


# ============================================================================
# §10 – FASE 3: tablas adicionales del modelo de datos del Plan Maestro
# users→usuarios, roles, companies→empresas, branches→sucursales,
# categories→categorias, products→productos, sales→ventas, sale_details,
# inventory→inventario, inventory_movements, targets→metas_empresariales,
# vectors→vectores_datos, vector_values, matrices→matrices_datos,
# matrix_values, operations→math_operation_logs, operation_inputs,
# operation_results, audit_logs→auditoria_eventos
# ============================================================================

class Rol(Base):
    """Tabla roles (§10): permisos por rol, además de la columna usuarios.rol."""
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, nullable=False)  # admin | analista | consulta
    permisos = Column(JSON)  # lista de permisos RBAC (§13)

class SaleDetail(Base):
    """sale_details (§10): detalle de productos vendidos de cada venta."""
    __tablename__ = "sale_details"
    id = Column(Integer, primary_key=True, index=True)
    venta_id = Column(Integer, ForeignKey("ventas.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Float, nullable=False)
    precio_unitario = Column(Float, default=0.0)
    subtotal = Column(Float, default=0.0)

class InventoryMovement(Base):
    """inventory_movements (§10): movimientos de existencias."""
    __tablename__ = "inventory_movements"
    id = Column(Integer, primary_key=True, index=True)
    inventario_id = Column(Integer, ForeignKey("inventario.id"))
    tipo = Column(String)  # ENTRADA | SALIDA | AJUSTE
    cantidad = Column(Float, nullable=False)
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    detalle = Column(String)

class VectorValue(Base):
    """vector_values (§10): valores normalizados de cada vector."""
    __tablename__ = "vector_values"
    id = Column(Integer, primary_key=True, index=True)
    vector_id = Column(Integer, ForeignKey("vectores_datos.id"))
    posicion = Column(Integer, nullable=False)
    valor = Column(Float, nullable=False)

class MatrixValue(Base):
    """matrix_values (§10): valores matriciales por celda."""
    __tablename__ = "matrix_values"
    id = Column(Integer, primary_key=True, index=True)
    matriz_id = Column(Integer, ForeignKey("matrices_datos.id"))
    fila = Column(Integer, nullable=False)
    columna = Column(Integer, nullable=False)
    valor = Column(Float, nullable=False)

class OperationInput(Base):
    """operation_inputs (§10): entradas normalizadas de cada operación."""
    __tablename__ = "operation_inputs"
    id = Column(Integer, primary_key=True, index=True)
    operacion_id = Column(Integer, ForeignKey("math_operation_logs.id"))
    nombre = Column(String)  # v1 | v2 | m1 | m2 | scalar | ...
    valor = Column(JSON)

class OperationResult(Base):
    """operation_results (§10): resultados de cada operación."""
    __tablename__ = "operation_results"
    id = Column(Integer, primary_key=True, index=True)
    operacion_id = Column(Integer, ForeignKey("math_operation_logs.id"))
    valor = Column(JSON)
    formato = Column(String, default="json")
