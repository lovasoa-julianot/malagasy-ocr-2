from datetime import date, datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.core.security import hash_password, verify_password
from app.models.agent import Agent
from app.models.fokontany import Fokontany
from app.models.personne import Personne
from app.models.recensement import Recensement, RecensementStatus
from app.models.utilisateur import Utilisateur
from app.schemas.chef_portal import (
    AccessCodeDetailsResponse,
    ChefAgentItem,
    ChefDashboardStatsResponse,
    ChefFokontanyUserResponse,
    ChefRecensementItem,
    CitizenItem,
)
from app.services.audit_service import log_action
from app.services.chef_fokontany_service import (
    generate_fokontany_access_code,
)


# ============================================================
# FORMATTERS
# ============================================================

def format_fr(value: date | datetime | None) -> str:
    if value is None:
        return "—"

    return value.strftime("%d/%m/%Y")


def format_relative_fr(value: datetime | None) -> str:
    if value is None:
        return "Aucune activité"

    now = datetime.now(timezone.utc)
    delta = now - value

    seconds = int(delta.total_seconds())

    if seconds < 0:
        return "À l'instant"

    if seconds < 60:
        return "Il y a moins d'une minute"

    minutes = seconds // 60

    if minutes < 60:
        return f"Il y a {minutes} minute{'s' if minutes > 1 else ''}"

    hours = minutes // 60

    if hours < 24:
        return f"Il y a {hours} heure{'s' if hours > 1 else ''}"

    days = hours // 24

    if days < 30:
        return f"Il y a {days} jour{'s' if days > 1 else ''}"

    return format_fr(value)


SEXE_LABELS = {
    "M": "Masculin",
    "F": "Féminin",
    "H": "Masculin",
    "FEMININ": "Féminin",
    "MASCULIN": "Masculin",
}


def sexe_label(value: str | None) -> str:
    if not value:
        return "—"

    return SEXE_LABELS.get(
        value.strip().upper(),
        value.capitalize(),
    )


def join_address(*parts: str | None) -> str:
    cleaned = [
        part.strip()
        for part in parts
        if part and part.strip()
    ]

    return ", ".join(cleaned) if cleaned else "—"


def build_qr_value(fokontany: Fokontany) -> str:
    """
    Payload encodé dans le QR code affiché par le Chef Fokontany.

    L'agent scanne ce QR puis saisit (ou confirme) le code d'accès.
    Format : FK|<code_fokontany>|<code_acces>
    """

    return "|".join(
        [
            "FK",
            fokontany.code,
            fokontany.code_acces_clair or "",
        ]
    )


# ============================================================
# SERVICE
# ============================================================

