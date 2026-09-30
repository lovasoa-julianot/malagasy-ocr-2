import type {
  RecensementCreate,
  RecensementResponse,
} from "../types/recensement";

export interface RecensementHistoryItem {
  id: string;
  numeroFiche: string;
  numeroCin: string | null;
  nom: string;
  prenoms: string;
  date: string;
  heure: string;
  statut:
    | "SCANNE"
    | "OCR_EN_COURS"
    | "A_VERIFIER"
    | "MODIFIE"
    | "VALIDE"
    | "REJETE";
}

const API_URL = import.meta.env.VITE_API_URL || "";

export async function createRecensement(
  data: RecensementCreate,
): Promise<RecensementResponse> {
  const response = await fetch(`${API_URL}/api/recensement`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  let result: RecensementResponse | { detail?: string };

  try {
    result = await response.json();
  } catch {
    throw new Error("Le serveur a retourné une réponse invalide.");
  }

  if (!response.ok) {
    const detail =
      "detail" in result && result.detail
        ? result.detail
        : "Impossible d'enregistrer le recensement.";

    throw new Error(detail);
  }

  return result as RecensementResponse;
}

export async function getRecensementHistory(): Promise<
  RecensementHistoryItem[]
> {
  const response = await fetch(`${API_URL}/api/recensement/history`, {
    method: "GET",
    credentials: "include",
  });

  let data: RecensementHistoryItem[] | { detail?: string };

  try {
    data = await response.json();
  } catch {
    throw new Error("Le serveur a retourné une réponse invalide.");
  }

  if (!response.ok) {
    throw new Error(
      "detail" in data && data.detail
        ? data.detail
        : "Impossible de charger l'historique.",
    );
  }

  return data as RecensementHistoryItem[];
}

export interface RecensementDetail {
  id: string;
  numero_fiche: string;
  numero_karine: string | null;
  statut: string;

  qr_token: string;
  qr_generated_at: string | null;
  is_qr_scanned_and_verified: boolean;

  date_recensement_terrain: string | null;
  created_at: string | null;
  validated_at: string | null;

  personne: {
    id: string;
    nom: string;
    prenoms: string;
    sexe: string | null;
    date_naissance: string | null;
    lieu_naissance: string | null;
    numero_cin: string;
    numero_serie_cin: string | null;
    date_delivrance: string | null;
    lieu_delivrance: string | null;
    profession: string | null;
    nom_pere: string | null;
    pere_decede: boolean | null;
    nom_mere: string | null;
    mere_decede: boolean | null;
    telephone: string | null;
    lot_logement: string | null;
    quartier_secteur: string | null;
  };

  agent: {
    id: string;
    matricule: string;
    nom: string;
    prenoms: string;
  };

  fokontany: {
    id: string;
    code: string;
    nom: string;
    commune: string;
    district: string;
    region: string;
  };
}

export async function getRecensementDetail(
  recensementId: string,
): Promise<RecensementDetail> {
  const response = await fetch(`${API_URL}/api/recensement/${recensementId}`, {
    method: "GET",
    credentials: "include",
  });

  let data: RecensementDetail | { detail?: string };

  try {
    data = await response.json();
  } catch {
    throw new Error("Le serveur a retourné une réponse invalide.");
  }

  if (!response.ok) {
    throw new Error(
      "detail" in data && data.detail
        ? data.detail
        : "Impossible de charger les détails du recensement.",
    );
  }

  return data as RecensementDetail;
}
