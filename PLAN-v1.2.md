# DClaw Assets — v1.2 Feature Roadmap

> 📘 **REVISED PRD v2.3:** See `REVISED-PRD.md` for full gap analysis and feature definitions.
> **AGENTS.md** is the architecture lock — read it before writing any code.

---

## YC Evaluation & Competitive Position

### Why This Problem is "Hair on Fire"
Every company with 50+ employees bleeds money on:
- **Shadow IT** — 30-40% of software spend on untracked/unused licenses
- **Compliance disasters** — SOX/ISO audits take weeks manually; one missed asset = penalty
- **Reactive hardware** — Laptops fail in the field; no predictive replacement
- **Procurement waste** — No visibility on what's needed vs. what's sitting in storage

**Total addressable pain:** IT asset waste averages $50K/year per 100 employees.
Competitors (ServiceNow, Freshservice, Snipe-IT) are expensive, slow to deploy, or AI-free.

### Competitive Gaps We Fill
| Gap vs. Competitors | DClaw Assets Approach |
|--------------------|-----------------------|
| No AI in Snipe-IT/Lansweeper | AI Copilot from day one — predicts refresh, detects waste |
| ServiceNow = $150K/yr | SaaS at 10% of the cost, deployed in 1 hour |
| Manual license auditing | Auto-detect unused licenses via usage pattern AI |
| Reactive maintenance | Predictive failure scoring before hardware breaks |
| Excel-based procurement | Purchase request approval workflow built-in |

### Technical Sophistication Signal (for YC)
- Async FastAPI with full repository pattern + Pydantic v2
- AI Copilot with live DB-injected context (Ollama local → OpenRouter cloud fallback)
- Alembic-managed schema evolution → zero-downtime deploys
- Docker + Helm → ships to K8s in one command

---

## Pre-Flight Checklist — Verify Before Any Feature

- [x] `frontend/package-lock.json` committed after `npm install`
- [x] `frontend/next-env.d.ts` exists and is committed
- [x] `docker-compose.yml` healthchecks use `python urllib.request.urlopen()` (backend) and `wget -q --spider` (frontend)
- [x] `frontend/Dockerfile` declares `ARG NEXT_PUBLIC_API_URL` before build
- [x] `backend/Dockerfile` uses non-root `appuser`, port `8043`
- [x] Ports: backend `8043`, frontend `3043`, DB `dclaw_assets`

---

## Complexity 0 — Low Complexity / Core Foundation ✅ COMPLETE

### 0.1 [x] Core Domain Models + Alembic Migration
- `app/models/asset.py`, `category.py`, `location.py`; migration `c70aa8acc9c9`

### 0.2 [x] Asset CRUD API
- `app/api/v1/assets.py`; full CRUD + stats + search/filter/pagination; 28 tests

### 0.3 [x] AssetCategory + Location CRUD APIs
- `app/api/v1/categories.py`, `locations.py`; 5+4 tests

### 0.4 [x] Dashboard Stats Endpoint
- `GET /api/v1/dashboard/`; totals by type/status, warranty expiring, recent assets

### 0.5 [x] Health Endpoint + dclaw-manifest.json
- `/health/` returns `{"status":"ok"}`; `frontend/public/dclaw-manifest.json` registered

### 0.6 [x] Frontend: Dashboard Page
- `app/page.tsx`; 7 KPI cards, recent assets table, warranty alert banner

### 0.7 [x] Frontend: Asset List Page
- `app/assets/page.tsx`; table with search/filter/pagination + Export CSV / Import CSV buttons

### 0.8 [x] Frontend: Add/Edit Asset Form
- `components/AssetForm.tsx`; all fields, category/location dropdowns, error surfacing

### 0.9 [x] PRODUCT-SPEC.md Update
- Rewritten with correct Asset Management entities

---

## Complexity 1 — Medium Complexity / Core Differentiators ✅ COMPLETE

### 1.1 [x] Assignment History & Tracking
- Backend: assign/return/list endpoints + tests
- Frontend: assignment form + history timeline on asset detail page

### 1.2 [x] Asset Detail Page
- `app/assets/[id]/page.tsx` — warranty banner, assign/return, depreciation, maintenance log, edit/delete, QR download button

### 1.3 [x] Category & Location Management Pages
- `app/categories/page.tsx`, `app/locations/page.tsx` with inline CRUD + color picker

