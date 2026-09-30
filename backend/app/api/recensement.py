import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependancy import get_current_agent
from app.db.database import get_db
from app.models.agent import Agent
from app.models.personne import Personne
from app.models.recensement import Recensement, RecensementStatus
from app.models.audit_log import AuditLog
from app.schemas.recensement import (
    RecensementCreate,
    RecensementResponse,
)
from sqlalchemy import text


router = APIRouter(
    prefix="/api/recensement",
    tags=["Recensement"],
)


def parse_date(value: str | None, field_name: str) -> date | None:
    """
    Convertit une date provenant du frontend/OCR vers un objet date.
    
    Formats acceptés :
    - JJ/MM/AAAA
    - JJ-MM-AAAA
    - AAAA-MM-JJ
    """
    if not value:
        return None

    value = value.strip()

    formats = [
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%Y-%m-%d",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue

    raise HTTPException(
        status_code=400,
        detail=(
            f"Format de date invalide pour {field_name}. "
            "Formats acceptés : JJ/MM/AAAA, JJ-MM-AAAA ou AAAA-MM-JJ."
        ),
    )


@router.post(
    "",
    response_model=RecensementResponse,
)
def create_recensement(
    data: RecensementCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):

    if not current_agent.is_active:
        raise HTTPException(
            status_code=403,
            detail="Cet agent est désactivé.",
        )

    numero_cin = data.numero_cin.strip().upper()
    numero_fiche = db.execute(
        text("SELECT nextval('numero_fiche_seq')")
    ).scalar_one()

    numero_fiche = f"{int(numero_fiche):08d}"

    nom = data.nom.strip()
    prenoms = data.prenoms.strip()

    if not numero_cin:
        raise HTTPException(
            status_code=400,
            detail="Le numéro CIN est obligatoire.",
        )

    if not nom:
        raise HTTPException(
            status_code=400,
            detail="Le nom est obligatoire.",
        )

    if not prenoms:
        raise HTTPException(
            status_code=400,
            detail="Les prénoms sont obligatoires.",
        )

    # =========================================================
    # 3. Conversion des dates
    # =========================================================

    date_naissance = parse_date(
        data.date_naissance,
        "date_naissance",
    )

    date_delivrance = parse_date(
        data.date_delivrance,
        "date_delivrance",
    )

    date_recensement_terrain = parse_date(
        data.date_recensement_terrain,
        "date_recensement_terrain",
    )

    # =========================================================
    # 4. Vérification du CIN
    # =========================================================

    existing_personne = (
        db.query(Personne)
        .filter(Personne.numero_cin == numero_cin)
        .first()
    )

    if existing_personne:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Le numéro CIN {numero_cin} existe déjà "
                "dans la base de données."
            ),
        )

    # =========================================================
    # 5. Vérification du numéro de fiche
    # =========================================================

    existing_recensement = (
        db.query(Recensement)
        .filter(Recensement.numero_fiche == numero_fiche)
        .first()
    )

    if existing_recensement:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Le numéro de fiche {numero_fiche} "
                "existe déjà."
            ),
        )

    # =========================================================
    # 6. Création de Personne
    # =========================================================

    personne = Personne(
        nom=nom,
        prenoms=prenoms,
        sexe=data.sexe,
        date_naissance=date_naissance,
        lieu_naissance=data.lieu_naissance,
        nee_vers=data.nee_vers,

        numero_cin=numero_cin,
        numero_serie_cin=data.numero_serie_cin,

        date_delivrance=date_delivrance,
        lieu_delivrance=data.lieu_delivrance,

        nom_pere=data.nom_pere,
        pere_decede=data.pere_decede,

        nom_mere=data.nom_mere,
        mere_decede=data.mere_decede,

        profession=data.profession,

        lot_logement=data.lot_logement,
        quartier_secteur=data.quartier_secteur,

        telephone=data.telephone,

        # IMPORTANT :
        # le fokontany vient de l'agent authentifié
        fokontany_id=current_agent.fokontany_id,
    )

    db.add(personne)

    # Génère personne.id avant de créer Recensement
    db.flush()

    # =========================================================
    # 7. Création du recensement
    # =========================================================

    recensement = Recensement(
        numero_fiche=numero_fiche,
        numero_karine=data.numero_karine,

        personne_id=personne.id,
        agent_id=current_agent.id,
        fokontany_id=current_agent.fokontany_id,

        statut=RecensementStatus.VALIDE,

        nom_temoin_present=f"{personne.nom} {personne.prenoms}".strip(),

        nom_membre_clre=f"{current_agent.nom} {current_agent.prenoms}".strip(),

        date_recensement_terrain=date_recensement_terrain,

        validated_at=datetime.now(timezone.utc),
        qr_generated_at=datetime.now(timezone.utc),
    )

    db.add(recensement)

    # Génère recensement.id et qr_token
    db.flush()

    # =========================================================
    # 8. Audit
    # =========================================================

    audit_log = AuditLog(
        agent_id=current_agent.id,
        fokontany_id=current_agent.fokontany_id,
        action="CREATE",
        resource_type="RECENSEMENT",
        resource_id=recensement.id,
        ip_address=(
            request.client.host
            if request.client
            else None
        ),
        user_agent=request.headers.get("user-agent"),
    )

    db.add(audit_log)

    # =========================================================
    # 9. Transaction
    # =========================================================

    try:
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Impossible d'enregistrer le recensement. "
                "Le numéro CIN ou le numéro de fiche existe "
                "peut-être déjà."
            ),
        )

    # =========================================================
    # 10. Réponse
    # =========================================================

    return RecensementResponse(
        success=True,
        recensement_id=str(recensement.id),
        personne_id=str(personne.id),
        numero_fiche=recensement.numero_fiche,
        numero_cin=personne.numero_cin,
        qr_token=recensement.qr_token,
        statut=recensement.statut.value,
        message="Recensement enregistré avec succès.",
    )

