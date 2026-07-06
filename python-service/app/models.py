from __future__ import annotations

from pydantic import BaseModel, Field
from typing import List, Optional


class CodeFile(BaseModel):
    """待分析的代码文件"""
    path: str = Field(..., description="文件路径")
    content: str = Field(..., description="文件源代码内容")
    language: str = Field(default="typescript", description="编程语言")


class AnalyzeRequest(BaseModel):
    """单文件分析请求"""
    file: CodeFile


class BatchAnalyzeRequest(BaseModel):
    """批量分析请求"""
    files: List[CodeFile] = Field(..., max_length=50, description="最多50个文件")


class QualityScore(BaseModel):
    """代码质量评分维度 (0-10)"""
    readability: float = Field(..., ge=0, le=10, description="可读性评分 0-10")
    performance: float = Field(..., ge=0, le=10, description="性能评分 0-10")
    standard: float = Field(..., ge=0, le=10, description="规范性评分 0-10")


class AnalyzeResult(BaseModel):
    """单文件分析结果"""
    file_path: str
    language: str
    scores: QualityScore
    suggestions: List[str] = Field(default=[], description="改进建议")
    strengths: List[str] = Field(default=[], description="优点")


class AnalyzeResponse(BaseModel):
    success: bool
    data: AnalyzeResult


class BatchAnalyzeResponse(BaseModel):
    success: bool
    data: List[AnalyzeResult]


class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"
    service: str = "pioneer-quality-analyzer"
    longcat_connected: bool = False
