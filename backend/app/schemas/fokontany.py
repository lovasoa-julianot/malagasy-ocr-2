from uuid import UUID

from pydantic import BaseModel, ConfigDict


class FokontanyCreate(BaseModel):
    nom: str
    code: str
    commune: str
    district: str
    code_district: int | None = None
    region: str
    province: str
    code_acces: str
    objectif_habitants: int = 0


class FokontanyUpdate(BaseModel):
    nom: str | None = None
    code: str | None = None
    commune: str | None = None
    district: str | None = None
    code_district: int | None = None
    region: str | None = None
    province: str | None = None
    code_acces: str | None = None
    objectif_habitants: int | None = None
    is_active: bool | None = None


class FokontanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nom: str
    code: str
    commune: str
    district: str
    code_district: int | None = None
    region: str
    province: str
    objectif_habitants: int
    is_active: bool