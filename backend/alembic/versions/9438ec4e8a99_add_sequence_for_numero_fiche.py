"""add sequence for numero fiche

Revision ID: 9438ec4e8a99
Revises: 41337ee18bda
Create Date: 2026-09-21 04:29:09.365865

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9438ec4e8a99'
down_revision: Union[str, Sequence[str], None] = '41337ee18bda'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute("""
        CREATE SEQUENCE IF NOT EXISTS numero_fiche_seq
        START WITH 1
        INCREMENT BY 1
        MINVALUE 1
    """)


def downgrade():
    op.execute("""
        DROP SEQUENCE IF EXISTS numero_fiche_seq
    """)