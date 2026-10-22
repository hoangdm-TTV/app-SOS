import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.user import UserRole


class UserBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    phone_number: str = Field(..., min_length=9, max_length=20, pattern=r"^[0-9+\-\s]+$")
    email: Optional[EmailStr] = None
    role: UserRole = UserRole.STAFF
    is_active: bool = True


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=120)
    phone_number: Optional[str] = Field(None, min_length=9, max_length=20, pattern=r"^[0-9+\-\s]+$")
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserShort(BaseModel):
    """Compact user representation for nested relationships."""
    id: uuid.UUID
    full_name: str
    phone_number: str
    role: UserRole

    model_config = ConfigDict(from_attributes=True)
