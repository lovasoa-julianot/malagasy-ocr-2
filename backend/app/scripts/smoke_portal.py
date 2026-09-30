"""
Smoke test des routes ajoutées (portail Chef Fokontany + espace Admin).

Usage :
    cd backend && ./venv/bin/python -m scripts.smoke_portal

Ce script s'exécute contre la base de développement et crée
les données nécessaires (admin, demande Chef Fokontany).
"""

import sys

from sqlalchemy import select

from app.core.security import hash_password
from app.db.database import SessionLocal
from app.main import app
from app.models.utilisateur import Utilisateur


ADMIN_EMAIL = "admin@ocr-cin.mg"
ADMIN_PASSWORD = "Admin@2026"

CHEF_EMAIL = "chef.smoke@fokontany.mg"
CHEF_PASSWORD = "Chef@2026"
CHEF_CODE_FOKONTANY = "FK-SMOKE-001"

from fastapi.testclient import TestClient  # noqa: E402


def seed(db):
    admin = db.scalar(
        select(Utilisateur).where(
            Utilisateur.email == ADMIN_EMAIL
        )
    )

    if not admin:
        admin = Utilisateur(
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            nom="Administrateur",
            prenoms="Système",
            role="ADMIN",
            is_active=True,
        )
        db.add(admin)
        db.commit()

    return admin


def check(response, expected=(200,), label=""):
    ok = response.status_code in expected

    print(
        f"{'OK ' if ok else 'KO '} "
        f"{label:<55} "
        f"[{response.status_code}]"
    )

    if not ok:
        print("      ", response.text[:400])

    return ok


