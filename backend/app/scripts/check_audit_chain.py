"""
Test de bout en bout de la chaîne de traçabilité :

connexion admin -> création d'un Fokontany et d'un agent ->
connexion agent -> enregistrement d'une fiche avec une
précision OCR mesurée -> consultation des statistiques et du
journal d'audit.

Les données créées sont supprimées à la fin afin de ne pas
souiller la base de développement.
"""

import sys

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.main import app


def main() -> int:
    moteur = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=moteur)
    db = Session()

    client = TestClient(app)

    login = client.post(
        "/api/auth/login",
        json={
            "email": "admin@ocr-cin.mg",
            "password": "Admin@2026",
        },
    )

    if login.status_code != 200:
        print("ECHEC connexion admin", login.status_code)
        return 1

    print("OK  connexion administrateur")

    code = "FK-TEST-AUDIT"

    creation = client.post(
        "/api/admin/fokontany",
        json={
            "nom": "Fokontany de test audit",
            "code": code,
            "commune": "Commune de test",
            "district": "District de test",
            "region": "Region de test",
            "province": "Province de test",
            "code_acces": "TEST-ACCESS-2026",
            "objectif_habitants": 100,
        },
    )

    if creation.status_code != 201:
        print("ECHEC creation fokontany", creation.status_code, creation.text[:300])
        return 1

    fokontany = creation.json()
    print("OK  création Fokontany", fokontany["code"])

    agent = client.post(
        "/api/admin/agents",
        json={
            "nom": "AGENT",
            "prenoms": "Test Audit",
            "telephone": "0340000000",
            "fokontany_id": fokontany["id"],
        },
    )

    if agent.status_code != 200:
        print("ECHEC creation agent", agent.status_code, agent.text[:300])
        return 1

    agent_data = agent.json()["agent"]
    print("OK  création agent", agent_data["matricule"])

    client.post("/api/auth/logout")

    agent_login = client.post(
        "/api/agent/login",
        json={
            "fokontany_id": fokontany["id"],
            "matricule": agent_data["matricule"],
        },
    )

    if agent_login.status_code != 200:
        print(
            "ECHEC connexion agent",
            agent_login.status_code,
            agent_login.text[:300],
        )
        return 1

    print("OK  connexion agent")

    import uuid

    cin = "TEST" + uuid.uuid4().hex[:9].upper()

    fiche = client.post(
        "/api/recensement",
        json={
            "nom": "RABE",
            "prenoms": "Test Precision",
            "sexe": "M",
            "date_naissance": "1990-05-12",
            "numero_cin": cin,
            "date_delivrance": "2015-03-08",
            "lieu_delivrance": "Antananarivo",
            "date_recensement_terrain": "2026-10-05",
            "ocr_confidence": 91.0,
        },
    )

    if fiche.status_code != 200:
        print("ECHEC enregistrement fiche", fiche.status_code, fiche.text[:400])
        return 1

    print(
        "OK  enregistrement fiche",
        fiche.json()["numero_fiche"],
        "CIN",
        cin,
    )

    client.post("/api/auth/logout")

    login = client.post(
        "/api/auth/login",
        json={
            "email": "admin@ocr-cin.mg",
            "password": "Admin@2026",
        },
    )

    stats = client.get(
        "/api/admin/statistiques?periode=WEEK"
    ).json()

    print("\n--- Statistiques sur 7 jours ---")

    print(
        "  précision OCR moyenne :",
        stats["kpis"]["precision_ocr"],
    )
    print(
        "  fiches enregistrées  :",
        stats["kpis"]["fiches_enregistrees"]["valeur"],
    )
    print(
        "  taux de validation   :",
        stats["kpis"]["taux_validation"]["valeur"],
        "%",
    )
    print("  séries quotidiennes  :", len(stats["activite_quotidienne"]))
    print("  régions             :", [r["region"] for r in stats["couverture_regions"]])
    print("  top agents          :", [a["matricule"] for a in stats["top_agents"]])
    print("  fokontany           :", [f["code"] for f in stats["fokontany"]])

    journal = client.get(
        "/api/admin/audit-logs?limit=12"
    ).json()

    print("\n--- Journal d'audit ---")
    print(
        f"  {journal['total']} événements, "
        f"page {journal['page']}/{journal['pages']}"
    )

    for item in journal["items"]:
        print(
            f"  {item['timestamp'][:19]} | "
            f"{item['user_type']:<14} | "
            f"{item['action_label']:<14} | "
            f"{item['outcome'] or '-':<7} | "
            f"{item['details'][:56]}"
        )

    echecs = client.get(
        "/api/admin/audit-logs?outcome=FAILURE&limit=5"
    ).json()

    print(
        f"\n  événements en échec : {echecs['total']}"
    )

    # Nettoyage
    db.execute(
        text(
            "DELETE FROM audit_logs WHERE fokontany_id = :id"
        ),
        {"id": fokontany["id"]},
    )

    db.execute(
        text(
            "DELETE FROM recensements WHERE fokontany_id = :id"
        ),
        {"id": fokontany["id"]},
    )

    db.execute(
        text("DELETE FROM agents WHERE fokontany_id = :id"),
        {"id": fokontany["id"]},
    )

    db.execute(
        text(
            "DELETE FROM personnes WHERE numero_cin = :cin"
        ),
        {"cin": cin},
    )

    db.execute(
        text("DELETE FROM fokontany WHERE id = :id"),
        {"id": fokontany["id"]},
    )

    db.commit()

    print("\nOK  données de test supprimées")
    return 0


if __name__ == "__main__":
    sys.exit(main())