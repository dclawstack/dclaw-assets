import uuid
from pydantic import BaseModel, ConfigDict


class LocationCreate(BaseModel):
    name: str
    address: str | None = None
    building: str | None = None
    floor: str | None = None
    room: str | None = None


class LocationUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    building: str | None = None
    floor: str | None = None
    room: str | None = None


class LocationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    address: str | None
    building: str | None
    floor: str | None
    room: str | None
