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
| Excel-based procurement | One-click PO generation with 3-vendor comparison |

### Technical Sophistication Signal (for YC)
- Async FastAPI with full repository pattern + Pydantic v2
- AI Copilot with RAG over your own asset inventory (not generic chatbot)
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

> All Complexity 0 items implemented in Phase 1 (PR #2).

### 0.1 Core Domain Models + Alembic Migration
- **Status:** [x] ✅ Done — `app/models/asset.py`, `category.py`, `location.py`; migration `c70aa8acc9c9`

### 0.2 Asset CRUD API
- **Status:** [x] ✅ Done — `app/api/v1/assets.py`; full CRUD + stats + search/filter/pagination; 16 tests

### 0.3 AssetCategory + Location CRUD APIs
- **Status:** [x] ✅ Done — `app/api/v1/categories.py`, `locations.py`; 5+4 tests each

### 0.4 Dashboard Stats Endpoint
- **Status:** [x] ✅ Done — `GET /api/v1/dashboard/`; totals by type/status, warranty expiring, recent assets

### 0.5 Health Endpoint + dclaw-manifest.json
- **Status:** [x] ✅ Done — `/health/` returns `{"status":"ok"}`; `frontend/public/dclaw-manifest.json` created

### 0.6 Frontend: Dashboard Page (Stats + Quick Actions)
- **Status:** [x] ✅ Done — `app/page.tsx`; 7 KPI cards, recent assets table, warranty alert banner

### 0.7 Frontend: Asset List Page
- **Status:** [x] ✅ Done — `app/assets/page.tsx`; table with search/filter/pagination + Export/Import buttons

### 0.8 Frontend: Add/Edit Asset Form
- **Status:** [x] ✅ Done — `components/AssetForm.tsx`; all fields, category/location dropdowns

### 0.9 PRODUCT-SPEC.md Update
- **Status:** [x] ✅ Done — rewritten with correct Asset Management entities

---

## Complexity 1 — Medium Complexity / Core Differentiators ✅ COMPLETE

### 1.1 Assignment History & Tracking
**Why:** Every asset needs a chain of custody. Required for audit and compliance.
- Backend: `POST /api/v1/assets/{id}/assign`, `POST /api/v1/assets/{id}/return`, `GET /api/v1/assets/{id}/assignments`
- Frontend: Assignment timeline on asset detail page
- **Status:** [x] ✅ Done — backend + tests (Phase 1); frontend in asset detail page (1.2)

### 1.2 Asset Detail Page
**Why:** Deep dive view. All asset info + assignment history + maintenance log.
- `app/assets/[id]/page.tsx` — asset info, assignment timeline, maintenance log, depreciation, edit/delete
- **Status:** [x] ✅ Done — full detail page with warranty banner, assignment/return form, depreciation card, maintenance log

### 1.3 Category & Location Management Pages
**Why:** Admin pages for organizing the inventory taxonomy.
- `app/categories/page.tsx`, `app/locations/page.tsx` with full inline CRUD + color picker
- **Status:** [x] ✅ Done — both pages implemented in Phase 1

### 1.4 Warranty & Expiry Alerts
**Why:** The #1 complaint from IT managers — they miss warranty expirations.
- Backend: `GET /api/v1/assets/expiring?days=30`
- Frontend: alert banner on dashboard, color-coded badges in asset list, WarrantyBanner on detail page
- **Status:** [x] ✅ Done — backend + dashboard banner + asset list column + detail page banner

### 1.5 Bulk Import via CSV
**Why:** New customers can't manually enter 500 assets. CSV import = fast onboarding.
- `POST /api/v1/assets/import` — parse CSV, bulk insert, return summary
- Frontend: upload modal with sample CSV download, created/skipped/error reporting
- **Status:** [x] ✅ Done — backend + 4 tests + frontend import modal

### 1.6 Asset Export
**Why:** IT managers need CSV exports for audits and reports.
- `GET /api/v1/assets/export` — stream CSV with all fields + current assignment
- Frontend: "Export CSV" download button on asset list page
- **Status:** [x] ✅ Done — backend + 2 tests + frontend export button

### 1.7 Maintenance Records
**Why:** Service history is required for insurance and lifecycle decisions.
- Backend: `GET/POST /api/v1/assets/{id}/maintenance`
- Frontend: maintenance log on asset detail page
- **Status:** [x] ✅ Done — backend + tests (Phase 1); frontend in detail page (1.2)

### 1.8 Depreciation Calculator
**Why:** CFOs demand asset book value for financial reporting.
- Backend: `GET /api/v1/assets/{id}/depreciation`
- Frontend: depreciation card on asset detail page
- **Status:** [x] ✅ Done — backend + tests (Phase 1); frontend in detail page (1.2)

### 1.9 Navigation Shell + Layout
**Why:** App shell with sidebar navigation connecting all pages.
- `components/Sidebar.tsx` + updated `app/layout.tsx`
- **Status:** [x] ✅ Done — sidebar with active state, responsive

---

## Complexity 2 — High Complexity / AI & Advanced Features

> These create the moat.

### 2.1 AI Asset Copilot (Core YC Differentiator)
**Why:** The single biggest differentiator. "Your IT inventory, explained by AI."
- Floating chat widget on all pages; context-aware (knows your counts, expiry, maintenance)
- `POST /api/v1/copilot/chat` — LLM with DB-injected system context
- Ollama local → OpenRouter cloud fallback
- `app/services/ai_copilot.py`, `app/api/v1/copilot.py`, `components/AICopilot.tsx`
- **Status:** [x] ✅ Done — full backend service + API + floating chat widget in layout

### 2.2 Predictive Refresh Scoring
**Why:** "Predict which laptops will fail before they fail."
- Score 0-100 per hardware asset: age (50pts), warranty status (30pts), repair count (20pts)
- `GET /api/v1/assets/refresh-predictions` — sorted by urgency
- Tests: 2 tests covering empty + scored results
- **Status:** [x] ✅ Done — backend + tests; [ ] ⏳ Frontend Refresh Priority page TODO

### 2.3 License Utilization & Waste Detection
**Why:** Average company wastes 30% of SaaS budget on unused licenses.
- Track seat count vs. active assignments; utilization % calculation
- `GET /api/v1/assets/license-waste?threshold=50`
- Tests: 2 tests covering unassigned detection + assigned exclusion
- **Status:** [x] ✅ Done — backend + tests; [ ] ⏳ Frontend License Optimization card TODO

### 2.4 Automated Compliance Report (SOX/ISO)
**Why:** Compliance reports take weeks manually. Automate → sell to finance teams.
- `GET /api/v1/reports/compliance?from=YYYY-MM-DD&to=YYYY-MM-DD`
- JSON report: all assets, assignments, maintenance, disposals in period
- **Status:** [ ] ⏳ TODO

### 2.5 Procurement Workflow
**Why:** Closes the loop from "need laptop" to "laptop assigned."
- `PurchaseRequest` model + approval workflow (pending → approved → ordered → received)
- `app/models/procurement.py`, `app/api/v1/procurement.py`
- **Status:** [ ] ⏳ TODO

### 2.6 QR Code Generation
**Why:** Physical asset labeling. Print a QR, scan → instant asset lookup.
- `GET /api/v1/assets/{id}/qr` → PNG image; 2 tests
- **Status:** [x] ✅ Done — backend + 2 tests; [ ] ⏳ QR button on asset detail page TODO

---

## Implementation Order

```
Phase 1 ✅ COMPLETE — Complexity 0 (all 9 items)
Phase 2 ✅ COMPLETE — Complexity 1 (all 9 items: 1.1-1.9)
Phase 3 🔄 IN PROGRESS — Complexity 2: 2.1 ✅, 2.2 ✅ (backend), 2.3 ✅ (backend), 2.6 ✅ (backend)
Phase 4 ⏳ NEXT — Complexity 2 remaining: 2.2/2.3/2.6 frontend, 2.4 compliance, 2.5 procurement
```

---

## Test Status

- **Total tests:** 38/38 passing
- `test_assets.py` — 28 tests (CRUD, assign/return, maintenance, depreciation, export, import, refresh-predictions, license-waste, QR)
- `test_categories.py` — 5 tests
- `test_health.py` — 1 test
- `test_locations.py` — 4 tests

---

## Definition of Done (per feature)

- [x] Backend: model + schema + repository + router wired in `main.py`
- [x] Alembic migration generated and tested
- [x] Tests written and passing (`pytest -v` — currently 38/38)
- [x] Frontend: all pages call real API (no mock data)
- [x] No TypeScript `any` without comment
- [x] `docker compose config` passes
