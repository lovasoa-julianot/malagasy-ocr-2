# Malagasy OCR

Application composée de deux processus indépendants :

- `backend/` : API **FastAPI** (Python) qui sert la base PostgreSQL et l'OCR ;
- `frontend/` : interface **Vite + React** (TypeScript).

## Installation

### Base de données

```bash
docker compose up -d
```

Postgres est exposé sur le port `5434`.

### Backend

```bash
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
cp .env.example .env   # puis renseigner DATABASE_URL, JWT_SECRET_KEY et GEMINI_API_KEY
./venv/bin/alembic upgrade head
./venv/bin/python app/scripts/create-admin.py
```

Le compte administrateur créé par le script utilise les identifiants
`admin@ocr-cin.mg` / `Admin@2026` (à changer en production).

### Frontend

```bash
cd frontend
npm install
```

## Développement

Dans deux terminaux :

```bash
cd backend && ./venv/bin/uvicorn app.main:app --reload --port 8000
```

```bash
cd frontend && npm run dev
```

Le frontend est disponible sur `http://localhost:3000` et l'API sur
`http://localhost:8000`. Le proxy Vite transmet `/api` au backend, donc
aucune configuration `VITE_API_URL` n'est nécessaire en développement.

La documentation interactive de l'API est disponible sur
`http://localhost:8000/docs`.

## Rôles et espaces

| Rôle | Authentification | Espace |
| --- | --- | --- |
| Administrateur | `POST /api/auth/login` | Supervision globale, agents, recensements, audit, qualité |
| Agent | `POST /api/agent/access` puis `/api/agent/login` | Saisie terrain et OCR |
| Chef Fokontany | `POST /api/chef-fokontany/login` | Validation locale, agents du territoire, registre des résidents, code d'accès |

Le jeton JWT est stocké dans un cookie `HttpOnly` commun aux trois rôles ;
`POST /api/auth/logout` le révoque.

## Vérifications

```bash
cd frontend && npm run build     # typecheck + build de production
cd frontend && npm run lint      # oxlint
cd backend && ./venv/bin/python -m app.scripts.smoke_portal   # test de bout en bout des routes
```
