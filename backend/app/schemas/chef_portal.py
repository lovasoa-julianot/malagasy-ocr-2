from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ============================================================
# AUTHENTIFICATION
# ============================================================

class ChefFokontanyLoginRequest(BaseModel):
    identifier: str = Field(
        min_length=3,
        max_length=255,
        description=(
            "Email du Chef Fokontany "
            "ou code du Fokontany (ex: FK-ANAT-012)."
        ),
    )

    password: str = Field(
        min_length=1,
        max_length=128,
    )


class ChefFokontanyUserResponse(BaseModel):
    id: UUID
    email: EmailStr
    nom: str
    prenoms: str
    telephone: str | None = None
    role: str
    fokontany_id: UUID
    fokontany_nom: str
    fokontany_code: str
    commune: str
    district: str
    code_district: int | None = None
    region: str
    province: str


class ChefFokontanyLoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: ChefFokontanyUserResponse


# ============================================================
# TABLEAU DE BORD
# ============================================================

class ChefDashboardStatsResponse(BaseModel):
    totalRecensements: int
    valides: int
    aVerifier: int
    rejets: int
    agentsActifs: int
    agentsTotal: int
    aujourdhui: int
    progressionPourcentage: int
    objectifHabitants: int


# ============================================================
# AGENTS DU FOKONTANY
# ============================================================

class ChefAgentItem(BaseModel):
    id: UUID
    matricule: str
    nom: str
    prenoms: str
    telephone: str
    email: str | None = None
    adresse: str | None = None
    is_active: bool
    total_recensements: int
    recensements_aujourdhui: int
    created_at: datetime


class ToggleAgentRequest(BaseModel):
    is_active: bool


class ToggleAgentResponse(BaseModel):
    success: bool
    id: UUID
    is_active: bool
    message: str


# ============================================================
# RECENSEMENTS DU FOKONTANY
# ============================================================

class ChefRecensementItem(BaseModel):
    id: UUID
    numero_fiche: str
    numero_karine: str | None = None
    numero_cin: str
    nom: str
    prenoms: str
    sexe: str | None = None
    date_naissance: str | None = None
    adresse: str | None = None
    agent_nom: str
    agent_matricule: str
    statut: str
    ocr_confidence: float | None = None
    created_at: str
    date_formatted: str
    heure_formatted: str


class UpdateRecensementStatusRequest(BaseModel):
    statut: str = Field(
        pattern="^(VALIDE|REJETE|A_VERIFIER)$",
    )


class UpdateRecensementStatusResponse(BaseModel):
    success: bool
    id: UUID
    statut: str
    message: str


# ============================================================
# REGISTRE DES CITOYENS
# ============================================================

class CitizenItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    numero_cin: str
    nom: str
    prenoms: str
    sexe: str
    date_naissance: str
    lieu_naissance: str
    profession: str
    adresse: str
    telephone: str | None = None
    date_recensement: str
    numero_fiche: str


# ============================================================
# CODE D'ACCES / QR CODE
# ============================================================

class AccessCodeDetailsResponse(BaseModel):
    fokontany_id: UUID
    code_fokontany: str
    nom_fokontany: str
    commune: str
    district: str
    region: str
    code_acces: str
    qr_value: str
    agents_count: int
    last_updated: str
