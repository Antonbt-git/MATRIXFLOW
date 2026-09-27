"""Migración: extensión biométrica (registro facial + verificaciones por DNI).

Revision ID: b10000000001
Revises: 2745087c7ff9
Create Date: 2026-09-27
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'b10000000001'
down_revision: Union[str, None] = '2745087c7ff9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'registros_faciales',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('dni', sa.String(), nullable=False),
        sa.Column('descriptor', sa.JSON(), nullable=False),
        sa.Column('modelo', sa.String(), nullable=True),
        sa.Column('registrado_por', sa.Integer(), nullable=True),
        sa.Column('creado_en', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('actualizado_en', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ),
        sa.ForeignKeyConstraint(['registrado_por'], ['usuarios.id'], ),
    )
    op.create_index(op.f('ix_registros_faciales_id'), 'registros_faciales', ['id'], unique=False)
    op.create_index(op.f('ix_registros_faciales_dni'), 'registros_faciales', ['dni'], unique=True)

    op.create_table(
        'verificaciones_biometricas',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=True),
        sa.Column('dni_intentado', sa.String(), nullable=True),
        sa.Column('resultado', sa.String(), nullable=True),
        sa.Column('distancia', sa.Float(), nullable=True),
        sa.Column('umbral', sa.Float(), nullable=True),
        sa.Column('ip', sa.String(), nullable=True),
        sa.Column('creado_en', sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ),
    )
    op.create_index(op.f('ix_verificaciones_biometricas_id'),
                    'verificaciones_biometricas', ['id'], unique=False)
    op.create_index(op.f('ix_verificaciones_biometricas_dni_intentado'),
                    'verificaciones_biometricas', ['dni_intentado'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_verificaciones_biometricas_dni_intentado',
                  table_name='verificaciones_biometricas')
    op.drop_index('ix_verificaciones_biometricas_id', table_name='verificaciones_biometricas')
    op.drop_table('verificaciones_biometricas')
    op.drop_index('ix_registros_faciales_dni', table_name='registros_faciales')
    op.drop_index('ix_registros_faciales_id', table_name='registros_faciales')
    op.drop_table('registros_faciales')
