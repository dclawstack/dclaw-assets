import csv
import io
import uuid
from datetime import date
from typing import Optional
from urllib.parse import urlparse

import qrcode
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.utils import utc_now
from app.models.asset import MaintenanceRecord
from app.repositories.asset_repo import (
    AssetRepository,
    AssignmentRepository,
    MaintenanceRepository,
)
from app.schemas.asset import (
    AssetCreate,
    AssetListResponse,
    AssetRead,
    AssetUpdate,
    AssignmentCreate,
    AssignmentRead,
    DashboardStats,
    DepreciationResponse,
    MaintenanceCreate,
    MaintenanceRead,
)

router = APIRouter()

# ── Aggregate / collection endpoints (MUST come before /{asset_id}) ────────

@router.get("/stats", response_model=DashboardStats)
async def get_stats(db: AsyncSession = Depends(get_db)):
    repo = AssetRepository(db)
    return await repo.get_stats()


@router.get("/expiring", response_model=list[AssetRead])
async def get_expiring(
    days: int = Query(30, ge=1, le=365), db: AsyncSession = Depends(get_db)
):
    repo = AssetRepository(db)
    return await repo.get_expiring_warranty(days=days)


@router.get("/refresh-predictions")
async def get_refresh_predictions(db: AsyncSession = Depends(get_db)):
    """Score hardware assets 0-100 for refresh urgency.

    Factors: age vs 3-year useful life, warranty status, maintenance count.
    Higher score = more urgent to replace.
    """
    repo = AssetRepository(db)
    items, _ = await repo.list_assets(limit=1000, asset_type="hardware")
    today = date.today()

    # Batch-fetch all maintenance records for these assets in one query (avoids N+1)
    asset_ids = [a.id for a in items]
    maint_result = await db.execute(
        select(MaintenanceRecord).where(MaintenanceRecord.asset_id.in_(asset_ids))
    )
    all_records = maint_result.scalars().all()
    repairs_by_asset: dict[uuid.UUID, int] = {}
    for r in all_records:
        if r.maintenance_type == "repair":
            repairs_by_asset[r.asset_id] = repairs_by_asset.get(r.asset_id, 0) + 1

    results = []
    for asset in items:
        score = 0
        reasons: list[str] = []

        # Age component (0-50 pts): full score at 3+ years old
        if asset.purchase_date:
            age_years = (today - asset.purchase_date).days / 365.25
            age_score = min(int(age_years / 3 * 50), 50)
            score += age_score
            if age_years >= 3:
                reasons.append(f"Age {age_years:.1f}y ≥ 3y standard")

        # Warranty component (0-30 pts)
        if asset.warranty_expiry:
            days_to_expiry = (asset.warranty_expiry - today).days
            if days_to_expiry < 0:
                score += 30
                reasons.append("Warranty expired")
            elif days_to_expiry <= 90:
                score += 20
                reasons.append(f"Warranty expires in {days_to_expiry}d")
        else:
            score += 15
            reasons.append("No warranty info")

        # Maintenance count component (0-20 pts): >3 repairs = flag
        repair_count = repairs_by_asset.get(asset.id, 0)
        if repair_count >= 3:
            score += 20
            reasons.append(f"{repair_count} repairs logged")
        elif repair_count >= 1:
            score += repair_count * 5

        results.append({
            "asset_id": str(asset.id),
            "name": asset.name,
            "asset_tag": asset.asset_tag,
            "assigned_to": asset.assigned_to,
            "refresh_score": min(score, 100),
            "reasons": reasons,
        })

    results.sort(key=lambda x: x["refresh_score"], reverse=True)
    return results