def main():
    db = SessionLocal()

    try:
        seed(db)
    finally:
        db.close()

    client = TestClient(app)

    failures = 0

    # --------------------------------------------------------
    # ADMIN
    # --------------------------------------------------------

    r = client.post(
        "/api/auth/login",
        json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
        },
    )
    failures += not check(r, (200,), "POST /api/auth/login")

    failures += not check(
        client.get("/api/auth/me"),
        (200,),
        "GET /api/auth/me",
    )

    failures += not check(
        client.get("/api/admin/stats"),
        (200,),
        "GET /api/admin/stats",
    )

    r = client.get("/api/admin/agents")
    failures += not check(r, (200,), "GET /api/admin/agents")

    r = client.get("/api/admin/recensements")
    failures += not check(
        r,
        (200,),
        "GET /api/admin/recensements",
    )

    failures += not check(
        client.get("/api/admin/audit-logs"),
        (200,),
        "GET /api/admin/audit-logs",
    )

    failures += not check(
        client.get("/api/admin/quality-alerts"),
        (200,),
        "GET /api/admin/quality-alerts",
    )

    r = client.get("/api/admin/fokontany")
    failures += not check(
        r,
        (200,),
        "GET /api/admin/fokontany",
    )

    fokontany_list = r.json() if r.status_code == 200 else []
    fokontany_id = (
        fokontany_list[0]["id"] if fokontany_list else None
    )

    if fokontany_id:
        failures += not check(
            client.post(
                "/api/admin/agents",
                json={
                    "nom": "SMOKE",
                    "prenoms": "Agent",
                    "telephone": "+261 34 00 000 00",
                    "email": "agent.smoke@fokontany.mg",
                    "adresse": "Lot 1",
                    "fokontany_id": fokontany_id,
                },
            ),
            (201, 200),
            "POST /api/admin/agents",
        )

        r = client.get("/api/admin/agents")

        if r.status_code == 200 and r.json():
            agent_id = r.json()[0]["id"]

            failures += not check(
                client.patch(
                    f"/api/admin/agents/{agent_id}/toggle",
                    json={"is_active": False},
                ),
                (200,),
                "PATCH /api/admin/agents/{id}/toggle",
            )

    # --------------------------------------------------------
    # CHEF FOKONTANY : demande + approbation
    # --------------------------------------------------------

    r = client.post(
        "/api/chef-fokontany/register",
        json={
            "code_fokontany": CHEF_CODE_FOKONTANY,
            "nom_fokontany": "ANDRAINJATO ATSIMO",
            "commune": "FIANARANTSOA RENIVOHITRA",
            "district": "FIANARANTSOA",
            "code_district": 46,
            "region": "HAUTE MATSIATRA",
            "province": "FIANARANTSOA",
            "nom": "RAZAFINDRABE",
            "prenoms": "Hery Tiana",
            "telephone": "+261 34 12 345 67",
            "email": CHEF_EMAIL,
            "password": CHEF_PASSWORD,
        },
    )

    if r.status_code not in (201, 409):
        failures += not check(
            r,
            (201,),
            "POST /api/chef-fokontany/register",
        )
    else:
        print("OK  POST /api/chef-fokontany/register        "
              f"[{r.status_code}] (déjà existant)")

    r = client.get("/api/admin/chef-fokontany/requests")
    failures += not check(
        r,
        (200,),
        "GET /api/admin/chef-fokontany/requests",
    )

    requests = r.json() if r.status_code == 200 else []
    pending = [
        item
        for item in requests
        if item["statut"] == "EN_ATTENTE"
    ]

    if pending:
        request_id = pending[0]["id"]

        r = client.post(
            f"/api/admin/chef-fokontany/requests/{request_id}/approve",
            json={},
        )
        failures += not check(
            r,
            (200,),
            "POST /admin/chef-fokontany/requests/{id}/approve",
        )

    # --------------------------------------------------------
    # CHEF FOKONTANY : espace portail
    # --------------------------------------------------------

    chef_client = TestClient(app)

    r = chef_client.post(
        "/api/chef-fokontany/login",
        json={
            "identifier": CHEF_EMAIL,
            "password": CHEF_PASSWORD,
        },
    )

    if not check(
        r,
        (200,),
        "POST /api/chef-fokontany/login",
    ):
        print(
            "\nImpossible de poursuivre : "
            "aucun Chef Fokontany approuvé en base."
        )
        sys.exit(1)

    failures += not check(
        chef_client.get("/api/chef-fokontany/me"),
        (200,),
        "GET /api/chef-fokontany/me",
    )

    failures += not check(
        chef_client.get("/api/chef-fokontany/dashboard"),
        (200,),
        "GET /api/chef-fokontany/dashboard",
    )

    failures += not check(
        chef_client.get("/api/chef-fokontany/agents"),
        (200,),
        "GET /api/chef-fokontany/agents",
    )

    failures += not check(
        chef_client.get("/api/chef-fokontany/recensements"),
        (200,),
        "GET /api/chef-fokontany/recensements",
    )

    failures += not check(
        chef_client.get("/api/chef-fokontany/citizens"),
        (200,),
        "GET /api/chef-fokontany/citizens",
    )

    r = chef_client.get("/api/chef-fokontany/access-code")
    failures += not check(
        r,
        (200, 409),
        "GET /api/chef-fokontany/access-code",
    )

    failures += not check(
        chef_client.post("/api/chef-fokontany/access-code/regenerate"),
        (200,),
        "POST /api/chef-fokontany/access-code/regenerate",
    )

    # --------------------------------------------------------
    # CHEF FOKONTANY : agents et recensements de son territoire
    # --------------------------------------------------------

    me = chef_client.get("/api/chef-fokontany/me").json()
    chef_fokontany_id = me["fokontany_id"]

    r = client.post(
        "/api/admin/agents",
        json={
            "nom": "RAZAFONDRABE",
            "prenoms": "Noro Aina",
            "telephone": "+261 33 44 556 77",
            "email": "noro.smoke@fokontany.mg",
            "adresse": "Villa Soafia",
            "fokontany_id": chef_fokontany_id,
        },
    )
    failures += not check(
        r,
        (201, 200),
        "POST /api/admin/agents (territoire chef)",
    )

    r = chef_client.get("/api/chef-fokontany/agents")
    chef_agents = r.json() if r.status_code == 200 else []

    if chef_agents:
        chef_agent_id = chef_agents[0]["id"]

        failures += not check(
            chef_client.patch(
                f"/api/chef-fokontany/agents/{chef_agent_id}/toggle",
                json={"is_active": False},
            ),
            (200,),
            "PATCH /api/chef-fokontany/agents/{id}/toggle",
        )

    # --------------------------------------------------------
    # ISOLATION DES RÔLES
    # --------------------------------------------------------

    failures += not check(
        chef_client.get("/api/admin/stats"),
        (401, 403),
        "GET /api/admin/stats (chef) refusé",
    )

    print()
    print(
        f"Identifiants de test : "
        f"{CHEF_EMAIL} / {CHEF_PASSWORD}"
    )

    if failures:
        print(f"\n{failures} vérification(s) en échec.")
        sys.exit(1)

    print("\nToutes les vérifications sont passées.")


if __name__ == "__main__":
    main()
