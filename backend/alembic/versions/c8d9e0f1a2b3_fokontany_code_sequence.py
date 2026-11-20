"""fokontany code sequence

Revision ID: c8d9e0f1a2b3
Revises: b7c8d9e0f1a2
Create Date: 2026-10-05 13:30:00.000000

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "c8d9e0f1a2b3"
down_revision: Union[str, Sequence[str], None] = "b7c8d9e0f1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Séquence du suffixe numérique des codes Fokontany
    # (FKT-<lettre du district>-<7 chiffres>).
    #
    # Elle est initialisée au-delà du plus grand suffixe
    # déjà attribué afin qu'un Fokontany créé manuellement
    # avant cette migration ne soit pas écrasé.
    op.execute(
        """
        DO $$
        DECLARE
            maxi bigint;
        BEGIN
            SELECT COALESCE(
                MAX(
                    substring(code from '([0-9]{7})$')::bigint
                ),
                0
            )
            INTO maxi
            FROM fokontany
            WHERE code ~ '^FKT-[A-Z]-[0-9]{7}$';

            EXECUTE format(
                'CREATE SEQUENCE IF NOT EXISTS fokontany_code_seq '
                'START WITH %s MINVALUE 1 INCREMENT BY 1',
                GREATEST(maxi + 1, 1)
            );
        END
        $$;
        """
    )


def downgrade() -> None:
    op.execute("DROP SEQUENCE IF EXISTS fokontany_code_seq")