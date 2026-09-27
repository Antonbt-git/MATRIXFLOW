#!/usr/bin/env bash
# Arranque de producción (Render): migraciones Alembic + seed + API.
# - Si la base ya existe pero sin alembic_version (creada por create_all),
#   hace "stamp head" para no repetir la migración inicial.
set -euo pipefail

# Render expone `python`; localmente suele haber solo `python3`.
PY="$(command -v python || command -v python3)"

"$PY" - <<'PY'
import os
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect

url = os.getenv("DATABASE_URL", "sqlite:///./matrixflow_local.db")
engine = create_engine(url)
inspector = inspect(engine)
cfg = Config(os.path.join(os.path.dirname(os.path.abspath(__file__)), "alembic.ini"))

tables = [t for t in inspector.get_table_names() if t != "alembic_version"]
if tables and not inspector.has_table("alembic_version"):
    # Tablas creadas por create_all sin histórico de Alembic -> no re-ejecutar DDL
    print("start.sh: tablas existentes sin alembic_version -> stamp head")
    command.stamp(cfg, "head")
else:
    print("start.sh: alembic upgrade head")
    command.upgrade(cfg, "head")
PY

"$PY" -m app.bootstrap

exec "$PY" -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --proxy-headers
