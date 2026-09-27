# ☁️ Despliegue: Supabase + Render + Vercel

Arquitectura de producción:

```
┌─────────────────┐   HTTPS/JSON    ┌──────────────────┐   TCP/SSL   ┌────────────┐
│  Vercel (SPA)   │ ──────────────► │ Render (FastAPI) │ ──────────► │  Supabase  │
│  React + Vite   │   /api/v1/*     │  uvicorn + alembic│  Session   │ PostgreSQL │
│  matrixflow.    │                 │  matrixflow-api   │  Pooler    │  19 tablas │
│  vercel.app     │ ◄────────────── │  .onrender.com    │  :6543     │  §10       │
└─────────────────┘    CORS         └──────────────────┘            └────────────┘
```

## 0. Requisitos

- Cuentas en [supabase.com](https://supabase.com), [render.com](https://render.com) y [vercel.com](https://vercel.com).
- El proyecto en **GitHub** (Render y Vercel despliegan desde Git).

```bash
cd MatrixFlow_Enterprise
git init && git add . && git commit -m "MatrixFlow Enterprise"
git remote add origin https://github.com/TU_USUARIO/MatrixFlow_Enterprise.git
git push -u origin main
```

---

## 1. Supabase → PostgreSQL

1. **New Project** (elige región `South America (São Paulo)` para menor latencia con Render).
2. Espera a que esté *Active* y ve a **Settings → Database**.
3. Copia la **Connection string → Session pooler** (puerto `6543`, IPv4, compatible con Render):

   ```
   postgresql://postgres.aws-0-XX:[PASSWORD]@aws-0-XX-XXXX.pooler.supabase.com:6543/postgres?sslmode=require
   ```

   > ⚠️ Usa el **Session pooler (6543)**, no la conexión directa (5432): la conexión
   > directa de proyectos nuevos es IPv6 y Render no la alcanza.
4. Ejecuta las migraciones y el seed **una sola vez** desde tu máquina:

   ```bash
   cd backend
   export DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres?sslmode=require"
   pip install -r requirements.txt
   alembic upgrade head
   python -m app.bootstrap
   ```

   (Si no lo haces, Render lo hará solo en el primer arranque con `start.sh`.)

---

## 2. Render → Backend (FastAPI)

El blueprint `render.yaml` en la raíz ya define el servicio.

1. Render → **New → Blueprint** → conecta tu repo de GitHub.
2. Render detecta `render.yaml` y crea el servicio `matrixflow-api`.
3. Configura las env vars (se marcan como *sync: false*, debes ingresarlas):
   - `DATABASE_URL` = la cadena del Session pooler de Supabase.
   - `ALLOWED_ORIGINS` = `https://TU_APP.vercel.app` (y opcional `https://matrixflow-api.onrender.com`).
   - `ADMIN_PASSWORD` = contraseña del usuario admin (déjala vacía o pon tu valor).
   - `SECRET_KEY` ya se genera automáticamente.
4. **Deploy**. El `start.sh` ejecuta: `alembic upgrade head` → `python -m app.bootstrap` → `uvicorn`.
5. Verifica: `https://TU_API.onrender.com/health` → `{"status":"healthy"}`.

### Alta manual (si no usas Blueprint)

| Campo | Valor |
|---|---|
| Runtime | Python 3 |
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `bash start.sh` |
| Health Check Path | `/health` |

---

## 3. Vercel → Frontend (React + Vite)

1. Vercel → **Add New → Project** → importa el mismo repo.
2. Configura:
   - **Root Directory** = `frontend` (Settings → General).
   - El resto lo detecta solo gracias a `frontend/vercel.json`
     (framework `vite`, build `npm run build`, salida `dist`,
     rewrites SPA → `index.html` para react-router).
3. **Environment Variables**:
   - `VITE_API_URL` = `https://TU_API.onrender.com` (sin barra final).
4. **Deploy**. Tras el build, `VITE_API_URL` queda compilado en el bundle
   (si cambias la URL, haz **Redeploy**).
5. Copia el dominio resultante (`https://TU_APP.vercel.app`) y ponlo en
   `ALLOWED_ORIGINS` de Render → el servicio se redespliega solo (*AutoDeploy*).

---

## 4. Checklist post-despliegue

- [ ] `GET /health` en Render → `{"status":"healthy"}`.
- [ ] Login `admin` / tu `ADMIN_PASSWORD` en el dominio de Vercel.
- [ ] Tablas visibles en Supabase → **Table Editor** (19 tablas §10 + `alembic_version`).
- [ ] CORS sin errores en consola del navegador (si falla: `ALLOWED_ORIGINS` no coincide exactamente).
- [ ] Dashboard carga datos y el CRUD (editar/eliminar) funciona.
- [ ] En Supabase → **Authentication → Logs** / backend `/api/v1/reports/auditoria` registran eventos.

## 5. Comandos útiles

```bash
# Migraciones en local contra Supabase
cd backend && DATABASE_URL="postgresql://...?sslmode=require" alembic upgrade head

# Rollback de la última migración
alembic downgrade -1

# Sembrar/repair datos (idempotente)
python -m app.bootstrap

# Build de producción del frontend
cd frontend && npm run build
```

## 6. Solución de problemas

| Sintoma | Causa / solución |
|---|---|
| `SSL connection has been requested but not supported` | Falta `?sslmode=require` en `DATABASE_URL`. |
| `Connection refused` / timeout a Supabase | Usaste la conexión directa (IPv6). Cambia al **Session pooler :6543**. |
| `relation "empresas" already exist` | `start.sh` aplica *stamp*; o ejecuta `alembic stamp head` a mano. |
| Respuestas CORS bloqueadas en el navegador | `ALLOWED_ORIGINS` debe contener el origen **exacto** (con `https://`), sin `/`. |
| Página en blanco al recargar una ruta en Vercel | Falta el rewrite SPA de `vercel.json` (verifica que Root Directory = `frontend`). |
| Render duerme el servicio tras 15 min de inactividad | Tier free: la primera petición tarda ~30 s (cold start). |
| 401 permanente tras deploy | El `SECRET_KEY` cambió → los JWT emitidos antes ya no valen; inicia sesión de nuevo. |
