# app/services/ocr_service.py

import json
import logging

from google import genai
from google.genai import types

from app.core.config import settings
from app.schemas.ocr import CINExtractedData
from datetime import datetime


logger = logging.getLogger(__name__)


class OCRService:

    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY n'est pas configurée dans le fichier .env"
            )

        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

        self.primary_model = getattr(
            settings,
            "GEMINI_PRIMARY_MODEL",
            "gemini-3.6-flash",
        )

        self.fallback_model = getattr(
            settings,
            "GEMINI_FALLBACK_MODEL",
            "gemini-3.5-flash-lite",
        )

    def _build_prompt(self) -> str:
        return """
Tu es un système OCR spécialisé dans l'extraction
d'informations à partir des cartes nationales d'identité
malgaches (CIN).

Tu reçois deux images :
1. RECTO de la CIN
2. VERSO de la CIN

Analyse attentivement les deux images.

========================
CHAMPS DU RECTO
========================

ANARANA
→ nom

FANAMPIN'ANARANA
→ prenoms

TERAKA TAMIN'NY
→ date_naissance

TAO
→ lieu_naissance

LAHARANA / N°
→ numero_cin

SEXE
→ sexe

========================
CHAMPS DU VERSO
========================

N°
→ numero_serie_cin

ASA ATAO
→ profession

RAY NITERAKA
→ nom_pere

RENY NITERAKA
→ nom_mere

NATAO TAO
→ lieu_delivrance

TAMIN'NY
→ date_delivrance

========================
RÈGLES
========================

1. Ne jamais inventer une information.

2. Si une information est absente ou illisible,
   retourner null.

3. Respecter exactement les noms et prénoms visibles.

4. Ne pas corriger automatiquement les noms propres.

5. Faire particulièrement attention au numéro CIN.

6. Ne pas confondre le numéro CIN et le numéro de rang.

7. Les dates doivent être au format JJ/MM/AAAA
   lorsque cela est lisible.

8. Retourner uniquement les informations demandées.

9. Ne retourner aucune explication.

10. La réponse doit respecter exactement le schéma JSON.
"""

    def _normalize_date(
        self,
        value: str | None,
    ) -> str | None:

        if not value:
            return None

        value = value.strip()

        mois = {
            "janvier": "01",
            "février": "02",
            "fevrier": "02",
            "mars": "03",
            "avril": "04",
            "mai": "05",
            "juin": "06",
            "juillet": "07",
            "août": "08",
            "aout": "08",
            "septembre": "09",
            "octobre": "10",
            "novembre": "11",
            "décembre": "12",
            "decembre": "12",
        }

        # Déjà au format JJ/MM/AAAA
        try:
            date = datetime.strptime(value, "%d/%m/%Y")
            return date.strftime("%d/%m/%Y")
        except ValueError:
            pass

        # Format JJ-MM-AAAA
        try:
            date = datetime.strptime(value, "%d-%m-%Y")
            return date.strftime("%d/%m/%Y")
        except ValueError:
            pass

        # Format "18 Janvier 2000"
        parts = value.lower().split()

        if len(parts) == 3:
            jour = parts[0]
            mois_nom = parts[1]
            annee = parts[2]

            if mois_nom in mois:
                try:
                    return (
                        f"{int(jour):02d}/"
                        f"{mois[mois_nom]}/"
                        f"{int(annee):04d}"
                    )
                except ValueError:
                    pass

        logger.warning(
            "Format de date non reconnu : %s",
            value,
        )

        return value

    async def _call_model(
        self,
        model: str,
        recto_bytes: bytes,
        verso_bytes: bytes,
        recto_mime_type: str,
        verso_mime_type: str,
    ) -> CINExtractedData:

        logger.info(
            "Tentative OCR avec le modèle Gemini : %s",
            model,
        )

        response = await self.client.aio.models.generate_content(
            model=model,
            contents=[
                types.Part.from_bytes(
                    data=recto_bytes,
                    mime_type=recto_mime_type,
                ),
                types.Part.from_bytes(
                    data=verso_bytes,
                    mime_type=verso_mime_type,
                ),
                self._build_prompt(),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=CINExtractedData,
                temperature=0,
            ),
        )

        if not response.text:
            raise ValueError(
                f"Le modèle {model} a retourné une réponse vide."
            )

        data = json.loads(response.text)

        # Conversion JSON → modèle Pydantic
        extracted_data = CINExtractedData.model_validate(data)

        # Normalisation des dates
        extracted_data.date_naissance = self._normalize_date(
            extracted_data.date_naissance
        )

        extracted_data.date_delivrance = self._normalize_date(
            extracted_data.date_delivrance
        )

        return extracted_data

    async def extract_cin(
        self,
        recto_bytes: bytes,
        verso_bytes: bytes,
        recto_mime_type: str = "image/jpeg",
        verso_mime_type: str = "image/jpeg",
    ) -> CINExtractedData:

        primary_error = None

        # ==========================================
        # 1. MODÈLE PRINCIPAL
        # ==========================================

        try:
            return await self._call_model(
                model=self.primary_model,
                recto_bytes=recto_bytes,
                verso_bytes=verso_bytes,
                recto_mime_type=recto_mime_type,
                verso_mime_type=verso_mime_type,
            )

        except Exception as error:
            primary_error = error

            logger.exception(
                "Le modèle principal %s a échoué.",
                self.primary_model,
            )

        # ==========================================
        # 2. FALLBACK
        # ==========================================

        try:
            logger.info(
                "Activation du modèle fallback : %s",
                self.fallback_model,
            )

            return await self._call_model(
                model=self.fallback_model,
                recto_bytes=recto_bytes,
                verso_bytes=verso_bytes,
                recto_mime_type=recto_mime_type,
                verso_mime_type=verso_mime_type,
            )

        except Exception as fallback_error:
            logger.exception(
                "Le modèle fallback %s a également échoué.",
                self.fallback_model,
            )

            raise ValueError(
                "OCR Gemini échoué. "
                f"Principal ({self.primary_model}): {primary_error}. "
                f"Fallback ({self.fallback_model}): {fallback_error}"
            ) from fallback_error


    async def process(
        self,
        recto_bytes: bytes,
        verso_bytes: bytes,
        recto_mime_type: str = "image/jpeg",
        verso_mime_type: str = "image/jpeg",
    ) -> CINExtractedData:

        return await self.extract_cin(
            recto_bytes=recto_bytes,
            verso_bytes=verso_bytes,
            recto_mime_type=recto_mime_type,
            verso_mime_type=verso_mime_type,
        )


ocr_service = OCRService()