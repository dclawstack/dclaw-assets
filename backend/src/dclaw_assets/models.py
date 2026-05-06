from pydantic import BaseModel
from datetime import datetime
from typing import List

class Asset(BaseModel):
    id: str
    name: str
    asset_type: str
    assigned_to: str
    warranty_expiry: str
    deprecation_status: str
    created_at: datetime

class AssetCreate(BaseModel):
    name: str
    asset_type: str
