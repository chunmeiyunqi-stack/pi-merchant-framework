from __future__ import annotations

import json
from typing import List, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from ..config import settings
from ..models import AnalyzeResult, QualityScore, CodeFile


ANALYSIS_PROMPT = """你是资深 TypeScript 代码审查专家。请分析以下代码的质量。

代码：
{code}

请从以下维度评分（0-10分）：
1. 可读性：命名规范、注释充分性、结构清晰度
2. 性能：算法效率、内存使用、异步处理
3. 规范性：类型安全、错误处理、代码风格

以严格JSON格式返回：
{{
  "readability": 8,
  "performance": 7,
  "standard": 9,
  "suggestions": ["建议1", "建议2"],
  "strengths": ["优点1", "优点2"]
}}

只返回JSON，不要其他内容。"""


class LongCatService:
    def __init__(self) -> None:
        self.api_key = settings.LONGCAT_API_KEY
        self.base_url = settings.LONGCAT_BASE_URL
        self.model = settings.LONGCAT_MODEL
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=httpx.Timeout(120.0, connect=15.0),
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
            )
        return self._client

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    async def check_connection(self) -> bool:
        """检查LongCat API是否可达"""
        if not self.api_key:
            return False
        try:
            resp = await self.client.get("/models", timeout=10.0)
            return resp.status_code < 500
        except Exception:
            return False

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def analyze_file(self, file: CodeFile) -> AnalyzeResult:
        """调用LongCat API分析单个代码文件"""
        prompt = ANALYSIS_PROMPT.format(
            code=file.content,
        )

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
            "max_tokens": 2048,
        }

        resp = await self.client.post("/chat/completions", json=payload)
        resp.raise_for_status()
        data = resp.json()

        content = data["choices"][0]["message"]["content"]
        return self._parse_response(content, file)

    def _parse_response(self, content: str, file: CodeFile) -> AnalyzeResult:
        """解析LLM返回的JSON结果"""
        cleaned = content.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        cleaned = cleaned.strip()

        result = json.loads(cleaned)

        return AnalyzeResult(
            file_path=file.path,
            language=file.language,
            scores=QualityScore(
                readability=float(result["readability"]),
                performance=float(result["performance"]),
                standard=float(result["standard"]),
            ),
            suggestions=result.get("suggestions", []),
            strengths=result.get("strengths", []),
        )


longcat = LongCatService()
