import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.config import settings
from app.database import get_db
from app.models.call_intent import CallIntent, CallStatus
from app.models.location import Location
from app.schemas.call_intent import (
    CallIntentCreate,
    CallIntentResponse,
    CallIntentUpdate,
)

router = APIRouter(prefix="/calls", tags=["Fallback Calls & Hotline Intent"])


@router.post(
    "/intent",
    response_model=CallIntentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log fallback telephone call intent (WebRTC fallback)",
)
async def log_call_intent(
    call_in: CallIntentCreate,
    db: AsyncSession = Depends(get_db),
) -> CallIntentResponse:
    """Invoked when WebRTC call connection fails or when worker taps direct telephone emergency hotline.

    Logs caller details, reason, and provides fallback telephone number for immediate dialing.
    """
    hotline = call_in.hotline_number or settings.DEFAULT_HOTLINE

    # Validate location if provided
    if call_in.location_id:
        loc_stmt = select(Location).where(Location.id == call_in.location_id)
        location = await db.scalar(loc_stmt)
        if not location:
            # Still allow fallback call even if location ID is invalid, but log warning
            call_in.location_id = None

    call_intent = CallIntent(
        location_id=call_in.location_id,
        caller_phone=call_in.caller_phone,
        caller_name=call_in.caller_name,
        reason=call_in.reason or "WEBRTC_FAILED",
        status=CallStatus.INITIATED,
        hotline_number=hotline,
        duration_seconds=0,
    )
    db.add(call_intent)
    await db.commit()
    await db.refresh(call_intent)

    # Re-fetch with location relationship
    stmt = (
        select(CallIntent)
        .where(CallIntent.id == call_intent.id)
        .options(selectinload(CallIntent.location))
    )
    call_record = await db.scalar(stmt)
    return CallIntentResponse.model_validate(call_record)


@router.patch(
    "/intent/{call_id}",
    response_model=CallIntentResponse,
    summary="Update fallback call outcome status or duration",
)
async def update_call_intent(
    call_id: uuid.UUID,
    update_in: CallIntentUpdate,
    db: AsyncSession = Depends(get_db),
) -> CallIntentResponse:
    """Updates call duration, status (CONNECTED, MISSED, FAILED) or agent notes."""
    stmt = (
        select(CallIntent)
        .where(CallIntent.id == call_id)
        .options(selectinload(CallIntent.location))
    )
    call_intent = await db.scalar(stmt)

    if not call_intent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bản ghi cuộc gọi dự phòng không tồn tại.",
        )

    if update_in.status is not None:
        call_intent.status = update_in.status
    if update_in.duration_seconds is not None:
        call_intent.duration_seconds = update_in.duration_seconds
    if update_in.note is not None:
        call_intent.note = update_in.note

    await db.commit()
    await db.refresh(call_intent)
    return CallIntentResponse.model_validate(call_intent)


@router.get(
    "/intent",
    response_model=List[CallIntentResponse],
    summary="List fallback call logs",
)
async def list_call_intents(
    caller_phone: Optional[str] = Query(None, description="Lọc theo SĐT người gọi"),
    location_id: Optional[uuid.UUID] = Query(None, description="Lọc theo vị trí"),
    status: Optional[CallStatus] = Query(None, description="Lọc theo trạng thái cuộc gọi"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> List[CallIntentResponse]:
    """Retrieve history of emergency fallback telephone calls."""
    stmt = select(CallIntent).options(selectinload(CallIntent.location))

    if caller_phone:
        stmt = stmt.where(CallIntent.caller_phone.ilike(f"%{caller_phone}%"))
    if location_id:
        stmt = stmt.where(CallIntent.location_id == location_id)
    if status:
        stmt = stmt.where(CallIntent.status == status)

    stmt = stmt.order_by(CallIntent.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [CallIntentResponse.model_validate(c) for c in result.scalars().all()]
