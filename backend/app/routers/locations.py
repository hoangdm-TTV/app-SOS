import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.config import settings
from app.database import get_db
from app.models.location import Location, LocationStatus, LocationType
from app.schemas.location import (
    LocationCreate,
    LocationDetailResponse,
    LocationResponse,
    LocationUpdate,
)
from app.utils.qr_generator import generate_qr_bytes

router = APIRouter(prefix="/locations", tags=["Locations (Buses & Dorms)"])


@router.get(
    "/{location_id}",
    response_model=LocationDetailResponse,
    summary="Get location details by UUID (Scanned from QR code)",
)
async def get_location(
    location_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> LocationDetailResponse:
    """Endpoint called immediately when worker scans QR code on bus or dormitory door.

    Returns vehicle/dormitory metadata, line manager contacts, and fallback emergency hotline.
    """
    stmt = (
        select(Location)
        .where(Location.id == location_id)
        .options(selectinload(Location.manager))
    )
    result = await db.execute(stmt)
    location = result.scalar_one_or_none()

    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Địa điểm với mã UUID '{location_id}' không tồn tại trong hệ thống.",
        )

    # Enrich response with hotline and deep link
    qr_target_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/sos?location_id={location.id}"
    response_data = LocationDetailResponse.model_validate(location)
    response_data.hotline_fallback = settings.DEFAULT_HOTLINE
    response_data.qr_target_url = qr_target_url
    return response_data


@router.get(
    "/{location_id}/qr",
    summary="Get printable QR code PNG image for a location",
)
async def get_location_qr_image(
    location_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Returns direct PNG image stream of QR code with printable header and label."""
    stmt = select(Location).where(Location.id == location_id)
    result = await db.execute(stmt)
    location = result.scalar_one_or_none()

    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Địa điểm không tồn tại.",
        )

    target_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/sos?location_id={location.id}"
    footer_label = f"MÃ: {location.code} - {location.name_display[:28]}"
    png_bytes = generate_qr_bytes(
        target_url=target_url,
        header_text=f"SOS - {location.type.value}",
        footer_text=footer_label,
    )
    return Response(content=png_bytes, media_type="image/png")


@router.get(
    "",
    response_model=List[LocationResponse],
    summary="List all locations (Buses & Dormitories)",
)
async def list_locations(
    type: Optional[LocationType] = Query(None, description="Lọc theo loại: BUS hoặc DORM"),
    status: Optional[LocationStatus] = Query(None, description="Lọc theo trạng thái"),
    search: Optional[str] = Query(None, description="Tìm theo mã hoặc tên hiển thị"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
) -> List[LocationResponse]:
    """Retrieve list of bus routes and dormitory rooms."""
    stmt = select(Location)

    if type:
        stmt = stmt.where(Location.type == type)
    if status:
        stmt = stmt.where(Location.status == status)
    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.where(
            (Location.code.ilike(search_pattern)) | (Location.name_display.ilike(search_pattern))
        )

    stmt = stmt.order_by(Location.code.asc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post(
    "",
    response_model=LocationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new location (Bus or Dormitory room)",
)
async def create_location(
    location_in: LocationCreate,
    db: AsyncSession = Depends(get_db),
) -> LocationResponse:
    """Create a new bus or dormitory room entry."""
    # Check duplicate code
    exist_stmt = select(Location).where(Location.code == location_in.code)
    existing = await db.scalar(exist_stmt)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Mã địa điểm '{location_in.code}' đã tồn tại.",
        )

    location = Location(
        type=location_in.type,
        code=location_in.code,
        name_display=location_in.name_display,
        manager_id=location_in.manager_id,
        status=location_in.status,
        metadata_info=location_in.metadata_info or {},
    )
    db.add(location)
    await db.commit()
    await db.refresh(location)
    return LocationResponse.model_validate(location)


@router.patch(
    "/{location_id}",
    response_model=LocationResponse,
    summary="Update location details or assigned manager",
)
async def update_location(
    location_id: uuid.UUID,
    location_in: LocationUpdate,
    db: AsyncSession = Depends(get_db),
) -> LocationResponse:
    """Update location metadata, active status, or assign new manager."""
    stmt = select(Location).where(Location.id == location_id)
    location = await db.scalar(stmt)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Địa điểm không tồn tại.",
        )

    update_data = location_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(location, field, value)

    await db.commit()
    await db.refresh(location)
    return LocationResponse.model_validate(location)
