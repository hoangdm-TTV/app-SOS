import uuid
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.models.location import LocationType
from app.models.ticket import TicketCategory


class ReportOverviewResponse(BaseModel):
    """Business Intelligence Overview metrics."""
    total_received: int
    total_resolved: int
    total_in_progress: int
    total_reopened: int
    total_cancelled: int
    satisfied_count: int
    unsatisfied_count: int
    satisfaction_rate: float       # Percentage 0.0 - 100.0%
    avg_resolution_time_minutes: float
    sla_breach_count: int
    sla_compliance_rate: float      # Percentage 0.0 - 100.0%

    model_config = ConfigDict(from_attributes=True)


class HourlyDistributionItem(BaseModel):
    hour: int                       # 0 to 23
    label: str                      # "00:00 - 01:00"
    count: int
    percentage: float


class ReportByHourResponse(BaseModel):
    total_tickets: int
    peak_hour: Optional[int]
    distribution: List[HourlyDistributionItem]


class HotspotItem(BaseModel):
    location_id: uuid.UUID
    code: str
    name_display: str
    type: LocationType
    ticket_count: int
    critical_count: int
    high_count: int
    top_category: Optional[TicketCategory] = None


class ReportHotspotsResponse(BaseModel):
    total_evaluated: int
    hotspots: List[HotspotItem]


class LeaderboardItem(BaseModel):
    rank: int
    manager_id: Optional[uuid.UUID]
    manager_name: str
    phone_number: str
    managed_locations_count: int
    total_assigned_tickets: int
    resolved_tickets: int
    reopened_tickets: int
    avg_resolution_time_minutes: float
    satisfaction_rate: float


class ReportLeaderboardResponse(BaseModel):
    total_managers: int
    leaderboard: List[LeaderboardItem]
