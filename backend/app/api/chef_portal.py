from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, Response
from sqlalchemy.orm import Session

from app.api.dependancy import require_chef
from app.core.security import ACCESS_TOKEN_COOKIE, create_access_token
from app.db.database import get_db
from app.models.fokontany import Fokontany
from app.models.utilisateur import Utilisateur
from app.schemas.chef_portal import (
    AccessCodeDetailsResponse,
    ChefAgentItem,
    ChefDashboardStatsResponse,
    ChefFokontanyLoginRequest,
    ChefFokontanyLoginResponse,
    ChefFokontanyUserResponse,
    ChefRecensementItem,
    CitizenItem,
    ToggleAgentRequest,
    ToggleAgentResponse,
    UpdateRecensementStatusRequest,
    UpdateRecensementStatusResponse,
)
from app.services.audit_service import OUTCOME_SUCCESS, log_action
from app.services.chef_portal_service import ChefPortalService


router = APIRouter(
    prefix="/api/chef-fokontany",
    tags=["Chef Fokontany Portal"],
)


def current_fokontany(chef: Utilisateur) -> Fokontany:
    return chef.fokontany


# ============================================================
# AUTHENTIFICATION
# ============================================================

@router.post(
    "/login",
    response_model=ChefFokontanyLoginResponse,
)
def chef_fokontany_login(
    data: ChefFokontanyLoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Connexion d'un Chef Fokontany.

    L'identifiant accepte l'email du Chef
    ou le code du Fokontany.
    """

    chef, fokontany = ChefPortalService.authenticate(
        db=db,
        identifier=data.identifier,
        password=data.password,
    )

    token = create_access_token(
        chef.id,
        "CHEF_FOKONTANY",
        "CHEF_FOKONTANY",
    )

    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=token,
        httponly=True,
        secure=False,  # True en production avec HTTPS
        samesite="lax",
        path="/",
        max_age=60 * 60 * 24,
    )

    log_action(
        db,
        action="LOGIN",
        resource_type="SYSTEM",
        resource_id=chef.id,
        utilisateur_id=chef.id,
        fokontany_id=fokontany.id,
        outcome=OUTCOME_SUCCESS,
        details=(
            f"Connexion de {chef.nom} {chef.prenoms} "
            f"au portail du Fokontany {fokontany.code}."
        ),
        request=request,
    )

    db.commit()

    return ChefFokontanyLoginResponse(
        access_token=token,
        token_type="bearer",
        user=ChefPortalService.build_user(chef, fokontany),
    )


@router.get(
    "/me",
    response_model=ChefFokontanyUserResponse,
)
def get_chef_fokontany_me(
    chef: Utilisateur = Depends(require_chef),
):
    return ChefPortalService.build_user(
        chef,
        current_fokontany(chef),
    )


# ============================================================
# TABLEAU DE BORD
# ============================================================

@router.get(
    "/dashboard",
    response_model=ChefDashboardStatsResponse,
)
def get_chef_dashboard(
    db: Session = Depends(get_db),
    chef: Utilisateur = Depends(require_chef),
):
    return ChefPortalService.dashboard(
        db,
        current_fokontany(chef),
    )


# ============================================================
# AGENTS
# ============================================================

@router.get(
    "/agents",
    response_model=list[ChefAgentItem],
)
def get_chef_agents(
    db: Session = Depends(get_db),
    chef: Utilisateur = Depends(require_chef),
):
    return ChefPortalService.list_agents(
        db,
        current_fokontany(chef),
    )


@router.patch(
    "/agents/{agent_id}/toggle",
    response_model=ToggleAgentResponse,
)
def toggle_chef_agent(
    agent_id: UUID,
    data: ToggleAgentRequest,
    db: Session = Depends(get_db),
    chef: Utilisateur = Depends(require_chef),
):
    agent = ChefPortalService.toggle_agent(
        db=db,
        fokontany=current_fokontany(chef),
        agent_id=agent_id,
        is_active=data.is_active,
        chef=chef,
    )

    return ToggleAgentResponse(
        success=True,
        id=agent.id,
        is_active=agent.is_active,
        message=(
            "Agent activé."
            if agent.is_active
            else "Agent désactivé."
        ),
    )


# ============================================================
# RECENSEMENTS
# ============================================================

@router.get(
    "/recensements",
    response_model=list[ChefRecensementItem],
)
def get_chef_recensements(
    statut: str | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(get_db),
    chef: Utilisateur = Depends(require_chef),
):
    return ChefPortalService.list_recensements(
        db,
        current_fokontany(chef),
        statut=statut,
        limit=limit,
    )


@router.patch(
    "/recensements/{recensement_id}/status",
    response_model=UpdateRecensementStatusResponse,
)
def update_chef_recensement_status(
    recensement_id: UUID,
    data: UpdateRecensementStatusRequest,
    db: Session = Depends(get_db),
    chef: Utilisateur = Depends(require_chef),
):
    recensement = ChefPortalService.update_recensement_status(
        db=db,
        fokontany=current_fokontany(chef),
        recensement_id=recensement_id,
        new_status=data.statut,
        chef=chef,
    )

    return UpdateRecensementStatusResponse(
        success=True,
        id=recensement.id,
        statut=recensement.statut.value,
        message=(
            f"Recensement {recensement.numero_fiche} "
            f"passé à {recensement.statut.value}."
        ),
    )


# ============================================================
# REGISTRE DES CITOYENS
# ============================================================

@router.get(
    "/citizens",
    response_model=list[CitizenItem],
)
def get_citizen_registry(
    search: str | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(get_db),
    chef: Utilisateur = Depends(require_chef),
):
    return ChefPortalService.list_citizens(
        db,
        current_fokontany(chef),
        search=search,
        limit=limit,
    )


# ============================================================
# CODE D'ACCES / QR CODE
# ============================================================

@router.get(
    "/access-code",
    response_model=AccessCodeDetailsResponse,
)
def get_access_code(
    db: Session = Depends(get_db),
    chef: Utilisateur = Depends(require_chef),
):
    return ChefPortalService.access_code_details(
        db,
        current_fokontany(chef),
    )


@router.post(
    "/access-code/regenerate",
    response_model=AccessCodeDetailsResponse,
)
def regenerate_access_code(
    db: Session = Depends(get_db),
    chef: Utilisateur = Depends(require_chef),
):
    return ChefPortalService.regenerate_access_code(
        db,
        current_fokontany(chef),
        chef,
    )