class ChefPortalService:

    # --------------------------------------------------------
    # Authentification
    # --------------------------------------------------------

    @staticmethod
    def authenticate(
        db: Session,
        identifier: str,
        password: str,
    ) -> tuple[Utilisateur, Fokontany]:

        identifier = identifier.strip()
        email = identifier.lower()

        # 1. Connexion par code Fokontany
        fokontany = db.scalar(
            select(Fokontany).where(
                func.upper(Fokontany.code) == identifier.upper()
            )
        )

        user = None

        if fokontany and fokontany.chef_id:
            user = db.get(Utilisateur, fokontany.chef_id)

        # 2. Connexion par email
        if not user:
            user = db.scalar(
                select(Utilisateur).where(
                    func.lower(Utilisateur.email) == email,
                    Utilisateur.role == "CHEF_FOKONTANY",
                )
            )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Identifiant ou mot de passe incorrect",
            )

        if not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Identifiant ou mot de passe incorrect",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Compte désactivé",
            )

        chef_fokontany = db.scalar(
            select(Fokontany).where(
                Fokontany.chef_id == user.id
            )
        )

        if not chef_fokontany:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Aucune demande de rattachement "
                    "n'est encore validée pour ce compte."
                ),
            )

        if not chef_fokontany.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ce Fokontany est désactivé",
            )

        return user, chef_fokontany

    @staticmethod
    def build_user(
        user: Utilisateur,
        fokontany: Fokontany,
    ) -> ChefFokontanyUserResponse:

        return ChefFokontanyUserResponse(
            id=user.id,
            email=user.email,
            nom=user.nom,
            prenoms=user.prenoms,
            telephone=None,
            role=user.role,
            fokontany_id=fokontany.id,
            fokontany_nom=fokontany.nom,
            fokontany_code=fokontany.code,
            commune=fokontany.commune,
            district=fokontany.district,
            code_district=fokontany.code_district,
            region=fokontany.region,
            province=fokontany.province,
        )

    # --------------------------------------------------------
    # Tableau de bord
    # --------------------------------------------------------

    @staticmethod
    def dashboard(
        db: Session,
        fokontany: Fokontany,
    ) -> ChefDashboardStatsResponse:

        today = datetime.now(timezone.utc).date()

        rows = (
            db.query(
                Recensement.statut,
                func.count(Recensement.id),
            )
            .filter(
                Recensement.fokontany_id == fokontany.id
            )
            .group_by(Recensement.statut)
            .all()
        )

        counts = {
            statut.value: total
            for statut, total in rows
        }

        valides = counts.get(RecensementStatus.VALIDE.value, 0)
        a_verifier = counts.get(RecensementStatus.A_VERIFIER.value, 0)
        rejets = counts.get(RecensementStatus.REJETE.value, 0)

        total = sum(counts.values())

        agents_total = (
            db.query(func.count(Agent.id))
            .filter(Agent.fokontany_id == fokontany.id)
            .scalar()
            or 0
        )

        agents_actifs = (
            db.query(func.count(Agent.id))
            .filter(
                Agent.fokontany_id == fokontany.id,
                Agent.is_active.is_(True),
            )
            .scalar()
            or 0
        )

        aujourdhui = (
            db.query(func.count(Recensement.id))
            .filter(
                Recensement.fokontany_id == fokontany.id,
                func.date(Recensement.created_at) == today,
            )
            .scalar()
            or 0
        )

        objectif = fokontany.objectif_habitants or 0

        progression = (
            round((valides / objectif) * 100)
            if objectif
            else 0
        )

        return ChefDashboardStatsResponse(
            totalRecensements=total,
            valides=valides,
            aVerifier=a_verifier,
            rejets=rejets,
            agentsActifs=agents_actifs,
            agentsTotal=agents_total,
            aujourdhui=aujourdhui,
            progressionPourcentage=min(progression, 100),
            objectifHabitants=objectif,
        )

    # --------------------------------------------------------
    # Agents
    # --------------------------------------------------------

    @staticmethod
    def list_agents(
        db: Session,
        fokontany: Fokontany,
    ) -> list[ChefAgentItem]:

        today = datetime.now(timezone.utc).date()

        agents = (
            db.scalars(
                select(Agent)
                .where(Agent.fokontany_id == fokontany.id)
                .order_by(Agent.created_at.desc())
            )
            .all()
        )

        items = []

        for agent in agents:
            total = (
                db.query(func.count(Recensement.id))
                .filter(Recensement.agent_id == agent.id)
                .scalar()
                or 0
            )

            aujourdhui = (
                db.query(func.count(Recensement.id))
                .filter(
                    Recensement.agent_id == agent.id,
                    func.date(Recensement.created_at) == today,
                )
                .scalar()
                or 0
            )

            items.append(
                ChefAgentItem(
                    id=agent.id,
                    matricule=agent.matricule,
                    nom=agent.nom,
                    prenoms=agent.prenoms,
                    telephone=agent.telephone,
                    email=agent.email,
                    adresse=agent.adresse,
                    is_active=agent.is_active,
                    total_recensements=total,
                    recensements_aujourdhui=aujourdhui,
                    created_at=agent.created_at,
                )
            )

        return items

    @staticmethod
    def get_agent(
        db: Session,
        fokontany: Fokontany,
        agent_id: UUID,
    ) -> Agent:

        agent = db.get(Agent, agent_id)

        if not agent or agent.fokontany_id != fokontany.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent introuvable dans ce Fokontany.",
            )

        return agent

    @staticmethod
    def toggle_agent(
        db: Session,
        fokontany: Fokontany,
        agent_id: UUID,
        is_active: bool,
        chef: Utilisateur,
    ) -> Agent:

        agent = ChefPortalService.get_agent(
            db,
            fokontany,
            agent_id,
        )

        agent.is_active = is_active

        log_action(
            db,
            action="UPDATE",
            resource_type="AGENT",
            resource_id=agent.id,
            agent_id=agent.id,
            fokontany_id=fokontany.id,
            details=(
                f"{'Activation' if is_active else 'Désactivation'} "
                f"de l'agent {agent.matricule} "
                f"par le Chef Fokontany {chef.nom} {chef.prenoms}."
            ),
        )

        db.commit()
        db.refresh(agent)

        return agent

    # --------------------------------------------------------
    # Recensements
    # --------------------------------------------------------

    @staticmethod
    def list_recensements(
        db: Session,
        fokontany: Fokontany,
        statut: str | None = None,
        limit: int = 200,
    ) -> list[ChefRecensementItem]:

        query = (
            select(Recensement)
            .options(
                joinedload(Recensement.personne),
                joinedload(Recensement.agent),
            )
            .where(Recensement.fokontany_id == fokontany.id)
            .order_by(Recensement.created_at.desc())
            .limit(limit)
        )

        if statut:
            query = query.where(
                Recensement.statut == RecensementStatus(statut)
            )

        recensements = db.scalars(query).all()

        items = []

        for recensement in recensements:
            personne = recensement.personne
            agent = recensement.agent

            if not personne:
                continue

            items.append(
                ChefRecensementItem(
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
                    adresse=join_address(
                        personne.lot_logement,
                        personne.quartier_secteur,
                    ),
                    agent_nom=(
                        f"{agent.nom} {agent.prenoms}".strip()
                        if agent
                        else "—"
                    ),
                    agent_matricule=agent.matricule if agent else "—",
                    statut=recensement.statut.value,
                    ocr_confidence=recensement.ocr_confidence,
                    created_at=recensement.created_at.isoformat(),
                    date_formatted=format_fr(recensement.created_at),
                    heure_formatted=(
                        recensement.created_at.strftime("%H:%M")
                        if recensement.created_at
                        else "—"
                    ),
                )
            )

        return items

    @staticmethod
    def get_recensement(
        db: Session,
        fokontany: Fokontany,
        recensement_id: UUID,
    ) -> Recensement:

        recensement = db.get(Recensement, recensement_id)

        if not recensement or recensement.fokontany_id != fokontany.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recensement introuvable dans ce Fokontany.",
            )

        return recensement

    @staticmethod
    def update_recensement_status(
        db: Session,
        fokontany: Fokontany,
        recensement_id: UUID,
        new_status: str,
        chef: Utilisateur,
    ) -> Recensement:

        recensement = ChefPortalService.get_recensement(
            db,
            fokontany,
            recensement_id,
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
            action="VALIDATE" if target == RecensementStatus.VALIDE else "REJECT",
            resource_type="RECENSEMENT",
            resource_id=recensement.id,
            fokontany_id=fokontany.id,
            details=(
                f"Recensement {recensement.numero_fiche} : "
                f"{previous} -> {target.value} "
                f"par le Chef Fokontany {chef.nom} {chef.prenoms}."
            ),
        )

        db.commit()
        db.refresh(recensement)

        return recensement

    # --------------------------------------------------------
    # Registre des citoyens
    # --------------------------------------------------------

    @staticmethod
    def list_citizens(
        db: Session,
        fokontany: Fokontany,
        search: str | None = None,
        limit: int = 200,
    ) -> list[CitizenItem]:

        query = (
            select(Recensement)
            .join(Personne, Recensement.personne_id == Personne.id)
            .options(joinedload(Recensement.personne))
            .where(
                Recensement.fokontany_id == fokontany.id,
                Recensement.statut == RecensementStatus.VALIDE,
            )
            .order_by(Recensement.created_at.desc())
            .limit(limit)
        )

        if search:
            pattern = f"%{search.strip()}%"

            query = query.where(
                Personne.nom.ilike(pattern)
                | Personne.prenoms.ilike(pattern)
                | Personne.numero_cin.ilike(pattern)
            )

        recensements = db.scalars(query).unique().all()

        items = []

        for recensement in recensements:
            personne = recensement.personne

            if not personne:
                continue

            items.append(
                CitizenItem(
                    id=personne.id,
                    numero_cin=personne.numero_cin,
                    nom=personne.nom,
                    prenoms=personne.prenoms,
                    sexe=sexe_label(personne.sexe),
                    date_naissance=format_fr(personne.date_naissance),
                    lieu_naissance=personne.lieu_naissance or "—",
                    profession=personne.profession or "—",
                    adresse=join_address(
                        personne.lot_logement,
                        personne.quartier_secteur,
                    ),
                    telephone=personne.telephone,
                    date_recensement=format_fr(recensement.created_at),
                    numero_fiche=recensement.numero_fiche,
                )
            )

        return items

    # --------------------------------------------------------
    # Code d'accès / QR code
    # --------------------------------------------------------

    @staticmethod
    def access_code_details(
        db: Session,
        fokontany: Fokontany,
    ) -> AccessCodeDetailsResponse:

        if not fokontany.code_acces_clair:
            # Les Fokontany créés avant la mise en place de l'affichage
            # du code ne disposent pas encore de version en clair :
            # on en génère une pour que le Chef puisse l'afficher.
            fokontany.code_acces_clair = (
                generate_fokontany_access_code()
            )
            fokontany.code_acces_hash = hash_password(
                fokontany.code_acces_clair
            )

            db.commit()
            db.refresh(fokontany)

        agents_count = (
            db.query(func.count(Agent.id))
            .filter(
                Agent.fokontany_id == fokontany.id,
                Agent.is_active.is_(True),
            )
            .scalar()
            or 0
        )

        return AccessCodeDetailsResponse(
            fokontany_id=fokontany.id,
            code_fokontany=fokontany.code,
            nom_fokontany=fokontany.nom,
            commune=fokontany.commune,
            district=fokontany.district,
            region=fokontany.region,
            code_acces=fokontany.code_acces_clair,
            qr_value=build_qr_value(fokontany),
            agents_count=agents_count,
            last_updated=(
                fokontany.updated_at.isoformat()
                if fokontany.updated_at
                else datetime.now(timezone.utc).isoformat()
            ),
        )

    @staticmethod
    def regenerate_access_code(
        db: Session,
        fokontany: Fokontany,
        chef: Utilisateur,
    ) -> AccessCodeDetailsResponse:

        new_code = generate_fokontany_access_code()

        fokontany.code_acces_hash = hash_password(new_code)
        fokontany.code_acces_clair = new_code

        log_action(
            db,
            action="UPDATE",
            resource_type="FOKONTANY",
            resource_id=fokontany.id,
            fokontany_id=fokontany.id,
            details=(
                "Régénération du code d'accès du Fokontany "
                f"{fokontany.code} par {chef.nom} {chef.prenoms}."
            ),
        )

        db.commit()
        db.refresh(fokontany)

        return ChefPortalService.access_code_details(
            db,
            fokontany,
        )
