from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.category import AssetCategory
from app.repositories.base_repo import BaseRepository
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryRepository(BaseRepository[AssetCategory]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, AssetCategory)

    async def get_by_name(self, name: str) -> AssetCategory | None:
        result = await self.db.execute(
            select(AssetCategory).where(AssetCategory.name == name)
        )
        return result.scalar_one_or_none()

    async def create_category(self, data: CategoryCreate) -> AssetCategory:
        obj = AssetCategory(
            name=data.name,
            description=data.description,
            color=data.color,
        )
        return await self.create(obj)

    async def update_category(
        self, obj: AssetCategory, data: CategoryUpdate
    ) -> AssetCategory:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(obj, field, value)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj
