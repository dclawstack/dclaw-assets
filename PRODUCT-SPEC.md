# PRODUCT-SPEC: DClaw Assets

## Overview

**App Name:** DClaw Assets
**Domain:** IT Asset Management
**Target User:** IT managers, operations teams, CFOs at 50–5000 employee companies

## Core Entities

### Asset
```
Asset
├── id: UUID (PK)
├── name: str (required)
├── asset_tag: str (unique, e.g. "ASSET-001")
├── serial_number: str (optional)
├── asset_type: enum ["hardware", "software", "license", "other"]
├── status: enum ["active", "inactive", "maintenance", "disposed", "lost"]
├── category_id: UUID (FK → AssetCategory, SET NULL)
├── location_id: UUID (FK → Location, SET NULL)
├── assigned_to: str (optional — employee name or email)
├── purchase_date: date (optional)
├── purchase_price: float (optional)
├── warranty_expiry: date (optional)
├── notes: str (optional)
├── created_at: datetime
└── updated_at: datetime
```

### AssetCategory
```
AssetCategory
├── id: UUID (PK)
├── name: str (unique, required)
├── description: str (optional)
├── color: str (hex color, default "#10B981")
└── created_at: datetime
```

### Location
```
Location
├── id: UUID (PK)
├── name: str (required)
├── address: str (optional)
├── building: str (optional)
├── floor: str (optional)
├── room: str (optional)
└── created_at: datetime
```

### Assignment
```
Assignment
├── id: UUID (PK)
├── asset_id: UUID (FK → Asset, ondelete=CASCADE)
├── assigned_to_name: str (required)
├── assigned_to_email: str (optional)
├── assigned_at: datetime
├── returned_at: datetime (optional — NULL means currently assigned)
├── notes: str (optional)
└── created_at: datetime
```

### MaintenanceRecord
```
MaintenanceRecord
├── id: UUID (PK)
├── asset_id: UUID (FK → Asset, ondelete=CASCADE)
├── maintenance_type: enum ["repair", "upgrade", "inspection", "cleaning", "other"]
├── description: str (required)
├── performed_by: str (optional)
├── cost: float (optional)
├── performed_at: datetime
└── created_at: datetime
```

## User Stories / Screens

### Screen 1: Dashboard
- KPI cards: Total Assets, Active, Under Maintenance, Warranty Expiring (30 days)
- Recent additions table (last 10 assets)
- Assets by type breakdown
- Quick action buttons: Add Asset, View Expiring, Export

### Screen 2: Asset List
- Table: asset_tag, name, type badge, status badge, location, assigned_to, warranty_expiry
- Search by name / tag / serial
- Filter by status, type, category
- Paginated (20 per page)
- "Add Asset" opens dialog form
- Row click → Asset Detail

### Screen 3: Asset Detail
- Asset info card with edit / delete
- Current assignment banner (assigned to / unassigned)
- Assignment history timeline
- Maintenance records list
- Depreciation card (if purchase_price + purchase_date set)

### Screen 4: Categories & Locations
- Manage taxonomies — create/edit/delete categories and locations
- Color-coded category badges

### Screen 5: Reports (Phase 2)
- Warranty expiring report
- License utilization report
- Depreciation summary
- Assignment history audit

## API Endpoints

```
GET    /health/                           → Health check

GET    /api/v1/assets                     → List assets (filter, search, paginate)
POST   /api/v1/assets                     → Create asset
GET    /api/v1/assets/stats               → Dashboard stats
GET    /api/v1/assets/expiring            → Assets with warranty expiring soon
GET    /api/v1/assets/{id}               → Get asset detail
PUT    /api/v1/assets/{id}               → Update asset
DELETE /api/v1/assets/{id}              → Delete asset (soft: set disposed)
GET    /api/v1/assets/{id}/assignments   → Assignment history
POST   /api/v1/assets/{id}/assign        → Assign asset to person
POST   /api/v1/assets/{id}/return        → Return/unassign asset
GET    /api/v1/assets/{id}/maintenance   → Maintenance history
POST   /api/v1/assets/{id}/maintenance   → Log maintenance event
GET    /api/v1/assets/{id}/depreciation  → Calculate depreciation
GET    /api/v1/assets/{id}/qr            → QR code image

GET    /api/v1/categories                → List categories
POST   /api/v1/categories                → Create category
PUT    /api/v1/categories/{id}           → Update category
DELETE /api/v1/categories/{id}           → Delete category

GET    /api/v1/locations                 → List locations
POST   /api/v1/locations                 → Create location
PUT    /api/v1/locations/{id}            → Update location
DELETE /api/v1/locations/{id}            → Delete location

GET    /api/v1/dashboard                 → Full dashboard stats

POST   /api/v1/copilot/chat              → AI Copilot (Phase 3)
```

## Non-Functional Requirements

- Backend tests: 80%+ coverage on business logic
- Frontend: Responsive (mobile-friendly table), Tailwind + pre-built UI components
- Docker: All services start with `docker compose up -d`
- No mock data — everything persisted to PostgreSQL
- All models use `Mapped[...]` + `mapped_column()` from SQLAlchemy 2.0
- UUID primary keys with `default=uuid.uuid4`
