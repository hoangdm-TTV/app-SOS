import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.models.ticket import (
    TicketCategory,
    TicketSeverity,
    TicketStatus,
    CSATRating,
)
from app.schemas.location import LocationResponse
from app.schemas.user import UserShort


class TicketCreate(BaseModel):
    """Schema for creating a new SOS ticket via Web PWA or Dispatcher."""
    location_id: uuid.UUID = Field(..., description="UUID của xe buýt hoặc KTX nơi xảy ra sự cố")
    category: TicketCategory = Field(..., description="Phân loại sự cố (Y tế, An ninh, Kỹ thuật...)")
    severity: TicketSeverity = Field(
        default=TicketSeverity.MEDIUM,
        description="Mức độ nghiêm trọng (LOW, MEDIUM, HIGH, CRITICAL)",
    )
    description: str = Field(..., min_length=3, max_length=2000, description="Mô tả chi tiết nội dung sự cố")
    reporter_phone: str = Field(..., min_length=9, max_length=20, pattern=r"^[0-9+\-\s]+$", description="SĐT liên hệ của công nhân")
    reporter_name: Optional[str] = Field(None, max_length=120, description="Họ tên công nhân (nếu có)")


class TicketStatusUpdate(BaseModel):
    """Schema for updating ticket lifecycle status."""
    status: TicketStatus = Field(..., description="Trạng thái mới (RECEIVED, IN_PROGRESS, RESOLVED, REOPENED)")
    resolved_note: Optional[str] = Field(None, max_length=2000, description="Ghi chú kết quả xử lý khi RESOLVED")
    resolved_by_id: Optional[uuid.UUID] = Field(None, description="UUID nhân sự/quản lý đã xử lý")
    assigned_to_id: Optional[uuid.UUID] = Field(None, description="Chỉ định nhân sự giải quyết")


class TicketCSATCreate(BaseModel):
    """Schema for worker satisfaction rating."""
    rating: CSATRating = Field(..., description="SATISFIED (Hài lòng) hoặc UNSATISFIED (Chưa hài lòng)")
    reason: Optional[str] = Field(
        None,
        max_length=1000,
        description="Lý do chi tiết (khuyến khích khi Chưa hài lòng để bộ phận vận hành cải tiến)",
    )

    @model_validator(mode="after")
    def validate_unsatisfied_reason(self) -> "TicketCSATCreate":
        if self.rating == CSATRating.UNSATISFIED and (not self.reason or not self.reason.strip()):
            # Cho phép hoặc cảnh báo, nhưng nếu có reason sẽ escalate rõ ràng hơn
            pass
        return self


class TicketResponse(BaseModel):
    """Full ticket detail response."""
    id: str
    location_id: uuid.UUID
    category: TicketCategory
    severity: TicketSeverity
    description: str
    status: TicketStatus
    reporter_phone: str
    reporter_name: Optional[str] = None
    assigned_to_id: Optional[uuid.UUID] = None
    assigned_to: Optional[UserShort] = None
    resolved_by_id: Optional[uuid.UUID] = None
    resolved_by: Optional[UserShort] = None
    resolved_at: Optional[datetime] = None
    resolved_note: Optional[str] = None
    reopened_at: Optional[datetime] = None
    reopened_reason: Optional[str] = None
    csat_rating: Optional[CSATRating] = None
    csat_reason: Optional[str] = None
    csat_submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    location: Optional[LocationResponse] = None

    model_config = ConfigDict(from_attributes=True)


class TicketListResponse(BaseModel):
    """Paginated ticket list."""
    items: List[TicketResponse]
    total: int
    page: int
    page_size: int
