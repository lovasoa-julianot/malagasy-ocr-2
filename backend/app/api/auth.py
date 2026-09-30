from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependancy import get_current_user
from app.core.security import (
    ACCESS_TOKEN_COOKIE,
    create_access_token,
    verify_password,
)
from app.db.database import get_db
from app.models.utilisateur import Utilisateur
from app.schemas.auth import LoginRequest, LoginResponse, UserResponse


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
    response: Response,
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(Utilisateur).where(
            Utilisateur.email == data.email
        )
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé",
        )

    if not verify_password(
        data.password,
        user.password_hash,
    ):
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
def logout(response: Response):
    response.delete_cookie(
        key=ACCESS_TOKEN_COOKIE,
        path="/",
    )

    return {
        "message": "Déconnexion réussie"
    }