### 1.4 [x] Warranty & Expiry Alerts
- Dashboard alert banner, color-coded list column, per-asset WarrantyBanner component

### 1.5 [x] Bulk Import via CSV
- `POST /api/v1/assets/import`; upload modal with sample CSV download, created/skipped/error report

### 1.6 [x] Asset Export
- `GET /api/v1/assets/export`; Export CSV download button on asset list page

### 1.7 [x] Maintenance Records
- Backend tested in Phase 1; frontend maintenance log on asset detail page

### 1.8 [x] Depreciation Calculator
- Backend tested in Phase 1; depreciation card on asset detail page

### 1.9 [x] Navigation Shell + Layout
- `components/Sidebar.tsx` (7 nav items) + `app/layout.tsx` with AI copilot widget

---

## Complexity 2 — High Complexity / AI & Advanced Features ✅ COMPLETE

### 2.1 [x] AI Asset Copilot
- `app/services/ai_copilot.py` — Ollama local → OpenRouter cloud fallback
- `POST /api/v1/copilot/chat` — DB-injected context (stats, expiring warranties, recent assets)
- `components/AICopilot.tsx` — floating chat widget on all pages
- Message length validation (max 5000 chars)

### 2.2 [x] Predictive Refresh Scoring
- `GET /api/v1/assets/refresh-predictions` — 0-100 score (age 50pts, warranty 30pts, repairs 20pts)
- Batch-fetches maintenance to avoid N+1 queries; 2 tests
- `app/refresh-predictions/page.tsx` — sortable list with urgency badges + summary cards

### 2.3 [x] License Utilization & Waste Detection
- `GET /api/v1/assets/license-waste?threshold=50`; 2 tests
- `app/reports/page.tsx` — interactive scanner with threshold slider

### 2.4 [x] Automated Compliance Report (SOX/ISO)
- `GET /api/v1/reports/compliance?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Returns assets + assignments + maintenance + disposals in period; 3 tests
- `app/reports/page.tsx` — date range picker, summary card grid, JSON download

### 2.5 [x] Procurement Workflow
- `app/models/procurement.py` — `PurchaseRequest` model with `ProcurementStatus` enum
- Migration `6f94c728e699` — adds `purchase_requests` table; fixes `created_at` column types
- `GET/POST /api/v1/procurement/`, `GET/PUT/DELETE /{id}`, `POST /{id}/transition`
- Valid transitions: pending→approved→ordered→received; any→cancelled; 11 tests
- `app/procurement/page.tsx` — pipeline view, transition buttons, new request modal

### 2.6 [x] QR Code Generation
- `GET /api/v1/assets/{id}/qr?base_url=...` → PNG; URL scheme validated; 2 tests
- QR download button on asset detail page header

---

## Implementation Order

```
Phase 1 ✅ COMPLETE — Complexity 0 (all 9 items)
Phase 2 ✅ COMPLETE — Complexity 1 (all 9 items: 1.1-1.9)
Phase 3 ✅ COMPLETE — Complexity 2 (all 6 items: 2.1-2.6)
```

---

## Test Status

- **Total tests: 52/52 passing**
- `test_assets.py` — 28 tests (CRUD, assign/return, maintenance, depreciation, export, import, refresh-predictions, license-waste, QR)
- `test_categories.py` — 5 tests
- `test_health.py` — 1 test
- `test_locations.py` — 4 tests
- `test_procurement.py` — 11 tests (full workflow, transitions, validation)
- `test_reports.py` — 3 tests (compliance report, missing params 422)

---

## Code Quality Notes (PR Review Addressed)

- N+1 in refresh-predictions → fixed with single batch query keyed by asset_id
- QR base_url → validated to http/https scheme only
- Copilot message → `max_length=5000` via Pydantic Field
- Unused `stream` param removed from `ai_copilot.py`
- Frontend `useEffect` deps → `useCallback` + proper dep array in `assets/page.tsx`
- `handleDelete`/`handleReturn` → wrapped in try/catch with `alert()` error surfacing
- `AssetForm` category/location load failure → now surfaces error message

---

## Definition of Done ✅ ALL MET

- [x] Backend: model + schema + repository + router wired in `main.py`
- [x] Alembic migrations generated and applied (`c70aa8acc9c9`, `6f94c728e699`)
- [x] Tests written and passing (`pytest -v` — 52/52)
- [x] Frontend: all pages call real API (no mock data)
- [x] No TypeScript `any` without justification
- [x] `docker compose config` passes
