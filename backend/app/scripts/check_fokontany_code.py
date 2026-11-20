"""
Vérifie l'attribution automatique des codes Fokontany.

Parcours couvert : inscription publique (sans code saisi) ->
approbation par l'administration -> création administrative
sans code -> journal d'audit.

Les données créées sont supprimées à la fin.
"""

import re
import sys

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.main import app


CODE_ATTENDU = re.compile(r"^FKT-[A-Z]-[0-9]{7}$")


def dossier(
    district: str,
    region: str,
    province: str,
    code_district: int,
    suffixe: str,
) -> dict:
    return {
        "nom_fokontany": f"Fokontany controle {suffixe}",
        "commune": "Commune de controle",
        "district": district,
        "code_district": code_district,
        "region": region,
        "province": province,
        "nom": "CONTROLE",
        "prenoms": f"Chef {suffixe}",
        "telephone": "0340000000",
        # Le serveur normalise l'adresse en minuscules : les
        # identifiants de contrôle le sont également.
        "email": f"chef.controle.{suffixe.lower()}@fokontany.mg",
        "password": "Chef@2026",
    }


def main() -> int:
    moteur = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=moteur)
    db = Session()

    client = TestClient(app)

    echecs: list[str] = []

    def verifier(condition: bool, message: str) -> None:
        print(("OK   " if condition else "ECHEC") + " " + message)

        if not condition:
            echecs.append(message)

    # ---------------------------------------------------------
    print("\n=== 1. Inscription sans code saisi ===")

    premier = client.post(
        "/api/chef-fokontany/register",
        json=dossier(
            "AMBATO BOENI", "BOENY", "MAHAJANGA", 63, "A"
        ),
    )

    if premier.status_code != 201:
        print("ECHEC statut", premier.status_code, premier.text[:400])
        return 1

    body = premier.json()

    print("  code attribue :", body["code_fokontany"])
    print("  district      :", body["district"])
    print("  nom chef      :", body["nom"], body["prenoms"])
    print("  depot         :", body["created_at"])

    verifier(
        bool(CODE_ATTENDU.match(body["code_fokontany"])),
        f"le code {body['code_fokontany']} respecte "
        "FKT-<lettre>-<7 chiffres>",
    )

    verifier(
        body["code_fokontany"].startswith("FKT-A-"),
        "la lettre du district AMBATO BOENI est A",
    )

    verifier(
        body["nom_fokontany"] == "Fokontany controle A"
        and body["nom"] == "CONTROLE",
        "le dossier renvoie les donnees reellement enregistrees",
    )

    # ---------------------------------------------------------
    print("\n=== 2. Second district, second code ===")

    second = client.post(
        "/api/chef-fokontany/register",
        json=dossier(
            "ANTSIRABE I",
            "VAKINANKARATRA",
            "ANTANANARIVO",
            21,
            "B",
        ),
    )

    if second.status_code != 201:
        print("ECHEC statut", second.status_code, second.text[:400])
        return 1

    code_second = second.json()["code_fokontany"]

    print("  code attribue :", code_second)

    verifier(
        code_second.startswith("FKT-A-"),
        "la lettre du district ANTSIRABE I est A",
    )

    verifier(
        code_second != body["code_fokontany"],
        "les deux inscriptions ont recu des codes distincts",
    )

    verifier(
        int(code_second.split("-")[-1])
        == int(body["code_fokontany"].split("-")[-1]) + 1,
        "la sequence globale est incrementee d'une unite",
    )

    # ---------------------------------------------------------
    print("\n=== 3. Client qui envoie encore un code ===")

    payload = dossier(
        "FARATSIHO",
        "VAKINANKARATRA",
        "ANTANANARIVO",
        24,
        "C",
    )
    payload["code_fokontany"] = "FKT-Z-9999999"

    ancien_client = client.post(
        "/api/chef-fokontany/register",
        json=payload,
    )

    if ancien_client.status_code != 201:
        print(
            "ECHEC statut",
            ancien_client.status_code,
            ancien_client.text[:300],
        )
        return 1

    code_ignore = ancien_client.json()["code_fokontany"]

    print("  code attribue :", code_ignore)

    verifier(
        code_ignore != "FKT-Z-9999999",
        "un code fourni par le client est ignore au profit de la norme",
    )

    verifier(
        code_ignore.startswith("FKT-F-"),
        "la lettre du district FARATSIHO est F",
    )

    # ---------------------------------------------------------
    print("\n=== 4. Approbation par l'administration ===")

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

    approbation = client.post(
        f"/api/admin/chef-fokontany/requests/"
        f"{second.json()['request_id']}/approve"
    )

    print("  approbation :", approbation.status_code)

    if approbation.status_code != 200:
        print("  detail :", approbation.text[:300])

    verifier(
        approbation.status_code == 200,
        "la demande approuvee cree le compte Chef Fokontany",
    )

    fokontany_cree = db.scalar(
        text("SELECT code FROM fokontany WHERE code = :code"),
        {"code": code_second},
    )

    verifier(
        fokontany_cree == code_second,
        "le Fokontany cree porte le code attribue a l'inscription",
    )

    # ---------------------------------------------------------
    print("\n=== 5. Creation administrative sans code ===")

    admin_fokontany = client.post(
        "/api/admin/fokontany",
        json={
            "nom": "Fokontany administratif controle",
            "commune": "Commune de controle",
            "district": "MAINTSY",
            "region": "SOFIA",
            "province": "MAHAJANGA",
            "code_acces": "CONTROLE-2026",
            "objectif_habitants": 500,
        },
    )

    if admin_fokontany.status_code != 201:
        print(
            "ECHEC creation admin",
            admin_fokontany.status_code,
            admin_fokontany.text[:300],
        )
        return 1

    code_admin = admin_fokontany.json()["code"]

    print("  code attribue :", code_admin)

    verifier(
        bool(CODE_ATTENDU.match(code_admin)),
        "la creation administrative suit la meme norme",
    )

    verifier(
        code_admin.startswith("FKT-M-"),
        "la lettre du district MAINTSY est M",
    )

    # ---------------------------------------------------------
    print("\n=== 6. Journal d'audit ===")

    journal = client.get("/api/admin/audit-logs?limit=8").json()

    for item in journal["items"][:4]:
        print(
            f"  {item['action_label']:<14} "
            f"{item['details'][:76]}"
        )

    verifier(
        any(
            "Chef Fokontany" in item["details"]
            for item in journal["items"]
        ),
        "les demandes d'inscription sont tracees",
    )

    # ---------------------------------------------------------
    # Nettoyage
    # ---------------------------------------------------------

    # Les Fokontany sont repérés par les codes attribués : le
    # lien chef_id est mis à null par la base lors de la
    # suppression du compte, ce qui le rend inutilisable ici.
    codes_crees = [
        body["code_fokontany"],
        code_second,
        code_ignore,
        code_admin,
    ]

    emails = [
        "chef.controle.a@fokontany.mg",
        "chef.controle.b@fokontany.mg",
        "chef.controle.c@fokontany.mg",
    ]

    with moteur.begin() as connection:
        for code in codes_crees:
            fokontany_ids = [
                row[0]
                for row in connection.execute(
                    text(
                        "SELECT id FROM fokontany "
                        "WHERE code = :code"
                    ),
                    {"code": code},
                )
            ]

            for fokontany_id in fokontany_ids:
                connection.execute(
                    text(
                        "DELETE FROM agents "
                        "WHERE fokontany_id = :id"
                    ),
                    {"id": fokontany_id},
                )

            connection.execute(
                text("DELETE FROM fokontany WHERE code = :code"),
                {"code": code},
            )

        for email in emails:
            connection.execute(
                text(
                    "DELETE FROM chef_fokontany_requests "
                    "WHERE email = :email"
                ),
                {"email": email},
            )

            connection.execute(
                text(
                    "DELETE FROM utilisateurs "
                    "WHERE email = :email"
                ),
                {"email": email},
            )

        connection.execute(
            text(
                "DELETE FROM audit_logs "
                "WHERE details LIKE :motif"
            ),
            {"motif": "%Fokontany controle %"},
        )

        connection.execute(
            text(
                "DELETE FROM audit_logs "
                "WHERE details LIKE :motif"
            ),
            {"motif": "%Fokontany administratif controle%"},
        )

    print("\nDonnees de controle supprimees")

    print("=" * 60)

    if echecs:
        print(f"{len(echecs)} verification(s) en echec :")

        for message in echecs:
            print("  -", message)

        return 1

    print("Toutes les verifications sont passees.")
    return 0


if __name__ == "__main__":
    sys.exit(main())