import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class QualityAlertResolution(Base):
    """
    Alertes qualité traitées par un administrateur.

    Les alertes elles-mêmes sont recalculées à la volée à partir
    des recensements : cette table mémorise uniquement celles
    qui ont été traitées.
    """

    __tablename__ = "quality_alert_resolutions"
    __table_args__ = (
        UniqueConstraint(
            "alert_id",
            name="uq_quality_alert_resolutions_alert_id",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    alert_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    resolved_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "utilisateurs.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    resolved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
