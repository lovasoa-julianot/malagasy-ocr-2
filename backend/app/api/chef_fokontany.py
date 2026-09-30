
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependancy import require_admin
from app.db.database import get_db
from app.models.utilisateur import Utilisateur
from app.schemas.chef_fokontany import (
    ChefFokontanyApproveRequest,
    ChefFokontanyApproveResponse,
    ChefFokontanyRegisterRequest,
    ChefFokontanyRegisterResponse,
    ChefFokontanyRejectRequest,
    ChefFokontanyReviewResponse,
    ChefFokontanyRequestResponse,
)
from app.services.chef_fokontany_service import (
    ChefFokontanyService,
)


router = APIRouter(
    prefix="/api",
    tags=["Chef Fokontany"],
)


# ============================================================
# INSCRIPTION PUBLIQUE DU CHEF FOKONTANY
# ============================================================

@router.post(
    "/chef-fokontany/register",
    response_model=ChefFokontanyRegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_chef_fokontany(
    data: ChefFokontanyRegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Soumet une demande d'inscription Chef Fokontany.

    La demande est créée avec le statut EN_ATTENTE.
    Elle devra être validée par un administrateur.
    """

    request = ChefFokontanyService.register_request(
        db=db,
        data=data,
    )

    return ChefFokontanyRegisterResponse(
        success=True,
        request_id=request.id,
        statut=request.statut.value,
        message=(
            "Votre demande a été enregistrée. "
            "Elle sera vérifiée et validée par un administrateur."
        ),
    )


# ============================================================
# LISTE DES DEMANDES EN ATTENTE
# ============================================================

@router.get(
    "/admin/chef-fokontany/requests",
    response_model=list[ChefFokontanyRequestResponse],
)
def get_pending_chef_fokontany_requests(
    db: Session = Depends(get_db),
    current_admin: Utilisateur = Depends(require_admin),
):
    """
    Retourne les demandes Chef Fokontany
    en attente de validation.
    """

    return ChefFokontanyService.get_pending_requests(
        db=db,
    )


# ============================================================
# DETAIL D'UNE DEMANDE
# ============================================================

@router.get(
    "/admin/chef-fokontany/requests/{request_id}",
    response_model=ChefFokontanyRequestResponse,
)
def get_chef_fokontany_request(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_admin: Utilisateur = Depends(require_admin),
):
    """
    Retourne le détail d'une demande Chef Fokontany.
    """

    return ChefFokontanyService.get_request(
        db=db,
        request_id=request_id,
    )


# ============================================================
# APPROUVER UNE DEMANDE
# ============================================================

@router.post(
    "/admin/chef-fokontany/requests/{request_id}/approve",
    response_model=ChefFokontanyApproveResponse,
)
def approve_chef_fokontany_request(
    request_id: UUID,
    data: ChefFokontanyApproveRequest | None = None,
    db: Session = Depends(get_db),
    current_admin: Utilisateur = Depends(require_admin),
):
    """
    Approuve une demande Chef Fokontany.

    Cette opération :
    - crée le compte du Chef Fokontany ;
    - crée le Fokontany ;
    - génère son code d'accès ;
    - associe le Chef au Fokontany ;
    - passe la demande à APPROUVE.
    """

    request, access_code = (
        ChefFokontanyService.approve_request(
            db=db,
            request_id=request_id,
            admin=current_admin,
            data=data,
        )
    )

    return ChefFokontanyApproveResponse(
        success=True,
        request_id=request.id,
        statut=request.statut.value,
        message=(
            "La demande a été approuvée. "
            "Le compte Chef Fokontany et le Fokontany "
            "ont été créés."
        ),
        code_acces_fokontany=access_code,
    )


# ============================================================
# REJETER UNE DEMANDE
# ============================================================

@router.post(
    "/admin/chef-fokontany/requests/{request_id}/reject",
    response_model=ChefFokontanyReviewResponse,
)
def reject_chef_fokontany_request(
    request_id: UUID,
    data: ChefFokontanyRejectRequest,
    db: Session = Depends(get_db),
    current_admin: Utilisateur = Depends(require_admin),
):
    """
    Rejette une demande Chef Fokontany.

    Le motif du rejet est conservé en base.
    """

    request = ChefFokontanyService.reject_request(
        db=db,
        request_id=request_id,
        admin=current_admin,
        data=data,
    )

    return ChefFokontanyReviewResponse(
        success=True,
        request_id=request.id,
        statut=request.statut.value,
        message="La demande Chef Fokontany a été rejetée.",
    )

