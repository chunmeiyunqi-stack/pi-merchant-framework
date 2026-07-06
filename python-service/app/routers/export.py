from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import Response, PlainTextResponse

from ..services.exporter import exporter
from ..services.longcat import longcat

router = APIRouter(tags=["export"])


@router.get("/export/json")
async def export_json(
    language: Optional[str] = None,
    min_score: Optional[float] = Query(default=None, ge=0, le=10),
    limit: int = Query(default=100, le=10000),
) -> Response:
    data = exporter.export_to_json(language, min_score, limit)
    return Response(
        content=data,
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename=quality_export.json"
        },
    )


@router.get("/export/csv")
async def export_csv(
    language: Optional[str] = None,
    min_score: Optional[float] = Query(default=None, ge=0, le=10),
    limit: int = Query(default=100, le=10000),
) -> Response:
    data = exporter.export_to_csv(language, min_score, limit)
    return Response(
        content=data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename=quality_export.csv"
        },
    )


@router.get("/export/training")
async def export_training(
    language: Optional[str] = None,
    min_score: Optional[float] = Query(default=None, ge=0, le=10),
    limit: int = Query(default=100, le=10000),
) -> Response:
    data = exporter.export_to_training_format(language, min_score, limit)
    return Response(
        content=data,
        media_type="application/jsonl",
        headers={
            "Content-Disposition": f"attachment; filename=training_data.jsonl"
        },
    )


@router.get("/export/report", response_class=PlainTextResponse)
async def export_report(
    language: Optional[str] = None,
) -> PlainTextResponse:
    report = exporter.generate_report(language)
    return PlainTextResponse(
        content=report,
        media_type="text/markdown",
        headers={
            "Content-Disposition": f"attachment; filename=quality_report.md"
        },
    )
