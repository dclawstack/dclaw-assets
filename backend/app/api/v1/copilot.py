"""AI Copilot API — context-aware chat over the asset inventory."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.asset_repo import AssetRepository, MaintenanceRepository
from app.services import ai_copilot

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    context_summary: str


async def _build_context(db: AsyncSession) -> str:
    repo = AssetRepository(db)
    stats = await repo.get_stats()
    expiring = await repo.get_expiring_warranty(days=30)

    lines = [
        f"Total assets: {stats.total_assets}",
        f"Active: {stats.active_assets} | In maintenance: {stats.maintenance_assets} | Disposed: {stats.disposed_assets}",
        f"By type — Hardware: {stats.hardware_count}, Software: {stats.software_count}, Licenses: {stats.license_count}",
        f"Warranties expiring in 30 days: {stats.warranty_expiring_30_days}",
    ]

    if expiring:
        lines.append("Assets with expiring warranties:")
        for a in expiring[:5]:
            lines.append(f"  - {a.asset_tag} ({a.name}): expires {a.warranty_expiry}")

    if stats.recently_added:
        lines.append("Recently added assets:")
        for a in stats.recently_added[:3]:
            lines.append(f"  - {a.asset_tag} ({a.name}), {a.asset_type}, {a.status}")

    return "\n".join(lines)


@router.post("/chat", response_model=ChatResponse)
async def copilot_chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    context = await _build_context(db)
    today = date.today().isoformat()

    try:
        reply = await ai_copilot.chat(request.message, context, today)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return ChatResponse(reply=reply, context_summary=context)
