import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.ticket import Ticket
    from app.models.call_intent import CallIntent


class LocationType(str, enum.Enum):
    BUS = "BUS"
    DORM = "DORM"


class LocationStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    MAINTENANCE = "MAINTENANCE"


class Location(Base):
    """Location entity: Bus or Dormitory room where QR code is placed."""
    __tablename__ = "locations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    type: Mapped[LocationType] = mapped_column(
        Enum(LocationType, name="location_type_enum", native_enum=False),
        nullable=False,
        index=True,
    )
    code: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
    )
    name_display: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    manager_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[LocationStatus] = mapped_column(
        Enum(LocationStatus, name="location_status_enum", native_enum=False),
        default=LocationStatus.ACTIVE,
        nullable=False,
    )
    metadata_info: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        default=dict,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    manager: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="managed_locations",
        foreign_keys=[manager_id],
        lazy="joined",
    )
    tickets: Mapped[List["Ticket"]] = relationship(
        "Ticket",
        back_populates="location",
        cascade="all, delete-orphan",
    )
    call_intents: Mapped[List["CallIntent"]] = relationship(
        "CallIntent",
        back_populates="location",
    )

    def __repr__(self) -> str:
        return f"<Location {self.code} - {self.name_display} ({self.type})>"
