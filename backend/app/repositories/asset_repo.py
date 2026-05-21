import uuid
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.models.asset import Asset, Assignment, MaintenanceRecord, AssetStatus
from app.repositories.base_repo import BaseRepository
from app.schemas.asset import AssetCreate, AssetUpdate, AssignmentCreate, MaintenanceCreate
from app.core.utils import utc_now


class AssetRepository(BaseRepository[Asset]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Asset)

    async def list_assets(
        self,
        limit: int = 20,
        offset: int = 0,
        search: str | None = None,
        status: str | None = None,
        asset_type: str | None = None,
        category_id: uuid.UUID | None = None,
    ) -> tuple[list[Asset], int]:
        query = select(Asset)
        count_query = select(func.count()).select_from(Asset)

        if search:
            like = f"%{search}%"
            filter_expr = or_(
                Asset.name.ilike(like),
                Asset.asset_tag.ilike(like),
                Asset.serial_number.ilike(like),
                Asset.assigned_to.ilike(like),
            )
            query = query.where(filter_expr)
            count_query = count_query.where(filter_expr)
        if status:
            query = query.where(Asset.status == status)
            count_query = count_query.where(Asset.status == status)
        if asset_type:
            query = query.where(Asset.asset_type == asset_type)
            count_query = count_query.where(Asset.asset_type == asset_type)
        if category_id:
            query = query.where(Asset.category_id == category_id)
            count_query = count_query.where(Asset.category_id == category_id)

        query = query.order_by(Asset.created_at.desc()).limit(limit).offset(offset)

        result = await self.db.execute(query)
        items = list(result.scalars().all())
        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0
        return items, total

    async def create_asset(self, data: AssetCreate) -> Asset:
        obj = Asset(**data.model_dump())
        return await self.create(obj)

    async def update_asset(self, obj: Asset, data: AssetUpdate) -> Asset:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        obj.updated_at = utc_now()
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def get_expiring_warranty(self, days: int = 30) -> list[Asset]:
        today = date.today()
        cutoff = today + timedelta(days=days)
        result = await self.db.execute(
            select(Asset).where(
                Asset.warranty_expiry >= today,
                Asset.warranty_expiry <= cutoff,
                Asset.status == AssetStatus.active,
            ).order_by(Asset.warranty_expiry)
        )
        return list(result.scalars().all())

    async def get_stats(self) -> dict:
        total = await self.db.execute(select(func.count()).select_from(Asset))
        active = await self.db.execute(
            select(func.count()).select_from(Asset).where(Asset.status == "active")
        )
        maintenance = await self.db.execute(
            select(func.count()).select_from(Asset).where(Asset.status == "maintenance")
        )
        disposed = await self.db.execute(
            select(func.count()).select_from(Asset).where(Asset.status == "disposed")
        )
        hardware = await self.db.execute(
            select(func.count()).select_from(Asset).where(Asset.asset_type == "hardware")
        )
        software = await self.db.execute(
            select(func.count()).select_from(Asset).where(Asset.asset_type == "software")
        )
        license_count = await self.db.execute(
            select(func.count()).select_from(Asset).where(Asset.asset_type == "license")
        )
        today = date.today()
        cutoff = today + timedelta(days=30)
        expiring = await self.db.execute(
            select(func.count())
            .select_from(Asset)
            .where(
                Asset.warranty_expiry >= today,
                Asset.warranty_expiry <= cutoff,
                Asset.status == "active",
            )
        )
        recent_result = await self.db.execute(
            select(Asset).order_by(Asset.created_at.desc()).limit(10)
        )
        recently_added = list(recent_result.scalars().all())

        return {
            "total_assets": total.scalar() or 0,
            "active_assets": active.scalar() or 0,
            "maintenance_assets": maintenance.scalar() or 0,
            "disposed_assets": disposed.scalar() or 0,
            "hardware_count": hardware.scalar() or 0,
            "software_count": software.scalar() or 0,
            "license_count": license_count.scalar() or 0,
            "warranty_expiring_30_days": expiring.scalar() or 0,
            "recently_added": recently_added,
        }

    async def get_asset_tag_exists(self, tag: str) -> bool:
        result = await self.db.execute(
            select(func.count()).select_from(Asset).where(Asset.asset_tag == tag)
        )
        return (result.scalar() or 0) > 0


class AssignmentRepository(BaseRepository[Assignment]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Assignment)

    async def get_by_asset(self, asset_id: uuid.UUID) -> list[Assignment]:
        result = await self.db.execute(
            select(Assignment)
            .where(Assignment.asset_id == asset_id)
            .order_by(Assignment.assigned_at.desc())
        )
        return list(result.scalars().all())

    async def get_active_assignment(self, asset_id: uuid.UUID) -> Assignment | None:
        result = await self.db.execute(
            select(Assignment).where(
                Assignment.asset_id == asset_id,
                Assignment.returned_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def assign(self, asset_id: uuid.UUID, data: AssignmentCreate) -> Assignment:
        obj = Assignment(
            asset_id=asset_id,
            assigned_to_name=data.assigned_to_name,
            assigned_to_email=data.assigned_to_email,
            notes=data.notes,
        )
        return await self.create(obj)

    async def return_asset(self, assignment: Assignment) -> Assignment:
        assignment.returned_at = utc_now()
        await self.db.commit()
        await self.db.refresh(assignment)
        return assignment


class MaintenanceRepository(BaseRepository[MaintenanceRecord]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, MaintenanceRecord)

    async def get_by_asset(self, asset_id: uuid.UUID) -> list[MaintenanceRecord]:
        result = await self.db.execute(
            select(MaintenanceRecord)
            .where(MaintenanceRecord.asset_id == asset_id)
            .order_by(MaintenanceRecord.performed_at.desc())
        )
        return list(result.scalars().all())

    async def log_maintenance(
        self, asset_id: uuid.UUID, data: MaintenanceCreate
    ) -> MaintenanceRecord:
        obj = MaintenanceRecord(
            asset_id=asset_id,
            maintenance_type=data.maintenance_type,
            description=data.description,
            performed_by=data.performed_by,
            cost=data.cost,
            performed_at=data.performed_at or utc_now(),
        )
        return await self.create(obj)
