from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependancy import get_current_user, get_optional_actor
from app.core.security import (
    ACCESS_TOKEN_COOKIE,
    create_access_token,
    verify_password,
)
from app.db.database import get_db
from app.models.agent import Agent
from app.models.utilisateur import Utilisateur
from app.schemas.auth import LoginRequest, LoginResponse, UserResponse
from app.services.audit_service import (
    OUTCOME_SUCCESS,
    log_action,
    log_login_failure,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: Utilisateur = Depends(get_current_user),
):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        nom=current_user.nom,
        prenoms=current_user.prenoms,
        role=current_user.role,
    )


@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(Utilisateur).where(
            Utilisateur.email == data.email
        )
    )

    if not user:
        log_login_failure(
            db,
            identifier=data.email,
            request=request,
            details=(
                "Tentative de connexion administrateur refusée : "
                f"adresse {data.email} inconnue."
            ),
        )

        db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    if not user.is_active:
        log_login_failure(
            db,
            identifier=data.email,
            request=request,
            details=(
                "Tentative de connexion administrateur refusée : "
                f"compte {user.email} désactivé."
            ),
        )

        db.commit()

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé",
        )

    if not verify_password(
        data.password,
        user.password_hash,
    ):
        log_login_failure(
            db,
            identifier=data.email,
            request=request,
            details=(
                "Tentative de connexion administrateur refusée : "
                f"mot de passe incorrect pour {user.email}."
            ),
        )

        db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    token = create_access_token(
        user.id,
        user.role,
        "ADMIN",
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
        resource_id=user.id,
        utilisateur_id=user.id,
        outcome=OUTCOME_SUCCESS,
        details=(
            f"Connexion de l'administrateur "
            f"{user.nom} {user.prenoms} ({user.email}) "
            "à la console d'administration."
        ),
        request=request,
    )

    db.commit()

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            nom=user.nom,
            prenoms=user.prenoms,
            role=user.role,
        ),
    )


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    actor: Utilisateur | Agent | None = Depends(get_optional_actor),
):
    response.delete_cookie(
        key=ACCESS_TOKEN_COOKIE,
        path="/",
    )

    if isinstance(actor, Utilisateur):
        details = (
            f"Déconnexion de {actor.nom} {actor.prenoms} "
            f"({actor.email})."
        )

        log_action(
            db,
            action="LOGOUT",
            resource_type="SYSTEM",
            resource_id=actor.id,
            utilisateur_id=actor.id,
            fokontany_id=(
                actor.fokontany.id
                if actor.fokontany
                else None
            ),
            outcome=OUTCOME_SUCCESS,
            details=details,
            request=request,
        )

    elif isinstance(actor, Agent):
        log_action(
            db,
            action="LOGOUT",
            resource_type="SYSTEM",
            resource_id=actor.id,
            agent_id=actor.id,
            fokontany_id=actor.fokontany_id,
            outcome=OUTCOME_SUCCESS,
            details=(
                f"Déconnexion de l'agent {actor.matricule} "
                f"({actor.nom} {actor.prenoms})."
            ),
            request=request,
        )

    db.commit()

    return {
        "message": "Déconnexion réussie"
    }