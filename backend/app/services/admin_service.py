from datetime import date, datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.agent import Agent
from app.models.audit_log import AuditLog
from app.models.chef_fokontany_request import (
    ChefFokontanyRequest,
    ChefFokontanyRequestStatus,
)
from app.models.fokontany import Fokontany
from app.models.personne import Personne
from app.models.quality_alert_resolution import QualityAlertResolution
from app.models.recensement import Recensement, RecensementStatus
from app.models.utilisateur import Utilisateur
from app.schemas.admin import (
    AdminAgentCreate,
    AdminAgentItem,
    AdminAuditLogItem,
    AdminDashboardStatsResponse,
    AdminFokontanyStatItem,
    AdminRecensementItem,
    QualityAlertItem,
)
from app.services.audit_service import log_action
from app.services.agent_service import generate_agent_matricule
from app.services.chef_portal_service import format_relative_fr


# ============================================================
# LIBELLES D'AUDIT
# ============================================================

ACTION_LABELS = {
    "LOGIN": "Connexion",
    "CREATE": "Création",
    "UPDATE": "Modification",
    "APPROVE": "Approbation",
    "REJECT": "Rejet",
    "VALIDATE": "Validation",
    "EXPORT": "Export",
}

RESOURCE_LABELS = {
    "RECENSEMENT": "Recensement",
    "AGENT": "Agent",
    "FOKONTANY": "Fokontany",
    "CHEF_REQUEST": "Demande Chef Fokontany",
    "SYSTEM": "Système",
}

# Seuil de confiance OCR en dessous duquel une alerte est levée.
OCR_CONFIDENCE_THRESHOLD = 0.75


