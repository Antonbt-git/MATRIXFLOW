import os
from dotenv import load_dotenv

# Carga backend/.env si existe; NO sobreescribe variables ya definidas en el
# entorno (por eso los tests pueden forzar su propia DATABASE_URL).
load_dotenv()

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# La URL de conexión SIEMPRE debe venir de una variable de entorno.
# NUNCA hardcodear credenciales de base de datos en el código fuente:
# si este archivo llega a un repositorio público, la base de datos queda expuesta.
# Para desarrollo local sin Supabase configurado, cae a un SQLite local.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./matrixflow_local.db")

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    # SQLite local: sin pooling remoto, solo check_same_thread para FastAPI
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # PostgreSQL (Supabase): pool conservador para el Session Pooler (puerto 6543),
    # pre_ping para reconectar tras el suspender del tier free y reciclado de
    # conexiones ociosas antes de los timeouts del pool.
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
        max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "5")),
        pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "1800")),
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
