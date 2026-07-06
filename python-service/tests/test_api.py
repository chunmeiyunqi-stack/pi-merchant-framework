from __future__ import annotations

import os
import uuid
from typing import AsyncGenerator, Generator

import httpx
import pytest
import uvicorn
import multiprocessing
import time


BASE_URL = "http://127.0.0.1:8000"


@pytest.fixture(scope="module")
def server() -> Generator[None, None, None]:
    """启动测试服务器"""
    proc = multiprocessing.Process(
        target=uvicorn.run,
        kwargs={
            "app": "app.main:app",
            "host": "127.0.0.1",
            "port": 8000,
            "log_level": "error",
        },
        daemon=True,
    )
    proc.start()
    time.sleep(3)
    yield
    proc.terminate()


@pytest.fixture
def client(server: None) -> httpx.Client:
    return httpx.Client(base_url=BASE_URL, timeout=10.0)


class TestHealthEndpoint:
    def test_health_ok(self, client: httpx.Client):
        r = client.get("/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert data["service"] == "pioneer-quality-analyzer"
        assert data["version"] == "1.0.0"
        assert "longcat_connected" in data


class TestStatisticsEndpoint:
    def test_statistics_returns_data(self, client: httpx.Client):
        r = client.get("/statistics")
        assert r.status_code == 200
        data = r.json()
        assert "totals" in data
        assert "avg_scores" in data
        assert "score_distribution" in data
        assert "top_snippets" in data
        assert "by_language" in data
        assert data["totals"]["snippets"] >= 1

    def test_statistics_avg_scores(self, client: httpx.Client):
        r = client.get("/statistics")
        data = r.json()
        avg = data["avg_scores"]
        assert "avg_readability" in avg
        assert "avg_performance" in avg
        assert "avg_standard" in avg
        assert "avg_overall" in avg


class TestTaskEndpoint:
    def test_get_task_not_found(self, client: httpx.Client):
        r = client.get(f"/tasks/{uuid.uuid4()}")
        assert r.status_code == 404

    def test_get_task_found(self, client: httpx.Client):
        """获取 seed 数据中的任务"""
        from app.utils.db import _execute
        rows = _execute("SELECT id FROM analysis_tasks LIMIT 1")
        if rows:
            task_id = rows[0]["id"]
            r = client.get(f"/tasks/{task_id}")
            assert r.status_code == 200
            data = r.json()
            assert data["id"] == str(task_id)
            assert "task_name" in data
            assert "status" in data


class TestAnalysisEndpoint:
    def test_get_analysis_not_found(self, client: httpx.Client):
        r = client.get(f"/analyses/{uuid.uuid4()}")
        assert r.status_code == 404

    def test_get_analysis_found(self, client: httpx.Client):
        """获取 seed 数据中的分析结果"""
        from app.utils.db import _execute
        rows = _execute("SELECT snippet_id FROM quality_analyses LIMIT 1")
        if rows:
            snippet_id = rows[0]["snippet_id"]
            r = client.get(f"/analyses/{snippet_id}")
            assert r.status_code == 200
            data = r.json()
            assert data["snippet_id"] == str(snippet_id)
            assert "readability_score" in data
            assert "standard_score" in data
            assert "overall_score" in data
            assert "suggestions" in data
            assert "strengths" in data
            assert "model_used" in data


class TestExportEndpoints:
    def test_export_json(self, client: httpx.Client):
        r = client.get("/export/json", params={"limit": 2})
        assert r.status_code == 200
        assert r.headers["content-type"] == "application/json"
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_export_csv(self, client: httpx.Client):
        r = client.get("/export/csv", params={"limit": 2})
        assert r.status_code == 200
        assert "text/csv" in r.headers["content-type"]
        assert len(r.content) > 0

    def test_export_training(self, client: httpx.Client):
        r = client.get("/export/training", params={"limit": 2})
        assert r.status_code == 200
        assert "jsonl" in r.headers["content-type"]
        lines = r.text.strip().split("\n")
        assert len(lines) >= 1
        import json
        json.loads(lines[0])

    def test_export_report(self, client: httpx.Client):
        r = client.get("/export/report")
        assert r.status_code == 200
        assert "text/markdown" in r.headers["content-type"]
        assert r.text.startswith("# 代码质量分析报告")

    def test_export_json_with_min_score(self, client: httpx.Client):
        r = client.get("/export/json", params={"min_score": 7.0, "limit": 10})
        assert r.status_code == 200
        data = r.json()
        for item in data:
            assert item["overall_score"] >= 7.0

    def test_export_json_with_language(self, client: httpx.Client):
        r = client.get("/export/json", params={"language": "typescript", "limit": 10})
        assert r.status_code == 200
        data = r.json()
        for item in data:
            assert item["language"] == "typescript"


class TestAnalyzeEndpointsWithoutKey:
    def test_analyze_returns_503_without_key(self, client: httpx.Client):
        r = client.post("/analyze", json={
            "file": {"path": "test.ts", "content": "const x = 1;", "language": "typescript"}
        })
        assert r.status_code == 503
        assert "API key" in r.json()["detail"]

    def test_batch_analyze_returns_503_without_key(self, client: httpx.Client):
        r = client.post("/batch-analyze", json={
            "files": [
                {"path": "a.ts", "content": "const x = 1;", "language": "typescript"}
            ]
        })
        assert r.status_code == 503
        assert "API key" in r.json()["detail"]

    def test_analyze_dataset_returns_503_without_key(self, client: httpx.Client):
        r = client.post("/analyze-dataset", params={"limit": 5})
        assert r.status_code == 503
        assert "API key" in r.json()["detail"]


class TestHealthResponseModel:
    def test_health_response_fields(self, client: httpx.Client):
        r = client.get("/health")
        data = r.json()
        expected_keys = {"status", "version", "service", "longcat_connected"}
        assert set(data.keys()) == expected_keys
        assert isinstance(data["longcat_connected"], bool)


class TestApiEdgeCases:
    def test_invalid_uuid_returns_422(self, client: httpx.Client):
        r = client.get("/tasks/not-a-uuid")
        assert r.status_code == 422

    def test_export_with_high_limit(self, client: httpx.Client):
        r = client.get("/export/json", params={"limit": 5000})
        assert r.status_code == 200
        # Should not exceed the 10000 max
        data = r.json()
        assert len(data) <= 5000

    def test_nonexistent_route(self, client: httpx.Client):
        r = client.get("/nonexistent")
        assert r.status_code == 404
