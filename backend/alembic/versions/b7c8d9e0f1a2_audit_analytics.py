"""audit analytics foundation

Revision ID: b7c8d9e0f1a2
Revises: a1b2c3d4e5f6
Create Date: 2026-10-05 10:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "b7c8d9e0f1a2"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -----------------------------------------------------
    # Journal d'audit : attribution réelle des acteurs
    # -----------------------------------------------------

    op.add_column(
        "audit_logs",
        sa.Column(
            "utilisateur_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )

    op.create_foreign_key(
        "fk_audit_logs_utilisateur_id",
        "audit_logs",
        "utilisateurs",
        ["utilisateur_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_index(
        op.f("ix_audit_logs_utilisateur_id"),
        "audit_logs",
        ["utilisateur_id"],
        unique=False,
    )

    op.add_column(
        "audit_logs",
        sa.Column(
            "outcome",
            sa.String(length=20),
            nullable=True,
        ),
    )

    op.add_column(
        "audit_logs",
        sa.Column(
            "duration_ms",
            sa.Integer(),
            nullable=True,
        ),
    )

    # -----------------------------------------------------
    # Index nécessaires aux agrégations statistiques
    # -----------------------------------------------------

    op.create_index(
        op.f("ix_audit_logs_action"),
        "audit_logs",
        ["action"],
        unique=False,
    )

    op.create_index(
        op.f("ix_audit_logs_resource_type"),
        "audit_logs",
        ["resource_type"],
        unique=False,
    )

    op.create_index(
        op.f("ix_audit_logs_outcome"),
        "audit_logs",
        ["outcome"],
        unique=False,
    )

    op.create_index(
        op.f("ix_audit_logs_created_at"),
        "audit_logs",
        ["created_at"],
        unique=False,
    )

    op.create_index(
        "ix_audit_logs_created_at_action",
        "audit_logs",
        ["created_at", "action"],
        unique=False,
    )

    op.create_index(
        "ix_audit_logs_created_at_resource_type",
        "audit_logs",
        ["created_at", "resource_type"],
        unique=False,
    )

    # -----------------------------------------------------
    # Recensements : précision OCR réellement mesurée
    # -----------------------------------------------------

    op.create_index(
        "ix_recensements_fokontany_created_at",
        "recensements",
        ["fokontany_id", "created_at"],
        unique=False,
    )

    op.create_index(
        "ix_recensements_agent_created_at",
        "recensements",
        ["agent_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.execute(
        "DROP INDEX IF EXISTS ix_recensements_agent_created_at"
    )

    op.execute(
        "DROP INDEX IF EXISTS ix_recensements_fokontany_created_at"
    )

    op.execute(
        "DROP INDEX IF EXISTS ix_audit_logs_created_at_resource_type"
    )

    op.execute(
        "DROP INDEX IF EXISTS ix_audit_logs_created_at_action"
    )

    op.execute(
        "DROP INDEX IF EXISTS ix_audit_logs_created_at"
    )

    op.execute(
        "DROP INDEX IF EXISTS ix_audit_logs_outcome"
    )

    op.execute(
        "DROP INDEX IF EXISTS ix_audit_logs_resource_type"
    )

    op.execute(
        "DROP INDEX IF EXISTS ix_audit_logs_action"
    )

    op.drop_column("audit_logs", "duration_ms")

    op.drop_column("audit_logs", "outcome")

    op.execute(
        "DROP INDEX IF EXISTS ix_audit_logs_utilisateur_id"
    )

    op.drop_constraint(
        "fk_audit_logs_utilisateur_id",
        "audit_logs",
        type_="foreignkey",
    )

    op.drop_column("audit_logs", "utilisateur_id")