import type { Agent } from "./agent";

export interface AdminUser {
  id: string;
  email: string;
  nom: string;
  prenoms: string;
  role: "ADMIN";
}

export interface ChefFokontanyUser {
  id: string;
  email: string;
  nom: string;
  prenoms: string;
  telephone?: string;
  role: "CHEF_FOKONTANY";
  fokontany_id: string;
  fokontany_nom: string;
  fokontany_code: string;
  nom_fokontany?: string;
  code_fokontany?: string;
  commune: string;
  district: string;
  code_district?: number;
  region: string;
  province: string;
}

export interface AuthState {
  admin: AdminUser | null;
  agent: Agent | null;
  chef: ChefFokontanyUser | null;
  accessToken: string | null;
  role: "ADMIN" | "AGENT" | "CHEF_FOKONTANY" | null;
  isAuthenticated: boolean;
}
