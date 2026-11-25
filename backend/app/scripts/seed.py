from datetime import date, datetime, timezone

from sqlalchemy import select

from app.core.security import hash_password
from app.db.database import SessionLocal
from app.models.agent import Agent
from app.models.chef_fokontany_request import (
    ChefFokontanyRequest,
    ChefFokontanyRequestStatus,
)
from app.models.fokontany import Fokontany
from app.models.personne import Personne
from app.models.recensement import Recensement, RecensementStatus
from app.models.utilisateur import Utilisateur

db = SessionLocal()


def get_or_create(model, defaults=None, **kwargs):
    instance = db.scalar(select(model).filter_by(**kwargs))
    if instance:
        return instance, False
    params = dict(kwargs)
    if defaults:
        params.update(defaults)
    instance = model(**params)
    db.add(instance)
    db.flush()
    return instance, True


try:
    # =========================================================
    # 1. Utilisateurs (admin + chefs fokontany)
    # =========================================================

    admin, _ = get_or_create(
        Utilisateur,
        email="admin@ocr-cin.mg",
        defaults=dict(
            password_hash=hash_password("Admin@2026"),
            nom="Administrateur",
            prenoms="Système",
            role="ADMIN",
            is_active=True,
        ),
    )
    print(f"Utilisateur admin : {admin.email}")

    chef_antsirabe, _ = get_or_create(
        Utilisateur,
        email="chef.antsirabe@fokontany.mg",
        defaults=dict(
            password_hash=hash_password("Chef@2026"),
            nom="Razafindrakoto",
            prenoms="Jean",
            role="CHEF_FOKONTANY",
            is_active=True,
        ),
    )
    print(f"Utilisateur chef : {chef_antsirabe.email}")

    chef_fianarantsoa, _ = get_or_create(
        Utilisateur,
        email="chef.fianarantsoa@fokontany.mg",
        defaults=dict(
            password_hash=hash_password("Chef@2026"),
            nom="Rakotoarisoa",
            prenoms="Marie",
            role="CHEF_FOKONTANY",
            is_active=True,
        ),
    )
    print(f"Utilisateur chef : {chef_fianarantsoa.email}")

    db.commit()

    # =========================================================
    # 2. Fokontany
    # =========================================================

    fokontany_data = [
        dict(
            nom="Fokontany Antananarivo Centre",
            code="FKT-A-0000001",
            commune="Antananarivo Renivohitra",
            district="Antananarivo",
            code_district=1,
            region="Analamanga",
            province="Antananarivo",
            code_acces_clair="ACC-ANT-0001",
            objectif_habitants=5000,
            chef_id=chef_antsirabe.id,
        ),
        dict(
            nom="Fokontany Ambositra Centre",
            code="FKT-A-0000002",
            commune="Ambositra",
            district="Ambositra",
            code_district=36,
            region="Amoron'i Mania",
            province="Fianarantsoa",
            code_acces_clair="ACC-AMB-0002",
            objectif_habitants=3000,
        ),
        dict(
            nom="Fokontany Fianarantsoa Est",
            code="FKT-F-0000001",
            commune="Fianarantsoa",
            district="Fianarantsoa",
            code_district=49,
            region="Haute Matsiatra",
            province="Fianarantsoa",
            code_acces_clair="ACC-FIA-0001",
            objectif_habitants=4000,
            chef_id=chef_fianarantsoa.id,
        ),
        dict(
            nom="Fokontany Toamasina Nord",
            code="FKT-T-0000001",
            commune="Toamasina",
            district="Toamasina I",
            code_district=60,
            region="Atsinanana",
            province="Toamasina",
            code_acces_clair="ACC-TMA-0001",
            objectif_habitants=4500,
        ),
    ]

    fokontany_objs = []
    for fd in fokontany_data:
        fk, created = get_or_create(
            Fokontany,
            code=fd["code"],
            defaults=dict(
                nom=fd["nom"],
                commune=fd["commune"],
                district=fd["district"],
                code_district=fd["code_district"],
                region=fd["region"],
                province=fd["province"],
                code_acces_hash=hash_password(fd["code_acces_clair"]),
                code_acces_clair=fd["code_acces_clair"],
                is_active=True,
                objectif_habitants=fd["objectif_habitants"],
                chef_id=fd.get("chef_id"),
            ),
        )
        fokontany_objs.append(fk)
        print(
            f"Fokontany : {fk.nom} ({fk.code}) {'cree' if created else 'existant'}"
        )

    db.commit()

    # =========================================================
    # 3. Agents
    # =========================================================

    agent_data = [
        dict(
            matricule="AGT-2026-000001",
            nom="Rakoto",
            prenoms="Hery",
            telephone="0341112223",
            email="agent.antsirabe@fokontany.mg",
            adresse="Lot II A 123, Ambositra",
            fokontany_id=fokontany_objs[1].id,
        ),
        dict(
            matricule="AGT-2026-000002",
            nom="Ravoahangy",
            prenoms="Noro",
            telephone="0342223334",
            email="agent.fianarantsoa@fokontany.mg",
            adresse="Lot IV B 456, Fianarantsoa",
            fokontany_id=fokontany_objs[2].id,
        ),
        dict(
            matricule="AGT-2026-000003",
            nom="Rajaonarisoa",
            prenoms="Tiana",
            telephone="0343334445",
            email="agent.toamasina@fokontany.mg",
            adresse="Lot V C 789, Toamasina",
            fokontany_id=fokontany_objs[3].id,
        ),
    ]

    agent_objs = []
    for ad in agent_data:
        ag, created = get_or_create(
            Agent,
            matricule=ad["matricule"],
            defaults=dict(
                nom=ad["nom"],
                prenoms=ad["prenoms"],
                telephone=ad["telephone"],
                email=ad["email"],
                adresse=ad["adresse"],
                fokontany_id=ad["fokontany_id"],
                is_active=True,
            ),
        )
        agent_objs.append(ag)
        print(
            f"Agent : {ag.nom} {ag.prenoms} ({ag.matricule}) "
            f"{'cree' if created else 'existant'}"
        )

    db.commit()

    # =========================================================
    # 4. Personnes (etat civil issu du CIN)
    # =========================================================

    personne_data = [
        dict(
            nom="RAZAFINDRAKOTO",
            prenoms="Jean Baptiste",
            sexe="M",
            date_naissance=date(1985, 3, 15),
            lieu_naissance="Antananarivo",
            nee_vers=False,
            numero_cin="CIN1000001",
            numero_serie_cin="001",
            date_delivrance=date(2020, 1, 10),
            lieu_delivrance="Antananarivo",
            nom_pere="RAZAFINDRAKOTO",
            pere_decede=False,
            nom_mere="RAZAFIMANANTSOA",
            mere_decede=False,
            profession="Agriculteur",
            lot_logement="Lot II A 123",
            quartier_secteur="Centre",
            telephone="0341112223",
            fokontany_id=fokontany_objs[1].id,
        ),
        dict(
            nom="RAKOTOARISOA",
            prenoms="Marie Louise",
            sexe="F",
            date_naissance=date(1990, 7, 22),
            lieu_naissance="Fianarantsoa",
            nee_vers=True,
            numero_cin="CIN2000002",
            numero_serie_cin="002",
            date_delivrance=date(2019, 5, 5),
            lieu_delivrance="Fianarantsoa",
            nom_pere="RAKOTOARISOA",
            pere_decede=True,
            nom_mere="RAZAFITSALAMA",
            mere_decede=False,
            profession="Commercante",
            lot_logement="Lot IV B 456",
            quartier_secteur="Est",
            telephone="0342223334",
            fokontany_id=fokontany_objs[2].id,
        ),
        dict(
            nom="RAJAONARISOA",
            prenoms="Tiana Andry",
            sexe="M",
            date_naissance=date(1988, 11, 8),
            lieu_naissance="Toamasina",
            nee_vers=False,
            numero_cin="CIN3000003",
            numero_serie_cin="003",
            date_delivrance=date(2021, 2, 14),
            lieu_delivrance="Toamasina",
            nom_pere="RAJAONARISOA",
            pere_decede=False,
            nom_mere="RANDRIANASOLO",
            mere_decede=False,
            profession="Pecheur",
            lot_logement="Lot V C 789",
            quartier_secteur="Nord",
            telephone="0343334445",
            fokontany_id=fokontany_objs[3].id,
        ),
    ]

    personne_objs = []
    for pd_ in personne_data:
        pp, created = get_or_create(
            Personne,
            numero_cin=pd_["numero_cin"],
            defaults=pd_,
        )
        personne_objs.append(pp)
        print(
            f"Personne : {pp.nom} {pp.prenoms} (CIN {pp.numero_cin}) "
            f"{'cree' if created else 'existant'}"
        )

    db.commit()

    # =========================================================
    # 5. Recensements
    # =========================================================

    recensement_data = [
        dict(
            numero_fiche="00000001",
            numero_karine="KARINE-2026-0001",
            personne_id=personne_objs[0].id,
            agent_id=agent_objs[0].id,
            fokontany_id=fokontany_objs[1].id,
            statut=RecensementStatus.VALIDE,
            nom_temoin_present="RAZAFINDRAKOTO Jean Baptiste",
            nom_membre_clre="Rakoto Hery",
            date_recensement_terrain=date(2026, 9, 1),
            ocr_confidence=92.5,
            validated_at=datetime.now(timezone.utc),
            qr_generated_at=datetime.now(timezone.utc),
        ),
        dict(
            numero_fiche="00000002",
            numero_karine="KARINE-2026-0002",
            personne_id=personne_objs[1].id,
            agent_id=agent_objs[1].id,
            fokontany_id=fokontany_objs[2].id,
            statut=RecensementStatus.VALIDE,
            nom_temoin_present="RAKOTOARISOA Marie Louise",
            nom_membre_clre="Ravoahangy Noro",
            date_recensement_terrain=date(2026, 9, 5),
            ocr_confidence=88.0,
            validated_at=datetime.now(timezone.utc),
            qr_generated_at=datetime.now(timezone.utc),
        ),
        dict(
            numero_fiche="00000003",
            numero_karine="KARINE-2026-0003",
            personne_id=personne_objs[2].id,
            agent_id=agent_objs[2].id,
            fokontany_id=fokontany_objs[3].id,
            statut=RecensementStatus.A_VERIFIER,
            nom_temoin_present="RAJAONARISOA Tiana Andry",
            nom_membre_clre="Rajaonarisoa Tiana",
            date_recensement_terrain=date(2026, 9, 10),
            ocr_confidence=75.0,
            validated_at=None,
            qr_generated_at=datetime.now(timezone.utc),
        ),
    ]

    for rd in recensement_data:
        rc, created = get_or_create(
            Recensement,
            numero_fiche=rd["numero_fiche"],
            defaults=rd,
        )
        print(
            f"Recensement : fiche {rc.numero_fiche} pour "
            f"{rc.personne.nom if rc.personne else '?'} "
            f"{'cree' if created else 'existant'}"
        )

    db.commit()

    # =========================================================
    # 6. Demandes Chef Fokontany (en attente)
    # =========================================================

    request_data = [
        dict(
            code_fokontany="FKT-T-0000002",
            nom_fokontany="Fokontany Toamasina Sud",
            commune="Toamasina",
            district="Toamasina II",
            code_district=61,
            region="Atsinanana",
            province="Toamasina",
            nom="RANDRIANASOLO",
            prenoms="Lala",
            telephone="0344445556",
            email="chef.toamasina@fokontany.mg",
            password_hash=hash_password("Chef@2026"),
            statut=ChefFokontanyRequestStatus.EN_ATTENTE,
        ),
    ]

    for rd in request_data:
        rr, created = get_or_create(
            ChefFokontanyRequest,
            email=rd["email"],
            defaults=rd,
        )
        print(
            f"Demande chef : {rr.nom} {rr.prenoms} ({rr.email}) "
            f"({rr.statut.value}) {'cree' if created else 'existant'}"
        )

    db.commit()

    print("\n============================================================")
    print("Seed termine avec succes.")
    print("Identifiants de test :")
    print("  Admin    : admin@ocr-cin.mg / Admin@2026")
    print("  Chef A   : chef.antsirabe@fokontany.mg / Chef@2026")
    print("  Chef F   : chef.fianarantsoa@fokontany.mg / Chef@2026")
    print("  Agent 1  : AGT-2026-000001 (Rakoto Hery, Ambositra)")
    print("  Agent 2  : AGT-2026-000002 (Ravoahangy Noro, Fianarantsoa)")
    print("  Agent 3  : AGT-2026-000003 (Rajaonarisoa Tiana, Toamasina)")
    print("============================================================")

except Exception as exc:
    db.rollback()
    print(f"Erreur lors du seed : {exc}")
    raise

finally:
    db.close()
