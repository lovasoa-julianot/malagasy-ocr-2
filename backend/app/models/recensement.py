import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Float,
    Index,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class RecensementStatus(str, enum.Enum):
    SCANNE = "SCANNE"
    OCR_EN_COURS = "OCR_EN_COURS"
    A_VERIFIER = "A_VERIFIER"
    MODIFIE = "MODIFIE"
    VALIDE = "VALIDE"
    REJETE = "REJETE"


class Recensement(Base):
    __tablename__ = "recensements"

    __table_args__ = (
        Index(
            "ix_recensements_fokontany_created_at",
            "fokontany_id",
            "created_at",
        ),
        Index(
            "ix_recensements_agent_created_at",
            "agent_id",
            "created_at",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    numero_fiche: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True) # ex: 07821916
    numero_karine: Mapped[str | None] = mapped_column(String(50), nullable=True) # ex: 312877

    personne_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("personnes.id", ondelete="SET NULL"), nullable=True, index=True
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False, index=True
    )
    fokontany_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("fokontany.id"), nullable=False, index=True
    )

    # ==========================================
    # NOUVEAU : Gestion du QR Code et de la signature numérique
    # ==========================================
    qr_token: Mapped[str] = mapped_column(
        String(255), 
        unique=True, 
        nullable=False, 
        default=lambda: str(uuid.uuid4()),
        index=True,
    ) # La chaîne de caractères unique encodée dans le QR code
    
    qr_generated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), 
        nullable=True,
    ) # Date à laquelle le système a généré la fiche et son QR code
    
    is_qr_scanned_and_verified: Mapped[bool] = mapped_column(
        default=False, 
        nullable=False,
    ) # Passe à True lorsque l'agent re-scanne la fiche sur le terrain pour validation définitive

    # Signatures textuelles restantes (les témoins, CLRE si besoin)
    nom_temoin_present: Mapped[str | None] = mapped_column(String(150), nullable=True)
    nom_membre_clre: Mapped[str | None] = mapped_column(String(150), nullable=True)
    date_recensement_terrain: Mapped[date | None] = mapped_column(Date, nullable=True)

    statut: Mapped[RecensementStatus] = mapped_column(
        Enum(RecensementStatus), default=RecensementStatus.SCANNE, nullable=False, index=True
    )
    ocr_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    personne = relationship("Personne", back_populates="recensements")
    agent = relationship("Agent", back_populates="recensements")
    fokontany = relationship("Fokontany", back_populates="recensements")