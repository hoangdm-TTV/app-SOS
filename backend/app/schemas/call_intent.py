import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.call_intent import CallStatus
from app.schemas.location import LocationResponse


class CallIntentCreate(BaseModel):
    """Schema for logging fallback telephone call initiation."""
    location_id: Optional[uuid.UUID] = Field(None, description="UUID vị trí nếu có")
    caller_phone: str = Field(..., min_length=9, max_length=20, pattern=r"^[0-9+\-\s]+$", description="SĐT người gọi")
    caller_name: Optional[str] = Field(None, max_length=120, description="Tên người gọi nếu có")
    reason: str = Field(
        default="WEBRTC_FAILED",
        max_length=120,
        description="Lý do chuyển cuộc gọi (WEBRTC_FAILED, DIRECT_HOTLINE, NO_MIC_PERMISSION, NETWORK_TIMEOUT)",
    )
    hotline_number: Optional[str] = Field(
        None,
        description="Số hotline đích (nếu không cung cấp sẽ lấy default từ config)",
    )


class CallIntentUpdate(BaseModel):
    """Schema for updating fallback call status/duration."""
    status: Optional[CallStatus] = None
    duration_seconds: Optional[int] = Field(None, ge=0)
    note: Optional[str] = Field(None, max_length=1000)


class CallIntentResponse(BaseModel):
    id: uuid.UUID
    location_id: Optional[uuid.UUID] = None
    caller_phone: str
    caller_name: Optional[str] = None
    reason: str
    status: CallStatus
    hotline_number: str
    duration_seconds: int
    note: Optional[str] = None
    created_at: datetime
    location: Optional[LocationResponse] = None

    model_config = ConfigDict(from_attributes=True)
