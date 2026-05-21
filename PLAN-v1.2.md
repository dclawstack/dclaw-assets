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

## Complexity 0 — Low Complexity / Core Foundation (Quick Wins)

> Implement these first. Each item should be completable in isolation.

### 0.1 Core Domain Models + Alembic Migration
**Why:** Nothing works without a schema. These are the foundation for all other features.
- **Entities:**
  - `Asset` — id, name, asset_tag, serial_number, asset_type (hardware/software/license/other), status (active/inactive/maintenance/disposed/lost), category_id (FK), location_id (FK), assigned_to (str, employee name/email), purchase_date, purchase_price, warranty_expiry, notes, created_at, updated_at
  - `AssetCategory` — id, name, description, color, created_at
  - `Location` — id, name, address, building, floor, room, created_at
  - `Assignment` — id, asset_id (FK→Asset CASCADE), assigned_to_name, assigned_to_email, assigned_at, returned_at (nullable), notes, created_at
- **Backend:** `app/models/asset.py`, `app/models/category.py`, `app/models/location.py`, `app/models/assignment.py`
- **Alembic:** `alembic revision --autogenerate -m "initial_asset_schema"`
- **Files:** `backend/app/models/`, `backend/alembic/versions/`
- **Status:** [ ]

### 0.2 Asset CRUD API
**Why:** The core read/write loop every other feature depends on.
- **Endpoints:**
  ```
  GET    /api/v1/assets              → list with filter/search/pagination
  POST   /api/v1/assets              → create asset
  GET    /api/v1/assets/{id}         → get asset + category + location
  PUT    /api/v1/assets/{id}         → update asset
  DELETE /api/v1/assets/{id}         → soft-delete (set status=disposed)
  GET    /api/v1/assets/stats        → dashboard stats (counts by type/status)
  ```
- **Backend:** `app/schemas/asset.py`, `app/repositories/asset_repo.py`, `app/api/v1/assets.py`
- **Tests:** `tests/test_assets.py` — CRUD + stats + filter
- **Status:** [ ]

### 0.3 AssetCategory + Location CRUD APIs
**Why:** Assets need classification and location; these are supporting tables.
- **Endpoints:** Full CRUD for `/api/v1/categories` and `/api/v1/locations`
- **Backend:** schemas, repos, routers for both
- **Tests:** `tests/test_categories.py`, `tests/test_locations.py`
- **Status:** [ ]

### 0.4 Dashboard Stats Endpoint
**Why:** The first thing any user sees; drives the "wow" moment in a demo.
- **Endpoint:** `GET /api/v1/dashboard` → total assets, by-type counts, by-status counts, warranty expiring in 30 days, recently added
- **Backend:** `app/api/v1/dashboard.py` — aggregate queries
- **Status:** [ ]

### 0.5 Health Endpoint + dclaw-manifest.json
**Why:** Required for DPanel registration and CI health gate.
- `GET /health/` already exists — verify it returns `{"status":"ok"}`
- Create `frontend/public/dclaw-manifest.json` with app metadata
- **Status:** [ ]

### 0.6 Frontend: Dashboard Page (Stats + Quick Actions)
**Why:** First impression. Replaces broken placeholder.
- Stat cards: Total Assets, Active, Under Maintenance, Warranty Expiring Soon
- Recent additions table (last 10 assets)
- Quick action buttons: Add Asset, Add Category, Add Location
- Calls `/api/v1/dashboard` and `/api/v1/assets`
- **Frontend:** Update `app/page.tsx` to be the real dashboard
- **Status:** [ ]

### 0.7 Frontend: Asset List Page
**Why:** Core data view. Table with search, status filter, type filter.
- Table: asset_tag, name, type, status badge, location, assigned_to, warranty_expiry
- Search by name/tag/serial
- Filter by status, type, category
- Paginated
- "Add Asset" opens dialog form
- **Frontend:** `app/assets/page.tsx`
- **Status:** [ ]

### 0.8 Frontend: Add/Edit Asset Form
**Why:** Data entry. Dialog form with all fields, category/location dropdowns.
- Controlled form with validation
- Category and Location loaded from API
- Status badge selector (color-coded)
- **Frontend:** `components/AssetForm.tsx` (dialog-based)
- **Status:** [ ]

### 0.9 PRODUCT-SPEC.md Update
**Why:** It still has CRM entities (Customer, Deal, Activity) — wrong domain.
- Rewrite with Asset Management entities: Asset, AssetCategory, Location, Assignment
- Update API endpoint list
- Update user stories
- **Status:** [ ]

---

## Complexity 1 — Medium Complexity / Core Differentiators

> These make the app genuinely useful and sticky.

### 1.1 Assignment History & Tracking
**Why:** Every asset needs a chain of custody. Required for audit and compliance.
- Track every time an asset is assigned/returned with timestamp and notes
- `GET /api/v1/assets/{id}/assignments` — full assignment history
- `POST /api/v1/assets/{id}/assign` — assign to person
- `POST /api/v1/assets/{id}/return` — mark returned
- Frontend: Assignment history timeline on asset detail page
- **Status:** [ ]

### 1.2 Asset Detail Page
**Why:** Deep dive view. All asset info + assignment history + maintenance log.
- Asset info card with edit/delete
- Assignment history timeline
- Maintenance records
- Warranty status banner
- **Frontend:** `app/assets/[id]/page.tsx`
- **Status:** [ ]

### 1.3 Category & Location Management Pages
**Why:** Admin pages for organizing the inventory taxonomy.
- CRUD pages for categories (with color picker) and locations (with building/floor/room)
- **Frontend:** `app/categories/page.tsx`, `app/locations/page.tsx`
- **Status:** [ ]

