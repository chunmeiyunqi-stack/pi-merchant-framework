from __future__ import annotations

import csv
import io
import json
from typing import Any, Dict, List, Optional

from ..utils.db import _execute


class DataExporter:
    def query_data(
        self,
        language: Optional[str] = None,
        min_score: Optional[float] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        conditions: List[str] = ["qa.id IS NOT NULL"]
        params: List[Any] = []

        if language:
            conditions.append("cs.language = %s")
            params.append(language)
        if min_score is not None:
            conditions.append("qa.overall_score >= %s")
            params.append(min_score)

        where = " AND ".join(conditions)
        params.append(limit)

        rows = _execute(
            f"""
            SELECT
                cs.id,
                cs.code,
                cs.language,
                cs.source_type,
                cs.repo_name,
                cs.file_path,
                cs.lines_of_code,
                cs.created_at as snippet_created_at,
                qa.readability_score,
                qa.performance_score,
                qa.standard_score,
                qa.overall_score,
                qa.suggestions,
                qa.strengths,
                qa.model_used,
                qa.analyzed_at
            FROM quality_analyses qa
            JOIN code_snippets cs ON cs.id = qa.snippet_id
            WHERE {where}
            ORDER BY qa.overall_score DESC
            LIMIT %s
            """,
            tuple(params),
        )
        return rows or []

    def _format_row(self, r: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": str(r["id"]),
            "code": r["code"],
            "language": r["language"],
            "source_type": r["source_type"],
            "repo_name": r.get("repo_name"),
            "file_path": r.get("file_path"),
            "lines_of_code": r["lines_of_code"],
            "readability_score": float(r["readability_score"]),
            "performance_score": float(r["performance_score"]),
            "standard_score": float(r["standard_score"]),
            "overall_score": float(r["overall_score"]),
            "suggestions": r["suggestions"],
            "strengths": r["strengths"],
            "model_used": r["model_used"],
            "analyzed_at": r["analyzed_at"].isoformat() if hasattr(r["analyzed_at"], "isoformat") else str(r["analyzed_at"]),
        }

    def export_to_json(
        self,
        language: Optional[str] = None,
        min_score: Optional[float] = None,
        limit: int = 100,
    ) -> bytes:
        rows = self.query_data(language, min_score, limit)
        data = [self._format_row(r) for r in rows]
        return json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")

    def export_to_csv(
        self,
        language: Optional[str] = None,
        min_score: Optional[float] = None,
        limit: int = 100,
    ) -> bytes:
        rows = self.query_data(language, min_score, limit)
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow([
            "id", "code", "language", "source_type", "repo_name", "file_path",
            "lines_of_code", "readability", "performance", "standard",
            "overall", "suggestions", "strengths", "model_used", "analyzed_at",
        ])
        for r in rows:
            writer.writerow([
                str(r["id"]),
                r["code"],
                r["language"],
                r.get("source_type", ""),
                r.get("repo_name", ""),
                r.get("file_path", ""),
                r["lines_of_code"],
                float(r["readability_score"]),
                float(r["performance_score"]),
                float(r["standard_score"]),
                float(r["overall_score"]),
                "; ".join(r["suggestions"]) if r["suggestions"] else "",
                "; ".join(r["strengths"]) if r["strengths"] else "",
                r["model_used"],
                r["analyzed_at"].isoformat() if hasattr(r["analyzed_at"], "isoformat") else str(r["analyzed_at"]),
            ])
        return buf.getvalue().encode("utf-8-sig")

    def export_to_training_format(
        self,
        language: Optional[str] = None,
        min_score: Optional[float] = None,
        limit: int = 100,
    ) -> bytes:
        rows = self.query_data(language, min_score, limit)
        buf = io.StringIO()
        for r in rows:
            suggestions_text = "；".join(r["suggestions"]) if r["suggestions"] else "无"
            strengths_text = "；".join(r["strengths"]) if r["strengths"] else "无"

            output = (
                f"代码质量评分：\n"
                f"- 可读性：{float(r['readability_score'])}/10\n"
                f"- 性能：{float(r['performance_score'])}/10\n"
                f"- 规范性：{float(r['standard_score'])}/10\n"
                f"- 综合：{float(r['overall_score'])}/10\n\n"
                f"优点：{strengths_text}\n"
                f"改进建议：{suggestions_text}"
            )

            line = json.dumps(
                {"input": r["code"], "output": output},
                ensure_ascii=False,
            )
            buf.write(line + "\n")

        return buf.getvalue().encode("utf-8")

    def generate_report(self, language: Optional[str] = None) -> str:
        rows = self.query_data(language, min_score=None, limit=10000)

        if not rows:
            return "# 代码质量分析报告\n\n暂无数据。"

        total = len(rows)
        lang = rows[0]["language"] if language else "all"

        avg_read = sum(float(r["readability_score"]) for r in rows) / total
        avg_perf = sum(float(r["performance_score"]) for r in rows) / total
        avg_std = sum(float(r["standard_score"]) for r in rows) / total
        avg_all = sum(float(r["overall_score"]) for r in rows) / total

        dist = {"9-10": 0, "7-9": 0, "5-7": 0, "3-5": 0, "0-3": 0}
        for r in rows:
            s = float(r["overall_score"])
            if s >= 9: dist["9-10"] += 1
            elif s >= 7: dist["7-9"] += 1
            elif s >= 5: dist["5-7"] += 1
            elif s >= 3: dist["3-5"] += 1
            else: dist["0-3"] += 1

        top5 = sorted(rows, key=lambda r: float(r["overall_score"]), reverse=True)[:5]

        all_suggestions: List[str] = []
        for r in rows:
            all_suggestions.extend(r["suggestions"])
        suggestion_groups: Dict[str, int] = {}
        for s in all_suggestions:
            key = s.strip().rstrip("。")
            suggestion_groups[key] = suggestion_groups.get(key, 0) + 1
        top_suggestions = sorted(suggestion_groups.items(), key=lambda x: -x[1])[:10]

        lines = [
            f"# 代码质量分析报告",
            f"",
            f"**生成时间：** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
            f"**语言筛选：** {lang}",
            f"**分析样本数：** {total}",
            f"",
            f"---",
            f"",
            f"## 1. 总体统计",
            f"",
            f"| 维度 | 平均分 |",
            f"|------|------:|",
            f"| 可读性 | {avg_read:.2f}/10 |",
            f"| 性能 | {avg_perf:.2f}/10 |",
            f"| 规范性 | {avg_std:.2f}/10 |",
            f"| 综合 | {avg_all:.2f}/10 |",
            f"",
            f"## 2. 分数分布",
            f"",
            f"| 分数区间 | 数量 | 占比 |",
            f"|----------|-----:|-----:|",
        ]
        for bucket, count in sorted(dist.items(), reverse=True):
            pct = count / total * 100
            bar = "█" * int(pct / 5) + "░" * (20 - int(pct / 5))
            lines.append(f"| {bucket} | {count} | {pct:.1f}% {bar} |")

        lines.extend([
            f"",
            f"## 3. Top 5 代码片段",
            f"",
        ])
        for i, r in enumerate(top5, 1):
            fp = r.get("file_path") or f"snippet-{str(r['id'])[:8]}"
            code_snippet = r["code"][:200].replace("\n", "\n    ")
            lines.extend([
                f"### {i}. {fp}",
                f"",
                f"- 语言：{r['language']}",
                f"- 综合评分：{float(r['overall_score']):.2f}/10",
                f"- 行数：{r['lines_of_code']}",
                f"",
                f"```{r['language']}",
                f"    {code_snippet}",
                f"```",
                f"",
            ])

        lines.extend([
            f"## 4. 高频改进建议 TOP 10",
            f"",
        ])
        for suggestion, count in top_suggestions:
            lines.append(f"- **{suggestion}**（出现 {count} 次）")

        lines.extend([
            f"",
            f"---",
            f"",
            f"*报告由 Pioneer Code Quality Analyzer 自动生成*",
        ])

        return "\n".join(lines)


from datetime import datetime, timezone

exporter = DataExporter()
