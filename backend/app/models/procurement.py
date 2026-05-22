import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Numeric, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.core.utils import utc_now


class ProcurementStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    ordered = "ordered"
    received = "received"
    cancelled = "cancelled"


class PurchaseRequest(Base):
    __tablename__ = "purchase_requests"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    requested_by: Mapped[str] = mapped_column(String(200))
    vendor: Mapped[str | None] = mapped_column(String(200), nullable=True)
    estimated_cost: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    quantity: Mapped[int] = mapped_column(default=1)
    status: Mapped[ProcurementStatus] = mapped_column(
        SAEnum(ProcurementStatus, name="procurement_status"),
        default=ProcurementStatus.pending,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(default=utc_now)
