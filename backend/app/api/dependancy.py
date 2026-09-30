from uuid import UUID

from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.security import (
    ACCESS_TOKEN_COOKIE,
    decode_access_token,
)
from app.db.database import get_db
from app.models.agent import Agent
from app.models.utilisateur import Utilisateur


security = HTTPBearer(auto_error=False)


def get_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    access_token: str | None = Cookie(
        default=None,
        alias=ACCESS_TOKEN_COOKIE,
    ),
) -> str:

    # 1. Priorité au header Authorization
    if credentials:
        return credentials.credentials

    # 2. Sinon, utiliser le cookie HttpOnly
    if access_token:
        return access_token

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentification requise",
    )


def get_current_user(
    token: str = Depends(get_token),
    db: Session = Depends(get_db),
) -> Utilisateur:

    payload = decode_access_token(token)

    if payload.get("type") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide",
        )

    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiant utilisateur invalide",
        )

    user = db.scalar(
        select(Utilisateur).where(
            Utilisateur.id == user_uuid
        )
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur introuvable",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé",
        )

    return user


def require_admin(
    current_user: Utilisateur = Depends(get_current_user),
) -> Utilisateur:

    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )

    return current_user


def get_current_agent(
    token: str = Depends(get_token),
    db: Session = Depends(get_db),
) -> Agent:

    payload = decode_access_token(token)

    if payload.get("type") != "AGENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux agents.",
        )

    agent_id = payload.get("sub")

    if not agent_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide.",
        )

    try:
        agent_uuid = UUID(agent_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiant agent invalide.",
        )

    agent = (
        db.query(Agent)
        .options(joinedload(Agent.fokontany))
        .filter(Agent.id == agent_uuid)
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Agent introuvable.",
        )

    if not agent.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte agent désactivé.",
        )

    return agent


def get_current_chef(
    token: str = Depends(get_token),
    db: Session = Depends(get_db),
) -> Utilisateur:

    payload = decode_access_token(token)

    if payload.get("type") != "CHEF_FOKONTANY":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux Chefs Fokontany.",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide.",
        )

    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiant utilisateur invalide.",
        )

    user = db.scalar(
        select(Utilisateur).where(
            Utilisateur.id == user_uuid
        )
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur introuvable.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé.",
        )

    if user.role != "CHEF_FOKONTANY":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux Chefs Fokontany.",
        )

    if not user.fokontany:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Aucun Fokontany n'est associé à ce compte.",
        )

    if not user.fokontany.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce Fokontany est désactivé.",
        )

    return user


def require_chef(
    current_chef: Utilisateur = Depends(get_current_chef),
) -> Utilisateur:
    return current_chef