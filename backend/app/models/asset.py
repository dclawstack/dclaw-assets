import uuid
import enum
from datetime import date, datetime
from sqlalchemy import ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.core.utils import utc_now


class AssetType(str, enum.Enum):
    hardware = "hardware"
    software = "software"
    license = "license"
    other = "other"


class AssetStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    maintenance = "maintenance"
    disposed = "disposed"
    lost = "lost"


class MaintenanceType(str, enum.Enum):
    repair = "repair"
    upgrade = "upgrade"
    inspection = "inspection"
    cleaning = "cleaning"
    other = "other"


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(nullable=False)
    asset_tag: Mapped[str] = mapped_column(unique=True, nullable=False)
    serial_number: Mapped[str | None] = mapped_column(nullable=True)
    asset_type: Mapped[AssetType] = mapped_column(
        SAEnum(AssetType, name="asset_type_enum"), nullable=False
    )
    status: Mapped[AssetStatus] = mapped_column(
        SAEnum(AssetStatus, name="asset_status_enum"),
        default=AssetStatus.active,
        nullable=False,
    )
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("asset_categories.id", ondelete="SET NULL"), nullable=True
    )
    location_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("locations.id", ondelete="SET NULL"), nullable=True
    )
    assigned_to: Mapped[str | None] = mapped_column(nullable=True)
    purchase_date: Mapped[date | None] = mapped_column(nullable=True)
    purchase_price: Mapped[float | None] = mapped_column(nullable=True)
    warranty_expiry: Mapped[date | None] = mapped_column(nullable=True)
    notes: Mapped[str | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(default=utc_now, onupdate=utc_now)

    category: Mapped["AssetCategory | None"] = relationship(  # type: ignore[name-defined]
        "AssetCategory", lazy="selectin", foreign_keys=[category_id]
    )
    location: Mapped["Location | None"] = relationship(  # type: ignore[name-defined]
        "Location", lazy="selectin", foreign_keys=[location_id]
    )
    assignments: Mapped[list["Assignment"]] = relationship(
        "Assignment", lazy="selectin", back_populates="asset", cascade="all, delete-orphan"
    )
    maintenance_records: Mapped[list["MaintenanceRecord"]] = relationship(
        "MaintenanceRecord", lazy="selectin", back_populates="asset", cascade="all, delete-orphan"
    )


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    asset_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("assets.id", ondelete="CASCADE"), nullable=False
    )
    assigned_to_name: Mapped[str] = mapped_column(nullable=False)
    assigned_to_email: Mapped[str | None] = mapped_column(nullable=True)
    assigned_at: Mapped[datetime] = mapped_column(default=utc_now)
    returned_at: Mapped[datetime | None] = mapped_column(nullable=True)
    notes: Mapped[str | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)

    asset: Mapped["Asset"] = relationship("Asset", back_populates="assignments")


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    asset_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("assets.id", ondelete="CASCADE"), nullable=False
    )
    maintenance_type: Mapped[MaintenanceType] = mapped_column(
        SAEnum(MaintenanceType, name="maintenance_type_enum"), nullable=False
    )
    description: Mapped[str] = mapped_column(nullable=False)
    performed_by: Mapped[str | None] = mapped_column(nullable=True)
    cost: Mapped[float | None] = mapped_column(nullable=True)
    performed_at: Mapped[datetime] = mapped_column(default=utc_now)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)

    asset: Mapped["Asset"] = relationship("Asset", back_populates="maintenance_records")
