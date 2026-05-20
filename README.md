# DClaw Assets

> **Asset Management vertical SaaS built on the DClaw Stack.**
> FastAPI backend · Next.js 14 frontend · PostgreSQL · Docker · Helm

## What This Is

**DClaw Assets** is a vertical SaaS application for asset management, built on the DClaw Stack.

- FastAPI backend with SQLAlchemy 2.0 and Pydantic v2
- Next.js 14 App Router frontend with Tailwind CSS v3 and pre-built UI components
- Docker + docker-compose with working healthchecks
- Helm chart for Kubernetes deployment
- Alembic migrations setup
- pytest test harness with pinned pytest-asyncio==0.24.0
- GitHub Actions CI
- Pre-built UI components (no shadcn CLI needed)

## Quick Start

```bash
# 1. Clone
git clone https://github.com/dclawstack/dclaw-assets.git
cd dclaw-assets

# 2. Configure environment
cp .env.example .env
# Edit .env as needed

# 3. Start all services
docker compose up -d

# Backend  → http://localhost:8043
# Frontend → http://localhost:3043
# API docs → http://localhost:8043/docs
```

## Ports

| Service | Port |
|---------|------|
| Backend (FastAPI) | `8043` |
| Frontend (Next.js) | `3043` |
| PostgreSQL | `5432` |
| Database name | `dclaw_assets` |

## Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.api.main:app --reload --port 8043

# Frontend
cd frontend
npm install
npm run dev   # http://localhost:3043

# Run backend tests
cd backend
pytest -v
```

## Critical Rules for Agents

### DO NOT install shadcn CLI
The app includes pre-built UI components in `frontend/src/components/ui/`. Installing `shadcn` v4 or `@base-ui/react` will break the Tailwind v3 build.

### DO NOT change the Postgres test port
`backend/tests/conftest.py` uses `localhost:5432`. GitHub Actions CI maps the Postgres service to port 5432. Changing this breaks CI.

### DO NOT delete `.github/workflows/ci.yml`
This file is required for GitHub Actions to run tests on every push.

### DO NOT upgrade pytest-asyncio
Keep `pytest-asyncio==0.24.0` pinned in `requirements.txt`. v1.3.0 breaks fixture scoping.

## Port Registry

| App | Backend Port | Frontend Port | Database |
|-----|-------------|---------------|----------|
| dclaw-chat | 8090 | 3000 | dclaw_chat |
| dclaw-med | 8092 | 3004 | dclaw_med |
| dclaw-learn | 8093 | 3003 | dclaw_learn |
| dclaw-code | 8094 | 3005 | dclaw_code |
| dclaw-legal | 8099 | 3013 | dclaw_legal |
| dclaw-crm | 8095 | 3006 | dclaw_crm |
| dclaw-finance | 8096 | 3007 | dclaw_finance |
| dclaw-hr | 8097 | 3008 | dclaw_hr |
| dclaw-inventory | 8098 | 3009 | dclaw_inventory |
| dclaw-project | 8100 | 3010 | dclaw_project |
| dclaw-support | 8101 | 3014 | dclaw_support |
| dclaw-marketing | 8102 | 3015 | dclaw_marketing |
| dclaw-real-estate | 8103 | 3016 | dclaw_real_estate |
| dclaw-sales | 8104 | 3017 | dclaw_sales |
| dclaw-recruit | 8105 | 3018 | dclaw_recruit |
| dclaw-vendor | 8106 | 3019 | dclaw_vendor |
| dclaw-doc | 8107 | 3020 | dclaw_doc |
| dclaw-calendar | 8108 | 3021 | dclaw_calendar |
| **dclaw-assets** | **8043** | **3043** | **dclaw_assets** |

## Key Files

| File | Purpose |
|------|---------|
| `AGENTS.md` | Architecture lock, anti-patterns, development workflow |
| `REVISED-PRD.md` | Product requirements and feature roadmap |
| `PLAN-v1.2.md` | Feature backlog for coding agents |
| `PRODUCT-SPEC.md` | Domain models and API contracts |
| `backend/app/core/config.py` | App settings, database URL |
| `docker-compose.yml` | Port mappings and service orchestration |
| `helm/` | Kubernetes deployment charts |

## What You Should NOT Change

- `app/models/base.py` — `DeclarativeBase` pattern
- `app/core/database.py` — Engine/session factory
- `docker-compose.yml` healthcheck commands
- `frontend/Dockerfile` `ARG NEXT_PUBLIC_API_URL` pattern
- `tests/conftest.py` — Test DB override pattern (keep `localhost:5432`)
- `frontend/src/components/ui/*.tsx` — Pre-built UI components (use as-is)
- `requirements.txt` — Keep `pytest-asyncio==0.24.0` pinned
- `.github/workflows/ci.yml` — Do not delete

## Contributors

| Name | Email |
|------|-------|
| Rajendra Machani | 01.r.machani@gmail.com |