class AdminService:

    # --------------------------------------------------------
    # Tableau de bord
    # --------------------------------------------------------

    @staticmethod
    def dashboard_stats(
        db: Session,
    ) -> AdminDashboardStatsResponse:

        today = datetime.now(timezone.utc).date()

        fokontany_total = (
            db.query(func.count(Fokontany.id))
            .filter(Fokontany.is_active.is_(True))
            .scalar()
            or 0
        )

        agents_total = (
            db.query(func.count(Agent.id))
            .scalar()
            or 0
        )

        agents_actifs = (
            db.query(func.count(Agent.id))
            .filter(Agent.is_active.is_(True))
            .scalar()
            or 0
        )

        personnes_recensees = (
            db.query(func.count(Personne.id))
            .scalar()
            or 0
        )

        recensements_aujourdhui = (
            db.query(func.count(Recensement.id))
            .filter(
                func.date(Recensement.created_at) == today
            )
            .scalar()
            or 0
        )

        rows = (
            db.query(
                Recensement.statut,
                func.count(Recensement.id),
            )
            .group_by(Recensement.statut)
            .all()
        )

        counts = {
            statut.value: total
            for statut, total in rows
        }

        demandes_chef = (
            db.query(func.count(ChefFokontanyRequest.id))
            .filter(
                ChefFokontanyRequest.statut
                == ChefFokontanyRequestStatus.EN_ATTENTE
            )
            .scalar()
            or 0
        )

        return AdminDashboardStatsResponse(
            fokontany=fokontany_total,
            agentsActifs=agents_actifs,
            agentsTotal=agents_total,
            personnesRecensees=personnes_recensees,
            recensementsAujourdhui=recensements_aujourdhui,
            aVerifier=counts.get(RecensementStatus.A_VERIFIER.value, 0),
            valides=counts.get(RecensementStatus.VALIDE.value, 0),
            rejets=counts.get(RecensementStatus.REJETE.value, 0),
            demandesChefEnAttente=demandes_chef,
        )

    # --------------------------------------------------------
    # Progression par Fokontany
    # --------------------------------------------------------

    @staticmethod
    def fokontany_stats(
        db: Session,
        limit: int = 10,
    ) -> list[AdminFokontanyStatItem]:

        fokontany_list = (
            db.scalars(
                select(Fokontany)
                .where(Fokontany.is_active.is_(True))
                .order_by(Fokontany.nom)
                .limit(limit)
            )
            .all()
        )

        if not fokontany_list:
            return []

        rows = (
            db.query(
                Recensement.fokontany_id,
                Recensement.statut,
                func.count(Recensement.id),
            )
            .filter(
                Recensement.fokontany_id.in_(
                    [f.id for f in fokontany_list]
                )
            )
            .group_by(
                Recensement.fokontany_id,
                Recensement.statut,
            )
            .all()
        )

        counters: dict[UUID, dict[str, int]] = {}

        for fokontany_id, statut, count in rows:
            counters.setdefault(
                fokontany_id,
                {},
            )[statut.value] = count

        items = []

        for fokontany in fokontany_list:
            stats = counters.get(fokontany.id, {})

            total = sum(stats.values())
            valides = stats.get(RecensementStatus.VALIDE.value, 0)

            objectif = fokontany.objectif_habitants or 0

            progression = (
                min(round((valides / objectif) * 100), 100)
                if objectif
                else (100 if valides else 0)
            )

            items.append(
                AdminFokontanyStatItem(
                    id=fokontany.id,
                    nom=fokontany.nom,
                    code=fokontany.code,
                    commune=fokontany.commune,
                    region=fokontany.region,
                    total=total,
                    valides=valides,
                    progression=progression,
                )
            )

        items.sort(
            key=lambda item: item.total,
            reverse=True,
        )

        return items

    # --------------------------------------------------------
    # Agents
    # --------------------------------------------------------

    @staticmethod
    def _agent_item(
        agent: Agent,
        total_recensements: int,
        derniere_activite: datetime | None,
    ) -> AdminAgentItem:

        fokontany = agent.fokontany

        return AdminAgentItem(
            id=agent.id,
            matricule=agent.matricule,
            nom=agent.nom,
            prenoms=agent.prenoms,
            telephone=agent.telephone,
            email=agent.email,
            adresse=agent.adresse,
            is_active=agent.is_active,
            fokontany_id=agent.fokontany_id,
            fokontany_nom=fokontany.nom if fokontany else None,
            fokontany_code=fokontany.code if fokontany else None,
            commune=fokontany.commune if fokontany else None,
            district=fokontany.district if fokontany else None,
            region=fokontany.region if fokontany else None,
            total_recensements=total_recensements,
            derniere_activite=format_relative_fr(
                derniere_activite
            ),
            created_at=agent.created_at,
        )

    @staticmethod
    def list_agents(
        db: Session,
        fokontany_id: UUID | None = None,
        search: str | None = None,
    ) -> list[AdminAgentItem]:

        query = (
            select(Agent)
            .options(joinedload(Agent.fokontany))
            .order_by(Agent.created_at.desc())
        )

        if fokontany_id:
            query = query.where(
                Agent.fokontany_id == fokontany_id
            )

        if search:
            pattern = f"%{search.strip()}%"

            query = query.where(
                Agent.nom.ilike(pattern)
                | Agent.prenoms.ilike(pattern)
                | Agent.matricule.ilike(pattern)
                | Agent.telephone.ilike(pattern)
            )

        agents = db.scalars(query).unique().all()

        return [
            AdminService._agent_item(
                agent,
                AdminService._agent_total(db, agent.id),
                AdminService._agent_last_activity(db, agent.id),
            )
            for agent in agents
        ]

    @staticmethod
    def _agent_total(
        db: Session,
        agent_id: UUID,
    ) -> int:
        return (
            db.query(func.count(Recensement.id))
            .filter(Recensement.agent_id == agent_id)
            .scalar()
            or 0
        )

    @staticmethod
    def _agent_last_activity(
        db: Session,
        agent_id: UUID,
    ) -> datetime | None:
        return (
            db.query(func.max(Recensement.created_at))
            .filter(Recensement.agent_id == agent_id)
            .scalar()
        )

    @staticmethod
    def create_agent(
        db: Session,
        data: AdminAgentCreate,
        admin: Utilisateur,
    ) -> Agent:

        fokontany = db.get(Fokontany, data.fokontany_id)

        if not fokontany:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fokontany introuvable",
            )

        if not fokontany.is_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Impossible d'affecter un agent à un Fokontany désactivé",
            )

        agent = Agent(
            fokontany_id=fokontany.id,
            matricule=generate_agent_matricule(db),
            nom=data.nom.strip(),
            prenoms=data.prenoms.strip(),
            telephone=data.telephone.strip(),
            email=(
                str(data.email).strip().lower()
                if data.email
                else None
            ),
            adresse=(
                data.adresse.strip()
                if data.adresse
                else None
            ),
            is_active=True,
        )

        db.add(agent)

        try:
            db.flush()
        except IntegrityError:
            db.rollback()

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Impossible de créer l'agent.",
            )

        log_action(
            db,
            action="CREATE",
            resource_type="AGENT",
            resource_id=agent.id,
            agent_id=agent.id,
            fokontany_id=fokontany.id,
            details=(
                f"Création de l'agent {agent.matricule} "
                f"({agent.nom} {agent.prenoms}) "
                f"par {admin.nom} {admin.prenoms}."
            ),
        )

        db.commit()
        db.refresh(agent)

        return agent

    @staticmethod
    def get_agent(
        db: Session,
        agent_id: UUID,
    ) -> Agent:

        agent = db.get(Agent, agent_id)

        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent introuvable",
            )

        return agent

    @staticmethod
    def toggle_agent(
        db: Session,
        agent_id: UUID,
        is_active: bool,
        admin: Utilisateur,
    ) -> Agent:

        agent = AdminService.get_agent(db, agent_id)

        agent.is_active = is_active

        log_action(
            db,
            action="UPDATE",
            resource_type="AGENT",
            resource_id=agent.id,
            agent_id=agent.id,
            fokontany_id=agent.fokontany_id,
            details=(
                f"{'Activation' if is_active else 'Désactivation'} "
                f"de l'agent {agent.matricule} "
                f"par {admin.nom} {admin.prenoms}."
            ),
        )

        db.commit()
        db.refresh(agent)

        return agent

    # --------------------------------------------------------
    # Recensements
    # --------------------------------------------------------

    @staticmethod
    def _recensement_item(
        recensement: Recensement,
        personne: Personne | None,
        agent: Agent | None,
        fokontany: Fokontany | None,
    ) -> AdminRecensementItem | None:

        if not personne:
            return None

        return AdminRecensementItem(
            id=recensement.id,
            numero_fiche=recensement.numero_fiche,
            numero_karine=recensement.numero_karine,
            numero_cin=personne.numero_cin,
            nom=personne.nom,
            prenoms=personne.prenoms,
            sexe=personne.sexe,
            date_naissance=(
                personne.date_naissance.isoformat()
                if personne.date_naissance
                else None
            ),
            fokontany_nom=fokontany.nom if fokontany else "—",
            fokontany_code=fokontany.code if fokontany else "—",
            commune=fokontany.commune if fokontany else "—",
            district=fokontany.district if fokontany else "—",
            region=fokontany.region if fokontany else "—",
            agent_nom=(
                f"{agent.nom} {agent.prenoms}".strip()
                if agent
                else "—"
            ),
            agent_matricule=agent.matricule if agent else "—",
            statut=recensement.statut.value,
            ocr_confidence=recensement.ocr_confidence,
            created_at=recensement.created_at,
            validated_at=recensement.validated_at,
        )

    @staticmethod
    def list_recensements(
        db: Session,
        statut: str | None = None,
        fokontany_id: UUID | None = None,
        search: str | None = None,
        limit: int = 200,
    ) -> list[AdminRecensementItem]:

        query = (
            select(Recensement)
            .options(
                joinedload(Recensement.personne),
                joinedload(Recensement.agent),
                joinedload(Recensement.fokontany),
            )
            .order_by(Recensement.created_at.desc())
            .limit(limit)
        )

        if statut:
            try:
                query = query.where(
                    Recensement.statut
                    == RecensementStatus(statut)
                )
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Statut de recensement invalide.",
                )

        if fokontany_id:
            query = query.where(
                Recensement.fokontany_id == fokontany_id
            )

        recensements = db.scalars(query).unique().all()

        items = []

        for recensement in recensements:
            item = AdminService._recensement_item(
                recensement,
                recensement.personne,
                recensement.agent,
                recensement.fokontany,
            )

            if not item:
                continue

            if search:
                pattern = search.strip().lower()

                haystack = " ".join(
                    [
                        item.nom,
                        item.prenoms,
                        item.numero_cin,
                        item.numero_fiche,
                    ]
                ).lower()

                if pattern not in haystack:
                    continue

            items.append(item)

        return items

    @staticmethod
    def update_recensement_status(
        db: Session,
        recensement_id: UUID,
        new_status: str,
        admin: Utilisateur,
    ) -> Recensement:

        recensement = db.get(Recensement, recensement_id)

        if not recensement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recensement introuvable",
            )

        try:
            target = RecensementStatus(new_status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Statut de recensement invalide.",
            )

        previous = recensement.statut.value

        recensement.statut = target

        if target == RecensementStatus.VALIDE:
            recensement.validated_at = datetime.now(timezone.utc)

        log_action(
            db,
            action=(
                "VALIDATE"
                if target == RecensementStatus.VALIDE
                else "REJECT"
            ),
            resource_type="RECENSEMENT",
            resource_id=recensement.id,
            fokontany_id=recensement.fokontany_id,
            details=(
                f"Recensement {recensement.numero_fiche} : "
                f"{previous} -> {target.value} "
                f"par {admin.nom} {admin.prenoms}."
            ),
        )

        db.commit()
        db.refresh(recensement)

        return recensement

    # --------------------------------------------------------
    # Journal d'audit
    # --------------------------------------------------------

    @staticmethod
    def list_audit_logs(
        db: Session,
        limit: int = 200,
    ) -> list[AdminAuditLogItem]:

        entries = (
            db.scalars(
                select(AuditLog)
                .order_by(AuditLog.created_at.desc())
                .limit(limit)
            )
            .all()
        )

        items = []

        for entry in entries:
            fokontany = (
                db.get(Fokontany, entry.fokontany_id)
                if entry.fokontany_id
                else None
            )

            agent = (
                db.get(Agent, entry.agent_id)
                if entry.agent_id
                else None
            )

            chef = fokontany.chef if fokontany else None

            if agent:
                user_type = "AGENT"
                user_name = (
                    f"{agent.nom} {agent.prenoms}".strip()
                )
            elif chef:
                user_type = "CHEF_FOKONTANY"
                user_name = (
                    f"{chef.nom} {chef.prenoms}".strip()
                )
            else:
                user_type = "ADMIN"
                user_name = "Administrateur Système"

            resource_label = RESOURCE_LABELS.get(
                entry.resource_type or "",
                entry.resource_type or "—",
            )

            action_label = ACTION_LABELS.get(
                entry.action,
                entry.action,
            )

            details = entry.details or (
                f"{action_label} - {resource_label} "
                f"{entry.resource_id or ''}".strip()
            )

            items.append(
                AdminAuditLogItem(
                    id=entry.id,
                    timestamp=entry.created_at,
                    user_type=user_type,
                    user_name=user_name,
                    action=entry.action,
                    resource_type=entry.resource_type or "SYSTEM",
                    resource_id=entry.resource_id,
                    fokontany_nom=fokontany.nom if fokontany else None,
                    ip_address=entry.ip_address,
                    details=details,
                )
            )

        return items

    # --------------------------------------------------------
    # Alertes qualité
    # --------------------------------------------------------

    @staticmethod
    def _resolved_alert_ids(
        db: Session,
    ) -> set[str]:
        return set(
            db.scalars(
                select(QualityAlertResolution.alert_id)
            ).all()
        )

    @staticmethod
    def quality_alerts(
        db: Session,
        limit: int = 100,
    ) -> list[QualityAlertItem]:

        today = date.today()
        resolved_ids = AdminService._resolved_alert_ids(db)

        alerts: list[QualityAlertItem] = []

        recensements = (
            db.scalars(
                select(Recensement)
                .options(
                    joinedload(Recensement.personne),
                    joinedload(Recensement.agent),
                    joinedload(Recensement.fokontany),
                )
                .order_by(Recensement.created_at.desc())
                .limit(limit * 4)
            )
            .unique()
            .all()
        )

        seen_cin: dict[str, list[Recensement]] = {}

        for recensement in recensements:
            personne = recensement.personne

            if not personne:
                continue

            agent_label = (
                f"{recensement.agent.nom} "
                f"{recensement.agent.prenoms}".strip()
                if recensement.agent
                else "—"
            )

            fokontany_label = (
                recensement.fokontany.nom
                if recensement.fokontany
                else "—"
            )

            date_label = (
                recensement.created_at.strftime(
                    "%d/%m/%Y à %H:%M"
                )
            )

            # 1. Confiance OCR insuffisante
            confidence = recensement.ocr_confidence

            if (
                confidence is not None
                and confidence < OCR_CONFIDENCE_THRESHOLD
            ):
                alerts.append(
                    QualityAlertItem(
                        id=f"ocr-{recensement.id}",
                        type="FAIBLE_CONFIANCE_OCR",
                        severity=(
                            "HIGH"
                            if confidence < 0.5
                            else "MEDIUM"
                        ),
                        title=(
                            "Confiance de lecture OCR "
                            f"inférieure à "
                            f"{int(OCR_CONFIDENCE_THRESHOLD * 100)}%"
                        ),
                        description=(
                            f"Le numéro CIN {personne.numero_cin} "
                            f"a été lu avec une confiance de "
                            f"{round(confidence * 100, 1)}%. "
                            "Une relecture manuelle est recommandée."
                        ),
                        recensement_id=str(recensement.id),
                        numero_cin=personne.numero_cin,
                        fokontany=fokontany_label,
                        agent=agent_label,
                        date=date_label,
                        resolu=(
                            recensement.statut
                            == RecensementStatus.VALIDE
                        ),
                    )
                )

            # 2. Anomalie de dates
            if (
                personne.date_naissance
                and personne.date_naissance > today
            ) or (
                personne.date_delivrance
                and personne.date_delivrance > today
            ):
                alerts.append(
                    QualityAlertItem(
                        id=f"date-{recensement.id}",
                        type="ANOMALIE_DATE",
                        severity="HIGH",
                        title="Date de la CIN suspecte",
                        description=(
                            f"Une date de la CIN du numéro "
                            f"{personne.numero_cin} est postérieure "
                            "à la date du jour."
                        ),
                        recensement_id=str(recensement.id),
                        numero_cin=personne.numero_cin,
                        fokontany=fokontany_label,
                        agent=agent_label,
                        date=date_label,
                        resolu=(
                            recensement.statut
                            == RecensementStatus.VALIDE
                        ),
                    )
                )

            # 3. Fiche en attente de validation
            if (
                recensement.statut
                == RecensementStatus.A_VERIFIER
            ):
                alerts.append(
                    QualityAlertItem(
                        id=f"fiche-{recensement.id}",
                        type="FICHE_MANQUANTE",
                        severity="MEDIUM",
                        title="Fiche en attente de validation",
                        description=(
                            f"La fiche {recensement.numero_fiche} "
                            f"({personne.nom} {personne.prenoms}) "
                            "n'a pas encore été validée."
                        ),
                        recensement_id=str(recensement.id),
                        numero_cin=personne.numero_cin,
                        fokontany=fokontany_label,
                        agent=agent_label,
                        date=date_label,
                        resolu=False,
                    )
                )

            seen_cin.setdefault(
                personne.numero_cin,
                [],
            ).append(recensement)

        # 4. Doublons de numéro CIN
        for numero_cin, doublons in seen_cin.items():
            if len(doublons) < 2:
                continue

            labels = sorted(
                {
                    (
                        r.fokontany.nom
                        if r.fokontany
                        else "—"
                    )
                    for r in doublons
                }
            )

            agents = sorted(
                {
                    (
                        f"{r.agent.nom} {r.agent.prenoms}".strip()
                        if r.agent
                        else "—"
                    )
                    for r in doublons
                }
            )

            latest = doublons[0]

            alerts.append(
                QualityAlertItem(
                    id=f"doublon-{numero_cin}",
                    type="DOUBLON_CIN",
                    severity="CRITICAL",
                    title="Doublon détecté sur le numéro CIN",
                    description=(
                        f"Le numéro CIN {numero_cin} est associé "
                        f"à {len(doublons)} fiches de recensement."
                    ),
                    numero_cin=numero_cin,
                    fokontany=" & ".join(labels),
                    agent=" / ".join(agents),
                    date=(
                        latest.created_at.strftime(
                            "%d/%m/%Y à %H:%M"
                        )
                    ),
                    resolu=False,
                )
            )

        return [
            alert
            for alert in alerts
            if alert.id not in resolved_ids
        ][:limit]

    @staticmethod
    def resolve_quality_alert(
        db: Session,
        alert_id: str,
        admin: Utilisateur,
    ) -> QualityAlertResolution:

        existing = db.scalar(
            select(QualityAlertResolution).where(
                QualityAlertResolution.alert_id == alert_id
            )
        )

        if existing:
            return existing

        resolution = QualityAlertResolution(
            alert_id=alert_id,
            resolved_by=admin.id,
        )

        db.add(resolution)

        log_action(
            db,
            action="UPDATE",
            resource_type="SYSTEM",
            resource_id=alert_id,
            details=(
                f"Alerte qualité traitée : {alert_id} "
                f"par {admin.nom} {admin.prenoms}."
            ),
        )

        db.commit()
        db.refresh(resolution)

        return resolution
