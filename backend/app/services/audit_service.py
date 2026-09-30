from uuid import UUID

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def client_ip(request: Request | None) -> str | None:
    if request is None or request.client is None:
        return None

    forwarded = request.headers.get("x-forwarded-for")

    if forwarded:
        return forwarded.split(",")[0].strip()

    return request.client.host


def log_action(
    db: Session,
    action: str,
    resource_type: str,
    resource_id: str | UUID | None = None,
    agent_id: UUID | None = None,
    fokontany_id: UUID | None = None,
    details: str | None = None,
    request: Request | None = None,
) -> AuditLog:
    """
    Enregistre une entrée dans le journal d'audit.

    L'appelant est responsable du commit : l'entrée est ajoutée
    dans la transaction métier en cours.
    """

    entry = AuditLog(
        agent_id=agent_id,
        fokontany_id=fokontany_id,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id else None,
        ip_address=client_ip(request),
        user_agent=(
            request.headers.get("user-agent")
            if request is not None
            else None
        ),
        details=details,
    )

    db.add(entry)

    return entry
