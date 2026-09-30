
import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class ChefFokontanyRequestStatus(str, enum.Enum):
    EN_ATTENTE = "EN_ATTENTE"
    APPROUVE = "APPROUVE"
    REJETE = "REJETE"


class ChefFokontanyRequest(Base):
    __tablename__ = "chef_fokontany_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    code_fokontany: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    nom_fokontany: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    commune: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    district: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    code_district: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        index=True,
    )

    region: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    province: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    nom: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    prenoms: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    telephone: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    statut: Mapped[ChefFokontanyRequestStatus] = mapped_column(
        Enum(
            ChefFokontanyRequestStatus,
            name="chef_fokontany_request_status",
        ),
        default=ChefFokontanyRequestStatus.EN_ATTENTE,
        nullable=False,
        index=True,
    )

    motif_rejet: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "utilisateurs.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    reviewer = relationship(
        "Utilisateur",
        foreign_keys=[reviewed_by],
    )

