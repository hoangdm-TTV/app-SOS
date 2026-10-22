import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.location import Location
from app.models.ticket import (
    CSATRating,
    Ticket,
    TicketCategory,
    TicketSeverity,
    TicketStatus,
)
from app.schemas.ticket import (
    TicketCreate,
    TicketCSATCreate,
    TicketListResponse,
    TicketResponse,
    TicketStatusUpdate,
)
from app.services.escalation import escalation_service
from app.services.notification import notification_service
from app.utils.ticket_id import generate_ticket_id

router = APIRouter(prefix="/tickets", tags=["SOS Tickets"])


@router.post(
    "",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new SOS ticket (From Web PWA or Dispatcher)",
)
async def create_ticket(
    ticket_in: TicketCreate,
    db: AsyncSession = Depends(get_db),
) -> TicketResponse:
    """Creates a new emergency ticket.

    Automatically generates a formatted ticket ID #TK-YYMM-XXXX, assigns to location,
    and alerts the vehicle/dormitory manager via Zalo ZNS.
    """
    # 1. Verify that location exists
    loc_stmt = (
        select(Location)
        .where(Location.id == ticket_in.location_id)
        .options(selectinload(Location.manager))
    )
    loc_result = await db.execute(loc_stmt)
    location = loc_result.scalar_one_or_none()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Địa điểm xảy ra sự cố không tồn tại.",
        )

    # 2. Generate sequential Ticket ID #TK-YYMM-XXXX
    ticket_id = await generate_ticket_id(db)

    # 3. Create Ticket record
    ticket = Ticket(
        id=ticket_id,
        location_id=ticket_in.location_id,
        category=ticket_in.category,
        severity=ticket_in.severity,
        description=ticket_in.description,
        status=TicketStatus.RECEIVED,
        reporter_phone=ticket_in.reporter_phone,
        reporter_name=ticket_in.reporter_name,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    # Load relationships for clean serialization & notification
    refreshed_ticket = await db.scalar(
        select(Ticket)
        .where(Ticket.id == ticket.id)
        .options(
            selectinload(Ticket.location).selectinload(Location.manager),
            selectinload(Ticket.assigned_to),
            selectinload(Ticket.resolved_by),
        )
    )

    # 4. Trigger Zalo ZNS alert to vehicle/dorm manager and central dispatch
    await notification_service.notify_new_ticket_created(
        ticket=refreshed_ticket,
        location=location,
        manager=location.manager,
    )

    return TicketResponse.model_validate(refreshed_ticket)


@router.get(
    "/{ticket_id}",
    response_model=TicketResponse,
    summary="Get full details of a specific ticket",
)
async def get_ticket(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
) -> TicketResponse:
    """Retrieve ticket details including location, status history, and CSAT feedback."""
    stmt = (
        select(Ticket)
        .where(Ticket.id == ticket_id)
        .options(
            selectinload(Ticket.location).selectinload(Location.manager),
            selectinload(Ticket.assigned_to),
            selectinload(Ticket.resolved_by),
        )
    )
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket với mã '{ticket_id}' không tồn tại.",
        )

    return TicketResponse.model_validate(ticket)


