from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, text

from app.core.database import get_db
from app.models.asset import Asset, AssetType, AssetStatus, Assignment, MaintenanceRecord, MaintenanceType
from app.models.category import AssetCategory
from app.models.location import Location
from app.models.procurement import PurchaseRequest, ProcurementStatus

router = APIRouter()


def _ago(days: int = 0, months: int = 0) -> datetime:
    return datetime.utcnow() - timedelta(days=days + months * 30)


def _date(days_ago: int = 0, years_ago: int = 0):
    from datetime import date
    return (datetime.utcnow() - timedelta(days=days_ago + years_ago * 365)).date()


@router.post("")
async def seed_data(db: AsyncSession = Depends(get_db)):
    # Categories
    categories = [
        AssetCategory(name="Laptop", description="Portable computers", color="#3B82F6"),
        AssetCategory(name="Desktop", description="Workstation computers", color="#8B5CF6"),
        AssetCategory(name="Server", description="Data center servers", color="#EF4444"),
        AssetCategory(name="Network Equipment", description="Switches, routers, APs", color="#0891B2"),
        AssetCategory(name="Software License", description="SaaS and on-prem licenses", color="#10B981"),
        AssetCategory(name="Mobile Device", description="Phones and tablets", color="#F59E0B"),
        AssetCategory(name="Peripheral", description="Monitors, keyboards, mice", color="#6B7280"),
    ]
    for c in categories:
        db.add(c)
    await db.flush()
    cat = {c.name: c for c in categories}

    # Locations
    locations = [
        Location(name="HQ — New York", address="100 5th Ave, New York, NY 10011", building="HQ Tower", floor="12", room="12A"),
        Location(name="Engineering — Floor 3", address="100 5th Ave, New York, NY 10011", building="HQ Tower", floor="3", room="3B Open"),
        Location(name="San Francisco Office", address="555 Market St, San Francisco, CA 94105", building="SF Hub", floor="4", room="4C"),
        Location(name="Remote / WFH", address=None, building=None, floor=None, room=None),
        Location(name="Data Center — NJ", address="1 Data Dr, Secaucus, NJ 07094", building="DC-East", floor="1", room="Cage 5"),
        Location(name="London Office", address="30 St Mary Axe, London EC3A 8BF", building="Gherkin", floor="10", room="10D"),
    ]
    for l in locations:
        db.add(l)
    await db.flush()
    loc = {l.name: l for l in locations}

    # Assets
    assets_data = [
        # Laptops
        dict(name="MacBook Pro 16\" M3", asset_tag="LAP-001", serial_number="C02ZX1234ABC", asset_type=AssetType.hardware, status=AssetStatus.active, category_id=cat["Laptop"].id, location_id=loc["Engineering — Floor 3"].id, assigned_to="alice.chen@example.com", purchase_date=_date(days_ago=180), purchase_price=3499.00, warranty_expiry=_date(days_ago=-1100), notes="Primary dev machine"),
        dict(name="MacBook Pro 14\" M3", asset_tag="LAP-002", serial_number="C02ZX5678DEF", asset_type=AssetType.hardware, status=AssetStatus.active, category_id=cat["Laptop"].id, location_id=loc["Remote / WFH"].id, assigned_to="bob.smith@example.com", purchase_date=_date(days_ago=200), purchase_price=2299.00, warranty_expiry=_date(days_ago=-1100), notes=None),
        dict(name="ThinkPad X1 Carbon Gen 11", asset_tag="LAP-003", serial_number="R90ABCD1234", asset_type=AssetType.hardware, status=AssetStatus.active, category_id=cat["Laptop"].id, location_id=loc["San Francisco Office"].id, assigned_to="carol.jones@example.com", purchase_date=_date(days_ago=400), purchase_price=1799.00, warranty_expiry=_date(days_ago=20), notes="Warranty expires soon"),
        dict(name="MacBook Air M2", asset_tag="LAP-004", serial_number="C02ZX9999GHI", asset_type=AssetType.hardware, status=AssetStatus.maintenance, category_id=cat["Laptop"].id, location_id=loc["HQ — New York"].id, assigned_to=None, purchase_date=_date(days_ago=500), purchase_price=1299.00, warranty_expiry=_date(days_ago=10), notes="Battery replacement in progress"),
        dict(name="Dell XPS 15 9530", asset_tag="LAP-005", serial_number="DLL5X9530001", asset_type=AssetType.hardware, status=AssetStatus.inactive, category_id=cat["Laptop"].id, location_id=loc["HQ — New York"].id, assigned_to=None, purchase_date=_date(years_ago=3), purchase_price=1899.00, warranty_expiry=_date(years_ago=1), notes="Awaiting reassignment"),
        # Servers
        dict(name="Dell PowerEdge R750 — DB Primary", asset_tag="SRV-001", serial_number="DPER750001", asset_type=AssetType.hardware, status=AssetStatus.active, category_id=cat["Server"].id, location_id=loc["Data Center — NJ"].id, assigned_to=None, purchase_date=_date(days_ago=300), purchase_price=12500.00, warranty_expiry=_date(days_ago=-1000), notes="Primary Postgres server"),
        dict(name="Dell PowerEdge R750 — DB Replica", asset_tag="SRV-002", serial_number="DPER750002", asset_type=AssetType.hardware, status=AssetStatus.active, category_id=cat["Server"].id, location_id=loc["Data Center — NJ"].id, assigned_to=None, purchase_date=_date(days_ago=300), purchase_price=12500.00, warranty_expiry=_date(days_ago=-1000), notes="Streaming replica"),
        dict(name="HPE ProLiant DL380 Gen10", asset_tag="SRV-003", serial_number="HPE380G10X1", asset_type=AssetType.hardware, status=AssetStatus.maintenance, category_id=cat["Server"].id, location_id=loc["Data Center — NJ"].id, assigned_to=None, purchase_date=_date(years_ago=3), purchase_price=8900.00, warranty_expiry=_date(days_ago=90), notes="NIC replacement pending"),
        # Network
        dict(name="Cisco Catalyst 9300 48-Port", asset_tag="NET-001", serial_number="CCS9300NYC1", asset_type=AssetType.hardware, status=AssetStatus.active, category_id=cat["Network Equipment"].id, location_id=loc["HQ — New York"].id, assigned_to=None, purchase_date=_date(years_ago=2), purchase_price=4200.00, warranty_expiry=_date(days_ago=-400), notes="Core switch HQ"),
        dict(name="Ubiquiti UniFi AP U6 Pro", asset_tag="NET-002", serial_number="UBNT001SF01", asset_type=AssetType.hardware, status=AssetStatus.active, category_id=cat["Network Equipment"].id, location_id=loc["San Francisco Office"].id, assigned_to=None, purchase_date=_date(days_ago=100), purchase_price=199.00, warranty_expiry=_date(days_ago=-900), notes=None),
        # Software licenses
        dict(name="GitHub Enterprise — 50 seats", asset_tag="LIC-001", serial_number=None, asset_type=AssetType.license, status=AssetStatus.active, category_id=cat["Software License"].id, location_id=None, assigned_to=None, purchase_date=_date(days_ago=60), purchase_price=9600.00, warranty_expiry=_date(days_ago=-305), notes="Annual renewal"),
        dict(name="Figma Professional — 25 seats", asset_tag="LIC-002", serial_number=None, asset_type=AssetType.license, status=AssetStatus.active, category_id=cat["Software License"].id, location_id=None, assigned_to=None, purchase_date=_date(days_ago=30), purchase_price=3750.00, warranty_expiry=_date(days_ago=-335), notes=None),
        dict(name="Slack Business+ — 80 seats", asset_tag="LIC-003", serial_number=None, asset_type=AssetType.license, status=AssetStatus.inactive, category_id=cat["Software License"].id, location_id=None, assigned_to=None, purchase_date=_date(years_ago=2), purchase_price=6400.00, warranty_expiry=_date(days_ago=45), notes="Migrated to Teams — unused"),
        dict(name="JetBrains All Products Pack — 10 seats", asset_tag="LIC-004", serial_number=None, asset_type=AssetType.license, status=AssetStatus.active, category_id=cat["Software License"].id, location_id=None, assigned_to=None, purchase_date=_date(days_ago=90), purchase_price=2490.00, warranty_expiry=_date(days_ago=-275), notes=None),
        # Mobile
        dict(name="iPhone 15 Pro", asset_tag="MOB-001", serial_number="IPH15P001NY", asset_type=AssetType.hardware, status=AssetStatus.active, category_id=cat["Mobile Device"].id, location_id=loc["HQ — New York"].id, assigned_to="david.park@example.com", purchase_date=_date(days_ago=120), purchase_price=1199.00, warranty_expiry=_date(days_ago=-245), notes=None),
        dict(name="iPad Pro 12.9\" M2", asset_tag="MOB-002", serial_number="IPADPRO001", asset_type=AssetType.hardware, status=AssetStatus.lost, category_id=cat["Mobile Device"].id, location_id=None, assigned_to="eve.martinez@example.com", purchase_date=_date(years_ago=2), purchase_price=1099.00, warranty_expiry=_date(days_ago=200), notes="Reported lost during travel"),
        # Peripherals
        dict(name="LG 27\" 4K Monitor", asset_tag="PER-001", serial_number="LG4K27001", asset_type=AssetType.hardware, status=AssetStatus.active, category_id=cat["Peripheral"].id, location_id=loc["Engineering — Floor 3"].id, assigned_to="alice.chen@example.com", purchase_date=_date(days_ago=180), purchase_price=649.00, warranty_expiry=_date(days_ago=-900), notes=None),
        dict(name="Apple Studio Display", asset_tag="PER-002", serial_number="APSD001NYC", asset_type=AssetType.hardware, status=AssetStatus.active, category_id=cat["Peripheral"].id, location_id=loc["HQ — New York"].id, assigned_to="frank.lee@example.com", purchase_date=_date(days_ago=300), purchase_price=1599.00, warranty_expiry=_date(days_ago=-800), notes=None),
    ]

    assets = []
    for d in assets_data:
        a = Asset(**d)
        db.add(a)
        assets.append(a)
    await db.flush()

    # Assignments (history for key assets)
    assignments = [
        Assignment(asset_id=assets[0].id, assigned_to_name="Alice Chen", assigned_to_email="alice.chen@example.com", assigned_at=_ago(days=180), notes="New hire setup"),
        Assignment(asset_id=assets[1].id, assigned_to_name="Bob Smith", assigned_to_email="bob.smith@example.com", assigned_at=_ago(days=200), notes="Remote setup"),
        Assignment(asset_id=assets[2].id, assigned_to_name="Carol Jones", assigned_to_email="carol.jones@example.com", assigned_at=_ago(days=400), notes="SF office transfer"),
        Assignment(asset_id=assets[4].id, assigned_to_name="Grace Kim", assigned_to_email="grace.kim@example.com", assigned_at=_ago(days=900), returned_at=_ago(days=100), notes="Original owner — returned before departure"),
        Assignment(asset_id=assets[14].id, assigned_to_name="David Park", assigned_to_email="david.park@example.com", assigned_at=_ago(days=120), notes="Assigned at onboarding"),
    ]
    for a in assignments:
        db.add(a)

    # Maintenance records
    maintenance = [
        MaintenanceRecord(asset_id=assets[3].id, maintenance_type=MaintenanceType.repair, description="Battery replacement — capacity dropped to 62%", performed_by="IT — John Doe", cost=189.00, performed_at=_ago(days=5)),
        MaintenanceRecord(asset_id=assets[7].id, maintenance_type=MaintenanceType.repair, description="NIC replacement after physical damage", performed_by="HPE On-site Tech", cost=450.00, performed_at=_ago(days=10)),
        MaintenanceRecord(asset_id=assets[5].id, maintenance_type=MaintenanceType.inspection, description="Annual hardware inspection — all systems nominal", performed_by="Dell ProSupport", cost=0.00, performed_at=_ago(days=60)),
        MaintenanceRecord(asset_id=assets[8].id, maintenance_type=MaintenanceType.upgrade, description="Firmware upgrade to 17.9.4a", performed_by="Network Team", cost=0.00, performed_at=_ago(days=30)),
    ]
    for m in maintenance:
        db.add(m)

    # Purchase requests
    procurement = [
        PurchaseRequest(title="10x MacBook Pro 14\" M3 — Q3 Hire Batch", description="New hires starting Q3 need standard-issue laptops. Engineering and design roles.", requested_by="hr@example.com", vendor="Apple Business", estimated_cost=22990.00, quantity=10, status=ProcurementStatus.approved, notes="Approved by CFO on budget cycle"),
        PurchaseRequest(title="Upgrade core switch — HQ Floor 5", description="Cisco 9300 replacement for aging 48-port unit showing CRC errors.", requested_by="network@example.com", vendor="CDW", estimated_cost=4800.00, quantity=1, status=ProcurementStatus.ordered, notes="ETA 2 weeks"),
        PurchaseRequest(title="Adobe Creative Cloud — 5 additional seats", description="Design team headcount increase requires 5 more CC seats.", requested_by="design@example.com", vendor="Adobe", estimated_cost=2990.00, quantity=5, status=ProcurementStatus.pending, notes=None),
        PurchaseRequest(title="Synology NAS DS923+ for local backups", description="Offsite backup for London office. 4-bay NAS with 4x 8TB drives.", requested_by="it@example.com", vendor="Synology / Amazon", estimated_cost=1650.00, quantity=1, status=ProcurementStatus.received, notes="Delivered and configured"),
        PurchaseRequest(title="20x USB-C Hubs — WFH kit", description="Standard WFH peripheral upgrade for remote engineers.", requested_by="it@example.com", vendor="Anker", estimated_cost=1400.00, quantity=20, status=ProcurementStatus.cancelled, notes="Cancelled — company switched to docks included in laptop bundles"),
    ]
    for p in procurement:
        db.add(p)

    await db.commit()

    return {
        "seeded": {
            "categories": len(categories),
            "locations": len(locations),
            "assets": len(assets_data),
            "assignments": len(assignments),
            "maintenance_records": len(maintenance),
            "purchase_requests": len(procurement),
        }
    }


@router.delete("")
async def clear_data(db: AsyncSession = Depends(get_db)):
    await db.execute(delete(MaintenanceRecord))
    await db.execute(delete(Assignment))
    await db.execute(delete(PurchaseRequest))
    await db.execute(delete(Asset))
    # Clear enum types to avoid "already exists" on re-seed
    await db.execute(delete(AssetCategory))
    await db.execute(delete(Location))
    await db.commit()
    return {"cleared": True}
