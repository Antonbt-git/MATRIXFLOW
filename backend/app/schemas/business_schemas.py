from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# --- RF-02: Usuarios y Roles ---
class UsuarioBase(BaseModel):
    username: str
    rol: str # 'admin', 'analista', 'consulta'
    empresa_id: int

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioResponse(UsuarioBase):
    id: int
    class Config:
        from_attributes = True

# --- RF-03: Empresas y Sucursales ---
class EmpresaBase(BaseModel):
    nombre: str
    nit: str
    sector: str

class EmpresaCreate(EmpresaBase):
    pass

class EmpresaResponse(EmpresaBase):
    id: int
    class Config:
        from_attributes = True

class SucursalBase(BaseModel):
    empresa_id: int
    nombre: str
    ciudad: str
    codigo_sucursal: str = Field(alias="codigo", default=None)

    class Config:
        from_attributes = True
        populate_by_name = True


class SucursalCreate(BaseModel):
    empresa_id: int
    nombre: str
    ciudad: str
    codigo: str


class SucursalResponse(BaseModel):
    id: int
    empresa_id: int
    nombre: str
    ciudad: Optional[str] = None
    codigo_sucursal: Optional[str] = None

    class Config:
        from_attributes = True

# --- RF-04: Productos y Categorías ---
class CategoriaBase(BaseModel):
    nombre: str

class CategoriaCreate(CategoriaBase):
    pass

class CategoriaResponse(CategoriaBase):
    id: int
    class Config:
        from_attributes = True

class ProductoBase(BaseModel):
    nombre: str
    categoria_id: int
    precio_base: float
    sku: str

class ProductoCreate(ProductoBase):
    pass

class ProductoResponse(ProductoBase):
    id: int
    class Config:
        from_attributes = True

# --- RF-05: Ventas ---
class VentaCreate(BaseModel):
    sucursal_id: int
    producto_id: int
    cantidad: float
    usuario_id: int

class VentaResponse(BaseModel):
    id: int
    sucursal_id: int
    producto_id: int
    cantidad: float
    monto_total: float
    fecha: datetime
    class Config:
        from_attributes = True

# --- RF-07: Metas ---
class MetaCreate(BaseModel):
    sucursal_id: int
    producto_id: Optional[int] = None
    valor_meta: float
    periodo: str

class MetaResponse(BaseModel):
    id: int
    valor_meta: float
    periodo: str
    class Config:
        from_attributes = True

# --- RF-08, 09: Vectores y Matrices ---
class VectorCreate(BaseModel):
    nombre: str
    valores: List[float]
    descripcion: Optional[str] = None


class VectorResponse(BaseModel):
    id: int
    nombre_vector: str
    valores: List[float]
    descripcion: Optional[str] = None

    class Config:
        from_attributes = True


class MatrizCreate(BaseModel):
    nombre: str
    valores: List[List[float]]
    dimensiones: str


class MatrizResponse(BaseModel):
    id: int
    nombre_matriz: str
    valores: List[List[float]]
    dimensiones: str

    class Config:
        from_attributes = True


# --- RF-10/11/12: Operaciones ---
class OperationVectorRequest(BaseModel):
    v1: List[float]
    v2: Optional[List[float]] = None
    scalar: Optional[float] = None
    vectors: Optional[List[List[float]]] = None
    weights: Optional[List[float]] = None


class OperationMatrixRequest(BaseModel):
    m1: List[List[float]]
    m2: Optional[List[List[float]]] = None
    scalar: Optional[float] = None


class OperationResultResponse(BaseModel):
    operacion: str
    resultado: object


class OperationLogResponse(BaseModel):
    id: int
    operacion: str
    entrada_a: Optional[object] = None
    entrada_b: Optional[object] = None
    resultado: Optional[object] = None
    estado: Optional[str] = "OK"
    usuario_id: Optional[int] = None

    class Config:
        from_attributes = True


# --- RF-06: Inventario ---
class InventarioResponse(BaseModel):
    id: int
    sucursal_id: int
    producto_id: int
    stock_actual: float
    stock_minimo: float

    class Config:
        from_attributes = True


class InventarioAdjust(BaseModel):
    sucursal_id: int
    producto_id: int
    cantidad: float
    stock_minimo: Optional[float] = None


# --- RF-13/15: Auditoría ---
class AuditoriaResponse(BaseModel):
    id: int
    usuario_id: Optional[int] = None
    accion: str
    modulo: str
    detalle: Optional[str] = None
    ip: Optional[str] = None
    estado: Optional[str] = "OK"
    resultado: Optional[str] = None

    class Config:
        from_attributes = True

# --- RF-14: Reportes ---
class ReporteMetasResponse(BaseModel):
    sucursal_id: int
    periodo: str
    ventas_reales: List[float]
    metas: List[float]
    desviacion: List[float]


# --- CRUD: schemas de actualización (todos los campos opcionales) ---
class EmpresaUpdate(BaseModel):
    nombre: Optional[str] = None
    nit: Optional[str] = None
    sector: Optional[str] = None


class SucursalUpdate(BaseModel):
    empresa_id: Optional[int] = None
    nombre: Optional[str] = None
    ciudad: Optional[str] = None
    codigo: Optional[str] = None


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    categoria_id: Optional[int] = None
    precio_base: Optional[float] = None
    sku: Optional[str] = None


class VectorUpdate(BaseModel):
    nombre: Optional[str] = None
    valores: Optional[List[float]] = None
    descripcion: Optional[str] = None


class MatrizUpdate(BaseModel):
    nombre: Optional[str] = None
    valores: Optional[List[List[float]]] = None
    dimensiones: Optional[str] = None


class UsuarioUpdate(BaseModel):
    rol: Optional[str] = None
    empresa_id: Optional[int] = None


class InventarioUpdate(BaseModel):
    stock_actual: Optional[float] = None
    stock_minimo: Optional[float] = None
