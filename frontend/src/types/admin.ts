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
  user_type: "ADMIN" | "AGENT" | "CHEF_FOKONTANY" | "SYSTEM";
  user_name: string;
  action: string;
  action_label: string;
  resource_type: string;
  resource_type_label: string;
  resource_id?: string | null;
  fokontany_nom?: string | null;
  region?: string | null;
  ip_address?: string | null;
  outcome?: "SUCCESS" | "FAILURE" | null;
  duration_ms?: number | null;
  details: string;
}

export interface AdminAuditLogPage {
  items: AdminAuditLogItem[];
  total: number;
  limit: number;
  offset: number;
  page: number;
  pages: number;
}

export interface AdminAuditFilterOption {
  value: string;
  label: string;
  count: number;
  id?: string | null;
}

export interface AdminAuditLogMeta {
  actions: AdminAuditFilterOption[];
  resource_types: AdminAuditFilterOption[];
  user_types: AdminAuditFilterOption[];
  fokontany: AdminAuditFilterOption[];
  total_evenements: number;
  premiere_trace?: string | null;
  derniere_trace?: string | null;
}

export interface AdminAuditQueryParams {
  action?: string;
  resource_type?: string;
  user_type?: string;
  outcome?: string;
  fokontany_id?: string;
  search?: string;
  date_debut?: string;
  date_fin?: string;
  limit?: number;
  offset?: number;
}

/* =========================================================
   STATISTIQUES & KPIs
   ========================================================= */

export type StatistiquesPeriode = "WEEK" | "MONTH" | "GLOBAL";

export interface AdminKpi {
  valeur: number;
  libelle_variation?: number | null;
  variation?: number | null;
  unite?: string | null;
  comparaison?: string | null;
  observations: number;
}

export interface AdminCouvertureRegion {
  region: string;
  fokontany: number;
  recensees: number;
  objectif: number;
  taux: number;
  population_totale: number;
}

export interface AdminActiviteJour {
  date: string;
  libelle: string;
  total: number;
  valides: number;
  rejets: number;
}

export interface AdminTrancheAge {
  libelle: string;
  age_min: number;
  age_max: number | null;
  effectif: number;
  pourcentage: number;
}

export interface AdminDemographie {
  total: number;
  hommes: number;
  femmes: number;
  autres: number;
  pourcentage_hommes: number;
  pourcentage_femmes: number;
  tranches_age: AdminTrancheAge[];
}

export interface AdminRepartitionStatut {
  statut: string;
  libelle: string;
  effectif: number;
  pourcentage: number;
}

export interface AdminTopAgent {
  matricule: string;
  nom: string;
  prenoms: string;
  fokontany: string;
  region: string;
  fiches: number;
  taux_validation: number;
}

export interface AdminFokontanyCouverture {
  id: string;
  nom: string;
  code: string;
  commune: string;
  region: string;
  fiches: number;
  valides: number;
  objectif: number;
  taux: number;
}

export interface AdminStatistiques {
  periode: StatistiquesPeriode;
  periode_libelle: string;
  date_debut: string;
  date_fin: string;
  genere_le: string;
  kpis: Record<string, AdminKpi>;
  couverture_regions: AdminCouvertureRegion[];
  activite_quotidienne: AdminActiviteJour[];
  demographie: AdminDemographie;
  repartition_statuts: AdminRepartitionStatut[];
  top_agents: AdminTopAgent[];
  fokontany: AdminFokontanyCouverture[];
}

export interface AdminAuditJour {
  date: string;
  libelle: string;
  total: number;
  succes: number;
  echecs: number;
}

export interface AdminAuditRepartition {
  cle: string;
  libelle: string;
  effectif: number;
  pourcentage: number;
}

export interface AdminAuditActif {
  libelle: string;
  role: string;
  evenements: number;
  derniere_activite?: string | null;
}

export interface AdminAuditStats {
  periode: StatistiquesPeriode;
  periode_libelle: string;
  date_debut: string;
  date_fin: string;
  total_evenements: number;
  succes: number;
  echecs: number;
  /** Entrées historiques sans résultat d'opération renseigné. */
  sans_resultat: number;
  taux_echec: number;
  activite_journaliere: AdminAuditJour[];
  par_action: AdminAuditRepartition[];
  par_resource_type: AdminAuditRepartition[];
  par_role: AdminAuditRepartition[];
  top_acteurs: AdminAuditActif[];
  duree_moyenne_ms?: number | null;
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
