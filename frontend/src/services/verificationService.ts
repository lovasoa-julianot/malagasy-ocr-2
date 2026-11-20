const API_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

export interface VerificationResult {
  verified: boolean;
  numero_fiche: string;
  numero_cin: string | null;
  nom: string;
  prenoms: string;
  statut: string;
  fokontany: string;
  commune: string;
  date_inscription: string | null;
  agent_matricule: string;
  message: string;
}

export async function verifyRecensement(
  qrToken: string,
): Promise<VerificationResult> {
  const response = await fetch(
    `${API_URL}/api/verification/${encodeURIComponent(qrToken)}`,
    {
      method: "GET",
    },
  );

  let data: VerificationResult | { detail?: string };

  try {
    data = await response.json();
  } catch {
    throw new Error("Le serveur a retourné une réponse invalide.");
  }

  if (!response.ok) {
    const detail =
      "detail" in data && data.detail
        ? data.detail
        : "QR code invalide ou fiche introuvable.";

    throw new Error(detail);
  }

  return data as VerificationResult;
}
