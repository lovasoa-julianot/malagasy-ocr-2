from uuid import UUID

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


# ============================================================
# VALEURS NORMALISEES
# ============================================================

# Résultat d'une opération. NULL pour les écritures
# historiques créées avant l'introduction de cette colonne.
OUTCOME_SUCCESS = "SUCCESS"
OUTCOME_FAILURE = "FAILURE"

OUTCOMES = (OUTCOME_SUCCESS, OUTCOME_FAILURE)

# Actions métier autorisées dans le journal.
ACTION_LOGIN = "LOGIN"
ACTION_LOGOUT = "LOGOUT"
ACTION_CREATE = "CREATE"
ACTION_UPDATE = "UPDATE"
ACTION_APPROVE = "APPROVE"
ACTION_REJECT = "REJECT"
ACTION_VALIDATE = "VALIDATE"
ACTION_EXPORT = "EXPORT"
ACTION_DELETE = "DELETE"
ACTION_OCR = "OCR"

ACTIONS = (
    ACTION_LOGIN,
    ACTION_LOGOUT,
    ACTION_CREATE,
    ACTION_UPDATE,
    ACTION_APPROVE,
    ACTION_REJECT,
    ACTION_VALIDATE,
    ACTION_EXPORT,
    ACTION_DELETE,
    ACTION_OCR,
)

# Types de ressources traçables.
RESOURCE_RECENSEMENT = "RECENSEMENT"
RESOURCE_AGENT = "AGENT"
RESOURCE_FOKONTANY = "FOKONTANY"
RESOURCE_CHEF_REQUEST = "CHEF_REQUEST"
RESOURCE_OCR = "OCR"
RESOURCE_SYSTEM = "SYSTEM"

RESOURCE_TYPES = (
    RESOURCE_RECENSEMENT,
    RESOURCE_AGENT,
    RESOURCE_FOKONTANY,
    RESOURCE_CHEF_REQUEST,
    RESOURCE_OCR,
    RESOURCE_SYSTEM,
)


def client_ip(request: Request | None) -> str | None:
    if request is None or request.client is None:
        return None

    forwarded = request.headers.get("x-forwarded-for")

    if forwarded:
        return forwarded.split(",")[0].strip()

    return request.client.host


def client_user_agent(request: Request | None) -> str | None:
    if request is None:
        return None

    return request.headers.get("user-agent")


def log_action(
    db: Session,
    action: str,
    resource_type: str,
    resource_id: str | UUID | None = None,
    agent_id: UUID | None = None,
    utilisateur_id: UUID | None = None,
    fokontany_id: UUID | None = None,
    details: str | None = None,
    outcome: str | None = None,
    duration_ms: int | None = None,
    request: Request | None = None,
) -> AuditLog:
    """
    Enregistre une entrée dans le journal d'audit.

    L'appelant est responsable du commit : l'entrée est ajoutée
    dans la transaction métier en cours.

    `utilisateur_id` identifie un administrateur ou un Chef
    Fokontany, `agent_id` un agent de terrain. Les deux peuvent
    être renseignés : une action d'administration sur un agent
    est ainsi attribuée à son auteur et à sa cible.
    """

    entry = AuditLog(
        agent_id=agent_id,
        utilisateur_id=utilisateur_id,
        fokontany_id=fokontany_id,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id else None,
        ip_address=client_ip(request),
        user_agent=client_user_agent(request),
        details=details,
        outcome=outcome,
        duration_ms=duration_ms,
    )

    db.add(entry)

    return entry


def log_login_failure(
    db: Session,
    identifier: str,
    resource_type: str = RESOURCE_SYSTEM,
    fokontany_id: UUID | None = None,
    request: Request | None = None,
    details: str | None = None,
) -> AuditLog:
    """
    Trace une tentative de connexion refusée.

    Aucune donnée d'identification sensible (mot de passe,
    jeton) n'est enregistrée : uniquement l'identifiant saisi,
    l'adresse IP et le motif du refus.
    """

    return log_action(
        db,
        action=ACTION_LOGIN,
        resource_type=resource_type,
        fokontany_id=fokontany_id,
        details=(
            details
            or (
                f"Tentative de connexion refusée "
                f"pour l'identifiant {identifier}."
            )
        ),
        outcome=OUTCOME_FAILURE,
        request=request,
    )