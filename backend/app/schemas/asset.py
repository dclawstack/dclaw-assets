import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.asset import AssetType, AssetStatus, MaintenanceType
from app.schemas.category import CategoryRead
from app.schemas.location import LocationRead


class AssetCreate(BaseModel):
    name: str
    asset_tag: str
    serial_number: Optional[str] = None
    asset_type: AssetType
    status: AssetStatus = AssetStatus.active
    category_id: Optional[uuid.UUID] = None
    location_id: Optional[uuid.UUID] = None
    assigned_to: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_price: Optional[float] = None
    warranty_expiry: Optional[date] = None
    notes: Optional[str] = None


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_tag: Optional[str] = None
    serial_number: Optional[str] = None
    asset_type: Optional[AssetType] = None
    status: Optional[AssetStatus] = None
    category_id: Optional[uuid.UUID] = None
    location_id: Optional[uuid.UUID] = None
    assigned_to: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_price: Optional[float] = None
    warranty_expiry: Optional[date] = None
    notes: Optional[str] = None


class AssetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    asset_tag: str
    serial_number: Optional[str]
    asset_type: AssetType
    status: AssetStatus
    category_id: Optional[uuid.UUID]
    location_id: Optional[uuid.UUID]
    assigned_to: Optional[str]
    purchase_date: Optional[date]
    purchase_price: Optional[float]
    warranty_expiry: Optional[date]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryRead] = None
    location: Optional[LocationRead] = None


class AssetListResponse(BaseModel):
    items: list[AssetRead]
    total: int
    page: int
    page_size: int


class AssignmentCreate(BaseModel):
    assigned_to_name: str
    assigned_to_email: Optional[str] = None
    notes: Optional[str] = None


class AssignmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    asset_id: uuid.UUID
    assigned_to_name: str
    assigned_to_email: Optional[str]
    assigned_at: datetime
    returned_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime


class MaintenanceCreate(BaseModel):
    maintenance_type: MaintenanceType
    description: str
    performed_by: Optional[str] = None
    cost: Optional[float] = None
    performed_at: Optional[datetime] = None


class MaintenanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    asset_id: uuid.UUID
    maintenance_type: MaintenanceType
    description: str
    performed_by: Optional[str]
    cost: Optional[float]
    performed_at: datetime
    created_at: datetime


class DashboardStats(BaseModel):
    total_assets: int
    active_assets: int
    maintenance_assets: int
    disposed_assets: int
    hardware_count: int
    software_count: int
    license_count: int
    warranty_expiring_30_days: int
    recently_added: list[AssetRead]


class DepreciationResponse(BaseModel):
    asset_id: uuid.UUID
    asset_name: str
    purchase_price: float
    purchase_date: date
    age_years: float
    useful_life_years: int
    annual_depreciation: float
    accumulated_depreciation: float
    book_value: float
    fully_depreciated: bool
