from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# ============================================================
# TABLEAU DE BORD ADMIN
# ============================================================

class AdminDashboardStatsResponse(BaseModel):
    fokontany: int
    agentsActifs: int
    agentsTotal: int
    personnesRecensees: int
    recensementsAujourdhui: int
    aVerifier: int
    valides: int
    rejets: int
    demandesChefEnAttente: int


class AdminFokontanyStatItem(BaseModel):
    id: UUID
    nom: str
    code: str
    commune: str
    region: str
    total: int
    valides: int
    progression: int


# ============================================================
# GESTION DES AGENTS
# ============================================================

class AdminAgentItem(BaseModel):
    id: UUID
    matricule: str
    nom: str
    prenoms: str
    telephone: str
    email: str | None = None
    adresse: str | None = None
    is_active: bool
    fokontany_id: UUID
    fokontany_nom: str | None = None
    fokontany_code: str | None = None
    commune: str | None = None
    district: str | None = None
    region: str | None = None
    total_recensements: int = 0
    derniere_activite: str | None = None
    created_at: datetime


class AdminAgentCreate(BaseModel):
    nom: str = Field(min_length=1, max_length=100)
    prenoms: str = Field(min_length=1, max_length=150)
    telephone: str = Field(min_length=3, max_length=30)
    email: EmailStr | None = None
    adresse: str | None = Field(default=None, max_length=255)
    fokontany_id: UUID


class AdminAgentCreateResponse(BaseModel):
    success: bool
    message: str
    agent: AdminAgentItem


class AdminAgentToggleRequest(BaseModel):
    is_active: bool


class AdminAgentToggleResponse(BaseModel):
    success: bool
    id: UUID
    is_active: bool
    message: str


# ============================================================
# GESTION DES RECENSEMENTS
# ============================================================

class AdminRecensementItem(BaseModel):
    id: UUID
    numero_fiche: str
    numero_karine: str | None = None
    numero_cin: str
    nom: str
    prenoms: str
    sexe: str | None = None
    date_naissance: str | None = None
    fokontany_nom: str
    fokontany_code: str
    commune: str
    district: str
    region: str
    agent_nom: str
    agent_matricule: str
    statut: str
    ocr_confidence: float | None = None
    created_at: datetime
    validated_at: datetime | None = None


class AdminRecensementStatusRequest(BaseModel):
    statut: str = Field(
        pattern="^(VALIDE|REJETE|A_VERIFIER)$",
    )


class AdminRecensementStatusResponse(BaseModel):
    success: bool
    id: UUID
    statut: str
    message: str


# ============================================================
# JOURNAL D'AUDIT
# ============================================================

class AdminAuditLogItem(BaseModel):
    id: UUID
    timestamp: datetime
    user_type: str
    user_name: str
    action: str
    resource_type: str
    resource_id: str | None = None
    fokontany_nom: str | None = None
    ip_address: str | None = None
    details: str


# ============================================================
# ALERTES QUALITE
# ============================================================

class QualityAlertItem(BaseModel):
    id: str
    type: str
    severity: str
    title: str
    description: str
    recensement_id: str | None = None
    numero_cin: str | None = None
    fokontany: str
    agent: str
    date: str
    resolu: bool
