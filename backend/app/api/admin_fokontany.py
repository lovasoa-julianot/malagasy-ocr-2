import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependancy import require_admin
from app.core.security import hash_password
from app.db.database import get_db
from app.models.fokontany import Fokontany
from app.models.utilisateur import Utilisateur
from app.schemas.fokontany import (
    FokontanyCreate,
    FokontanyResponse,
    FokontanyUpdate,
)
from app.services.audit_service import log_action


router = APIRouter(
    prefix="/api/admin/fokontany",
    tags=["Admin - Fokontany"],
)


@router.post(
    "",
    response_model=FokontanyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_fokontany(
    data: FokontanyCreate,
    request: Request,
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(require_admin),
):
    existing = db.scalar(
        select(Fokontany).where(
            Fokontany.code == data.code
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Le code du Fokontany existe déjà",
        )

    fokontany = Fokontany(
        nom=data.nom,
        code=data.code,
        commune=data.commune,
        district=data.district,
        region=data.region,
        province=data.province,
        code_acces_hash=hash_password(data.code_acces),
        code_acces_clair=data.code_acces,
        objectif_habitants=data.objectif_habitants,
        is_active=True,
    )

    db.add(fokontany)
    db.flush()

    log_action(
        db,
        action="CREATE",
        resource_type="FOKONTANY",
        resource_id=fokontany.id,
        fokontany_id=fokontany.id,
        details=(
            f"Création du territoire Fokontany "
            f"{fokontany.nom} ({fokontany.code}) "
            f"par {admin.nom} {admin.prenoms}."
        ),
        request=request,
    )

    db.commit()
    db.refresh(fokontany)

    return fokontany


@router.get(
    "",
    response_model=list[FokontanyResponse],
)
def list_fokontany(
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(require_admin),
):
    return db.scalars(
        select(Fokontany)
        .order_by(Fokontany.nom)
    ).all()


@router.get(
    "/{fokontany_id}",
    response_model=FokontanyResponse,
)
def get_fokontany(
    fokontany_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(require_admin),
):
    fokontany = db.get(
        Fokontany,
        fokontany_id,
    )

    if not fokontany:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fokontany introuvable",
        )

    return fokontany


@router.put(
    "/{fokontany_id}",
    response_model=FokontanyResponse,
)
def update_fokontany(
    fokontany_id: uuid.UUID,
    data: FokontanyUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(require_admin),
):
    fokontany = db.get(
        Fokontany,
        fokontany_id,
    )

    if not fokontany:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fokontany introuvable",
        )

    updates = data.model_dump(
        exclude_unset=True
    )

    if "code_acces" in updates:
        new_code = updates.pop("code_acces")

        fokontany.code_acces_hash = hash_password(new_code)
        fokontany.code_acces_clair = new_code

    for field, value in updates.items():
        setattr(fokontany, field, value)

    log_action(
        db,
        action="UPDATE",
        resource_type="FOKONTANY",
        resource_id=fokontany.id,
        fokontany_id=fokontany.id,
        details=(
            f"Modification du territoire Fokontany "
            f"{fokontany.nom} ({fokontany.code}) "
            f"par {admin.nom} {admin.prenoms}. "
            f"Champs modifiés : {', '.join(sorted(updates)) or 'code_acces'}"
        ),
        request=request,
    )

    db.commit()
    db.refresh(fokontany)

    return fokontany


@router.delete(
    "/{fokontany_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def deactivate_fokontany(
    fokontany_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(require_admin),
):
    fokontany = db.get(
        Fokontany,
        fokontany_id,
    )

    if not fokontany:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fokontany introuvable",
        )

    # On désactive plutôt que de supprimer.
    fokontany.is_active = False

    db.commit()