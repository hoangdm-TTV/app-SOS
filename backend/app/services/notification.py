import logging
from typing import Optional
from app.config import settings
from app.models.location import Location
from app.models.ticket import Ticket, TicketSeverity
from app.models.user import User
from app.services.zalo_zns import zalo_zns_service

logger = logging.getLogger("sos.notification")


class NotificationService:
    """Dispatches notifications across multiple channels (Zalo ZNS, operations hotline)."""

    @staticmethod
    async def notify_new_ticket_created(
        ticket: Ticket,
        location: Location,
        manager: Optional[User] = None,
    ) -> None:
        """Triggered upon new ticket creation. Notifies location manager & emergency dispatcher."""
        created_at_str = ticket.created_at.strftime("%H:%M %d/%m/%Y")
        loc_name = location.name_display if location else "Không xác định"

        # 1. Notify the designated Vehicle / Dormitory Manager via Zalo ZNS
        target_manager = manager or (location.manager if location else None)
        if target_manager and target_manager.phone_number:
            logger.info(
                f"Sending ZNS new ticket alert to manager {target_manager.full_name} ({target_manager.phone_number})"
            )
            await zalo_zns_service.send_new_ticket_alert(
                phone=target_manager.phone_number,
                manager_name=target_manager.full_name,
                ticket_id=ticket.id,
                location_name=loc_name,
                category=ticket.category.value,
                severity=ticket.severity.value,
                description=ticket.description,
                created_at_str=created_at_str,
            )
        else:
            logger.warning(f"Ticket {ticket.id} location {location.code if location else 'N/A'} has no assigned manager!")

        # 2. If severity is HIGH or CRITICAL, also broadcast alert to centralized dispatch center
        if ticket.severity in (TicketSeverity.HIGH, TicketSeverity.CRITICAL):
            dispatch_phone = settings.ESCALATION_DISPATCH_PHONE
            if dispatch_phone:
                logger.info(f"Escalating HIGH/CRITICAL ticket {ticket.id} to central dispatch {dispatch_phone}")
                await zalo_zns_service.send_new_ticket_alert(
                    phone=dispatch_phone,
                    manager_name="Ban Điều Hành Khẩn Cấp",
                    ticket_id=ticket.id,
                    location_name=f"[KHẨN] {loc_name}",
                    category=ticket.category.value,
                    severity=ticket.severity.value,
                    description=ticket.description,
                    created_at_str=created_at_str,
                )

    @staticmethod
    async def notify_ticket_resolved(ticket: Ticket, location: Location) -> None:
        """Triggered when ticket status is patched to RESOLVED. Sends CSAT feedback link to worker."""
        if not ticket.reporter_phone:
            logger.warning(f"Ticket {ticket.id} has no reporter phone number to send CSAT request.")
            return

        csat_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/csat?ticket_id={ticket.id}"
        loc_name = location.name_display if location else "Xe buýt / KTX"

        logger.info(f"Sending CSAT feedback request for ticket {ticket.id} to worker {ticket.reporter_phone}")
        await zalo_zns_service.send_csat_request(
            phone=ticket.reporter_phone,
            worker_name=ticket.reporter_name,
            ticket_id=ticket.id,
            location_name=loc_name,
            csat_url=csat_url,
        )


notification_service = NotificationService()
