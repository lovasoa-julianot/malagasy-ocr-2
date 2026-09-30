from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.recensement import Recensement
from app.schemas.verification import VerificationResponse


router = APIRouter(
    prefix="/api/verification",
    tags=["Vérification publique"],
)


@router.get(
    "/{qr_token}",
    response_model=VerificationResponse,
)
def verify_recensement(
    qr_token: str,
    db: Session = Depends(get_db),
):
    recensement = (
        db.query(Recensement)
        .filter(Recensement.qr_token == qr_token)
        .first()
    )

    if not recensement:
        raise HTTPException(
            status_code=404,
            detail="Fiche introuvable ou QR code invalide.",
        )

    personne = recensement.personne

    if not personne:
        raise HTTPException(
            status_code=404,
            detail="Personne associée à cette fiche introuvable.",
        )

    fokontany = recensement.fokontany
    agent = recensement.agent

    return VerificationResponse(
        verified=True,
        numero_fiche=recensement.numero_fiche,
        numero_cin=personne.numero_cin,
        nom=personne.nom,
        prenoms=personne.prenoms,
        statut=recensement.statut.value,
        fokontany=fokontany.nom,
        commune=fokontany.commune,
        date_inscription=(
            recensement.created_at.isoformat()
            if recensement.created_at
            else None
        ),
        agent_matricule=agent.matricule,
        message="Cette fiche est enregistrée dans le système.",
    )