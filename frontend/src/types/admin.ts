export interface AdminDashboardStats {
  fokontany: number;
  agentsActifs: number;
  agentsTotal: number;
  personnesRecensees: number;
  recensementsAujourdhui: number;
  aVerifier: number;
  valides: number;
  rejets: number;
  demandesChefEnAttente: number;
}

export interface AdminFokontanyStatItem {
  id: string;
  nom: string;
  code: string;
  commune: string;
  region: string;
  total: number;
  valides: number;
  progression: number;
}

export interface ChefFokontanyRequestItem {
  id: string;
  code_fokontany: string;
  nom_fokontany: string;
  commune: string;
  district: string;
  code_district?: number;
  region: string;
  province: string;
  nom: string;
  prenoms: string;
  telephone: string;
  email: string;
  statut: "EN_ATTENTE" | "APPROUVE" | "REJETE";
  motif_rejet?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export interface AdminAgentItem {
  id: string;
  matricule: string;
  nom: string;
  prenoms: string;
  telephone: string;
  email?: string | null;
  adresse?: string | null;
  is_active: boolean;
  fokontany_id: string;
  fokontany_nom?: string;
  fokontany_code?: string;
  commune?: string;
  district?: string;
  region?: string;
  total_recensements?: number;
  derniere_activite?: string | null;
  created_at?: string;
}

export interface AdminRecensementItem {
  id: string;
  numero_fiche: string;
  numero_karine?: string | null;
  numero_cin: string;
  nom: string;
  prenoms: string;
  sexe?: string | null;
  date_naissance?: string | null;
  fokontany_nom: string;
  fokontany_code: string;
  commune: string;
  district: string;
  region: string;
  agent_nom: string;
  agent_matricule: string;
  statut: "SCANNE" | "OCR_EN_COURS" | "A_VERIFIER" | "MODIFIE" | "VALIDE" | "REJETE";
  ocr_confidence?: number | null;
  created_at: string;
  validated_at?: string | null;
}

export interface AdminAuditLogItem {
  id: string;
  timestamp: string;
  user_type: "ADMIN" | "AGENT" | "CHEF_FOKONTANY";
  user_name: string;
  action: "LOGIN" | "CREATE" | "UPDATE" | "APPROVE" | "REJECT" | "VALIDATE" | "EXPORT";
  resource_type: "RECENSEMENT" | "AGENT" | "FOKONTANY" | "CHEF_REQUEST" | "SYSTEM";
  resource_id?: string | null;
  fokontany_nom?: string | null;
  ip_address?: string | null;
  details: string;
}

export interface QualityAlertItem {
  id: string;
  type: "DOUBLON_CIN" | "FAIBLE_CONFIANCE_OCR" | "ANOMALIE_DATE" | "FICHE_MANQUANTE";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  recensement_id?: string;
  numero_cin?: string;
  fokontany: string;
  agent: string;
  date: string;
  resolu: boolean;
}
