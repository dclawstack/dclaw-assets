"""Automated compliance report — SOX/ISO audit data in a single endpoint."""

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.asset import Asset, Assignment, MaintenanceRecord
from app.repositories.asset_repo import AssetRepository

router = APIRouter()


@router.get("/compliance")
async def compliance_report(
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
    db: AsyncSession = Depends(get_db),
):
    """Generate a compliance report for the given date range.

    Returns all assets created/modified in range, all assignments made,
    and all maintenance performed. Suitable for SOX/ISO audits.
    """
    # Assets active during period (created before to_date)
    assets_result = await db.execute(
        select(Asset).where(Asset.created_at <= to_date).order_by(Asset.created_at)
    )
    assets = assets_result.scalars().all()

    # Assignments made in period
    assignments_result = await db.execute(
        select(Assignment).where(
            Assignment.assigned_at >= from_date,
            Assignment.assigned_at <= to_date,
        ).order_by(Assignment.assigned_at)
    )
    assignments = assignments_result.scalars().all()

    # Maintenance performed in period
    maintenance_result = await db.execute(
        select(MaintenanceRecord).where(
            MaintenanceRecord.performed_at >= from_date,
            MaintenanceRecord.performed_at <= to_date,
        ).order_by(MaintenanceRecord.performed_at)
    )
    maintenance = maintenance_result.scalars().all()

    # Disposals (assets set to disposed status) — filter by updated_at proxy
    disposed_result = await db.execute(
        select(Asset).where(
            Asset.status == "disposed",
            Asset.updated_at >= from_date,
            Asset.updated_at <= to_date,
        )
    )
    disposed = disposed_result.scalars().all()

    return {
        "report_period": {"from": from_date.isoformat(), "to": to_date.isoformat()},
        "generated_at": date.today().isoformat(),
        "summary": {
            "total_assets_in_inventory": len(assets),
            "assignments_in_period": len(assignments),
            "maintenance_events_in_period": len(maintenance),
            "disposals_in_period": len(disposed),
        },
        "assets": [
            {
                "id": str(a.id),
                "asset_tag": a.asset_tag,
                "name": a.name,
                "asset_type": a.asset_type,
                "status": a.status,
                "serial_number": a.serial_number,
                "assigned_to": a.assigned_to,
                "purchase_date": a.purchase_date.isoformat() if a.purchase_date else None,
                "purchase_price": a.purchase_price,
                "warranty_expiry": a.warranty_expiry.isoformat() if a.warranty_expiry else None,
                "created_at": a.created_at.isoformat(),
            }
            for a in assets
        ],
        "assignments": [
            {
                "id": str(a.id),
                "asset_id": str(a.asset_id),
                "assigned_to_name": a.assigned_to_name,
                "assigned_to_email": a.assigned_to_email,
                "assigned_at": a.assigned_at.isoformat(),
                "returned_at": a.returned_at.isoformat() if a.returned_at else None,
                "notes": a.notes,
            }
            for a in assignments
        ],
        "maintenance": [
            {
                "id": str(m.id),
                "asset_id": str(m.asset_id),
                "maintenance_type": m.maintenance_type,
                "description": m.description,
                "performed_by": m.performed_by,
                "cost": m.cost,
                "performed_at": m.performed_at.isoformat(),
            }
            for m in maintenance
        ],
        "disposals": [
            {
                "id": str(a.id),
                "asset_tag": a.asset_tag,
                "name": a.name,
                "asset_type": a.asset_type,
                "updated_at": a.updated_at.isoformat(),
            }
            for a in disposed
        ],
    }