@router.get(
    "",
    response_model=TicketListResponse,
    summary="List tickets with filtering and pagination",
)
async def list_tickets(
    status: Optional[TicketStatus] = Query(None, description="Lọc theo trạng thái ticket"),
    category: Optional[TicketCategory] = Query(None, description="Lọc theo loại sự cố"),
    severity: Optional[TicketSeverity] = Query(None, description="Lọc theo mức độ nghiêm trọng"),
    location_id: Optional[uuid.UUID] = Query(None, description="Lọc theo vị trí xe/KTX"),
    reporter_phone: Optional[str] = Query(None, description="Lọc theo SĐT công nhân"),
    page: int = Query(1, ge=1, description="Số trang (bắt đầu từ 1)"),
    page_size: int = Query(20, ge=1, le=100, description="Kích thước mỗi trang"),
    db: AsyncSession = Depends(get_db),
) -> TicketListResponse:
    """Query tickets with flexible filters for the operations dashboard."""
    base_filter = []
    if status:
        base_filter.append(Ticket.status == status)
    if category:
        base_filter.append(Ticket.category == category)
    if severity:
        base_filter.append(Ticket.severity == severity)
    if location_id:
        base_filter.append(Ticket.location_id == location_id)
    if reporter_phone:
        base_filter.append(Ticket.reporter_phone.ilike(f"%{reporter_phone}%"))

    # Total count query
    count_stmt = select(func.count(Ticket.id)).where(*base_filter)
    total_records = await db.scalar(count_stmt) or 0

    # Paginated data query
    offset = (page - 1) * page_size
    data_stmt = (
        select(Ticket)
        .where(*base_filter)
        .options(
            selectinload(Ticket.location).selectinload(Location.manager),
            selectinload(Ticket.assigned_to),
            selectinload(Ticket.resolved_by),
        )
        .order_by(Ticket.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(data_stmt)
    tickets = result.scalars().all()

    return TicketListResponse(
        items=[TicketResponse.model_validate(t) for t in tickets],
        total=total_records,
        page=page,
        page_size=page_size,
    )


@router.patch(
    "/{ticket_id}/status",
    response_model=TicketResponse,
    summary="Update ticket status (RECEIVED -> IN_PROGRESS -> RESOLVED -> REOPENED)",
)
async def update_ticket_status(
    ticket_id: str,
    status_in: TicketStatusUpdate,
    db: AsyncSession = Depends(get_db),
) -> TicketResponse:
    """Updates ticket lifecycle.

    Special Logic:
    - When marked as RESOLVED, automatically dispatches Zalo ZNS CSAT satisfaction
      rating survey to the reporting worker.
    """
    stmt = (
        select(Ticket)
        .where(Ticket.id == ticket_id)
        .options(
            selectinload(Ticket.location).selectinload(Location.manager),
            selectinload(Ticket.assigned_to),
            selectinload(Ticket.resolved_by),
        )
    )
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket '{ticket_id}' không tồn tại.",
        )

    old_status = ticket.status
    new_status = status_in.status
    ticket.status = new_status
    ticket.updated_at = datetime.now(timezone.utc)

    if status_in.assigned_to_id is not None:
        ticket.assigned_to_id = status_in.assigned_to_id

    # Handle RESOLVED transition
    if new_status == TicketStatus.RESOLVED:
        ticket.resolved_at = datetime.now(timezone.utc)
        if status_in.resolved_note:
            ticket.resolved_note = status_in.resolved_note
        if status_in.resolved_by_id:
            ticket.resolved_by_id = status_in.resolved_by_id

    # Handle manual REOPEN transition
    if new_status == TicketStatus.REOPENED and old_status != TicketStatus.REOPENED:
        ticket.reopened_at = datetime.now(timezone.utc)
        if status_in.resolved_note:
            ticket.reopened_reason = status_in.resolved_note

    await db.commit()
    await db.refresh(ticket)

    # Re-fetch with relationships
    refreshed_ticket = await db.scalar(
        select(Ticket)
        .where(Ticket.id == ticket.id)
        .options(
            selectinload(Ticket.location).selectinload(Location.manager),
            selectinload(Ticket.assigned_to),
            selectinload(Ticket.resolved_by),
        )
    )

    # Trigger CSAT request if newly RESOLVED
    if new_status == TicketStatus.RESOLVED and old_status != TicketStatus.RESOLVED:
        await notification_service.notify_ticket_resolved(
            ticket=refreshed_ticket,
            location=refreshed_ticket.location,
        )

    return TicketResponse.model_validate(refreshed_ticket)


@router.post(
    "/{ticket_id}/csat",
    response_model=TicketResponse,
    summary="Worker submits CSAT satisfaction evaluation",
)
async def submit_ticket_csat(
    ticket_id: str,
    csat_in: TicketCSATCreate,
    db: AsyncSession = Depends(get_db),
) -> TicketResponse:
    """Submits worker satisfaction rating (SATISFIED or UNSATISFIED).

    Special Logic:
    - If rating is UNSATISFIED, ticket status is automatically updated to REOPENED,
      and an urgent escalation alert is sent to operations management via Zalo ZNS.
    """
    stmt = (
        select(Ticket)
        .where(Ticket.id == ticket_id)
        .options(
            selectinload(Ticket.location).selectinload(Location.manager),
            selectinload(Ticket.assigned_to),
            selectinload(Ticket.resolved_by),
        )
    )
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket '{ticket_id}' không tồn tại.",
        )

    now_utc = datetime.now(timezone.utc)
    ticket.csat_rating = csat_in.rating
    ticket.csat_reason = csat_in.reason
    ticket.csat_submitted_at = now_utc
    ticket.updated_at = now_utc

    is_unsatisfied = csat_in.rating == CSATRating.UNSATISFIED

    if is_unsatisfied:
        # Automatically reopen the ticket and record escalation trigger
        ticket.status = TicketStatus.REOPENED
        ticket.reopened_at = now_utc
        ticket.reopened_reason = (
            csat_in.reason or "Công nhân đánh giá Chưa Hài Lòng với kết quả xử lý"
        )

    await db.commit()
    await db.refresh(ticket)

    refreshed_ticket = await db.scalar(
        select(Ticket)
        .where(Ticket.id == ticket.id)
        .options(
            selectinload(Ticket.location).selectinload(Location.manager),
            selectinload(Ticket.assigned_to),
            selectinload(Ticket.resolved_by),
        )
    )

    # Trigger escalation alert if worker was UNSATISFIED
    if is_unsatisfied:
        await escalation_service.notify_manager(
            ticket=refreshed_ticket,
            reason=csat_in.reason or "Công nhân phản ánh Chưa hài lòng với phương án xử lý sự cố.",
        )

    return TicketResponse.model_validate(refreshed_ticket)
