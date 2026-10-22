import logging
from datetime import datetime, timezone
from app.config import settings
from app.models.ticket import Ticket
from app.services.zalo_zns import zalo_zns_service

logger = logging.getLogger("sos.escalation")


class EscalationService:
    """Manages escalation workflows when workers are unsatisfied or SLA breaches occur."""

    @staticmethod
    async def notify_manager(ticket: Ticket, reason: str) -> None:
        """Escalates an unsatisfied ticket to location manager and top management."""
        reopened_at_str = (
            ticket.reopened_at.strftime("%H:%M %d/%m/%Y")
            if ticket.reopened_at
            else datetime.now(timezone.utc).strftime("%H:%M %d/%m/%Y")
        )
        location_name = ticket.location.name_display if ticket.location else "Vị trí không xác định"

        # 1. Alert the line manager directly assigned to the location
        if ticket.location and ticket.location.manager and ticket.location.manager.phone_number:
            manager = ticket.location.manager
            logger.warning(
                f"[ESCALATION] Alerting direct manager {manager.full_name} ({manager.phone_number}) "
                f"for REOPENED ticket {ticket.id}"
            )
            await zalo_zns_service.send_escalation_alert(
                phone=manager.phone_number,
                recipient_name=manager.full_name,
                ticket_id=ticket.id,
                location_name=location_name,
                csat_reason=reason,
                reopened_at_str=reopened_at_str,
            )

        # 2. Alert Central Operations / Executive Management Phone
        mgmt_phone = settings.ESCALATION_MANAGEMENT_PHONE
        if mgmt_phone:
            logger.warning(
                f"[ESCALATION] Alerting central management {mgmt_phone} for REOPENED ticket {ticket.id}"
            )
            await zalo_zns_service.send_escalation_alert(
                phone=mgmt_phone,
                recipient_name="Ban Giám Đốc & Vận Hành",
                ticket_id=ticket.id,
                location_name=f"[KHIẾU NẠI CSAT] {location_name}",
                csat_reason=reason,
                reopened_at_str=reopened_at_str,
            )


escalation_service = EscalationService()
