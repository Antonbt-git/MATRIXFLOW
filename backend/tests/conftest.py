"""§15: entorno de pruebas aislado.

Fija DATABASE_URL a un SQLite propio ANTES de importar la app, de modo que
`pytest` nunca toca Supabase ni la base de desarrollo local. La semilla crea
las 19 tablas §10 y el usuario admin/admin123 que usan los tests de API.
"""
import os
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE)

TEST_DB = os.path.join(BASE, "matrixflow_test.db")
if os.path.exists(TEST_DB):
    os.remove(TEST_DB)

# override explícito: load_dotenv() no sobreescribe variables ya presentes
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["ADMIN_USERNAME"] = "admin"
os.environ["ADMIN_PASSWORD"] = "admin123"

from app.bootstrap import run_seed  # noqa: E402

run_seed()
