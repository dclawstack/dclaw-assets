import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.location_repo import LocationRepository
from app.schemas.location import LocationCreate, LocationUpdate, LocationRead

router = APIRouter()


@router.get("", response_model=list[LocationRead])
async def list_locations(db: AsyncSession = Depends(get_db)):
    repo = LocationRepository(db)
    items, _ = await repo.list_all(limit=200)
    return items


@router.post("", response_model=LocationRead, status_code=status.HTTP_201_CREATED)
async def create_location(data: LocationCreate, db: AsyncSession = Depends(get_db)):
    repo = LocationRepository(db)
    return await repo.create_location(data)


@router.get("/{location_id}", response_model=LocationRead)
async def get_location(location_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    repo = LocationRepository(db)
    obj = await repo.get_by_id(location_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Location not found")
    return obj


@router.put("/{location_id}", response_model=LocationRead)
async def update_location(
    location_id: uuid.UUID,
    data: LocationUpdate,
    db: AsyncSession = Depends(get_db),
):
    repo = LocationRepository(db)
    obj = await repo.get_by_id(location_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Location not found")
    return await repo.update_location(obj, data)


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(location_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    repo = LocationRepository(db)
    obj = await repo.get_by_id(location_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Location not found")
    await repo.delete(obj)
