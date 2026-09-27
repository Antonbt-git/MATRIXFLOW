# MatrixFlow Enterprise — Docs (Fase 8)

## Arquitectura
React+TS → FastAPI → NumPy → PostgreSQL. Ver Plan Maestro v1.0.

## Endpoints principales
- POST /auth/login (OAuth2 form) → JWT
- GET /auth/me
- CRUD: /business/empresas|surcursales|productos, /vectors/, /matrices/, /inventory/, /sales/
- Operaciones: POST /operations/vectors/{sum|subtract|dot|scalar|linear_combination|distance}
- POST /operations/matrices/{add|subtract|multiply|transpose|scalar}
- GET /operations/history (CA-08)
- GET /reports/metas/{sucursal}/{periodo}, /reports/ventas, /reports/auditoria

## Matemática empresarial
- Ingresos = cantidades · precios (dot_product)
- Desviación = ventas_reales − metas (subtract_vectors)
- Indicador ponderado = linear_combination

## Criterios de aceptación
CA-01 login por rol, CA-04/05 vectores/matrices, CA-06 dimensiones rechazadas (400),
CA-07 resultados NumPy, CA-08 historial, CA-09 visualización, CA-10 reportes persistidos.

## Puesta en marcha
Backend: `pip install -r requirements.txt && uvicorn app.main:app`
Migraciones (§10): `alembic upgrade head` (crea las 19 tablas; DATABASE_URL define destino)
Seed: `python database/seed.py` (crea admin/admin123 + roles RBAC)
Frontend: `npm install && npm run dev`
Tests: `pytest tests/ -q` (17 pruebas: motor, API, validadores, seguridad)

## Despliegue en la nube
Guía paso a paso en [`DEPLOY.md`](DEPLOY.md): **Supabase** (PostgreSQL, Session
pooler :6543) + **Render** (blueprint `render.yaml`, arranque `backend/start.sh` =
Alembic → `app/bootstrap.py` → uvicorn) + **Vercel** (SPA con `frontend/vercel.json`).

## Stack frontend (§8.1)
React+TS+Vite, TanStack Query + Axios (services/client.ts), Tailwind (paleta §8.4),
Lucide React (iconografía), React Hook Form + Zod (schemas/business.ts), Recharts.
