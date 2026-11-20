import type {
  ChefDashboardStats,
  ChefAgentItem,
  ChefRecensementItem,
  FokontanyCitizenItem,
  FokontanyAccessCodeDetails,
} from "../types/chefFokontany";

const API_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

async function readJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || fallbackMessage);
  }

  return data as T;
}

/* =========================================================
   TABLEAU DE BORD
   GET /api/chef-fokontany/dashboard
========================================================= */

export async function getChefDashboardStats(): Promise<ChefDashboardStats> {
  const response = await fetch(`${API_URL}/api/chef-fokontany/dashboard`, {
    method: "GET",
    credentials: "include",
  });

  return readJson<ChefDashboardStats>(
    response,
    "Impossible de charger le tableau de bord.",
  );
}

/* =========================================================
   RECENSEMENTS DU FOKONTANY
========================================================= */

export async function getChefRecensements(
  statut?: "VALIDE" | "REJETE" | "A_VERIFIER",
): Promise<ChefRecensementItem[]> {
  const query = statut ? `?statut=${statut}` : "";

  const response = await fetch(
    `${API_URL}/api/chef-fokontany/recensements${query}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return readJson<ChefRecensementItem[]>(
    response,
    "Impossible de charger les recensements du Fokontany.",
  );
}

export async function updateRecensementChef(
  recensementId: string,
  newStatus: "VALIDE" | "REJETE",
): Promise<{ success: boolean }> {
  const response = await fetch(
    `${API_URL}/api/chef-fokontany/recensements/${recensementId}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ statut: newStatus }),
    },
  );

  return readJson<{ success: boolean }>(
    response,
    "Impossible de modifier le statut du recensement.",
  );
}

/* =========================================================
   AGENTS DU FOKONTANY
========================================================= */

export async function getChefAgents(): Promise<ChefAgentItem[]> {
  const response = await fetch(`${API_URL}/api/chef-fokontany/agents`, {
    method: "GET",
    credentials: "include",
  });

  return readJson<ChefAgentItem[]>(
    response,
    "Impossible de charger les agents du Fokontany.",
  );
}

export async function toggleAgentByChef(
  agentId: string,
  isActive: boolean,
): Promise<{ success: boolean }> {
  const response = await fetch(
    `${API_URL}/api/chef-fokontany/agents/${agentId}/toggle`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ is_active: isActive }),
    },
  );

  return readJson<{ success: boolean }>(
    response,
    "Impossible de modifier le statut de l’agent.",
  );
}

/* =========================================================
   CODE D'ACCES / QR CODE
========================================================= */

export async function getFokontanyAccessCodeDetails(): Promise<FokontanyAccessCodeDetails> {
  const response = await fetch(`${API_URL}/api/chef-fokontany/access-code`, {
    method: "GET",
    credentials: "include",
  });

  return readJson<FokontanyAccessCodeDetails>(
    response,
    "Impossible de charger le code d’accès du Fokontany.",
  );
}

export async function regenerateAccessCodeChef(): Promise<FokontanyAccessCodeDetails> {
  const response = await fetch(
    `${API_URL}/api/chef-fokontany/access-code/regenerate`,
    { method: "POST", credentials: "include" },
  );

  return readJson<FokontanyAccessCodeDetails>(
    response,
    "Impossible de régénérer le code d’accès.",
  );
}

/* =========================================================
   REGISTRE DES CITOYENS
========================================================= */

export async function getCitizenRegistry(
  search?: string,
): Promise<FokontanyCitizenItem[]> {
  const query = search
    ? `?search=${encodeURIComponent(search)}`
    : "";

  const response = await fetch(
    `${API_URL}/api/chef-fokontany/citizens${query}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return readJson<FokontanyCitizenItem[]>(
    response,
    "Impossible de charger le registre des résidents.",
  );
}
