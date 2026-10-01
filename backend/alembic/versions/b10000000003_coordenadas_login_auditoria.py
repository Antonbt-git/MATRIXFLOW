"""Agrega coordenadas de ubicación a la auditoría de login.

Revision ID: b10000000003
Revises: b10000000002
Create Date: 2026-10-01
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'b10000000003'
down_revision: Union[str, None] = 'b10000000002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('auditoria_eventos', sa.Column('latitud', sa.Float(), nullable=True))
    op.add_column('auditoria_eventos', sa.Column('longitud', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('auditoria_eventos', 'longitud')
    op.drop_column('auditoria_eventos', 'latitud')
