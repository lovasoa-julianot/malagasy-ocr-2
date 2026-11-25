export interface RecensementCreate {
  numero_karine?: string | null;
  nom: string;
  prenoms: string;
  sexe?: string | null;
  date_naissance?: string | null;
  lieu_naissance?: string | null;
  nee_vers?: boolean | null;
  numero_cin: string;
  numero_serie_cin?: string | null;
  profession?: string | null;
  nom_pere?: string | null;
  pere_decede?: boolean | null;
  nom_mere?: string | null;
  mere_decede?: boolean | null;
  lieu_delivrance?: string | null;
  date_delivrance?: string | null;
  telephone?: string | null;
  lot_logement?: string | null;
  quartier_secteur?: string | null;
  date_recensement_terrain?: string | null;
  /**
   * Précision de la lecture OCR mesurée par l'agent :
   * part des champs laissés inchangés après relecture (0 à 100).
   */
  ocr_confidence?: number | null;
}

export interface RecensementResponse {
  success: boolean;
  recensement_id: string;
  personne_id: string;
  numero_fiche: string;
  numero_cin: string;
  qr_token: string;
  statut: string;
  message: string;

  /**
   * Vrai quand la personne (CIN + etat civil) existait deja : aucun
   * doublon n'a ete cree, les donnees renvoient l'enregistrement existant.
   */
  deja_existe: boolean;
}
