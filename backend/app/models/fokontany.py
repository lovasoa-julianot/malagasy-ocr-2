
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Fokontany(Base):
    __tablename__ = "fokontany"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    nom: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    commune: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    district: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    code_district: Mapped[int] = mapped_column(
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

    code_acces_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    # Le code d'accès en clair est conservé afin que le Chef Fokontany
    # puisse l'afficher, l'imprimer et le partager sous forme de QR code.
    code_acces_clair: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    chef_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "utilisateurs.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        unique=True,
        index=True,
    )

    # Population cible utilisée pour le calcul de progression du Chef Fokontany.
    objectif_habitants: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        server_default="0",
    )

    chef = relationship(
        "Utilisateur",
        foreign_keys=[chef_id],
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

    agents = relationship(
        "Agent",
        back_populates="fokontany",
        cascade="all, delete-orphan",
    )

    recensements = relationship(
        "Recensement",
        back_populates="fokontany",
    )

