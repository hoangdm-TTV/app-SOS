from app.routers.locations import router as locations_router
from app.routers.tickets import router as tickets_router
from app.routers.calls import router as calls_router
from app.routers.reports import router as reports_router

__all__ = [
    "locations_router",
    "tickets_router",
    "calls_router",
    "reports_router",
]
