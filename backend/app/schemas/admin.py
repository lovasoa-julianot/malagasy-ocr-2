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
    action_label: str
    resource_type: str
    resource_type_label: str
    resource_id: str | None = None
    fokontany_nom: str | None = None
    region: str | None = None
    ip_address: str | None = None
    outcome: str | None = None
    duration_ms: int | None = None
    details: str


class AdminAuditLogPage(BaseModel):
    items: list[AdminAuditLogItem]
    total: int
    limit: int
    offset: int
    page: int
    pages: int


class AdminAuditFilterOption(BaseModel):
    value: str
    label: str
    count: int = 0
    id: UUID | None = None


class AdminAuditLogMeta(BaseModel):
    actions: list[AdminAuditFilterOption]
    resource_types: list[AdminAuditFilterOption]
    user_types: list[AdminAuditFilterOption]
    fokontany: list[AdminAuditFilterOption]
    total_evenements: int
    premiere_trace: datetime | None = None
    derniere_trace: datetime | None = None


# ============================================================
# STATISTIQUES & KPIs
# ============================================================

class AdminKpi(BaseModel):
    valeur: float
    libelle_variation: float | None = None
    variation: float | None = None
    unite: str | None = None
    comparaison: str | None = None
    # Nombre d'observations servant de base à l'indicateur.
    # Permet de distinguer une valeur nulle d'une mesure
    # encore inexistante.
    observations: int = 0


class AdminCouvertureRegion(BaseModel):
    region: str
    fokontany: int
    recensees: int
    objectif: int
    taux: float
    population_totale: float


class AdminActiviteJour(BaseModel):
    date: str
    libelle: str
    total: int
    valides: int
    rejets: int


class AdminTrancheAge(BaseModel):
    libelle: str
    age_min: int
    age_max: int | None
    effectif: int
    pourcentage: float


class AdminDemographie(BaseModel):
    total: int
    hommes: int
    femmes: int
    autres: int
    pourcentage_hommes: float
    pourcentage_femmes: float
    tranches_age: list[AdminTrancheAge]


class AdminRepartitionStatut(BaseModel):
    statut: str
    libelle: str
    effectif: int
    pourcentage: float


class AdminTopAgent(BaseModel):
    matricule: str
    nom: str
    prenoms: str
    fokontany: str
    region: str
    fiches: int
    taux_validation: float


class AdminFokontanyCouverture(BaseModel):
    id: UUID
    nom: str
    code: str
    commune: str
    region: str
    fiches: int
    valides: int
    objectif: int
    taux: float


class AdminStatistiquesResponse(BaseModel):
    periode: str
    periode_libelle: str
    date_debut: str
    date_fin: str
    genere_le: datetime
    kpis: dict[str, AdminKpi]
    couverture_regions: list[AdminCouvertureRegion]
    activite_quotidienne: list[AdminActiviteJour]
    demographie: AdminDemographie
    repartition_statuts: list[AdminRepartitionStatut]
    top_agents: list[AdminTopAgent]
    fokontany: list[AdminFokontanyCouverture]


class AdminAuditRepartition(BaseModel):
    cle: str
    libelle: str
    effectif: int
    pourcentage: float


class AdminAuditActif(BaseModel):
    libelle: str
    role: str
    evenements: int
    derniere_activite: datetime | None = None


class AdminAuditJour(BaseModel):
    date: str
    libelle: str
    total: int
    succes: int
    echecs: int


class AdminAuditStatsResponse(BaseModel):
    periode: str
    periode_libelle: str
    date_debut: str
    date_fin: str
    total_evenements: int
    succes: int
    echecs: int
    # Entrées historiques écrites avant l'introduction du
    # résultat d'opération : ni succès ni échec.
    sans_resultat: int
    taux_echec: float
    activite_journaliere: list[AdminAuditJour]
    par_action: list[AdminAuditRepartition]
    par_resource_type: list[AdminAuditRepartition]
    par_role: list[AdminAuditRepartition]
    top_acteurs: list[AdminAuditActif]
    duree_moyenne_ms: int | None = None


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
