from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    Response,
    status,
)
from sqlalchemy import select, Select
from sqlalchemy.orm import Session

from app.core.security import verify_password, ACCESS_TOKEN_COOKIE
from app.db.database import get_db
from app.models.agent import Agent
from app.models.fokontany import Fokontany
from app.schemas.agent import (
    AgentAccessRequest,
    AgentLoginResponse,
    AgentRegisterRequest,
    AgentResponse,
    FokontanyAccessRequest,
    FokontanyAccessResponse,
)
from app.services.agent_service import generate_agent_matricule
from app.services.audit_service import (
    OUTCOME_SUCCESS,
    log_action,
    log_login_failure,
)
from app.core.security import create_access_token
from app.api.dependancy import get_current_agent
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_access_token

security = HTTPBearer()


router = APIRouter(
    prefix="/api/agent",
    tags=["Agent Access"],
)

@router.get(
    "/me",
    response_model=AgentResponse,
)
def get_current_agent_info(
    current_agent: Agent = Depends(get_current_agent),
):
    return current_agent

@router.post(
    "/access",
    response_model=FokontanyAccessResponse,
)

def verify_fokontany_access(
    data: FokontanyAccessRequest,
    db: Session = Depends(get_db),
):
    fokontany = db.scalar(
        select(Fokontany).where(
            Fokontany.code == data.code
        )
    )

    if not fokontany:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fokontany introuvable",
        )

    if not fokontany.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce Fokontany est désactivé",
        )

    if not verify_password(
        data.code_acces,
        fokontany.code_acces_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Code d'accès incorrect",
        )

    agent_exists = db.scalar(
        select(Agent.id)
        .where(
            Agent.fokontany_id == fokontany.id,
            Agent.is_active == True,
        )
        .limit(1)
    )

    if agent_exists:
        return FokontanyAccessResponse(
            access_granted=True,
            registration_required=False,
            fokontany_id=fokontany.id,
            fokontany_nom=fokontany.nom,
            message="Fokontany validé. Identifiez-vous avec votre matricule.",
        )

    registration_token = create_access_token(
        fokontany.id,
        "REGISTRATION",
        "REGISTRATION",
        expires_minutes=15,
    )

    return FokontanyAccessResponse(
        access_granted=True,
        registration_required=True,
        fokontany_id=fokontany.id,
        fokontany_nom=fokontany.nom,
        registration_token= registration_token,
        message="Fokontany validé. Enregistrement de l'agent requis.",
    )


def get_registration_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token d'enregistrement invalide ou expiré",
        )

    if payload.get("type") != "REGISTRATION":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token d'enregistrement requis",
        )

    if payload.get("role") != "REGISTRATION":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token d'enregistrement invalide",
        )

    fokontany_id = payload.get("sub")

    if not fokontany_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Fokontany absent du token d'enregistrement",
        )

    return {
        "fokontany_id": fokontany_id,
    }

@router.post(
    "/register",
    response_model=AgentResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_agent(
    data: AgentRegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
    registration_data: dict = Depends(get_registration_token),
):
    fokontany_id = registration_data["fokontany_id"]

    fokontany = db.get(
        Fokontany,
        fokontany_id,
    )

    if not fokontany:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fokontany introuvable",
        )

    if not fokontany.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce Fokontany est désactivé",
        )

    # Vérifier qu'aucun agent actif n'a été créé entre-temps
    agent_exists = db.scalar(
        select(Agent.id)
        .where(
            Agent.fokontany_id == fokontany.id,
            Agent.is_active == True,
        )
        .limit(1)
    )

    if agent_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un agent est déjà enregistré pour ce Fokontany",
        )

    matricule = generate_agent_matricule(db)

    agent = Agent(
        fokontany_id=fokontany.id,
        matricule=matricule,
        nom=data.nom,
        prenoms=data.prenoms,
        telephone=data.telephone,
        email=data.email,
        adresse=data.adresse,
        is_active=True,
    )

    db.add(agent)
    db.flush()

    log_action(
        db,
        action="CREATE",
        resource_type="AGENT",
        resource_id=agent.id,
        agent_id=agent.id,
        fokontany_id=fokontany.id,
        outcome=OUTCOME_SUCCESS,
        details=(
            f"Enregistrement de l'agent {agent.matricule} "
            f"({agent.nom} {agent.prenoms}) sur le Fokontany "
            f"{fokontany.nom} ({fokontany.code})."
        ),
        request=request,
    )

    db.commit()
    db.refresh(agent)

    return agent



@router.post(
    "/login",
    response_model=AgentLoginResponse,
)
def agent_login(
    data: AgentAccessRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    agent = db.scalar(
        select(Agent).where(
            Agent.fokontany_id == data.fokontany_id,
            Agent.matricule == data.matricule,
        )
    )

    if not agent:
        log_login_failure(
            db,
            identifier=data.matricule,
            fokontany_id=data.fokontany_id,
            request=request,
            details=(
                "Tentative de connexion agent refusée : "
                f"matricule {data.matricule} inconnu pour "
                "le Fokontany sélectionné."
            ),
        )

        db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Matricule incorrect",
        )

    if not agent.is_active:
        log_login_failure(
            db,
            identifier=data.matricule,
            request=request,
            details=(
                "Tentative de connexion agent refusée : "
                f"compte {agent.matricule} désactivé."
            ),
        )

        db.commit()

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte agent désactivé",
        )

    token = create_access_token(
        agent.id,
        "AGENT",
        "AGENT",
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
        resource_id=agent.id,
        agent_id=agent.id,
        fokontany_id=agent.fokontany_id,
        outcome=OUTCOME_SUCCESS,
        details=(
            f"Connexion de l'agent {agent.matricule} "
            f"({agent.nom} {agent.prenoms}) sur le terrain."
        ),
        request=request,
    )

    db.commit()

    return AgentLoginResponse(
        access_token=token,
        token_type="bearer",
        agent=agent,
        message="Accès terrain autorisé",
    )