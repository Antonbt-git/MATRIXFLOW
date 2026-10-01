import client from './client';

/** Capa de servicios §8.1: TanStack Query / Axios (§12) sobre /api/v1. */
type Cfg = { signal?: AbortSignal };

const get = async <T,>(path: string, cfg?: Cfg): Promise<T> => (await client.get(path, cfg)).data;
const post = async <T,>(path: string, body?: unknown, cfg?: Cfg): Promise<T> =>
  (await client.post(path, body, cfg)).data;

export const api = {
  // Vectores / Matrices (RF-08, RF-09)
  listVectors: (cfg?: Cfg) => get<any[]>('/vectors/', cfg),
  createVector: (nombre: string, valores: number[], descripcion = '') =>
    post('/vectors/', { nombre, valores, descripcion }),
  listMatrices: (cfg?: Cfg) => get<any[]>('/matrices/', cfg),
  createMatriz: (nombre: string, valores: number[][], dimensiones: string) =>
    post('/matrices/', { nombre, valores, dimensiones }),
  // Operaciones (RF-10..12)
  opVectors: (op: string, payload: object) =>
    post<{ operacion: string; resultado: any }>(`/operations/vectors/${op}`, payload),
  opMatrices: (op: string, payload: object) =>
    post<{ operacion: string; resultado: any }>(`/operations/matrices/${op}`, payload),
  history: (cfg?: Cfg) => get<any[]>('/operations/history?limit=100', cfg),
  // Inventario (RF-06)
  inventory: (sucursal_id?: number, cfg?: Cfg) =>
    get<any[]>(`/inventory/${sucursal_id ? `?sucursal_id=${sucursal_id}` : ''}`, cfg),
  adjustInventory: (sucursal_id: number, producto_id: number, cantidad: number) =>
    post('/inventory/adjust', { sucursal_id, producto_id, cantidad }),
  // Empresa (RF-03, RF-04)
  listEmpresas: (cfg?: Cfg) => get<any[]>('/companies/', cfg),
  createEmpresa: (nombre: string, nit: string, sector: string) =>
    post('/companies/', { nombre, nit, sector }),
  updateEmpresa: (id: number, data: object) => client.put(`/companies/${id}`, data),
  deleteEmpresa: (id: number) => client.delete(`/companies/${id}`),
  listSucursales: (cfg?: Cfg) => get<any[]>('/branches/', cfg),
  createSucursal: (empresa_id: number, nombre: string, ciudad: string, codigo: string) =>
    post('/branches/', { empresa_id, nombre, ciudad, codigo }),
  updateSucursal: (id: number, data: object) => client.put(`/branches/${id}`, data),
  deleteSucursal: (id: number) => client.delete(`/branches/${id}`),
  listProductos: (cfg?: Cfg) => get<any[]>('/products/', cfg),
  createProducto: (nombre: string, categoria_id: number, precio_base: number, sku: string) =>
    post('/products/', { nombre, categoria_id, precio_base, sku }),
  updateProducto: (id: number, data: object) => client.put(`/products/${id}`, data),
  deleteProducto: (id: number) => client.delete(`/products/${id}`),
  // Ventas (RF-05)
  listVentas: (cfg?: Cfg) => get<any[]>('/sales/', cfg),
  registerVenta: (sucursal_id: number, producto_id: number, cantidad: number) =>
    post('/sales/register/', { sucursal_id, producto_id, cantidad, usuario_id: 0 }),
  updateVenta: (id: number, data: object) => client.put(`/sales/${id}`, data),
  deleteVenta: (id: number) => client.delete(`/sales/${id}`),
  // Inventario
  updateInventario: (id: number, data: object) => client.put(`/inventory/${id}`, data),
  deleteInventario: (id: number) => client.delete(`/inventory/${id}`),
  // Vectores / Matrices (update/delete)
  updateVector: (id: number, data: object) => client.put(`/vectors/${id}`, data),
  deleteVector: (id: number) => client.delete(`/vectors/${id}`),
  updateMatriz: (id: number, data: object) => client.put(`/matrices/${id}`, data),
  deleteMatriz: (id: number) => client.delete(`/matrices/${id}`),
  // Metas
  createMeta: (sucursal_id: number, valor_meta: number, periodo: string, producto_id?: number) =>
    post('/reports/metas/', { sucursal_id, valor_meta, periodo, producto_id }),
  updateMeta: (id: number, data: object) => client.put(`/reports/metas/${id}`, data),
  deleteMeta: (id: number) => client.delete(`/reports/metas/${id}`),
  reporteMetas: (sucursal_id: number, periodo: string, cfg?: Cfg) =>
    get<{ sucursal_id: number; periodo: string; ventas_reales: number[]; metas: number[]; desviacion: number[] }>(
      `/reports/metas/${sucursal_id}/${periodo}`, cfg),
  reporteIngresos: (sucursal_id: number, cfg?: Cfg) =>
    get<{ ingresos_totales: number; cantidades: number[]; precios: number[] }>(`/reports/ingresos/${sucursal_id}`, cfg),
  // Usuarios
  listUsers: (cfg?: Cfg) => get<any[]>('/users/', cfg),
  createUser: (username: string, password: string, rol: string, empresa_id: number) =>
    post('/users/', { username, password, rol, empresa_id }),
  updateUser: (id: number, data: object) => client.put(`/users/${id}`, data),
  deleteUser: (id: number) => client.delete(`/users/${id}`),
  audit: (cfg?: Cfg) => get<any[]>('/reports/auditoria?limit=100', cfg),
  // Carnet de auditoría (Historial): 7 días, usuarios activos, ubicación
  carnet: (cfg?: Cfg) => get<any>('/reports/carnet', cfg),
  ultimoLogin: (cfg?: Cfg) => get<any>('/reports/ultimo-login', cfg),
  // Biométrica: registro facial + verificación por DNI (extensión del plan)
  registerFace: (dni: string, descriptor: number[], usuario_id?: number) =>
    post<any>('/biometrics/register', { dni, descriptor, usuario_id }),
  verifyFace: (dni: string, descriptor: number[]) =>
    post<any>('/biometrics/verify', { dni, descriptor }),
  listFaceRecords: (cfg?: Cfg) => get<any[]>('/biometrics/records', cfg),
  deleteFaceRecord: (id: number) => client.delete(`/biometrics/records/${id}`),
  biometricLogs: (cfg?: Cfg) => get<any[]>('/biometrics/logs', cfg),
};
