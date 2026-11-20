from datetime import datetime
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
    AdminAuditLogMeta,
    AdminAuditLogPage,
    AdminAuditStatsResponse,
    AdminDashboardStatsResponse,
    AdminFokontanyStatItem,
    AdminRecensementItem,
    AdminRecensementStatusRequest,
    AdminRecensementStatusResponse,
    AdminStatistiquesResponse,
    QualityAlertItem,
)
from app.services.admin_service import AdminService
from app.services.analytics_service import (
    PERIODE_MONTH,
    AnalyticsService,
)


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
    response_model=AdminAuditLogPage,
)
def list_audit_logs(
    action: str | None = Query(default=None),
    resource_type: str | None = Query(default=None),
    user_type: str | None = Query(default=None),
    outcome: str | None = Query(default=None),
    fokontany_id: UUID | None = Query(default=None),
    date_debut: datetime | None = Query(default=None),
    date_fin: datetime | None = Query(default=None),
    search: str | None = Query(default=None),
    limit: int = Query(default=25, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(require_admin),
):
    """
    Journal d'audit paginé et filtrable.

    Le filtrage est appliqué en base : la pagination reste
    cohérente quel que soit le nombre d'événements.
    """

    return AdminService.list_audit_logs(
        db,
        action=action,
        resource_type=resource_type,
        user_type=user_type,
        outcome=outcome,
        fokontany_id=fokontany_id,
        date_debut=date_debut,
        date_fin=date_fin,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/audit-logs/meta",
    response_model=AdminAuditLogMeta,
)
def get_audit_logs_meta(
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(require_admin),
):
    """
    Valeurs disponibles pour les filtres du journal
    (actions, ressources, profils et territoires).
    """

    return AdminService.audit_log_meta(db)


# ============================================================
# STATISTIQUES & KPIs
# ============================================================

@router.get(
    "/statistiques",
    response_model=AdminStatistiquesResponse,
)
def get_admin_statistiques(
    periode: str = Query(default=PERIODE_MONTH),
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(require_admin),
):
    """
    Indicateurs de pilotage calculés à partir des fiches
    réellement enregistrées.

    Périodes acceptées : WEEK, MONTH, GLOBAL.
    """

    return AnalyticsService.statistiques(db, periode=periode)


@router.get(
    "/statistiques/audit",
    response_model=AdminAuditStatsResponse,
)
def get_admin_statistiques_audit(
    periode: str = Query(default=PERIODE_MONTH),
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(require_admin),
):
    """
    Agrégats du journal d'audit sur la période demandée.
    """

    return AnalyticsService.audit_stats(db, periode=periode)


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
