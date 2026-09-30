export interface AgentFokontany {
  id?: string;
  code?: string;
  nom?: string;
  commune?: string;
  district?: string;
  region?: string;
}

export interface Agent {
  id: string;
  fokontanyId?: string;
  fokontany_id?: string;
  matricule: string;
  nom: string;
  prenoms: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  isActive?: boolean;
  is_active?: boolean;
  fokontany?: AgentFokontany;
}
