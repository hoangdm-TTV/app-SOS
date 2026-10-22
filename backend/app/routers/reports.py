from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.database import get_db
from app.models.location import Location, LocationType
from app.models.ticket import CSATRating, Ticket, TicketCategory, TicketSeverity, TicketStatus
from app.models.user import User, UserRole
from app.schemas.report import (
    HotspotItem,
    HourlyDistributionItem,
    LeaderboardItem,
    ReportByHourResponse,
    ReportHotspotsResponse,
    ReportLeaderboardResponse,
    ReportOverviewResponse,
)

router = APIRouter(prefix="/reports", tags=["Business Intelligence & Reports"])


@router.get(
    "/overview",
    response_model=ReportOverviewResponse,
    summary="Get overall incident operations metrics",
)
async def get_report_overview(
    db: AsyncSession = Depends(get_db),
) -> ReportOverviewResponse:
    """Calculates overall metrics: received, resolved, in-progress, reopened, CSAT rate, and SLA compliance."""
    # 1. Ticket status counts
    status_counts_stmt = select(
        func.count(Ticket.id).label("total_tickets"),
        func.count(case((Ticket.status == TicketStatus.RESOLVED, 1))).label("resolved"),
        func.count(case((Ticket.status == TicketStatus.IN_PROGRESS, 1))).label("in_progress"),
        func.count(case((Ticket.status == TicketStatus.REOPENED, 1))).label("reopened"),
        func.count(case((Ticket.status == TicketStatus.CANCELLED, 1))).label("cancelled"),
        func.count(case((Ticket.csat_rating == CSATRating.SATISFIED, 1))).label("csat_satisfied"),
        func.count(case((Ticket.csat_rating == CSATRating.UNSATISFIED, 1))).label("csat_unsatisfied"),
    )
    counts_res = await db.execute(status_counts_stmt)
    row = counts_res.fetchone()

    total_received = row.total_tickets if row else 0
    total_resolved = row.resolved if row else 0
    total_in_progress = row.in_progress if row else 0
    total_reopened = row.reopened if row else 0
    total_cancelled = row.cancelled if row else 0
    satisfied_count = row.csat_satisfied if row else 0
    unsatisfied_count = row.csat_unsatisfied if row else 0

    total_csat = satisfied_count + unsatisfied_count
    satisfaction_rate = round((satisfied_count / total_csat) * 100, 2) if total_csat > 0 else 100.0

    # 2. Average Resolution Time and SLA breaches
    # Fetch resolved tickets to compute precise time in python/db
    resolved_stmt = select(
        Ticket.created_at,
        Ticket.resolved_at,
        Ticket.severity,
    ).where(Ticket.resolved_at.isnot(None))
    resolved_res = await db.execute(resolved_stmt)
    resolved_tickets = resolved_res.all()

    total_duration_minutes = 0.0
    sla_breaches = 0

    for t in resolved_tickets:
        if t.resolved_at and t.created_at:
            duration = (t.resolved_at - t.created_at).total_seconds() / 60.0
            if duration >= 0:
                total_duration_minutes += duration
                sla_threshold = (
                    settings.SLA_HIGH_CRITICAL_MINUTES
                    if t.severity in (TicketSeverity.HIGH, TicketSeverity.CRITICAL)
                    else settings.SLA_STANDARD_MINUTES
                )
                if duration > sla_threshold:
                    sla_breaches += 1

    avg_resolution_time = (
        round(total_duration_minutes / len(resolved_tickets), 1)
        if len(resolved_tickets) > 0
        else 0.0
    )

    resolved_count = len(resolved_tickets)
    sla_compliance_rate = (
        round(((resolved_count - sla_breaches) / resolved_count) * 100, 2)
        if resolved_count > 0
        else 100.0
    )

    return ReportOverviewResponse(
        total_received=total_received,
        total_resolved=total_resolved,
        total_in_progress=total_in_progress,
        total_reopened=total_reopened,
        total_cancelled=total_cancelled,
        satisfied_count=satisfied_count,
        unsatisfied_count=unsatisfied_count,
        satisfaction_rate=satisfaction_rate,
        avg_resolution_time_minutes=avg_resolution_time,
        sla_breach_count=sla_breaches,
        sla_compliance_rate=sla_compliance_rate,
    )


