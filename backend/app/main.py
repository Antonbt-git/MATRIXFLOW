from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api.routes import (
    auth, users, companies, branches, products, sales,
    vectors, matrices, inventory, operations, reports,
)
from app.database.connection import engine, Base
# Importar modelos para que Base.metadata conozca las tablas (Fase 3)
from app.models import business_models  # noqa: F401

# Crear tablas automáticamente si no existen (complemento a Alembic para dev)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MatrixFlow Enterprise API",
    description="Sistema Web Empresarial de Análisis mediante Álgebra Lineal",
    version="1.0.0"
)

# Configuración de CORS (Fase 6: restringible por env)
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusión de Routers Modulares (prefijo /api/v1 §9.2)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(companies.router)
app.include_router(branches.router)
app.include_router(products.router)
app.include_router(sales.router)
app.include_router(vectors.router)
app.include_router(matrices.router)
app.include_router(inventory.router)
app.include_router(operations.router)
app.include_router(reports.router)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "MatrixFlow Enterprise API is operational",
        "status": "Active",
        "engine": "NumPy Linear Algebra Core",
        "database": "Supabase PostgreSQL"
    }


@app.get("/health", tags=["Root"])
def health_check():
    return {"status": "healthy"}