### 1.4 Warranty & Expiry Alerts
**Why:** The #1 complaint from IT managers — they miss warranty expirations.
- Dashboard banner: "N assets warranty-expiring in 30 days"
- `GET /api/v1/assets/expiring?days=30` endpoint
- Color-coded badges: green (>90 days), yellow (30-90), red (<30)
- **Status:** [ ]

### 1.5 Bulk Import via CSV
**Why:** New customers can't manually enter 500 assets. CSV import = fast onboarding.
- `POST /api/v1/assets/import` — accept CSV, parse, bulk insert
- Return import summary: success count, error rows
- Frontend: upload modal with sample CSV download
- **Status:** [ ]

### 1.6 Asset Export
**Why:** IT managers need Excel exports for audits and reports.
- `GET /api/v1/assets/export?format=csv` — stream CSV
- Include all fields + current assignment
- **Status:** [ ]

### 1.7 Maintenance Records
**Why:** Service history is required for insurance and lifecycle decisions.
- `MaintenanceRecord` model: asset_id, type (repair/upgrade/inspection), description, performed_by, cost, performed_at
- `GET /api/v1/assets/{id}/maintenance` — maintenance history
- `POST /api/v1/assets/{id}/maintenance` — log maintenance event
- **Status:** [ ]

### 1.8 Depreciation Calculator
**Why:** CFOs demand asset book value for financial reporting.
- `GET /api/v1/assets/{id}/depreciation` — straight-line calculation
- Fields: purchase_price, purchase_date, useful_life_years → current book value
- Batch depreciation report for all assets
- **Status:** [ ]

### 1.9 Navigation Shell + Layout
**Why:** App shell with sidebar navigation connecting all pages.
- Sidebar: Dashboard, Assets, Categories, Locations, Assignments, Reports
- Breadcrumbs, active state, mobile responsive
- **Frontend:** `app/layout.tsx` update with sidebar component
- **Status:** [ ]

---

## Complexity 2 — High Complexity / AI & Advanced Features

> These create the moat. Start only after Complexity 0 and 1 are complete.

### 2.1 AI Asset Copilot (Core YC Differentiator)
**Why:** The single biggest differentiator vs. every competitor. "Your IT inventory, explained by AI."
- Floating chat widget on all pages
- Context-aware: knows your asset counts, expiry dates, maintenance history
- Answers: "How many MacBooks do we have?", "Which licenses expire this month?", "Who has the oldest laptop?"
- Backend: `POST /api/v1/copilot/chat` — LLM with system context from DB
- Uses Ollama (local) → OpenRouter (cloud fallback)
- **Backend:** `app/services/ai_copilot.py`, `app/api/v1/copilot.py`
- **Frontend:** `components/AICopilot.tsx` (floating bottom-right)
- **Status:** [ ]

### 2.2 Predictive Refresh Scoring
**Why:** "Predict which laptops will fail before they fail." — Instant demo wow moment.
- Score each hardware asset 1-100 for refresh urgency
- Factors: age (vs. 3-year standard), warranty status, maintenance frequency, purchase price
- `GET /api/v1/assets/refresh-predictions` — sorted by urgency score
- Frontend: Refresh Priority table with urgency badge
- **Status:** [ ]

### 2.3 License Utilization & Waste Detection
**Why:** Average company wastes 30% of SaaS budget on unused licenses.
- Track license seat count vs. active assignments
- Utilization % = assigned / total_seats
- `GET /api/v1/assets/license-waste` → licenses <50% utilized
- Frontend: License Optimization dashboard card
- **Status:** [ ]

### 2.4 Automated Compliance Report (SOX/ISO)
**Why:** Compliance reports take weeks manually. Automate → sell to finance teams.
- Generate PDF/JSON report: all assets, assignments, maintenance, disposals
- Date-range filter for audit period
- `GET /api/v1/reports/compliance?from=YYYY-MM-DD&to=YYYY-MM-DD`
- **Status:** [ ]

### 2.5 Procurement Workflow
**Why:** Closes the loop from "need laptop" to "laptop assigned" without leaving the app.
- `PurchaseRequest` model: requested_by, asset_type, justification, budget, status (pending/approved/ordered/received)
- Approval workflow: pending → approved → ordered → received → asset auto-created
- `POST /api/v1/procurement/requests` → create request
- `PUT /api/v1/procurement/requests/{id}/approve` → approve
- **Status:** [ ]

### 2.6 QR Code Generation
**Why:** Physical asset labeling. Print a QR, scan with phone → instant asset lookup.
- `GET /api/v1/assets/{id}/qr` → return QR code image (PNG)
- Links to asset detail page URL
- **Status:** [ ]

---

## Implementation Order

```
Phase 1 (This Sprint — Complexity 0):
  0.9 → 0.1 → 0.2 → 0.3 → 0.4 → 0.5 → 0.6 → 0.7 → 0.8

Phase 2 (Complexity 1):
  1.9 → 1.1 → 1.2 → 1.3 → 1.4 → 1.7 → 1.5 → 1.6 → 1.8

Phase 3 (Complexity 2 — after stable Phase 1+2):
  2.1 → 2.2 → 2.3 → 2.6 → 2.4 → 2.5
```

---

## Definition of Done (per feature)

- [ ] Backend: model + schema + repository + router wired in `main.py`
- [ ] Alembic migration generated and tested
- [ ] Tests written and passing (`pytest -v`)
- [ ] Frontend: page/component calls real API (no mock data)
- [ ] No TypeScript `any` without comment
- [ ] `docker compose config` passes
