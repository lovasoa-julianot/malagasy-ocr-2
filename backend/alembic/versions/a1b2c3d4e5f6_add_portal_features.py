"""add portal features

Revision ID: a1b2c3d4e5f6
Revises: 49f2492f7100
Create Date: 2026-09-28 09:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "49f2492f7100"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "fokontany",
        sa.Column(
            "code_acces_clair",
            sa.String(length=50),
            nullable=True,
        ),
    )

    op.add_column(
        "audit_logs",
        sa.Column(
            "details",
            sa.Text(),
            nullable=True,
        ),
    )

    op.add_column(
        "fokontany",
        sa.Column(
            "objectif_habitants",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )

    op.create_table(
        "quality_alert_resolutions",
        sa.Column(
            "id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "alert_id",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "resolved_by",
            sa.dialects.postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
        sa.Column(
            "resolved_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["resolved_by"],
            ["utilisateurs.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "alert_id",
            name="uq_quality_alert_resolutions_alert_id",
        ),
    )

    op.create_index(
        op.f("ix_quality_alert_resolutions_alert_id"),
        "quality_alert_resolutions",
        ["alert_id"],
        unique=False,
    )


def downgrade() -> None:
    op.execute(
        "DROP INDEX IF EXISTS "
        "ix_quality_alert_resolutions_alert_id"
    )

    op.execute("DROP TABLE IF EXISTS quality_alert_resolutions")

    op.drop_column("fokontany", "objectif_habitants")

    op.drop_column("audit_logs", "details")

    op.drop_column("fokontany", "code_acces_clair")
