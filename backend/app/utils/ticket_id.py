from datetime import datetime, timezone
import re
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.ticket import Ticket


async def generate_ticket_id(session: AsyncSession) -> str:
    """Generate unique ticket ID with format #TK-YYMM-XXXX (e.g., #TK-2610-0089).

    YYMM: 2-digit Year + 2-digit Month.
    XXXX: 4-digit sequential number incrementing monthly.
    """
    now = datetime.now(timezone.utc)
    yymm = now.strftime("%y%m")
    prefix = f"#TK-{yymm}-"

    # Query the highest ticket ID matching this month's prefix
    stmt = (
        select(Ticket.id)
        .where(Ticket.id.like(f"{prefix}%"))
        .order_by(Ticket.id.desc())
        .limit(1)
    )
    result = await session.execute(stmt)
    latest_id = result.scalar_one_or_none()

    if latest_id:
        # Extract the sequence number from #TK-YYMM-XXXX
        match = re.search(r"#TK-\d{4}-(\d+)", latest_id)
        if match:
            current_num = int(match.group(1))
            next_num = current_num + 1
        else:
            next_num = 1
    else:
        next_num = 1

    return f"{prefix}{next_num:04d}"
