from datetime import datetime, time, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.dependancy import get_current_agent
from app.db.database import get_db
from app.models import RecensementStatus
from app.models.agent import Agent
from app.models.recensement import Recensement
from app.models.personne import Personne

router = APIRouter(
    prefix="/api/agent",
    tags=["Agent Dashboard"],
)


@router.get("/dashboard")
def get_agent_dashboard(
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    today = datetime.now(timezone.utc).date()

    scanned_today = (
        db.query(func.count(Recensement.id))
        .filter(
            Recensement.agent_id == current_agent.id,
            func.date(Recensement.created_at) == today,
        )
        .scalar()
        or 0
    )

    registered_today = (
        db.query(func.count(Recensement.id))
        .filter(
            Recensement.agent_id == current_agent.id,
            Recensement.statut == RecensementStatus.VALIDE,
            func.date(Recensement.validated_at) == today,
        )
        .scalar()
        or 0
    )

    # =========================================================
    # 3. Total recensé par cet agent
    # =========================================================

    total = (
        db.query(func.count(Recensement.id))
        .filter(
            Recensement.agent_id == current_agent.id,
        )
        .scalar()
        or 0
    )

    # =========================================================
    # 4. Activité récente
    # =========================================================

    recent_recensements = (
        db.query(Recensement)
        .filter(
            Recensement.agent_id == current_agent.id,
        )
        .order_by(Recensement.created_at.desc())
        .limit(5)
        .all()
    )

    recent_activity = []

    for recensement in recent_recensements:
        personne = recensement.personne

        if not personne:
            continue

        recent_activity.append(
            {
                "id": str(recensement.id),
                "name": f"{personne.nom} {personne.prenoms}".strip(),
                "cin": personne.numero_cin,
                "time": recensement.created_at.strftime("%H:%M"),
                "status": recensement.statut.value,
            }
        )

    return {
        "stats": {
            "scannedToday": scanned_today,
            "registeredToday": registered_today,
            "total": total,
        },
        "recentActivity": recent_activity,
    }