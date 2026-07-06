from __future__ import annotations

from fastapi import APIRouter

from ..models import HealthResponse
from ..services.longcat import longcat

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    connected = await longcat.check_connection()
    return HealthResponse(
        status="ok",
        longcat_connected=connected,
    )
