import json
import logging
from typing import Any, Dict, Optional
import httpx
from app.config import settings

logger = logging.getLogger("sos.zalo_zns")


def format_vietnamese_phone_for_zns(phone: str) -> str:
    """Normalize Vietnamese phone number to 84xxxxxxxxx format required by Zalo ZNS."""
    clean_digits = "".join(filter(str.isdigit, phone))
    if clean_digits.startswith("84"):
        return clean_digits
    if clean_digits.startswith("0"):
        return "84" + clean_digits[1:]
    return "84" + clean_digits


class ZaloZNSService:
    """Service to send official Zalo Notification Service (ZNS) messages to workers and managers."""

    ZNS_ENDPOINT = "https://business.openapi.zalo.me/message/template"

    def __init__(self) -> None:
        self.mock_mode = settings.ZALO_ZNS_MOCK_MODE
        self.access_token = settings.ZALO_ACCESS_TOKEN
        self.app_id = settings.ZALO_APP_ID

    async def send_zns_message(
        self,
        phone: str,
        template_id: str,
        template_data: Dict[str, Any],
        tracking_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Low-level method to send a template message via Zalo ZNS API or mock simulation."""
        normalized_phone = format_vietnamese_phone_for_zns(phone)

        payload = {
            "phone": normalized_phone,
            "template_id": template_id,
            "template_data": template_data,
        }
        if tracking_id:
            payload["tracking_id"] = tracking_id

        # Mock Mode for development, unit testing, or staging
        if self.mock_mode:
            logger.info(
                f"[MOCK ZNS] Sent to {normalized_phone} (Template: {template_id}) | "
                f"Data: {json.dumps(template_data, ensure_ascii=False)}"
            )
            return {
                "error": 0,
                "message": "Success (Mock Mode)",
                "data": {
                    "msg_id": f"mock_msg_{tracking_id or '0000'}",
                    "sent_to": normalized_phone,
                    "template_id": template_id,
                    "template_data": template_data,
                },
            }

        # Production Mode: Call Zalo Open API
        headers = {
            "Content-Type": "application/json",
            "access_token": self.access_token,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.ZNS_ENDPOINT,
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                res_data = response.json()

                if res_data.get("error") != 0:
                    logger.error(f"[ZNS API Error] Response: {res_data}")
                else:
                    logger.info(f"[ZNS Success] Sent message to {normalized_phone}, msg_id={res_data.get('data', {}).get('msg_id')}")

                return res_data
        except Exception as exc:
            logger.exception(f"[ZNS Exception] Failed sending ZNS to {normalized_phone}: {exc}")
            return {
                "error": -1,
                "message": f"Network error or invalid ZNS response: {str(exc)}",
            }

    async def send_new_ticket_alert(
        self,
        phone: str,
        manager_name: str,
        ticket_id: str,
        location_name: str,
        category: str,
        severity: str,
        description: str,
        created_at_str: str,
    ) -> Dict[str, Any]:
        """Send urgent notification to vehicle/dorm manager when worker submits a new SOS ticket."""
        template_id = settings.ZALO_ZNS_TEMPLATE_NEW_TICKET
        template_data = {
            "manager_name": manager_name,
            "ticket_id": ticket_id,
            "location_name": location_name,
            "category": category,
            "severity": severity,
            "description": description[:100] + ("..." if len(description) > 100 else ""),
            "created_at": created_at_str,
        }
        return await self.send_zns_message(
            phone=phone,
            template_id=template_id,
            template_data=template_data,
            tracking_id=f"new_ticket_{ticket_id}",
        )

    async def send_csat_request(
        self,
        phone: str,
        worker_name: Optional[str],
        ticket_id: str,
        location_name: str,
        csat_url: str,
    ) -> Dict[str, Any]:
        """Send CSAT satisfaction rating request to worker once ticket is marked RESOLVED."""
        template_id = settings.ZALO_ZNS_TEMPLATE_CSAT_REQUEST
        template_data = {
            "customer_name": worker_name or "Quý công nhân viên",
            "ticket_id": ticket_id,
            "location_name": location_name,
            "csat_url": csat_url,
        }
        return await self.send_zns_message(
            phone=phone,
            template_id=template_id,
            template_data=template_data,
            tracking_id=f"csat_req_{ticket_id}",
        )

    async def send_escalation_alert(
        self,
        phone: str,
        recipient_name: str,
        ticket_id: str,
        location_name: str,
        csat_reason: str,
        reopened_at_str: str,
    ) -> Dict[str, Any]:
        """Send escalation alert to operations management when worker submits UNSATISFIED rating."""
        template_id = settings.ZALO_ZNS_TEMPLATE_ESCALATION
        template_data = {
            "recipient_name": recipient_name,
            "ticket_id": ticket_id,
            "location_name": location_name,
            "escalation_reason": csat_reason or "Không đạt yêu cầu xử lý từ công nhân viên",
            "reopened_at": reopened_at_str,
        }
        return await self.send_zns_message(
            phone=phone,
            template_id=template_id,
            template_data=template_data,
            tracking_id=f"escalate_{ticket_id}",
        )


zalo_zns_service = ZaloZNSService()