@router.get(
    "/by-hour",
    response_model=ReportByHourResponse,
    summary="Get incident distribution across 24 hours of the day",
)
async def get_report_by_hour(
    db: AsyncSession = Depends(get_db),
) -> ReportByHourResponse:
    """Returns distribution of tickets filed by hour (0 to 23) to optimize shift staffing."""
    # Query ticket counts grouped by extracted hour
    hour_col = func.extract("hour", Ticket.created_at)
    stmt = (
        select(hour_col.label("hr"), func.count(Ticket.id).label("cnt"))
        .group_by(hour_col)
        .order_by(hour_col)
    )
    result = await db.execute(stmt)
    hour_counts: Dict[int, int] = {int(r.hr): int(r.cnt) for r in result.all() if r.hr is not None}

    total_tickets = sum(hour_counts.values())
    peak_hour = None
    max_count = -1

    items: List[HourlyDistributionItem] = []
    for h in range(24):
        c = hour_counts.get(h, 0)
        if c > max_count:
            max_count = c
            peak_hour = h if c > 0 else None

        pct = round((c / total_tickets) * 100, 2) if total_tickets > 0 else 0.0
        items.append(
            HourlyDistributionItem(
                hour=h,
                label=f"{h:02d}:00 - {(h + 1) % 24:02d}:00",
                count=c,
                percentage=pct,
            )
        )

    return ReportByHourResponse(
        total_tickets=total_tickets,
        peak_hour=peak_hour,
        distribution=items,
    )


@router.get(
    "/hotspots",
    response_model=ReportHotspotsResponse,
    summary="Top buses and dormitories with the highest reported incidents",
)
async def get_report_hotspots(
    limit: int = Query(10, ge=1, le=50, description="Top N địa điểm sự cố"),
    type: Optional[LocationType] = Query(None, description="Lọc riêng xe buýt BUS hoặc KTX DORM"),
    db: AsyncSession = Depends(get_db),
) -> ReportHotspotsResponse:
    """Identifies hotspot locations requiring maintenance, security check, or operational review."""
    # Base query grouping by location
    stmt = (
        select(
            Location.id,
            Location.code,
            Location.name_display,
            Location.type,
            func.count(Ticket.id).label("ticket_count"),
            func.count(case((Ticket.severity == TicketSeverity.CRITICAL, 1))).label("critical_count"),
            func.count(case((Ticket.severity == TicketSeverity.HIGH, 1))).label("high_count"),
        )
        .join(Ticket, Ticket.location_id == Location.id)
    )

    if type:
        stmt = stmt.where(Location.type == type)

    stmt = (
        stmt.group_by(Location.id, Location.code, Location.name_display, Location.type)
        .order_by(func.count(Ticket.id).desc())
        .limit(limit)
    )

    result = await db.execute(stmt)
    rows = result.all()

    hotspots: List[HotspotItem] = []
    for r in rows:
        # Determine dominant category for this location
        cat_stmt = (
            select(Ticket.category, func.count(Ticket.id))
            .where(Ticket.location_id == r.id)
            .group_by(Ticket.category)
            .order_by(func.count(Ticket.id).desc())
            .limit(1)
        )
        cat_res = await db.execute(cat_stmt)
        top_cat_row = cat_res.first()
        top_category = top_cat_row[0] if top_cat_row else None

        hotspots.append(
            HotspotItem(
                location_id=r.id,
                code=r.code,
                name_display=r.name_display,
                type=r.type,
                ticket_count=r.ticket_count,
                critical_count=r.critical_count,
                high_count=r.high_count,
                top_category=top_category,
            )
        )

    return ReportHotspotsResponse(
        total_evaluated=len(hotspots),
        hotspots=hotspots,
    )


