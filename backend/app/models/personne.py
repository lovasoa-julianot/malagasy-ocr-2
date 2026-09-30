import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Personne(Base):
    __tablename__ = "personnes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    nom: Mapped[str] = mapped_column(String(100), nullable=False)
    prenoms: Mapped[str] = mapped_column(String(150), nullable=False)
    sexe: Mapped[str | None] = mapped_column(String(20), nullable=True)
    date_naissance: Mapped[date | None] = mapped_column(Date, nullable=True)
    lieu_naissance: Mapped[str | None] = mapped_column(String(150), nullable=True)
    
    nee_vers: Mapped[bool] = mapped_column( nullable=True)

    numero_cin: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    
    numero_serie_cin: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    date_delivrance: Mapped[date | None] = mapped_column(Date, nullable=True)
    lieu_delivrance: Mapped[str | None] = mapped_column(String(150), nullable=True)

    nom_pere: Mapped[str | None] = mapped_column(String(150), nullable=True)
    pere_decede: Mapped[bool] = mapped_column( nullable=True) 
    
    nom_mere: Mapped[str | None] = mapped_column(String(150), nullable=True)
    mere_decede: Mapped[bool] = mapped_column( nullable=True) 

    profession: Mapped[str | None] = mapped_column(String(150), nullable=True)

 
    lot_logement: Mapped[str | None] = mapped_column(String(100), nullable=True) 
    quartier_secteur: Mapped[str | None] = mapped_column(String(150), nullable=True) 
    
    telephone: Mapped[str | None] = mapped_column(String(30), nullable=True)

    fokontany_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("fokontany.id"), nullable=False, index=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    recensements = relationship("Recensement", back_populates="personne")