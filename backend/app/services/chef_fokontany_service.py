
import secrets
import string
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.chef_fokontany_request import (
    ChefFokontanyRequest,
    ChefFokontanyRequestStatus,
)
from app.models.fokontany import Fokontany
from app.models.utilisateur import Utilisateur
from app.schemas.chef_fokontany import (
    ChefFokontanyApproveRequest,
    ChefFokontanyRegisterRequest,
    ChefFokontanyRejectRequest,
)
from app.services.audit_service import OUTCOME_SUCCESS, log_action
from app.services.fokontany_code_service import (
    generer_code_fokontany,
)
from app.data.madagascar_administrative import validate_district


def generate_fokontany_access_code(length: int = 8) -> str:
    """
    Génère un code d'accès aléatoire pour les agents du Fokontany.

    Le code en clair n'est jamais enregistré en base.
    Seul son hash est conservé dans Fokontany.code_acces_hash.
    """

    alphabet = string.ascii_uppercase + string.digits

    return "".join(
        secrets.choice(alphabet)
        for _ in range(length)
    )


class ChefFokontanyService:

    @staticmethod
    def register_request(
        db: Session,
        data: ChefFokontanyRegisterRequest,
        request_payload: Request | None = None,
    ) -> ChefFokontanyRequest:

        if not validate_district(
                province=data.province,
                region=data.region,
                district=data.district,
                code_district=data.code_district,
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Les informations administratives sont invalides. "
                    "La province, la région, le district et le code district "
                    "ne correspondent pas."
                ),
            )

        email = str(data.email).strip().lower()

        # ---------------------------------------------------------
        # Le code Fokontany est attribué par le serveur selon la
        # norme FKT-<lettre du district>-<7 chiffres>.
        # Il n'est plus demandé au demandeur.
        # ---------------------------------------------------------

        code_fokontany = generer_code_fokontany(
            db,
            district=data.district,
        )

        # ---------------------------------------------------------
        # Vérifier que l'email n'est pas déjà utilisé par un compte
        # ---------------------------------------------------------
        existing_user = db.scalar(
            select(Utilisateur).where(
                Utilisateur.email == email
            )
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cette adresse email est déjà utilisée.",
            )

        # ---------------------------------------------------------
        # Vérifier qu'une demande en attente n'existe pas déjà
        # ---------------------------------------------------------
        existing_request = db.scalar(
            select(ChefFokontanyRequest)
            .where(
                ChefFokontanyRequest.email == email,
                ChefFokontanyRequest.statut
                == ChefFokontanyRequestStatus.EN_ATTENTE,
            )
        )

        if existing_request:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Une demande d'inscription est déjà "
                    "en attente pour cette adresse email."
                ),
            )

        # ---------------------------------------------------------
        # La génération du code a déjà écarté les collisions
        # avec un Fokontany existant ou une demande en attente.
        # Ce contrôle reste en défense si une saisie manuelle
        # intervene entre l'attribution et l'enregistrement.
        # ---------------------------------------------------------
        existing_fokontany = db.scalar(
            select(Fokontany).where(
                Fokontany.code == code_fokontany
            )
        )

        if existing_fokontany:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ce code Fokontany est déjà enregistré.",
            )

        # ---------------------------------------------------------
        # Vérifier qu'une demande en attente n'existe pas déjà
        # pour ce code
        # ---------------------------------------------------------
        existing_code_request = db.scalar(
            select(ChefFokontanyRequest)
            .where(
                ChefFokontanyRequest.code_fokontany
                == code_fokontany,
                ChefFokontanyRequest.statut
                == ChefFokontanyRequestStatus.EN_ATTENTE,
            )
        )

        if existing_code_request:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Une demande est déjà en attente "
                    "pour ce code Fokontany."
                ),
            )

        # ---------------------------------------------------------
        # Création de la demande
        # ---------------------------------------------------------
        request = ChefFokontanyRequest(
            code_fokontany=code_fokontany,
            nom_fokontany=data.nom_fokontany.strip(),
            commune=data.commune.strip(),
            district=data.district.strip(),
            code_district=data.code_district,
            region=data.region.strip(),
            province=data.province.strip(),
            nom=data.nom.strip(),
            prenoms=data.prenoms.strip(),
            telephone=data.telephone.strip(),
            email=email,
            password_hash=hash_password(data.password),
            statut=ChefFokontanyRequestStatus.EN_ATTENTE,
        )

        try:
            db.add(request)
            db.flush()

            log_action(
                db,
                action="CREATE",
                resource_type="CHEF_REQUEST",
                resource_id=request.id,
                outcome=OUTCOME_SUCCESS,
                details=(
                    f"Demande d'inscription Chef Fokontany "
                    f"déposée pour le territoire "
                    f"{request.nom_fokontany} "
                    f"({request.district}, {request.region}) "
                    f"avec le code {code_fokontany}, "
                    f"par {request.nom} {request.prenoms}."
                ),
                request=request_payload,
            )

            db.commit()
            db.refresh(request)

        except Exception:
            db.rollback()
            raise

        return request

    @staticmethod
    def get_pending_requests(
        db: Session,
    ) -> list[ChefFokontanyRequest]:

        return list(
            db.scalars(
                select(ChefFokontanyRequest)
                .where(
                    ChefFokontanyRequest.statut
                    == ChefFokontanyRequestStatus.EN_ATTENTE
                )
                .order_by(
                    ChefFokontanyRequest.created_at.desc()
                )
            ).all()
        )

    @staticmethod
    def get_request(
        db: Session,
        request_id: UUID,
    ) -> ChefFokontanyRequest:

        request = db.get(
            ChefFokontanyRequest,
            request_id,
        )

        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Demande Chef Fokontany introuvable.",
            )

        return request

    @staticmethod
    def approve_request(
        db: Session,
        request_id: UUID,
        admin: Utilisateur,
        data: ChefFokontanyApproveRequest | None = None,
    ) -> tuple[ChefFokontanyRequest, str]:

        request = ChefFokontanyService.get_request(
            db,
            request_id,
        )

        # ---------------------------------------------------------
        # La demande doit être EN_ATTENTE
        # ---------------------------------------------------------
        if (
            request.statut
            != ChefFokontanyRequestStatus.EN_ATTENTE
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Cette demande a déjà été traitée."
                ),
            )

        # ---------------------------------------------------------
        # Double vérification avant création
        # ---------------------------------------------------------
        existing_user = db.scalar(
            select(Utilisateur).where(
                Utilisateur.email == request.email
            )
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Cette adresse email est déjà associée "
                    "à un compte utilisateur."
                ),
            )

        existing_fokontany = db.scalar(
            select(Fokontany).where(
                Fokontany.code == request.code_fokontany
            )
        )

        if existing_fokontany:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Ce code Fokontany est déjà enregistré."
                ),
            )

        # ---------------------------------------------------------
        # Génération du code d'accès destiné aux agents
        # ---------------------------------------------------------
        access_code = generate_fokontany_access_code()

        # ---------------------------------------------------------
        # Création du compte Chef
        # ---------------------------------------------------------
        chef = Utilisateur(
            email=request.email,
            password_hash=request.password_hash,
            nom=request.nom,
            prenoms=request.prenoms,
            role="CHEF_FOKONTANY",
            is_active=True,
        )

        db.add(chef)
        db.flush()

        # ---------------------------------------------------------
        # Création du Fokontany
        # ---------------------------------------------------------
        fokontany = Fokontany(
            nom=request.nom_fokontany,
            code=request.code_fokontany,
            commune=request.commune,
            district=request.district,
            code_district=request.code_district,
            region=request.region,
            province=request.province,
            code_acces_hash=hash_password(access_code),
            code_acces_clair=access_code,
            is_active=True,
            chef_id=chef.id,
        )

        db.add(fokontany)
        db.flush()

        # ---------------------------------------------------------
        # Mise à jour de la demande
        # ---------------------------------------------------------
        request.statut = (
            ChefFokontanyRequestStatus.APPROUVE
        )
        request.reviewed_by = admin.id
        request.reviewed_at = datetime.now(timezone.utc)

        log_action(
            db,
            action="APPROVE",
            resource_type="CHEF_REQUEST",
            resource_id=request.id,
            utilisateur_id=admin.id,
            fokontany_id=fokontany.id,
            outcome=OUTCOME_SUCCESS,
            details=(
                f"Approbation de la demande Chef Fokontany "
                f"pour le territoire {fokontany.nom} "
                f"({fokontany.code}) par {admin.nom} {admin.prenoms}."
            ),
        )

        db.commit()
        db.refresh(request)

        return request, access_code

    @staticmethod
    def reject_request(
        db: Session,
        request_id: UUID,
        admin: Utilisateur,
        data: ChefFokontanyRejectRequest,
    ) -> ChefFokontanyRequest:

        request = ChefFokontanyService.get_request(
            db,
            request_id,
        )

        # ---------------------------------------------------------
        # La demande doit être EN_ATTENTE
        # ---------------------------------------------------------
        if (
            request.statut
            != ChefFokontanyRequestStatus.EN_ATTENTE
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Cette demande a déjà été traitée."
                ),
            )

        request.statut = (
            ChefFokontanyRequestStatus.REJETE
        )
        request.motif_rejet = data.motif.strip()
        request.reviewed_by = admin.id
        request.reviewed_at = datetime.now(timezone.utc)

        log_action(
            db,
            action="REJECT",
            resource_type="CHEF_REQUEST",
            resource_id=request.id,
            utilisateur_id=admin.id,
            outcome=OUTCOME_SUCCESS,
            details=(
                f"Rejet de la demande Chef Fokontany "
                f"pour le territoire {request.nom_fokontany} "
                f"({request.code_fokontany}) "
                f"par {admin.nom} {admin.prenoms}. "
                f"Motif : {request.motif_rejet}"
            ),
        )

        try:
            db.commit()
            db.refresh(request)

        except Exception:
            db.rollback()
            raise

        return request
