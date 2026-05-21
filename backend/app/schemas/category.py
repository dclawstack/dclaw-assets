import uuid
from pydantic import BaseModel, ConfigDict


class CategoryCreate(BaseModel):
    name: str
    description: str | None = None
    color: str = "#10B981"


class CategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    color: str
