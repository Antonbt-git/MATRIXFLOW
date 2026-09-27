# 🚀 MatrixFlow Enterprise
**Sistema Web Empresarial de Análisis de Ventas, Inventario e Indicadores mediante Álgebra Lineal**

MatrixFlow Enterprise es una solución de Business Intelligence (BI) que transforma datos operativos de ventas e inventarios en estructuras matemáticas (vectores y matrices) para ejecutar análisis avanzados mediante álgebra lineal.

## 📑 Alineación con el Plan Maestro de Desarrollo

Este proyecto implementa la totalidad de los requerimientos funcionales y técnicos definidos en el documento técnico:

### ✅ Requerimientos Funcionales Implementados
- **Gestión Administrativa**: Gestión de usuarios, roles, empresas, sucursales y categorías de productos.
- **Operaciones Comerciales**: Registro de ventas con validación de stock en tiempo real (Inventario).
- **Planificación**: Registro y seguimiento de metas empresariales por periodo.
- **Core Matemático**:
    - **Operaciones Vectoriales**: Sumas, restas y producto punto para cálculo de ingresos.
    - **Operaciones Matriciales**: Multiplicación y transposición para transformación de indicadores.
    - **Combinaciones Lineales**: Generación de indicadores ponderados.
- **Auditoría y Control**: Registro detallado de cada operación matemática y evento del sistema,
  con IP y ubicación del inicio de sesión (departamento, distrito y dirección) y un
  **Carnet de Auditoría** en Historial: actividad de los últimos 7 días, usuarios más
  activos y lugar desde el que te conectas.
- **Verificación Biométrica**: Registro facial de los usuarios (descriptor de 128
  dimensiones + DNI) e identificación por DNI + rostro que muestra sus datos y su
  actividad en la página (operaciones, ventas, sesiones y auditoría).

---

## 🛠️ Stack Tecnológico

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Recharts.
- **Backend**: Python + FastAPI.
- **Cálculo Científico**: NumPy (Motor de Álgebra Lineal).
- **Base de Datos**: Supabase (PostgreSQL).

---

## 📐 Lógica Matemática Aplicada

El sistema no solo almacena datos, sino que los procesa matemáticamente:

1. **Ingresos Totales**: Se calcula mediante el **Producto Punto** entre el vector de cantidades vendidas $\mathbf{q}$ y el vector de precios $\mathbf{p}$:
   $$\text{Ingresos} = \mathbf{q} \cdot \mathbf{p} = \sum_{i=1}^{n} q_i p_i$$

2. **Análisis de Metas**: Se utiliza la **Resta de Vectores** para hallar la desviación entre ventas reales $\mathbf{v}$ y metas $\mathbf{m}$:
   $$\text{Desviación} = \mathbf{v} - \mathbf{m}$$

3. **Indicadores Ponderados**: Se implementan **Combinaciones Lineales** para crear índices de rentabilidad personalizados.

4. **Identificación Facial**: El rostro se compara por **Distancia Euclidiana** entre
   descriptores de 128 dimensiones (umbral 0.6) y **Similitud Coseno**:
   $$d(\mathbf{a}, \mathbf{b}) = \lVert \mathbf{a} - \mathbf{b} \rVert_2 \le \tau$$

---

## 🚀 Guía de Instalación y Despliegue

> 📄 **Guía completa de despliegue en la nube:** [`docs/DEPLOY.md`](docs/DEPLOY.md)
> (Supabase → PostgreSQL, Render → API, Vercel → SPA, con checklist y troubleshooting).

### Desarrollo local
1. **Backend**: `cd backend && pip install -r requirements.txt && PYTHONPATH=. uvicorn app.main:app --reload`
   (usa SQLite `backend/matrixflow_local.db` si no defines `DATABASE_URL`).
2. **Datos**: `python database/seed.py` → admin `admin` / `admin123`.
3. **Frontend**: `cd frontend && npm install && npm run dev` → http://localhost:5173.
4. **Tests**: `cd backend && python -m pytest tests/ -q` (36 pruebas).

### Producción (resumen)
1. **Supabase** → copia la *Session pooler* (puerto `6543`, `?sslmode=require`).
2. **Render** → New → Blueprint → usa el [`render.yaml`](render.yaml) de la raíz
   (`start.sh` = `alembic upgrade head` → `app.bootstrap` → `uvicorn`). Env vars:
   `DATABASE_URL`, `ALLOWED_ORIGINS`, `ADMIN_PASSWORD`.
3. **Vercel** → Root Directory `frontend`, usa [`frontend/vercel.json`](frontend/vercel.json),
   env var `VITE_API_URL=https://TU_API.onrender.com`.
4. Pon el dominio de Vercel en `ALLOWED_ORIGINS` de Render para el CORS (§13).

---

## 📈 Módulos del Dashboard
- **Resumen Ejecutivo**: StatCards con ingresos totales y estado del sistema.
- **Trazabilidad Matemática**: Panel técnico que muestra los vectores exactos utilizados en cada cálculo.
- **Gráficos de Rendimiento**: Visualización de datos transformados mediante matrices.
