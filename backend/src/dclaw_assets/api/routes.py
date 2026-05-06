from fastapi import APIRouter
from datetime import datetime
from uuid import uuid4
from dclaw_assets.models import Asset, AssetCreate

router = APIRouter()

@router.post("/assets", response_model=Asset)
async def create_item(payload: AssetCreate):
    return Asset(
        id=str(uuid4()),
        name=payload.name,
        asset_type=payload.asset_type,
        assigned_to="Unassigned",
        warranty_expiry="2028-05-07",
        deprecation_status="active",
        created_at=datetime.utcnow(),
    )

@router.get("/assets/{asset_id}/history")
async def get_item(asset_id: str):
    return [{"date": "2025-01-10", "action": "Purchased", "user": "Procurement"}, {"date": "2025-02-01", "action": "Assigned", "user": "Alice"}, {"date": "2025-04-15", "action": "Returned", "user": "Alice"}]
