export interface DashboardStats {
  scannedToday: number;
  registeredToday: number;
  total: number;
}

export interface RecentActivity {
  id: string;
  name: string;
  cin: string;
  time: string;
  status: string;
}

export interface AgentDashboardData {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
}

const API_URL = import.meta.env.VITE_API_URL || "";

export async function getAgentDashboard(): Promise<AgentDashboardData> {
  const response = await fetch(`${API_URL}/api/agent/dashboard`, {
    method: "GET",
    credentials: "include",
  });

  let data: AgentDashboardData | { detail?: string };

  try {
    data = await response.json();
  } catch {
    throw new Error("Réponse invalide du serveur.");
  }

  if (!response.ok) {
    throw new Error(
      "detail" in data && data.detail
        ? data.detail
        : "Impossible de charger le tableau de bord.",
    );
  }

  return data as AgentDashboardData;
}
