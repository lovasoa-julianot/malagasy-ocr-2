from pydantic import BaseModel


class VerificationResponse(BaseModel):
    verified: bool
    numero_fiche: str
    numero_cin: str | None
    nom: str
    prenoms: str
    statut: str
    fokontany: str
    commune: str
    date_inscription: str | None
    agent_matricule: str
    message: str