import time
from pathlib import Path

from google import genai
from google.genai import types
from google.genai.errors import ServerError, ClientError

from app.exceptions.gemini_exception import (
    GeminiUnavailableError,
    GeminiQuotaError,
)

from app.core.config import GEMINI_API_KEY, GEMINI_MODEL
from app.schemas.cin_schema import InformationsRecto, InformationsVerso, PersonneExtraite

class GeminiService:

    def __init__(self):
        self.client = genai.Client(
            api_key=GEMINI_API_KEY
        )

    def _generate_content(
            self,
            image_bytes: bytes,
            prompt: str,
            response_schema,
    ):
        for attempt in range(2):
            try:
                return self.client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=[
                        types.Part.from_bytes(
                            data=image_bytes,
                            mime_type="image/jpeg",
                        ),
                        prompt,
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=response_schema,
                        thinking_config=types.ThinkingConfig(
                            thinking_level="low"
                        ),
                    ),
                )

            except ServerError as error:

                if attempt == 0:
                    time.sleep(1)
                    continue

                raise GeminiUnavailableError(
                    "Le service Gemini est temporairement indisponible."
                ) from error

            except ClientError as error:

                if error.code == 429:
                    raise GeminiQuotaError(
                        "Le quota Gemini a été atteint. "
                        "Veuillez réessayer plus tard."
                    ) from error

                raise GeminiUnavailableError(
                    "Une erreur est survenue lors de la communication "
                    "avec le service Gemini."
                ) from error

    def extraire_recto(
        self,
        image_path: str
    ) -> InformationsRecto:

        image_bytes = Path(image_path).read_bytes()

        prompt = """
Tu analyses une carte nationale d'identité malgache.

Cette image correspond UNIQUEMENT au RECTO de la carte.

Extrais uniquement les informations suivantes :

- ANARANA / Nom → nom
- FANAMPIN'ANARANA / Prenoms → prenoms
- TERAKA TAMIN'NY / Ne(e) le → dateNaissance
- TAO / a → lieuNaissance
- LAHARANA / N → numeroCin

Règles importantes :

1. Ne cherche aucune information provenant du verso.
2. Ne devine jamais une information.
3. Si une information est absente ou illisible, retourne null.
4. Respecte exactement les informations visibles sur le document.
5. Ne retourne aucune explication.
6. Retourne uniquement les champs du schéma demandé.
"""
        response = self._generate_content(
            image_bytes=image_bytes,
            prompt=prompt,
            response_schema=InformationsRecto,
        )

        return InformationsRecto.model_validate_json(
            response.text
        )


    def extraire_verso(
            self,
            image_path: str
    ) -> InformationsVerso:

        image_bytes = Path(image_path).read_bytes()

        prompt = """
    Tu analyses une carte nationale d'identité malgache.

    Cette image correspond UNIQUEMENT au VERSO de la carte.

    Extrais uniquement les informations suivantes :

    - RAY NITERAKA / Pere → nomPere
    - RENY NITERAKA / Mere → nomMere
    - N° -> rang
    - ASA ATAO / Profession -> profession
    - NATAO TAO / Fait a -> lieuDelivrance
    - TAMIN'NY / Le -> dateDelivrance
    

    Règles importantes :

    1. Ne cherche aucune information provenant du recto.
    2. Ne retourne que le nom du père et le nom de la mère.
    3. Ne confonds pas les noms des parents avec d'autres noms présents sur le document.
    4. Ne devine jamais une information.
    5. Si une information est absente ou illisible, retourne null.
    6. Respecte exactement les informations visibles sur le document.
    7. Ne retourne aucune explication.
    8. Retourne uniquement les champs du schéma demandé.
    """
        response = self._generate_content(
            image_bytes=image_bytes,
            prompt=prompt,
            response_schema=InformationsVerso,
        )

        return InformationsVerso.model_validate_json(
            response.text
        )


    def extraire_cin(
            self,
            recto_path: str,
            verso_path: str,
    ) -> PersonneExtraite:

        recto = self.extraire_recto(recto_path)
        verso = self.extraire_verso(verso_path)

        return PersonneExtraite(
            nom=recto.nom,
            prenoms=recto.prenoms,
            dateNaissance=recto.dateNaissance,
            lieuNaissance=recto.lieuNaissance,
            numeroCin=recto.numeroCin,

            nomPere=verso.nomPere,
            nomMere=verso.nomMere,
            rang=verso.rang,
            lieuDelivrance=verso.lieuDelivrance,
            dateDelivrance=verso.dateDelivrance,
            profession=verso.profession
        )