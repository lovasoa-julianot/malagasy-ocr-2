
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ChefFokontanyRegisterRequest(BaseModel):
    code_fokontany: str = Field(
        min_length=1,
        max_length=50,
    )

    nom_fokontany: str = Field(
        min_length=1,
        max_length=150,
    )

    commune: str = Field(
        min_length=1,
        max_length=150,
    )

    district: str = Field(
        min_length=1,
        max_length=150,
    )

    code_district: int = Field(
        ge=1,
        le=119,
    )

    region: str = Field(
        min_length=1,
        max_length=150,
    )

    province: str = Field(
        min_length=1,
        max_length=150,
    )

    nom: str = Field(
        min_length=1,
        max_length=100,
    )

    prenoms: str = Field(
        min_length=1,
        max_length=150,
    )

    telephone: str = Field(
        min_length=3,
        max_length=30,
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )


class ChefFokontanyRegisterResponse(BaseModel):
    success: bool
    request_id: UUID
    statut: str
    message: str


class ChefFokontanyRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID

    code_fokontany: str
    nom_fokontany: str
    commune: str

    district: str
    code_district: int

    region: str
    province: str

    nom: str
    prenoms: str
    telephone: str
    email: EmailStr

    statut: str
    motif_rejet: str | None

    reviewed_by: UUID | None
    reviewed_at: datetime | None

    created_at: datetime
    updated_at: datetime


class ChefFokontanyApproveRequest(BaseModel):
    commentaire: str | None = Field(
        default=None,
        max_length=500,
    )


class ChefFokontanyRejectRequest(BaseModel):
    motif: str = Field(
        min_length=3,
        max_length=1000,
    )


class ChefFokontanyReviewResponse(BaseModel):
    success: bool
    request_id: UUID
    statut: str
    message: str


class ChefFokontanyApproveResponse(BaseModel):
    success: bool
    request_id: UUID
    statut: str
    message: str
    code_acces_fokontany: str

