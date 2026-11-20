from pydantic import BaseModel, Field


class RecensementCreate(BaseModel):
    # Informations Personne
    nom: str = Field(..., min_length=1, max_length=100)
    prenoms: str = Field(..., min_length=1, max_length=150)

    sexe: str | None = None
    date_naissance: str | None = None
    lieu_naissance: str | None = None
    nee_vers: bool | None = None

    numero_cin: str = Field(..., min_length=1, max_length=50)
    numero_serie_cin: str | None = None

    date_delivrance: str | None = None
    lieu_delivrance: str | None = None

    nom_pere: str | None = None
    pere_decede: bool | None = None

    nom_mere: str | None = None
    mere_decede: bool | None = None

    profession: str | None = None

    lot_logement: str | None = None
    quartier_secteur: str | None = None

    telephone: str | None = None

    numero_karine: str | None = None
    date_recensement_terrain: str | None = None

    # Précision de la lecture OCR, mesurée par l'agent :
    # part des champs de la CIN laissés inchangés après
    # relecture, exprimée en pourcentage (0 à 100).
    ocr_confidence: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )


class RecensementResponse(BaseModel):
    success: bool
    recensement_id: str
    personne_id: str
    numero_fiche: str
    numero_cin: str
    qr_token: str
    statut: str
    message: str