import type {
  AdminDashboardStats,
  AdminFokontanyStatItem,
  ChefFokontanyRequestItem,
  AdminAgentItem,
  AdminRecensementItem,
  AdminAuditLogMeta,
  AdminAuditLogPage,
  AdminAuditQueryParams,
  AdminAuditStats,
  AdminStatistiques,
  QualityAlertItem,
  StatistiquesPeriode,
} from "../types/admin";

const API_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

async function readJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || fallbackMessage);
  }

  return data as T;
}

/* =========================================================
   TABLEAU DE BORD ADMIN
   GET /api/admin/stats
========================================================= */

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const response = await fetch(`${API_URL}/api/admin/stats`, {
    method: "GET",
    credentials: "include",
  });

  return readJson<AdminDashboardStats>(
    response,
    "Impossible de charger les statistiques.",
  );
}

export async function getAdminFokontanyStats(): Promise<AdminFokontanyStatItem[]> {
  const response = await fetch(`${API_URL}/api/admin/fokontany-stats`, {
    method: "GET",
    credentials: "include",
  });

  return readJson<AdminFokontanyStatItem[]>(
    response,
    "Impossible de charger la progression par Fokontany.",
  );
}

/* =========================================================
   DEMANDES CHEF FOKONTANY
========================================================= */

export async function getChefFokontanyRequests(): Promise<ChefFokontanyRequestItem[]> {
  const response = await fetch(`${API_URL}/api/admin/chef-fokontany/requests`, {
    method: "GET",
    credentials: "include",
  });

  return readJson<ChefFokontanyRequestItem[]>(
    response,
    "Impossible de charger les demandes Chef Fokontany.",
  );
}

export async function approveChefFokontanyRequest(
  requestId: string,
): Promise<{ success: boolean; access_code: string; message: string; fokontany_created: boolean }> {
  const response = await fetch(
    `${API_URL}/api/admin/chef-fokontany/requests/${requestId}/approve`,
    { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include" },
  );
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.detail || "Impossible d’approuver cette demande Chef.");
  }
  return {
    success: result.success,
    access_code: result.access_code || result.code_acces_fokontany || "",
    message: result.message,
    fokontany_created: Boolean(result.fokontany_created),
  };
}

export async function rejectChefFokontanyRequest(
  requestId: string,
  motif: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${API_URL}/api/admin/chef-fokontany/requests/${requestId}/reject`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ motif }),
    },
  );

  return readJson<{ success: boolean; message: string }>(
    response,
    "Impossible de rejeter cette demande Chef.",
  );
}

/* =========================================================
   AGENTS
========================================================= */

export async function getAdminAgents(): Promise<AdminAgentItem[]> {
  const response = await fetch(`${API_URL}/api/admin/agents`, {
    method: "GET",
    credentials: "include",
  });

  return readJson<AdminAgentItem[]>(
    response,
    "Impossible de charger les agents.",
  );
}

export async function toggleAgentStatus(
  agentId: string,
  isActive: boolean,
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/api/admin/agents/${agentId}/toggle`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ is_active: isActive }),
  });

  return readJson<{ success: boolean }>(
    response,
    "Impossible de modifier le statut de l’agent.",
  );
}

export async function createAgentAdmin(data: {
  nom: string;
  prenoms: string;
  telephone: string;
  email?: string;
  adresse?: string;
  fokontany_id: string;
  fokontany_nom?: string;
}): Promise<AdminAgentItem> {
  const response = await fetch(`${API_URL}/api/admin/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  const result = await readJson<{
    success: boolean;
    message: string;
    agent: AdminAgentItem;
  }>(response, "Impossible de créer l’agent.");

  return result.agent;
}

/* =========================================================
   RECENSEMENTS
========================================================= */

export async function getAdminRecensements(): Promise<AdminRecensementItem[]> {
  const response = await fetch(`${API_URL}/api/admin/recensements`, {
    method: "GET",
    credentials: "include",
  });

  return readJson<AdminRecensementItem[]>(
    response,
    "Impossible de charger les recensements.",
  );
}

export async function updateRecensementStatusAdmin(
  recensementId: string,
  newStatus: "VALIDE" | "REJETE" | "A_VERIFIER",
): Promise<{ success: boolean }> {
  const response = await fetch(
    `${API_URL}/api/admin/recensements/${recensementId}/status`,
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
   JOURNAL D'AUDIT ET ALERTES QUALITE
========================================================= */

export async function getAdminAuditLogs(
  params: AdminAuditQueryParams = {},
): Promise<AdminAuditLogPage> {
  const query = new URLSearchParams();

  if (params.action) query.set("action", params.action);
  if (params.resource_type) query.set("resource_type", params.resource_type);
  if (params.user_type) query.set("user_type", params.user_type);
  if (params.outcome) query.set("outcome", params.outcome);
  if (params.fokontany_id) query.set("fokontany_id", params.fokontany_id);
  if (params.search) query.set("search", params.search);
  if (params.date_debut) query.set("date_debut", params.date_debut);
  if (params.date_fin) query.set("date_fin", params.date_fin);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));

  const suffix = query.toString() ? `?${query.toString()}` : "";

  const response = await fetch(`${API_URL}/api/admin/audit-logs${suffix}`, {
    method: "GET",
    credentials: "include",
  });

  return readJson<AdminAuditLogPage>(
    response,
    "Impossible de charger le journal d’audit.",
  );
}

export async function getAdminAuditLogMeta(): Promise<AdminAuditLogMeta> {
  const response = await fetch(`${API_URL}/api/admin/audit-logs/meta`, {
    method: "GET",
    credentials: "include",
  });

  return readJson<AdminAuditLogMeta>(
    response,
    "Impossible de charger les filtres du journal d’audit.",
  );
}

export async function getAdminQualityAlerts(): Promise<QualityAlertItem[]> {
  const response = await fetch(`${API_URL}/api/admin/quality-alerts`, {
    method: "GET",
    credentials: "include",
  });

  return readJson<QualityAlertItem[]>(
    response,
    "Impossible de charger les alertes qualité.",
  );
}

export async function resolveQualityAlert(
  alertId: string,
): Promise<{ success: boolean }> {
  const response = await fetch(
    `${API_URL}/api/admin/quality-alerts/${encodeURIComponent(alertId)}/resolve`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    },
  );

  return readJson<{ success: boolean }>(
    response,
    "Impossible de marquer l’alerte comme traitée.",
  );
}

/* =========================================================
   STATISTIQUES & KPIs
   GET /api/admin/statistiques
   GET /api/admin/statistiques/audit
   ========================================================= */

export async function getAdminStatistiques(
  periode: StatistiquesPeriode = "MONTH",
): Promise<AdminStatistiques> {
  const response = await fetch(
    `${API_URL}/api/admin/statistiques?periode=${periode}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return readJson<AdminStatistiques>(
    response,
    "Impossible de charger les statistiques.",
  );
}

export async function getAdminStatistiquesAudit(
  periode: StatistiquesPeriode = "MONTH",
): Promise<AdminAuditStats> {
  const response = await fetch(
    `${API_URL}/api/admin/statistiques/audit?periode=${periode}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return readJson<AdminAuditStats>(
    response,
    "Impossible de charger les agrégats du journal d’audit.",
  );
}
