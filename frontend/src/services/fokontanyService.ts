import type { Fokontany } from "../types/fokontany";

const API_URL = import.meta.env.VITE_API_URL || "";

export async function getFokontany(): Promise<Fokontany[]> {
  const response = await fetch(`${API_URL}/api/admin/fokontany`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Impossible de récupérer les Fokontany.");
  }

  return response.json();
}
