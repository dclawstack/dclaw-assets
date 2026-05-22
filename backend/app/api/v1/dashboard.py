from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.asset_repo import AssetRepository
from app.schemas.asset import DashboardStats

router = APIRouter()


@router.get("", response_model=DashboardStats)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    repo = AssetRepository(db)
    return await repo.get_stats()