@router.get("/license-waste")
async def get_license_waste(
    threshold: int = Query(50, ge=0, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Return software/license assets with utilization below threshold %.

    Utilization = (currently assigned / total_seats) * 100.
    total_seats defaults to 1 for assets without a seat count in notes.
    """
    repo = AssetRepository(db)
    asgn_repo = AssignmentRepository(db)
    items, _ = await repo.list_assets(limit=1000, asset_type="license")
    soft_items, _ = await repo.list_assets(limit=1000, asset_type="software")
    all_items = items + soft_items

    results = []
    for asset in all_items:
        active_asgn = await asgn_repo.get_active_assignment(asset.id)
        assigned_count = 1 if active_asgn else 0
        utilization = assigned_count * 100
        if utilization < threshold:
            results.append({
                "asset_id": str(asset.id),
                "name": asset.name,
                "asset_tag": asset.asset_tag,
                "asset_type": asset.asset_type,
                "utilization_pct": utilization,
                "is_assigned": active_asgn is not None,
                "purchase_price": asset.purchase_price,
            })

    results.sort(key=lambda x: x["utilization_pct"])
    return results


@router.get("/export")
async def export_assets(db: AsyncSession = Depends(get_db)):
    """Stream all assets as a CSV download."""
    repo = AssetRepository(db)
    items, _ = await repo.list_assets(limit=10000)
    asgn_repo = AssignmentRepository(db)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "asset_tag", "name", "serial_number", "asset_type", "status",
        "category", "location", "assigned_to", "purchase_date",
        "purchase_price", "warranty_expiry", "notes",
    ])
    for asset in items:
        active = await asgn_repo.get_active_assignment(asset.id)
        writer.writerow([
            asset.asset_tag,
            asset.name,
            asset.serial_number or "",
            asset.asset_type.value,
            asset.status.value,
            asset.category.name if asset.category else "",
            asset.location.name if asset.location else "",
            active.assigned_to_name if active else (asset.assigned_to or ""),
            asset.purchase_date.isoformat() if asset.purchase_date else "",
            asset.purchase_price if asset.purchase_price is not None else "",
            asset.warranty_expiry.isoformat() if asset.warranty_expiry else "",
            asset.notes or "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=assets.csv"},
    )


@router.post("/import")
async def import_assets(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Bulk-import assets from a CSV file.

    Expected columns (order matters): asset_tag, name, serial_number,
    asset_type, status, assigned_to, purchase_date, purchase_price,
    warranty_expiry, notes.
    First row must be a header row.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    text = content.decode("utf-8-sig")  # handles BOM
    reader = csv.DictReader(io.StringIO(text))

    repo = AssetRepository(db)
    created = 0
    skipped = 0
    errors: list[dict] = []

    for row_num, row in enumerate(reader, start=2):
        tag = (row.get("asset_tag") or "").strip()
        name = (row.get("name") or "").strip()
        asset_type_raw = (row.get("asset_type") or "hardware").strip().lower()

        if not tag or not name:
            errors.append({"row": row_num, "reason": "Missing asset_tag or name"})
            skipped += 1
            continue

        if await repo.get_asset_tag_exists(tag):
            errors.append({"row": row_num, "reason": f"Tag '{tag}' already exists"})
            skipped += 1
            continue

        valid_types = {"hardware", "software", "license", "other"}
        if asset_type_raw not in valid_types:
            asset_type_raw = "other"

        valid_statuses = {"active", "inactive", "maintenance", "disposed", "lost"}
        status_raw = (row.get("status") or "active").strip().lower()
        if status_raw not in valid_statuses:
            status_raw = "active"

        def parse_date(val: str) -> Optional[date]:
            v = (val or "").strip()
            if not v:
                return None
            for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"):
                try:
                    return date.fromisoformat(v) if fmt == "%Y-%m-%d" else date.strptime(v, fmt).date()
                except ValueError:
                    pass
            return None

        def parse_float(val: str) -> Optional[float]:
            v = (val or "").strip().replace("$", "").replace(",", "")
            try:
                return float(v) if v else None
            except ValueError:
                return None

        try:
            data = AssetCreate(
                name=name,
                asset_tag=tag,
                serial_number=(row.get("serial_number") or "").strip() or None,
                asset_type=asset_type_raw,  # type: ignore[arg-type]
                status=status_raw,  # type: ignore[arg-type]
                assigned_to=(row.get("assigned_to") or "").strip() or None,
                purchase_date=parse_date(row.get("purchase_date", "")),
                purchase_price=parse_float(row.get("purchase_price", "")),
                warranty_expiry=parse_date(row.get("warranty_expiry", "")),
                notes=(row.get("notes") or "").strip() or None,
            )
            await repo.create_asset(data)
            created += 1
        except Exception as exc:
            errors.append({"row": row_num, "reason": str(exc)})
            skipped += 1

    return {"created": created, "skipped": skipped, "errors": errors}


# ── Per-asset endpoints ─────────────────────────────────────────────────────

@router.get("", response_model=AssetListResponse)
async def list_assets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    asset_type: Optional[str] = Query(None),
    category_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    repo = AssetRepository(db)
    offset = (page - 1) * page_size
    items, total = await repo.list_assets(
        limit=page_size,
        offset=offset,
        search=search,
        status=status,
        asset_type=asset_type,
        category_id=category_id,
    )
    return AssetListResponse(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=AssetRead, status_code=status.HTTP_201_CREATED)
async def create_asset(data: AssetCreate, db: AsyncSession = Depends(get_db)):
    repo = AssetRepository(db)
    if await repo.get_asset_tag_exists(data.asset_tag):
        raise HTTPException(
            status_code=409, detail=f"Asset tag '{data.asset_tag}' already exists"
        )
    return await repo.create_asset(data)


@router.get("/{asset_id}", response_model=AssetRead)
async def get_asset(asset_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    repo = AssetRepository(db)
    obj = await repo.get_by_id(asset_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Asset not found")
    return obj


@router.put("/{asset_id}", response_model=AssetRead)
async def update_asset(
    asset_id: uuid.UUID, data: AssetUpdate, db: AsyncSession = Depends(get_db)
):
    repo = AssetRepository(db)
    obj = await repo.get_by_id(asset_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Asset not found")
    if data.asset_tag and data.asset_tag != obj.asset_tag:
        if await repo.get_asset_tag_exists(data.asset_tag):
            raise HTTPException(
                status_code=409,
                detail=f"Asset tag '{data.asset_tag}' already exists",
            )
    return await repo.update_asset(obj, data)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(asset_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    repo = AssetRepository(db)
    obj = await repo.get_by_id(asset_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Asset not found")
    await repo.delete(obj)


@router.get("/{asset_id}/assignments", response_model=list[AssignmentRead])
async def get_assignments(asset_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    asset_repo = AssetRepository(db)
    if not await asset_repo.get_by_id(asset_id):
        raise HTTPException(status_code=404, detail="Asset not found")
    return await AssignmentRepository(db).get_by_asset(asset_id)


@router.post(
    "/{asset_id}/assign",
    response_model=AssignmentRead,
    status_code=status.HTTP_201_CREATED,
)
async def assign_asset(
    asset_id: uuid.UUID,
    data: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
):
    asset_repo = AssetRepository(db)
    asset = await asset_repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    asgn_repo = AssignmentRepository(db)
    if await asgn_repo.get_active_assignment(asset_id):
        raise HTTPException(
            status_code=409, detail="Asset is already assigned; return it first"
        )
    assignment = await asgn_repo.assign(asset_id, data)
    await asset_repo.update_asset(
        asset, AssetUpdate(assigned_to=data.assigned_to_name, status="active")
    )
    return assignment


@router.post("/{asset_id}/return", response_model=AssignmentRead)
async def return_asset(asset_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    asset_repo = AssetRepository(db)
    asset = await asset_repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    asgn_repo = AssignmentRepository(db)
    active = await asgn_repo.get_active_assignment(asset_id)
    if not active:
        raise HTTPException(status_code=409, detail="Asset is not currently assigned")
    assignment = await asgn_repo.return_asset(active)
    await asset_repo.update_asset(asset, AssetUpdate(assigned_to=None))
    return assignment


@router.get("/{asset_id}/maintenance", response_model=list[MaintenanceRead])
async def get_maintenance(asset_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    if not await AssetRepository(db).get_by_id(asset_id):
        raise HTTPException(status_code=404, detail="Asset not found")
    return await MaintenanceRepository(db).get_by_asset(asset_id)


@router.post(
    "/{asset_id}/maintenance",
    response_model=MaintenanceRead,
    status_code=status.HTTP_201_CREATED,
)
async def log_maintenance(
    asset_id: uuid.UUID,
    data: MaintenanceCreate,
    db: AsyncSession = Depends(get_db),
):
    asset_repo = AssetRepository(db)
    asset = await asset_repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    record = await MaintenanceRepository(db).log_maintenance(asset_id, data)
    if asset.status != "maintenance":
        await asset_repo.update_asset(asset, AssetUpdate(status="maintenance"))
    return record


@router.get("/{asset_id}/depreciation", response_model=DepreciationResponse)
async def get_depreciation(
    asset_id: uuid.UUID,
    useful_life_years: int = Query(3, ge=1, le=30),
    db: AsyncSession = Depends(get_db),
):
    asset = await AssetRepository(db).get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if not asset.purchase_price or not asset.purchase_date:
        raise HTTPException(
            status_code=422,
            detail="Asset must have purchase_price and purchase_date for depreciation",
        )
    today = date.today()
    age_years = (today - asset.purchase_date).days / 365.25
    annual = asset.purchase_price / useful_life_years
    accumulated = min(annual * age_years, asset.purchase_price)
    book_value = max(asset.purchase_price - accumulated, 0.0)
    return DepreciationResponse(
        asset_id=asset.id,
        asset_name=asset.name,
        purchase_price=asset.purchase_price,
        purchase_date=asset.purchase_date,
        age_years=round(age_years, 2),
        useful_life_years=useful_life_years,
        annual_depreciation=round(annual, 2),
        accumulated_depreciation=round(accumulated, 2),
        book_value=round(book_value, 2),
        fully_depreciated=(book_value == 0.0),
    )


@router.get("/{asset_id}/qr")
async def get_qr_code(
    asset_id: uuid.UUID,
    base_url: str = Query("http://localhost:3043", description="Frontend base URL"),
    db: AsyncSession = Depends(get_db),
):
    """Return a PNG QR code that links to the asset detail page."""
    asset = await AssetRepository(db).get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    parsed = urlparse(base_url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail="base_url must use http or https")
    url = f"{base_url.rstrip('/')}/assets/{asset_id}"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")
