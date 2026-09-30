from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class FokontanyAccessRequest(BaseModel):
    code: str
    code_acces: str


class FokontanyAccessResponse(BaseModel):
    access_granted: bool
    registration_required: bool
    fokontany_id: UUID
    fokontany_nom: str
    registration_token: str | None = None
    message: str


class AgentRegisterRequest(BaseModel):
    nom: str
    prenoms: str
    telephone: str
    email: str
    adresse: str


class FokontanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    nom: str
    commune: str
    district: str
    code_district: int | None = None
    region: str
    province: str


class AgentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    fokontany_id: UUID
    matricule: str
    nom: str
    prenoms: str
    telephone: str
    email: str | None = None
    adresse: str | None = None
    is_active: bool
    fokontany: FokontanyResponse | None = None


class AgentAccessRequest(BaseModel):
    fokontany_id: str
    matricule: str

class AgentLoginResponse(BaseModel):
    access_token: str
    token_type: str
    agent: AgentResponse
    message: str


class AgentAccessResponse(BaseModel):
    access_granted: bool
    agent: AgentResponse
    message: str