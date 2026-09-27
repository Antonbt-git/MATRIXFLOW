"""Migración: ubicación de inicio de sesión en la auditoría (carnet).

Revision ID: b10000000002
Revises: b10000000001
Create Date: 2026-09-27
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'b10000000002'
down_revision: Union[str, None] = 'b10000000001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('auditoria_eventos', sa.Column('departamento', sa.String(), nullable=True))
    op.add_column('auditoria_eventos', sa.Column('distrito', sa.String(), nullable=True))
    op.add_column('auditoria_eventos', sa.Column('direccion', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('auditoria_eventos', 'direccion')
    op.drop_column('auditoria_eventos', 'distrito')
    op.drop_column('auditoria_eventos', 'departamento')
