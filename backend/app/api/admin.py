from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependancy import require_admin
from app.db.database import get_db
from app.models.utilisateur import Utilisateur
from app.schemas.admin import (
    AdminAgentCreate,
    AdminAgentCreateResponse,
    AdminAgentItem,
    AdminAgentToggleRequest,
    AdminAgentToggleResponse,
    AdminAuditLogItem,
    AdminDashboardStatsResponse,
    AdminFokontanyStatItem,
    AdminRecensementItem,
    AdminRecensementStatusRequest,
    AdminRecensementStatusResponse,
    QualityAlertItem,
)
from app.services.admin_service import AdminService


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
)


# ============================================================
# TABLEAU DE BORD
# ============================================================

@router.get(
    "/stats",
    response_model=AdminDashboardStatsResponse,
)
def get_admin_stats(
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(require_admin),
):
    return AdminService.dashboard_stats(db)


@router.get(
    "/fokontany-stats",
    response_model=list[AdminFokontanyStatItem],
)
def get_fokontany_stats(
    limit: int = Query(default=10, ge=1, le=200),
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(require_admin),
):
    return AdminService.fokontany_stats(db, limit=limit)


# ============================================================
# AGENTS
# ============================================================

@router.get(
    "/agents",
    response_model=list[AdminAgentItem],
)
def list_agents(
    fokontany_id: UUID | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(require_admin),
):
    return AdminService.list_agents(
        db,
        fokontany_id=fokontany_id,
        search=search,
    )


@router.post(
    "/agents",
    response_model=AdminAgentCreateResponse,
)
def create_agent(
    data: AdminAgentCreate,
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(require_admin),
):
    agent = AdminService.create_agent(
        db,
        data,
        admin,
    )

    item = AdminService._agent_item(
        agent,
        AdminService._agent_total(db, agent.id),
        AdminService._agent_last_activity(db, agent.id),
    )

    return AdminAgentCreateResponse(
        success=True,
        message=(
            f"Agent {agent.matricule} créé avec succès. "
            "Communiquez-lui son matricule."
        ),
        agent=item,
    )


@router.patch(
    "/agents/{agent_id}/toggle",
    response_model=AdminAgentToggleResponse,
)
def toggle_agent(
    agent_id: UUID,
    data: AdminAgentToggleRequest,
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(require_admin),
):
    agent = AdminService.toggle_agent(
        db,
        agent_id,
        data.is_active,
        admin,
    )

    return AdminAgentToggleResponse(
        success=True,
        id=agent.id,
        is_active=agent.is_active,
        message=(
            f"Agent {agent.matricule} activé."
            if agent.is_active
            else f"Agent {agent.matricule} désactivé."
        ),
    )


# ============================================================
# RECENSEMENTS
# ============================================================

@router.get(
    "/recensements",
    response_model=list[AdminRecensementItem],
)
def list_recensements(
    statut: str | None = Query(default=None),
    fokontany_id: UUID | None = Query(default=None),
    search: str | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(require_admin),
):
    return AdminService.list_recensements(
        db,
        statut=statut,
        fokontany_id=fokontany_id,
        search=search,
        limit=limit,
    )


@router.patch(
    "/recensements/{recensement_id}/status",
    response_model=AdminRecensementStatusResponse,
)
def update_recensement_status(
    recensement_id: UUID,
    data: AdminRecensementStatusRequest,
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(require_admin),
):
    recensement = AdminService.update_recensement_status(
        db,
        recensement_id,
        data.statut,
        admin,
    )

    return AdminRecensementStatusResponse(
        success=True,
        id=recensement.id,
        statut=recensement.statut.value,
        message=(
            f"Recensement {recensement.numero_fiche} "
            f"passé à {recensement.statut.value}."
        ),
    )


# ============================================================
# JOURNAL D'AUDIT
# ============================================================

@router.get(
    "/audit-logs",
    response_model=list[AdminAuditLogItem],
)
def list_audit_logs(
    limit: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(require_admin),
):
    return AdminService.list_audit_logs(db, limit=limit)


# ============================================================
# ALERTES QUALITE
# ============================================================

@router.get(
    "/quality-alerts",
    response_model=list[QualityAlertItem],
)
def list_quality_alerts(
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(require_admin),
):
    return AdminService.quality_alerts(db, limit=limit)


@router.patch(
    "/quality-alerts/{alert_id}/resolve",
)
def resolve_quality_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(require_admin),
):
    AdminService.resolve_quality_alert(
        db,
        alert_id,
        admin,
    )

    return {
        "success": True,
        "id": alert_id,
        "message": "Alerte marquée comme traitée.",
    }
