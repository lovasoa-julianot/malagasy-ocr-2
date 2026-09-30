export interface ChefDashboardStats {
  totalRecensements: number;
  valides: number;
  aVerifier: number;
  rejets: number;
  agentsActifs: number;
  agentsTotal: number;
  aujourdhui: number;
  progressionPourcentage: number;
  objectifHabitants: number;
}

export interface ChefAgentItem {
  id: string;
  matricule: string;
  nom: string;
  prenoms: string;
  telephone: string;
  email?: string | null;
  adresse?: string | null;
  is_active: boolean;
  total_recensements: number;
  recensements_aujourdhui: number;
  created_at: string;
}

export interface ChefRecensementItem {
  id: string;
  numero_fiche: string;
  numero_karine?: string | null;
  numero_cin: string;
  nom: string;
  prenoms: string;
  sexe?: string | null;
  date_naissance?: string | null;
  adresse?: string | null;
  agent_nom: string;
  agent_matricule: string;
  statut: "SCANNE" | "OCR_EN_COURS" | "A_VERIFIER" | "MODIFIE" | "VALIDE" | "REJETE";
  ocr_confidence?: number | null;
  created_at: string;
  date_formatted: string;
  heure_formatted: string;
}

export interface FokontanyCitizenItem {
  id: string;
  numero_cin: string;
  nom: string;
  prenoms: string;
  sexe: string;
  date_naissance: string;
  lieu_naissance: string;
  profession: string;
  adresse: string;
  telephone?: string | null;
  date_recensement: string;
  numero_fiche: string;
}

export interface FokontanyAccessCodeDetails {
  fokontany_id: string;
  code_fokontany: string;
  nom_fokontany: string;
  commune: string;
  district: string;
  region: string;
  code_acces: string; // The active access code for agents
  qr_value: string; // encoded payload for agent scanner
  agents_count: number;
  last_updated: string;
}
