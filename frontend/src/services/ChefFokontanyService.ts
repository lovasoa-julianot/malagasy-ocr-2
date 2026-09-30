const API_URL = import.meta.env.VITE_API_URL || "";

export interface ChefFokontanyRegisterData {
  code_fokontany: string;
  nom_fokontany: string;
  commune: string;
  district: string;
  code_district: number;
  region: string;
  province: string;
  nom: string;
  prenoms: string;
  telephone: string;
  email: string;
  password: string;
}

export interface ChefFokontanyRegisterResponse {
  success: boolean;
  request_id: string;
  statut: string;
  message: string;
}

export async function registerChefFokontany(
  data: ChefFokontanyRegisterData,
): Promise<ChefFokontanyRegisterResponse> {
  const response = await fetch(`${API_URL}/api/chef-fokontany/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.detail || "Impossible d'envoyer la demande d'inscription.",
    );
  }

  return response.json();
}