@router.get("/history")
def get_recensement_history(
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    """
    Retourne l'historique des recensements de l'agent connecté.
    """

    recensements = (
        db.query(Recensement)
        .filter(
            Recensement.agent_id == current_agent.id
        )
        .order_by(
            Recensement.created_at.desc()
        )
        .all()
    )

    return [
        {
            "id": str(recensement.id),
            "numeroFiche": recensement.numero_fiche,
            "numeroCin": (
                recensement.personne.numero_cin
                if recensement.personne
                else None
            ),
            "nom": (
                recensement.personne.nom
                if recensement.personne
                else ""
            ),
            "prenoms": (
                recensement.personne.prenoms
                if recensement.personne
                else ""
            ),
            "date": recensement.created_at.strftime("%d/%m/%Y"),
            "heure": recensement.created_at.strftime("%H:%M"),
            "statut": recensement.statut.value,
        }
        for recensement in recensements
    ]


@router.get("/{recensement_id}")
def get_recensement_detail(
    recensement_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    recensement = (
        db.query(Recensement)
        .filter(
            Recensement.id == recensement_id,
            Recensement.agent_id == current_agent.id,
        )
        .first()
    )

    if not recensement:
        raise HTTPException(
            status_code=404,
            detail="Recensement introuvable.",
        )

    personne = recensement.personne

    if not personne:
        raise HTTPException(
            status_code=404,
            detail="Personne associée au recensement introuvable.",
        )

    return {
        "id": str(recensement.id),
        "numero_fiche": recensement.numero_fiche,
        "numero_karine": recensement.numero_karine,
        "statut": recensement.statut.value,

        "qr_token": recensement.qr_token,
        "qr_generated_at": (
            recensement.qr_generated_at.isoformat()
            if recensement.qr_generated_at
            else None
        ),
        "is_qr_scanned_and_verified": recensement.is_qr_scanned_and_verified,

        "date_recensement_terrain": (
            recensement.date_recensement_terrain.isoformat()
            if recensement.date_recensement_terrain
            else None
        ),

        "created_at": (
            recensement.created_at.isoformat()
            if recensement.created_at
            else None
        ),

        "validated_at": (
            recensement.validated_at.isoformat()
            if recensement.validated_at
            else None
        ),

        "personne": {
            "id": str(personne.id),
            "nom": personne.nom,
            "prenoms": personne.prenoms,
            "sexe": personne.sexe,
            "date_naissance": (
                personne.date_naissance.isoformat()
                if personne.date_naissance
                else None
            ),
            "lieu_naissance": personne.lieu_naissance,
            "numero_cin": personne.numero_cin,
            "numero_serie_cin": personne.numero_serie_cin,
            "date_delivrance": (
                personne.date_delivrance.isoformat()
                if personne.date_delivrance
                else None
            ),
            "lieu_delivrance": personne.lieu_delivrance,
            "profession": personne.profession,
            "nom_pere": personne.nom_pere,
            "pere_decede": personne.pere_decede,
            "nom_mere": personne.nom_mere,
            "mere_decede": personne.mere_decede,
            "telephone": personne.telephone,
            "lot_logement": personne.lot_logement,
            "quartier_secteur": personne.quartier_secteur,
        },

        "agent": {
            "id": str(current_agent.id),
            "matricule": current_agent.matricule,
            "nom": current_agent.nom,
            "prenoms": current_agent.prenoms,
        },

        "fokontany": {
            "id": str(current_agent.fokontany.id),
            "code": current_agent.fokontany.code,
            "nom": current_agent.fokontany.nom,
            "commune": current_agent.fokontany.commune,
            "district": current_agent.fokontany.district,
            "region": current_agent.fokontany.region,
        },
    }