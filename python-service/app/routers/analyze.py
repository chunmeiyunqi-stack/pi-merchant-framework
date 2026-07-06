from __future__ import annotations

from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from ..models import AnalyzeRequest, AnalyzeResponse, BatchAnalyzeRequest
from ..services.analyzer import get_analyzer
from ..services.longcat import longcat
from ..utils.db import get_analysis_by_snippet, get_task

router = APIRouter(tags=["analyze"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_code(req: AnalyzeRequest) -> AnalyzeResponse:
    if not longcat.api_key:
        raise HTTPException(status_code=503, detail="LongCat API key not configured")

    analyzer = get_analyzer()
    result = await analyzer.analyze_single(
        code=req.file.content,
        language=req.file.language,
        source_type="upload",
        file_path=req.file.path,
    )

    from ..models import AnalyzeResult as AR, QualityScore

    return AnalyzeResponse(
        success=True,
        data=AR(
            file_path=req.file.path,
            language=req.file.language,
            scores=QualityScore(
                readability=result["scores"]["readability"],
                performance=result["scores"]["performance"],
                standard=result["scores"]["standard"],
            ),
            suggestions=result["suggestions"],
            strengths=result["strengths"],
        ),
    )


@router.post("/batch-analyze", response_model=Dict[str, Any])
async def batch_analyze_code(req: BatchAnalyzeRequest) -> Dict[str, Any]:
    if not longcat.api_key:
        raise HTTPException(status_code=503, detail="LongCat API key not configured")

    analyzer = get_analyzer()

    snippets = [
        {
            "code": f.code,
            "language": f.language,
            "source_type": "upload",
            "file_path": f.path,
        }
        for f in req.files
    ]

    result = await analyzer.analyze_batch(snippets, concurrency=10)
    return result


@router.post("/analyze-dataset")
async def analyze_dataset(
    language: Optional[str] = None,
    source_type: Optional[str] = None,
    min_lines: Optional[int] = None,
    max_lines: Optional[int] = None,
    limit: int = Query(default=100, le=500),
    task_name: str = "dataset-analysis",
) -> Dict[str, Any]:
    if not longcat.api_key:
        raise HTTPException(status_code=503, detail="LongCat API key not configured")

    analyzer = get_analyzer()
    filters: Dict[str, Any] = {}
    if language:
        filters["language"] = language
    if source_type:
        filters["source_type"] = source_type
    if min_lines is not None:
        filters["min_lines"] = min_lines
    if max_lines is not None:
        filters["max_lines"] = max_lines

    try:
        task_id = await analyzer.analyze_dataset(
            filters=filters, limit=limit, task_name=task_name
        )
        return {"success": True, "task_id": task_id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/statistics")
async def get_statistics() -> Dict[str, Any]:
    analyzer = get_analyzer()
    return analyzer.calculate_statistics()


@router.get("/tasks/{task_id}")
async def get_task_status(task_id: UUID) -> Dict[str, Any]:
    row = get_task(task_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return {
        "id": str(row["id"]),
        "task_name": row["task_name"],
        "total_count": row["total_count"],
        "completed_count": row["completed_count"],
        "failed_count": row["failed_count"],
        "status": row["status"],
        "created_at": row["created_at"].isoformat(),
        "completed_at": row["completed_at"].isoformat() if row["completed_at"] else None,
    }


@router.get("/analyses/{snippet_id}")
async def get_analysis_result(snippet_id: UUID) -> Dict[str, Any]:
    row = get_analysis_by_snippet(snippet_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Analysis not found for this snippet")
    return {
        "id": str(row["id"]),
        "snippet_id": str(row["snippet_id"]),
        "readability_score": float(row["readability_score"]),
        "performance_score": float(row["performance_score"]),
        "standard_score": float(row["standard_score"]),
        "overall_score": float(row["overall_score"]),
        "suggestions": row["suggestions"],
        "strengths": row["strengths"],
        "model_used": row["model_used"],
        "analyzed_at": row["analyzed_at"].isoformat(),
    }
