from pydantic import BaseModel


class CINExtractedData(BaseModel):
    nom: str | None = None
    prenoms: str | None = None
    sexe: str | None = None
    date_naissance: str | None = None
    lieu_naissance: str | None = None
    numero_cin: str | None = None

    numero_serie_cin: str | None = None
    profession: str | None = None
    nom_pere: str | None = None
    nom_mere: str | None = None
    lieu_delivrance: str | None = None
    date_delivrance: str | None = None


class OCRResult(BaseModel):
    success: bool
    data: CINExtractedData
    message: str