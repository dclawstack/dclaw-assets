"""Procurement workflow — purchase requests with approval lifecycle."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.utils import utc_now
from app.models.procurement import PurchaseRequest, ProcurementStatus

router = APIRouter()

_VALID_TRANSITIONS: dict[ProcurementStatus, list[ProcurementStatus]] = {
    ProcurementStatus.pending: [ProcurementStatus.approved, ProcurementStatus.cancelled],
    ProcurementStatus.approved: [ProcurementStatus.ordered, ProcurementStatus.cancelled],
    ProcurementStatus.ordered: [ProcurementStatus.received, ProcurementStatus.cancelled],
    ProcurementStatus.received: [],
    ProcurementStatus.cancelled: [],
}


class PurchaseRequestCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    requested_by: str = Field(..., min_length=1, max_length=200)
    vendor: Optional[str] = None
    estimated_cost: Optional[float] = Field(None, ge=0)
    quantity: int = Field(1, ge=1)
    notes: Optional[str] = None


class PurchaseRequestUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    vendor: Optional[str] = None
    estimated_cost: Optional[float] = Field(None, ge=0)
    quantity: Optional[int] = Field(None, ge=1)
    notes: Optional[str] = None


class StatusTransition(BaseModel):
    new_status: ProcurementStatus


def _pr_to_dict(pr: PurchaseRequest) -> dict:
    return {
        "id": str(pr.id),
        "title": pr.title,
        "description": pr.description,
        "requested_by": pr.requested_by,
        "vendor": pr.vendor,
        "estimated_cost": pr.estimated_cost,
        "quantity": pr.quantity,
        "status": pr.status,
        "notes": pr.notes,
        "created_at": pr.created_at.isoformat(),
        "updated_at": pr.updated_at.isoformat(),
    }


@router.get("/")
async def list_purchase_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
):
    query = select(PurchaseRequest).order_by(PurchaseRequest.created_at.desc())
    if status_filter:
        query = query.where(PurchaseRequest.status == status_filter)
    result = await db.execute(query)
    items = result.scalars().all()
    return [_pr_to_dict(pr) for pr in items]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_purchase_request(
    data: PurchaseRequestCreate, db: AsyncSession = Depends(get_db)
):
    pr = PurchaseRequest(**data.model_dump())
    db.add(pr)
    await db.commit()
    await db.refresh(pr)
    return _pr_to_dict(pr)


@router.get("/{pr_id}")
async def get_purchase_request(pr_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PurchaseRequest).where(PurchaseRequest.id == pr_id))
    pr = result.scalar_one_or_none()
    if not pr:
        raise HTTPException(status_code=404, detail="Purchase request not found")
    return _pr_to_dict(pr)


@router.put("/{pr_id}")
async def update_purchase_request(
    pr_id: uuid.UUID, data: PurchaseRequestUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(PurchaseRequest).where(PurchaseRequest.id == pr_id))
    pr = result.scalar_one_or_none()
    if not pr:
        raise HTTPException(status_code=404, detail="Purchase request not found")
    if pr.status in (ProcurementStatus.received, ProcurementStatus.cancelled):
        raise HTTPException(status_code=409, detail="Cannot update a completed or cancelled request")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(pr, field, value)
    pr.updated_at = utc_now()
    await db.commit()
    await db.refresh(pr)
    return _pr_to_dict(pr)


@router.post("/{pr_id}/transition")
async def transition_status(
    pr_id: uuid.UUID, data: StatusTransition, db: AsyncSession = Depends(get_db)
):
    """Advance purchase request through the approval workflow.

    Valid transitions:
    pending → approved | cancelled
    approved → ordered | cancelled
    ordered → received | cancelled
    """
    result = await db.execute(select(PurchaseRequest).where(PurchaseRequest.id == pr_id))
    pr = result.scalar_one_or_none()
    if not pr:
        raise HTTPException(status_code=404, detail="Purchase request not found")

    allowed = _VALID_TRANSITIONS[pr.status]
    if data.new_status not in allowed:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot transition from '{pr.status}' to '{data.new_status}'. "
                   f"Allowed: {[s.value for s in allowed] or 'none'}",
        )
    pr.status = data.new_status
    pr.updated_at = utc_now()
    await db.commit()
    await db.refresh(pr)
    return _pr_to_dict(pr)


@router.delete("/{pr_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_purchase_request(pr_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PurchaseRequest).where(PurchaseRequest.id == pr_id))
    pr = result.scalar_one_or_none()
    if not pr:
        raise HTTPException(status_code=404, detail="Purchase request not found")
    await db.delete(pr)
    await db.commit()
