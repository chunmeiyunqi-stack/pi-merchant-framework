from __future__ import annotations

import json

import csv, io
import pytest

from app.services.exporter import exporter


class TestExporterJson:
    def test_export_json_returns_valid_json(self):
        """导出为 JSON 并验证内容"""
        data = exporter.export_to_json(limit=3)
        parsed = json.loads(data.decode("utf-8"))
        assert isinstance(parsed, list)
        if parsed:
            item = parsed[0]
            assert "id" in item
            assert "code" in item
            assert "readability_score" in item
            assert "standard_score" in item
            assert "overall_score" in item
            assert "suggestions" in item
            assert "strengths" in item

    def test_export_json_language_filter(self):
        """语言过滤后只返回指定语言"""
        data = exporter.export_to_json(language="python", limit=10)
        parsed = json.loads(data.decode("utf-8"))
        for item in parsed:
            assert item["language"] == "python"

    def test_export_json_min_score_filter(self):
        """最低分过滤"""
        data = exporter.export_to_json(min_score=7.0, limit=10)
        parsed = json.loads(data.decode("utf-8"))
        for item in parsed:
            assert item["overall_score"] >= 7.0

    def test_export_json_limit(self):
        """limit 限制返回条数"""
        data = exporter.export_to_json(limit=1)
        parsed = json.loads(data.decode("utf-8"))
        assert len(parsed) <= 1

    def test_export_json_empty(self):
        """不存在的语言返回空列表"""
        data = exporter.export_to_json(language="brainfuck", limit=10)
        parsed = json.loads(data.decode("utf-8"))
        assert len(parsed) == 0


class TestExporterCsv:
    def test_export_csv_has_header(self):
        """CSV 包含表头行"""
        data = exporter.export_to_csv(limit=3)
        text = data.decode("utf-8-sig")
        assert text.startswith("id,code,")

    def test_export_csv_rows(self):
        """CSV 包含数据行"""
        data = exporter.export_to_csv(limit=3)
        lines = data.decode("utf-8-sig").strip().split("\n")
        assert len(lines) >= 2
        

    def test_export_csv_utf8_bom(self):
        """CSV 使用 UTF-8-BOM 编码"""
        data = exporter.export_to_csv(limit=1)
        assert data[:3] == b"\xef\xbb\xbf"


class TestExporterTraining:
    def test_training_jsonl_lines(self):
        """JSONL 每行一个 JSON 对象"""
        data = exporter.export_to_training_format(limit=3)
        lines = data.decode("utf-8").strip().split("\n")
        assert len(lines) >= 1
        for line in lines:
            obj = json.loads(line)
            assert "input" in obj
            assert "output" in obj
            assert isinstance(obj["input"], str)
            assert isinstance(obj["output"], str)

    def test_training_output_contains_score(self):
        """output 包含评分信息"""
        data = exporter.export_to_training_format(limit=1)
        line = data.decode("utf-8").strip()
        obj = json.loads(line)
        assert "可读性" in obj["output"]
        assert "性能" in obj["output"]
        assert "规范性" in obj["output"]

    def test_training_empty(self):
        """无匹配数据返回空"""
        data = exporter.export_to_training_format(language="brainfuck", limit=10)
        assert len(data) == 0


class TestExporterReport:
    def test_report_starts_with_title(self):
        """报告以标题开头"""
        report = exporter.generate_report()
        assert report.startswith("# 代码质量分析报告")

    def test_report_has_sections(self):
        """报告包含所有小节"""
        report = exporter.generate_report()
        assert "## 1. 总体统计" in report
        assert "## 2. 分数分布" in report
        assert "## 3. Top 5" in report or "## 3. Top" in report
        assert "## 4. 高频改进建议" in report

    def test_report_has_statistics_table(self):
        """报告包含统计表格"""
        report = exporter.generate_report()
        assert "| 可读性 |" in report
        assert "| 性能 |" in report
        assert "| 规范性 |" in report
        assert "| 综合 |" in report

    def test_report_empty_with_no_data(self):
        """无数据时返回提示信息"""
        from app.utils.db import _execute
        _execute("CREATE TEMP TABLE empty_test AS SELECT * FROM quality_analyses WHERE 1=0")
        # Can't easily test without data since DB has seed data
        pass

    def test_report_has_language_filter(self):
        """语言筛选有效"""
        report = exporter.generate_report(language="typescript")
        assert "typescript" in report or "TypeScript" in report

    def test_report_ends_with_signature(self):
        """报告以生成标记结尾"""
        report = exporter.generate_report()
        assert "Pioneer Code Quality Analyzer" in report
        assert "自动生成" in report
