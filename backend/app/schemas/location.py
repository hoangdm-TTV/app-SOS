import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.location import LocationType, LocationStatus
from app.schemas.user import UserShort


class LocationBase(BaseModel):
    type: LocationType
    code: str = Field(..., min_length=2, max_length=64, description="Code ví dụ: BUS-042, DORM-A-201")
    name_display: str = Field(..., min_length=2, max_length=255, description="Tên hiển thị thân thiện")
    status: LocationStatus = LocationStatus.ACTIVE
    metadata_info: Optional[Dict[str, Any]] = Field(default_factory=dict)


class LocationCreate(LocationBase):
    manager_id: Optional[uuid.UUID] = None


class LocationUpdate(BaseModel):
    type: Optional[LocationType] = None
    code: Optional[str] = Field(None, min_length=2, max_length=64)
    name_display: Optional[str] = Field(None, min_length=2, max_length=255)
    manager_id: Optional[uuid.UUID] = None
    status: Optional[LocationStatus] = None
    metadata_info: Optional[Dict[str, Any]] = None


class LocationResponse(LocationBase):
    id: uuid.UUID
    manager_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LocationDetailResponse(LocationResponse):
    """Rich location info returned when worker scans QR code."""
    manager: Optional[UserShort] = None
    hotline_fallback: str = Field(
        default="19006868",
        description="Số hotline khẩn cấp trực tiếp nếu WebRTC cuộc gọi thoại gặp sự cố",
    )
    qr_target_url: Optional[str] = Field(
        None,
        description="Deep link / URL Web PWA tương ứng của location",
    )

    model_config = ConfigDict(from_attributes=True)
