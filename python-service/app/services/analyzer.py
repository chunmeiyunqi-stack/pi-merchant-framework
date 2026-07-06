from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import psycopg2.extras

from ..models import AnalyzeResult, QualityScore
from ..services.longcat import LongCatService
from ..utils.db import (
    _execute,
    create_task,
    get_snippet_by_id,
    insert_analysis,
    insert_snippet,
    update_task_status,
)


class CodeAnalyzer:
    def __init__(self, longcat_client: LongCatService) -> None:
        self.longcat = longcat_client
        self.semaphore = asyncio.Semaphore(10)

    async def analyze_single(
        self,
        code: str,
        language: str = "typescript",
        source_type: str = "upload",
        repo_name: Optional[str] = None,
        file_path: Optional[str] = None,
        github_stars: Optional[int] = None,
    ) -> Dict[str, Any]:
        """分析单个代码片段，存入数据库，返回完整结果"""
        lines_of_code = len(code.split("\n"))

        snippet = insert_snippet(
            code=code,
            language=language,
            source_type=source_type,
            lines_of_code=lines_of_code,
            repo_name=repo_name,
            file_path=file_path,
            github_stars=github_stars,
        )
        if snippet is None:
            raise RuntimeError("Failed to insert snippet into database")

        snippet_id: uuid.UUID = snippet["id"]

        from ..models import CodeFile

        file = CodeFile(
            path=file_path or f"inline/{snippet_id}",
            content=code,
            language=language,
        )

        result = await self.longcat.analyze_file(file)

        overall = round(
            (result.scores.readability + result.scores.performance + result.scores.standard)
            / 3.0 / 10.0,
            2,
        )
        # 转成 0-10 分制存 DB
        readability_db = round(result.scores.readability , 2)
        performance_db = round(result.scores.performance , 2)
        standard_db = round(result.scores.standard , 2)

        analysis = insert_analysis(
            snippet_id=snippet_id,
            readability_score=readability_db,
            performance_score=performance_db,
            standard_score=standard_db,
            overall_score=overall,
            suggestions=result.suggestions,
            strengths=result.strengths,
            model_used=self.longcat.model,
        )

        return {
            "snippet_id": str(snippet_id),
            "analysis_id": str(analysis["id"]) if analysis else None,
            "scores": {
                "readability": result.scores.readability,
                "performance": result.scores.performance,
                "standard": result.scores.standard,
            },
            "overall": overall,
            "summary": result.summary,
            "suggestions": result.suggestions,
            "analyzed_at": (
                analysis["analyzed_at"].isoformat() if analysis else None
            ),
        }

    async def analyze_batch(
        self,
        snippets: List[Dict[str, Any]],
        concurrency: int = 10,
    ) -> Dict[str, Any]:
        """批量分析，asyncio.gather + semaphore 控制并发"""
        self.semaphore = asyncio.Semaphore(concurrency)

        async def _wrapped(s: Dict[str, Any]) -> Optional[Dict[str, Any]]:
            async with self.semaphore:
                try:
                    return await self.analyze_single(
                        code=s.get("code", ""),
                        language=s.get("language", "typescript"),
                        source_type=s.get("source_type", "upload"),
                        repo_name=s.get("repo_name"),
                        file_path=s.get("file_path"),
                        github_stars=s.get("github_stars"),
                    )
                except Exception as e:
                    return {
                        "error": str(e),
                        "file_path": s.get("file_path", "unknown"),
                    }

        start = datetime.now(timezone.utc)
        results = await asyncio.gather(*[_wrapped(s) for s in snippets])
        elapsed = (datetime.now(timezone.utc) - start).total_seconds()

        successes = [r for r in results if r and "error" not in r]
        failures = [r for r in results if r and "error" in r]

        stats: Dict[str, Any] = {
            "total": len(snippets),
            "success": len(successes),
            "failed": len(failures),
            "elapsed_seconds": round(elapsed, 2),
            "avg_time_per_item": (
                round(elapsed / len(snippets), 2) if snippets else 0
            ),
        }

        if successes:
            avg_read = sum(s["scores"]["readability"] for s in successes) / len(successes)
            avg_perf = sum(s["scores"]["performance"] for s in successes) / len(successes)
            avg_comp = sum(s["scores"]["standard"] for s in successes) / len(successes)
            stats["avg_scores"] = {
                "readability": round(avg_read, 1),
                "performance": round(avg_perf, 1),
                "standard": round(avg_comp, 1),
            }

        return {"stats": stats, "results": successes, "failures": failures}

    async def analyze_dataset(
        self,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 100,
        task_name: str = "dataset-analysis",
    ) -> str:
        """从数据库读取未分析代码，创建后台任务"""
        filters = filters or {}

        conditions: List[str] = []
        params: List[Any] = []

        # 只选还没有分析结果的记录
        conditions.append(
            "s.id NOT IN (SELECT snippet_id FROM quality_analyses)"
        )

        if "language" in filters and filters["language"]:
            conditions.append("s.language = %s")
            params.append(filters["language"])
        if "source_type" in filters and filters["source_type"]:
            conditions.append("s.source_type = %s")
            params.append(filters["source_type"])
        if "min_lines" in filters:
            conditions.append("s.lines_of_code >= %s")
            params.append(filters["min_lines"])
        if "max_lines" in filters:
            conditions.append("s.lines_of_code <= %s")
            params.append(filters["max_lines"])

        where = " AND ".join(conditions)
        sql = f"SELECT s.* FROM code_snippets s WHERE {where} ORDER BY s.created_at ASC LIMIT %s"
        params.append(limit)

        rows = _execute(sql, tuple(params))
        if not rows:
            raise ValueError("No unanalyzed snippets match the given filters")

        task = create_task(task_name=task_name, total_count=len(rows))
        if task is None:
            raise RuntimeError("Failed to create analysis task")

        task_id: uuid.UUID = task["id"]

        update_task_status(task_id, "running")

        async def _background_worker() -> None:
            snippets_data = [
                {
                    "code": r["code"],
                    "language": r["language"],
                    "source_type": r["source_type"],
                    "file_path": r.get("file_path"),
                    "repo_name": r.get("repo_name"),
                    "github_stars": r.get("github_stars"),
                }
                for r in rows
            ]

            batch_result = await self.analyze_batch(snippets_data)

            final_status = "completed" if batch_result["stats"]["failed"] == 0 else "completed"
            update_task_status(
                task_id,
                final_status,
                completed_count=batch_result["stats"]["success"],
                failed_count=batch_result["stats"]["failed"],
            )

        asyncio.ensure_future(_background_worker())
        return str(task_id)

    def calculate_statistics(self) -> Dict[str, Any]:
        """从数据库聚合统计数据"""
        total_snippets = _execute("SELECT COUNT(*) as cnt FROM code_snippets")
        total_analyses = _execute("SELECT COUNT(*) as cnt FROM quality_analyses")
        total_tasks = _execute("SELECT COUNT(*) as cnt FROM analysis_tasks")

        avg_scores = _execute(
            """
            SELECT
                ROUND(AVG(readability_score)::numeric, 2) as avg_readability,
                ROUND(AVG(performance_score)::numeric, 2) as avg_performance,
                ROUND(AVG(standard_score)::numeric, 2) as avg_standard,
                ROUND(AVG(overall_score)::numeric, 2) as avg_overall
            FROM quality_analyses
            """
        )

        distribution = _execute(
            """
            SELECT
                CASE
                    WHEN overall_score >= 9 THEN '9-10'
                    WHEN overall_score >= 7 THEN '7-9'
                    WHEN overall_score >= 5 THEN '5-7'
                    WHEN overall_score >= 3 THEN '3-5'
                    ELSE '0-3'
                END as score_range,
                COUNT(*) as count
            FROM quality_analyses
            GROUP BY score_range
            ORDER BY score_range DESC
            """
        )

        top_snippets = _execute(
            """
            SELECT
                cs.id, cs.file_path, cs.language, cs.lines_of_code,
                qa.overall_score, qa.analyzed_at
            FROM quality_analyses qa
            JOIN code_snippets cs ON cs.id = qa.snippet_id
            ORDER BY qa.overall_score DESC
            LIMIT 10
            """
        )

        by_language = _execute(
            """
            SELECT
                cs.language,
                COUNT(*) as count,
                ROUND(AVG(qa.overall_score)::numeric, 2) as avg_score
            FROM quality_analyses qa
            JOIN code_snippets cs ON cs.id = qa.snippet_id
            GROUP BY cs.language
            ORDER BY count DESC
            """
        )

        return {
            "totals": {
                "snippets": total_snippets[0]["cnt"] if total_snippets else 0,
                "analyses": total_analyses[0]["cnt"] if total_analyses else 0,
                "tasks": total_tasks[0]["cnt"] if total_tasks else 0,
            },
            "avg_scores": avg_scores[0] if avg_scores else {},
            "score_distribution": distribution or [],
            "top_snippets": top_snippets or [],
            "by_language": by_language or [],
        }


_analyzer: Optional[CodeAnalyzer] = None


def get_analyzer(longcat_client: Optional[LongCatService] = None) -> CodeAnalyzer:
    from ..services.longcat import longcat

    global _analyzer
    if _analyzer is None:
        _analyzer = CodeAnalyzer(longcat_client or longcat)
    return _analyzer
