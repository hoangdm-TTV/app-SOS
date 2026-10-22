import logging
import sys
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.config import settings
from app.database import engine
from app.routers import (
    calls_router,
    locations_router,
    reports_router,
    tickets_router,
)

# Configure structured logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("sos.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager: verify connections on startup and close on shutdown."""
    logger.info(f"Starting {settings.PROJECT_NAME} in '{settings.ENVIRONMENT}' environment...")
    # Verify DB connectivity
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("[Database] Connected successfully to PostgreSQL.")
    except Exception as exc:
        logger.warning(f"[Database] Warning: Could not verify initial DB connection: {exc}")

    yield

    logger.info("Shutting down application and disposing connection pools...")
    await engine.dispose()
    logger.info("Application stopped gracefully.")


# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Production-grade Backend REST API for Company SOS Incident Management System. "
        "Supports 50-200 shuttle buses and 10-30 dormitory buildings with Zalo ZNS instant alerts, "
        "WebRTC emergency call fallback, and BI operations analytics."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration for Frontend Web PWA
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health & Status"], summary="Root system information")
async def root_status() -> dict:
    """Root info endpoint."""
    return {
        "project": settings.PROJECT_NAME,
        "status": "online",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
    }


@app.get(f"{settings.API_V1_STR}/health", tags=["Health & Status"], summary="System healthcheck")
async def health_check() -> dict:
    """Health check endpoint used by Docker, Kubernetes, or Load Balancers."""
    db_status = "healthy"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"unhealthy: {str(exc)}"

    return {
        "status": "ok" if "healthy" in db_status else "degraded",
        "database": db_status,
        "zns_mock_mode": settings.ZALO_ZNS_MOCK_MODE,
        "environment": settings.ENVIRONMENT,
    }


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(f"Unhandled server error at {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Đã xảy ra lỗi máy chủ nội bộ. Vui lòng liên hệ ban quản trị hệ thống.",
            "error_type": type(exc).__name__,
        },
    )


# Register API v1 Routers
app.include_router(locations_router, prefix=settings.API_V1_STR)
app.include_router(tickets_router, prefix=settings.API_V1_STR)
app.include_router(calls_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