@router.get(
    "/leaderboard",
    response_model=ReportLeaderboardResponse,
    summary="Operations leaderboard ranking managers and route coordinators",
)
async def get_report_leaderboard(
    db: AsyncSession = Depends(get_db),
) -> ReportLeaderboardResponse:
    """Rank operations managers based on resolution efficiency and worker CSAT satisfaction."""
    # Query managers with managed locations and tickets
    stmt = (
        select(User)
        .where(User.role.in_([UserRole.MANAGER, UserRole.STAFF]))
        .order_by(User.full_name)
    )
    result = await db.execute(stmt)
    managers = result.scalars().all()

    leaderboard_items: List[LeaderboardItem] = []

    for mgr in managers:
        # Managed locations count
        loc_count_stmt = select(func.count(Location.id)).where(Location.manager_id == mgr.id)
        managed_locs = await db.scalar(loc_count_stmt) or 0

        # Tickets assigned to or occurring in managed locations
        ticket_stmt = (
            select(
                func.count(Ticket.id).label("total_tickets"),
                func.count(case((Ticket.status == TicketStatus.RESOLVED, 1))).label("resolved"),
                func.count(case((Ticket.status == TicketStatus.REOPENED, 1))).label("reopened"),
                func.count(case((Ticket.csat_rating == CSATRating.SATISFIED, 1))).label("csat_sat"),
                func.count(case((Ticket.csat_rating == CSATRating.UNSATISFIED, 1))).label("csat_unsat"),
            )
            .join(Location, Ticket.location_id == Location.id)
            .where((Location.manager_id == mgr.id) | (Ticket.assigned_to_id == mgr.id))
        )
        t_res = await db.execute(ticket_stmt)
        t_row = t_res.fetchone()

        total_t = t_row.total_tickets if t_row else 0
        resolved_t = t_row.resolved if t_row else 0
        reopened_t = t_row.reopened if t_row else 0
        sat_t = t_row.csat_sat if t_row else 0
        unsat_t = t_row.csat_unsat if t_row else 0

        total_csat = sat_t + unsat_t
        csat_pct = round((sat_t / total_csat) * 100, 2) if total_csat > 0 else 100.0

        # Calculate average resolution time for this manager
        res_time_stmt = (
            select(Ticket.created_at, Ticket.resolved_at)
            .join(Location, Ticket.location_id == Location.id)
            .where(
                (Location.manager_id == mgr.id) | (Ticket.assigned_to_id == mgr.id),
                Ticket.resolved_at.isnot(None),
            )
        )
        res_times = (await db.execute(res_time_stmt)).all()
        mgr_durations = [
            (t.resolved_at - t.created_at).total_seconds() / 60.0
            for t in res_times
            if t.resolved_at and t.created_at
        ]
        avg_minutes = (
            round(sum(mgr_durations) / len(mgr_durations), 1)
            if len(mgr_durations) > 0
            else 0.0
        )

        leaderboard_items.append(
            LeaderboardItem(
                rank=0,  # Will assign after sorting
                manager_id=mgr.id,
                manager_name=mgr.full_name,
                phone_number=mgr.phone_number,
                managed_locations_count=managed_locs,
                total_assigned_tickets=total_t,
                resolved_tickets=resolved_t,
                reopened_tickets=reopened_t,
                avg_resolution_time_minutes=avg_minutes,
                satisfaction_rate=csat_pct,
            )
        )

    # Sort managers: primary by CSAT satisfaction (desc), secondary by resolved_tickets (desc), tertiary by avg resolution time (asc)
    leaderboard_items.sort(
        key=lambda item: (-item.satisfaction_rate, -item.resolved_tickets, item.avg_resolution_time_minutes)
    )

    for idx, item in enumerate(leaderboard_items, start=1):
        item.rank = idx

    return ReportLeaderboardResponse(
        total_managers=len(leaderboard_items),
        leaderboard=leaderboard_items,
    )
