from __future__ import annotations

import uuid
import pytest

from app.utils.db import (
    _execute,
    init_db,
    insert_snippet,
    get_snippets,
    get_snippet_by_id,
    insert_analysis,
    get_analysis_by_snippet,
    get_analyses,
    create_task,
    update_task_status,
    get_task,
    list_tasks,
)


class TestDatabaseInit:
    def test_init_db(self):
        """验证数据库初始化（表和索引已创建）"""
        init_db()
        rows = _execute("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
        tables = [r["tablename"] for r in (rows or [])]
        assert "code_snippets" in tables
        assert "quality_analyses" in tables
        assert "analysis_tasks" in tables

    def test_indexes_exist(self):
        """验证索引已创建"""
        rows = _execute("SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename='code_snippets'")
        indexes = [r["indexname"] for r in (rows or [])]
        assert "idx_snippets_language" in indexes
        assert "idx_snippets_source_type" in indexes
        assert "idx_snippets_created_at" in indexes


class TestCodeSnippets:
    def test_insert_snippet(self):
        """插入代码片段并返回 UUID"""
        result = insert_snippet(
            code="function add(a: number, b: number): number { return a + b; }",
            language="typescript",
            source_type="manual",
            lines_of_code=1,
            file_path="src/utils/math.ts",
        )
        assert result is not None
        assert "id" in result
        assert uuid.UUID(str(result["id"]))
        # cleanup
        _execute("DELETE FROM code_snippets WHERE id = %s", (result["id"],))

    def test_get_snippets_empty_filter(self):
        """不传过滤条件，返回最近记录"""
        rows = get_snippets(limit=5)
        assert isinstance(rows, list)

    def test_get_snippets_with_language_filter(self, sample_snippet_id):
        """按语言过滤查询"""
        rows = get_snippets(language="typescript", limit=10)
        assert len(rows) >= 1
        for r in rows:
            assert r["language"] == "typescript"

    def test_get_snippets_with_source_type_filter(self, sample_snippet_id):
        """按来源类型过滤"""
        rows = get_snippets(source_type="manual", limit=10)
        assert len(rows) >= 1
        for r in rows:
            assert r["source_type"] == "manual"

    def test_get_snippet_by_id_not_found(self):
        """查询不存在的 ID 返回 None"""
        result = get_snippet_by_id(uuid.uuid4())
        assert result is None

    def test_get_snippet_by_id_found(self, sample_snippet_id):
        """按 ID 精确查询"""
        result = get_snippet_by_id(sample_snippet_id)
        assert result is not None
        assert result["id"] == sample_snippet_id
        assert result["language"] == "typescript"


class TestQualityAnalyses:
    def test_insert_and_get_analysis(self, sample_snippet_id):
        """插入分析结果并查询"""
        result = insert_analysis(
            snippet_id=sample_snippet_id,
            readability_score=8.0,
            performance_score=7.5,
            standard_score=9.0,
            overall_score=8.17,
            suggestions=["Add error handling"],
            strengths=["Clean code structure"],
            model_used="LongCat-2.0",
        )
        assert result is not None
        assert "id" in result

        fetched = get_analysis_by_snippet(sample_snippet_id)
        assert fetched is not None
        assert float(fetched["readability_score"]) == 8.0
        assert float(fetched["performance_score"]) == 7.5
        assert float(fetched["standard_score"]) == 9.0
        assert "Add error handling" in fetched["suggestions"]
        assert "Clean code structure" in fetched["strengths"]

    def test_get_analysis_not_found(self):
        """查询不存在的 snippet 返回 None"""
        result = get_analysis_by_snippet(uuid.uuid4())
        assert result is None

    def test_get_analyses_with_min_score(self, sample_analysis_id):
        """按最低分过滤分析结果"""
        rows = get_analyses(min_overall=8.0)
        assert len(rows) >= 1
        for r in rows:
            assert float(r["overall_score"]) >= 8.0

    def test_get_analyses_pagination(self):
        """分页查询分析结果"""
        all_rows = get_analyses(limit=1, offset=0)
        assert len(all_rows) <= 1


class TestAnalysisTasks:
    def test_create_task(self):
        """创建批量分析任务"""
        result = create_task(task_name="integration-test", total_count=5)
        assert result is not None
        assert "id" in result
        _execute("DELETE FROM analysis_tasks WHERE id = %s", (result["id"],))

    def test_update_task_status_to_running(self, sample_task_id):
        """更新任务状态为 running"""
        result = update_task_status(sample_task_id, "running")
        assert result is not None
        assert result["status"] == "running"

    def test_update_task_status_completed(self, sample_task_id):
        """完成任务并设置计数"""
        result = update_task_status(sample_task_id, "completed", completed_count=8, failed_count=2)
        assert result["status"] == "completed"
        assert result["completed_count"] == 8
        assert result["failed_count"] == 2
        assert result["completed_at"] is not None

    def test_get_task_not_found(self):
        """查询不存在的任务返回 None"""
        result = get_task(uuid.uuid4())
        assert result is None

    def test_get_task_found(self, sample_task_id):
        """按 ID 查询任务"""
        result = get_task(sample_task_id)
        assert result is not None
        assert result["task_name"] == "test-task"
        assert result["total_count"] == 10

    def test_list_tasks_empty_filter(self, sample_task_id):
        """不传过滤条件列出所有任务"""
        tasks = list_tasks(limit=10)
        assert len(tasks) >= 1

    def test_list_tasks_with_status_filter(self, sample_task_id):
        """按状态过滤任务"""
        tasks = list_tasks(status="pending")
        for t in tasks:
            assert t["status"] == "pending"
