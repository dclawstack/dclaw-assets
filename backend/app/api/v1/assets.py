import uuid
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.asset_repo import AssetRepository, AssignmentRepository, MaintenanceRepository
from app.schemas.asset import (
    AssetCreate, AssetUpdate, AssetRead, AssetListResponse,
    AssignmentCreate, AssignmentRead,
    MaintenanceCreate, MaintenanceRead,
    DashboardStats, DepreciationResponse,
)
from app.core.utils import utc_now

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_stats(db: AsyncSession = Depends(get_db)):
    repo = AssetRepository(db)
    return await repo.get_stats()


@router.get("/expiring", response_model=list[AssetRead])
async def get_expiring(days: int = Query(30, ge=1, le=365), db: AsyncSession = Depends(get_db)):
    repo = AssetRepository(db)
    return await repo.get_expiring_warranty(days=days)


@router.get("/", response_model=AssetListResponse)
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


@router.post("/", response_model=AssetRead, status_code=status.HTTP_201_CREATED)
async def create_asset(data: AssetCreate, db: AsyncSession = Depends(get_db)):
    repo = AssetRepository(db)
    if await repo.get_asset_tag_exists(data.asset_tag):
        raise HTTPException(status_code=409, detail=f"Asset tag '{data.asset_tag}' already exists")
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
            raise HTTPException(status_code=409, detail=f"Asset tag '{data.asset_tag}' already exists")
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
    repo = AssignmentRepository(db)
    return await repo.get_by_asset(asset_id)


@router.post("/{asset_id}/assign", response_model=AssignmentRead, status_code=status.HTTP_201_CREATED)
async def assign_asset(
    asset_id: uuid.UUID, data: AssignmentCreate, db: AsyncSession = Depends(get_db)
):
    asset_repo = AssetRepository(db)
    asset = await asset_repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    repo = AssignmentRepository(db)
    active = await repo.get_active_assignment(asset_id)
    if active:
        raise HTTPException(status_code=409, detail="Asset is already assigned; return it first")
    assignment = await repo.assign(asset_id, data)
    update_data = AssetUpdate(assigned_to=data.assigned_to_name, status="active")
    await asset_repo.update_asset(asset, update_data)
    return assignment


@router.post("/{asset_id}/return", response_model=AssignmentRead)
async def return_asset(asset_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    asset_repo = AssetRepository(db)
    asset = await asset_repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    repo = AssignmentRepository(db)
    active = await repo.get_active_assignment(asset_id)
    if not active:
        raise HTTPException(status_code=409, detail="Asset is not currently assigned")
    assignment = await repo.return_asset(active)
    update_data = AssetUpdate(assigned_to=None)
    await asset_repo.update_asset(asset, update_data)
    return assignment


@router.get("/{asset_id}/maintenance", response_model=list[MaintenanceRead])
async def get_maintenance(asset_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    asset_repo = AssetRepository(db)
    if not await asset_repo.get_by_id(asset_id):
        raise HTTPException(status_code=404, detail="Asset not found")
    repo = MaintenanceRepository(db)
    return await repo.get_by_asset(asset_id)


@router.post(
    "/{asset_id}/maintenance",
    response_model=MaintenanceRead,
    status_code=status.HTTP_201_CREATED,
)
async def log_maintenance(
    asset_id: uuid.UUID, data: MaintenanceCreate, db: AsyncSession = Depends(get_db)
):
    asset_repo = AssetRepository(db)
    asset = await asset_repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    repo = MaintenanceRepository(db)
    record = await repo.log_maintenance(asset_id, data)
    if asset.status != "maintenance":
        update_data = AssetUpdate(status="maintenance")
        await asset_repo.update_asset(asset, update_data)
    return record


@router.get("/{asset_id}/depreciation", response_model=DepreciationResponse)
async def get_depreciation(
    asset_id: uuid.UUID,
    useful_life_years: int = Query(3, ge=1, le=30),
    db: AsyncSession = Depends(get_db),
):
    repo = AssetRepository(db)
    asset = await repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if not asset.purchase_price or not asset.purchase_date:
        raise HTTPException(
            status_code=422,
            detail="Asset must have purchase_price and purchase_date for depreciation",
        )
    today = date.today()
    age_days = (today - asset.purchase_date).days
    age_years = age_days / 365.25
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
