from typing import List, Union
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application Settings and Configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application
    PROJECT_NAME: str = "SOS Internal Incident Management System"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    SECRET_KEY: str = "default_insecure_secret_key_change_in_production"

    # Frontend
    FRONTEND_BASE_URL: str = "http://localhost:5173"
    CORS_ORIGINS: Union[List[str], str] = ["*"]

    # Hotline Fallback
    DEFAULT_HOTLINE: str = "19006868"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://sos_user:sos_secret_password@localhost:5432/sos_db"
    SYNC_DATABASE_URL: str = "postgresql://sos_user:sos_secret_password@localhost:5432/sos_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Zalo ZNS
    ZALO_ZNS_MOCK_MODE: bool = True
    ZALO_APP_ID: str = ""
    ZALO_APP_SECRET: str = ""
    ZALO_OA_ID: str = ""
    ZALO_ACCESS_TOKEN: str = ""
    ZALO_REFRESH_TOKEN: str = ""
    ZALO_ZNS_TEMPLATE_NEW_TICKET: str = "zns_tpl_new_ticket_alert"
    ZALO_ZNS_TEMPLATE_CSAT_REQUEST: str = "zns_tpl_csat_request"
    ZALO_ZNS_TEMPLATE_ESCALATION: str = "zns_tpl_escalation_alert"

    # Operations & Escalation
    ESCALATION_MANAGEMENT_PHONE: str = "0988888888"
    ESCALATION_DISPATCH_PHONE: str = "0977777777"
    SLA_HIGH_CRITICAL_MINUTES: int = 30
    SLA_STANDARD_MINUTES: int = 120

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]


settings = Settings()
