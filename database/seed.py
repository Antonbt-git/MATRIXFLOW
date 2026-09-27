"""Seed inicial (Fase 3): delega en app.bootstrap (idempotente y con env vars).

Uso local:  python database/seed.py
"""
import os
import sys

BACKEND = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, BACKEND)
# La URL por defecto de SQLite es relativa al CWD: nos situamos en backend/
os.chdir(BACKEND)

from app.bootstrap import run_seed  # noqa: E402

run_seed()
