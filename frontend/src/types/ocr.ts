export interface CINExtractedData {
  nom: string;
  prenoms: string;
  sexe: string;
  date_naissance: string;
  lieu_naissance: string;
  numero_cin: string;
  numero_serie_cin: string;
  profession: string;
  nom_pere: string;
  nom_mere: string;
  lieu_delivrance: string;
  date_delivrance: string;
}

export interface OCRResult {
  success: boolean;
  data: CINExtractedData;
  message: string;
}
