import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.location import Location
    from app.models.user import User


class TicketCategory(str, enum.Enum):
    SECURITY = "SECURITY"        # An ninh, trộm cắp, gây rối
    MEDICAL = "MEDICAL"          # Y tế, cấp cứu, say nắng, ngất xỉu
    FIRE_SAFETY = "FIRE_SAFETY"  # Cháy nổ, khói, chập điện
    TECHNICAL = "TECHNICAL"      # Hỏng xe giữa đường, điều hòa hỏng, mất điện nước KTX
    CONFLICT = "CONFLICT"        # Mâu thuẫn, xô xát giữa công nhân
    HYGIENE = "HYGIENE"          # Vệ sinh, an toàn thực phẩm, mùi lạ
    OTHER = "OTHER"              # Khác


class TicketSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class TicketStatus(str, enum.Enum):
    RECEIVED = "RECEIVED"        # Mới tiếp nhận
    IN_PROGRESS = "IN_PROGRESS"  # Đang xử lý
    RESOLVED = "RESOLVED"        # Đã xử lý xong
    REOPENED = "REOPENED"        # Mở lại (khi công nhân CSAT Không hài lòng)
    CANCELLED = "CANCELLED"      # Báo nhầm/hủy


class CSATRating(str, enum.Enum):
    SATISFIED = "SATISFIED"        # Hài lòng
    UNSATISFIED = "UNSATISFIED"    # Chưa hài lòng


class Ticket(Base):
    """Incident SOS ticket reported by workers on buses or dormitories."""
    __tablename__ = "tickets"

    # ID format: #TK-YYMM-XXXX (e.g., #TK-2410-0089)
    id: Mapped[str] = mapped_column(String(32), primary_key=True)

    location_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("locations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category: Mapped[TicketCategory] = mapped_column(
        Enum(TicketCategory, name="ticket_category_enum", native_enum=False),
        nullable=False,
        index=True,
    )
    severity: Mapped[TicketSeverity] = mapped_column(
        Enum(TicketSeverity, name="ticket_severity_enum", native_enum=False),
        default=TicketSeverity.MEDIUM,
        nullable=False,
        index=True,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus, name="ticket_status_enum", native_enum=False),
        default=TicketStatus.RECEIVED,
        nullable=False,
        index=True,
    )

    # Worker (reporter) info
    reporter_phone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    reporter_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)

    # Assignment & Resolution
    assigned_to_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    resolved_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Reopening metadata (CSAT Unsatisfied escalation)
    reopened_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reopened_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # CSAT Feedback
    csat_rating: Mapped[Optional[CSATRating]] = mapped_column(
        Enum(CSATRating, name="csat_rating_enum", native_enum=False),
        nullable=True,
        index=True,
    )
    csat_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    csat_submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    location: Mapped["Location"] = relationship("Location", back_populates="tickets", lazy="joined")
    assigned_to: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[assigned_to_id],
        back_populates="assigned_tickets",
        lazy="joined",
    )
    resolved_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[resolved_by_id],
        lazy="joined",
    )

    def __repr__(self) -> str:
        return f"<Ticket {self.id} [{self.category}/{self.severity}] - {self.status}>"
