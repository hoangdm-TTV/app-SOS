import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.location import Location


class CallStatus(str, enum.Enum):
    INITIATED = "INITIATED"    # Vừa bấm gọi / chuyển hướng
    CONNECTED = "CONNECTED"    # Đã kết nối tổng đài
    MISSED = "MISSED"          # Tổng đài bận / nhỡ
    FAILED = "FAILED"          # Lỗi kết nối / rớt mạng


class CallIntent(Base):
    """Log entry for fallback voice calls when WebRTC audio fails or direct hotline is dialed."""
    __tablename__ = "call_intents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("locations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    caller_phone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    caller_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    reason: Mapped[str] = mapped_column(
        String(120),
        default="WEBRTC_FAILED",
        nullable=False,
    )
    status: Mapped[CallStatus] = mapped_column(
        Enum(CallStatus, name="call_status_enum", native_enum=False),
        default=CallStatus.INITIATED,
        nullable=False,
        index=True,
    )
    hotline_number: Mapped[str] = mapped_column(String(20), nullable=False)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # Relationships
    location: Mapped[Optional["Location"]] = relationship(
        "Location",
        back_populates="call_intents",
        lazy="joined",
    )

    def __repr__(self) -> str:
        return f"<CallIntent {self.caller_phone} -> {self.hotline_number} [{self.status}]>"
