import type { CINExtractedData, OCRResult } from "../types/ocr";

const API_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

export async function extractCIN(
  recto: File,
  verso: File,
): Promise<CINExtractedData> {
  const formData = new FormData();

  formData.append("recto", recto);
  formData.append("verso", verso);

  const response = await fetch(`${API_URL}/api/ocr/cin`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  let data: OCRResult | { detail?: string };

  try {
    data = await response.json();
  } catch {
    throw new Error("Le serveur a retourné une réponse invalide.");
  }

  if (!response.ok) {
    const detail =
      "detail" in data && data.detail
        ? data.detail
        : "Impossible d'effectuer l'OCR de la CIN.";

    throw new Error(detail);
  }

  if (!("success" in data) || !data.success) {
    throw new Error("L'OCR n'a pas pu extraire les informations de la CIN.");
  }

  return data.data;
}
