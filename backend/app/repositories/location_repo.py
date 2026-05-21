from sqlalchemy.ext.asyncio import AsyncSession
from app.models.location import Location
from app.repositories.base_repo import BaseRepository
from app.schemas.location import LocationCreate, LocationUpdate


class LocationRepository(BaseRepository[Location]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Location)

    async def create_location(self, data: LocationCreate) -> Location:
        obj = Location(**data.model_dump())
        return await self.create(obj)

    async def update_location(self, obj: Location, data: LocationUpdate) -> Location:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(obj, field, value)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj
