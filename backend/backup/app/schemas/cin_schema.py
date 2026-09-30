from typing import Optional
from pydantic import BaseModel, Field


class InformationsRecto(BaseModel):
    nom: Optional[str] = None
    prenoms: Optional[str] = None
    dateNaissance: Optional[str] = None
    lieuNaissance: Optional[str] = None
    numeroCin: Optional[str] = None
    sexe: Optional[str] = None


class InformationsVerso(BaseModel):
    nomPere: Optional[str] = None
    nomMere: Optional[str] = None
    rang: Optional[str] = None
    profession: Optional[str] = None
    lieuDelivrance: Optional[str] = None
    dateDelivrance: Optional[str] = None


class PersonneExtraite(BaseModel):
    nom: Optional[str] = None
    prenoms: Optional[str] = None
    dateNaissance: Optional[str] = None
    lieuNaissance: Optional[str] = None
    numeroCin: Optional[str] = None
    sexe: Optional[str] = None
    nomPere: Optional[str] = None
    nomMere: Optional[str] = None
    rang: Optional[str] = None
    profession: Optional[str] = None
    lieuDelivrance: Optional[str] = None
    dateDelivrance: Optional[str] = None


class CINOCRResponse(BaseModel):
    success: bool
    person: PersonneExtraite
    warnings: list[str] = Field(default_factory=list)