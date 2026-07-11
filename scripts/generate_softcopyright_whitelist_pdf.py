from __future__ import annotations

import fnmatch
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Sequence, Tuple

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "softcopyright_output"
PDF_PATH = OUT_DIR / "01-源程序鉴别材料(补正版_V1.0.0).pdf"
REPORT_PATH = OUT_DIR / "01-源程序鉴别材料(补正版_V1.0.0)-report.json"

APP_NAME = "先锋人工智能服务框架软件"
VERSION = "V1.0.0"
OWNER = "秦晓望"
NOTICE_ID = "2026R11L1477838"

PAGE_WIDTH, PAGE_HEIGHT = A4
LEFT_MARGIN = RIGHT_MARGIN = TOP_MARGIN = BOTTOM_MARGIN = 2.5 * cm
CONTENT_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN
CONTENT_HEIGHT = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN
LINES_PER_PAGE = 50
TOTAL_PAGES = 60
TOTAL_VISIBLE_LINES = LINES_PER_PAGE * TOTAL_PAGES
HEADER_LINES = 6
CODE_LINES_TARGET = TOTAL_VISIBLE_LINES - HEADER_LINES
LINE_HEIGHT = 14
FONT_SIZE = 10.5

CODE_FONT = "CourierNew"
CN_FONT = "SimSun"

WHITELIST_GROUPS: Sequence[Tuple[str, Sequence[str]]] = (
    (
        "packages/pi-sdk/src/ai-providers",
        (
            "types.ts",
            "factory.ts",
            "base.ts",
            "openai.ts",
            "anthropic.ts",
            "ollama.ts",
            "index.ts",
        ),
    ),
    (
        "packages/pi-sdk/src/tenant",
        (
            "context.ts",
            "prisma-middleware.ts",
            "manager.ts",
            "types.ts",
            "index.ts",
        ),
    ),
    (
        "apps/web/src/app/api/payments",
        (
            "approve/route.ts",
            "complete/route.ts",
            "cancel/route.ts",
        ),
    ),
    (
        "packages/pi-sdk/src/license",
        (
            "validator.ts",
            "manager.ts",
            "types.ts",
            "index.ts",
        ),
    ),
    (
        "packages/pi-sdk/src/usage",
        (
            "tracker.ts",
            "types.ts",
            "index.ts",
        ),
    ),
    (
        "apps/web/src/lib",
        (
            "session.ts",
            "rate-limit.ts",
            "ai-metrics-example.ts",
            "metrics-middleware.ts",
            "metrics.ts",
            "order-utils.ts",
            "pi-client.ts",
            "prisma.ts",
            "swagger.ts",
        ),
    ),
)

BLACKLIST_PATTERNS = (
    "**/next-env.d.ts",
    "**/next.config.js",
    "**/next.config.mjs",
    "**/tsconfig.json",
    "**/package.json",
    "**/*.md",
    "**/prisma/schema.prisma",
    "apps/admin/src/app/**/page.tsx",
    "apps/web/src/app/**/page.tsx",
    "apps/web/src/app/layout.tsx",
    "apps/web/src/app/loading.tsx",
    "apps/web/src/app/error.tsx",
)


def register_fonts() -> None:
    fonts = {
        CODE_FONT: r"C:\WINDOWS\Fonts\cour.ttf",
        CN_FONT: r"C:\WINDOWS\Fonts\simsun.ttc",
    }
    for font_name, font_path in fonts.items():
        if not Path(font_path).exists():
            raise FileNotFoundError(f"Missing font: {font_path}")
        pdfmetrics.registerFont(TTFont(font_name, font_path))


def is_blacklisted(rel_path: str) -> bool:
    for pattern in BLACKLIST_PATTERNS:
        if fnmatch.fnmatch(rel_path, pattern) or fnmatch.fnmatch(rel_path.replace("/", os.sep), pattern):
            return True
    return False


def collect_whitelist_files() -> List[Path]:
    files: List[Path] = []
    for base_rel, preferred in WHITELIST_GROUPS:
        base = ROOT / base_rel
        if not base.exists():
            continue

        preferred_set = {base / rel for rel in preferred}
        seen: set[Path] = set()

        for rel in preferred:
            candidate = base / rel
            if candidate.exists() and candidate.is_file():
                rel_posix = candidate.relative_to(ROOT).as_posix()
                if not is_blacklisted(rel_posix):
                    files.append(candidate)
                    seen.add(candidate)

        extra_files = sorted(
            [
                path
                for path in base.rglob("*")
                if path.is_file()
                and path not in seen
                and path.suffix.lower() in {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}
            ],
            key=lambda p: p.relative_to(ROOT).as_posix(),
        )
        for path in extra_files:
            rel_posix = path.relative_to(ROOT).as_posix()
            if not is_blacklisted(rel_posix):
                files.append(path)

    return files


def redact_text(text: str) -> str:
    text = text.replace("V2.0.0", "V1.0.0")
    text = text.replace("v2.0.0", "v1.0.0")
    text = text.replace("2.0.0", "1.0.0")
    replacements = (
        (re.compile(r"sk-[A-Za-z0-9]+"), "[REDACTED]"),
        (re.compile(r"password:\s*'[^']*'"), "password: '[REDACTED]'"),
        (re.compile(r'DATABASE_URL:\s*"[^\"]*"'), 'DATABASE_URL: "[REDACTED]"'),
        (re.compile(r"DATABASE_URL:\s*'[^']*'"), "DATABASE_URL: '[REDACTED]'"),
        (re.compile(r"PI_API_KEY:\s*'[^']*'"), "PI_API_KEY: '[REDACTED]'"),
        (re.compile(r'PI_API_KEY:\s*"[^"]*"'), 'PI_API_KEY: "[REDACTED]"'),
    )
    result = text
    for pattern, replacement in replacements:
        result = pattern.sub(replacement, result)
    return result


def build_header_lines() -> List[str]:
    return [
        "/*",
        f" * 软件名称：{APP_NAME}（Pioneer AI Service Framework）[简称：Pioneer框架]",
        f" * 版本号：{VERSION}",
        f" * 著作权人：{OWNER}",
        f" * 申请号/流水号：{NOTICE_ID}",
        " */",
    ]


def build_code_lines(files: Sequence[Path]) -> Tuple[List[str], List[dict]]:
    lines: List[str] = []
    metadata: List[dict] = []

    for file_path in files:
        rel = file_path.relative_to(ROOT).as_posix()
        metadata.append({"file": rel, "lines": 0})
        lines.append(f"// --- File: {rel} ---")
        metadata[-1]["lines"] += 1

        content = redact_text(file_path.read_text(encoding="utf-8", errors="ignore"))
        file_lines = content.splitlines()
        if not file_lines:
            file_lines = [""]

        for raw_line in file_lines:
            lines.append(raw_line.rstrip("\r"))
            metadata[-1]["lines"] += 1

        lines.append("")
        metadata[-1]["lines"] += 1

    if len(lines) > CODE_LINES_TARGET:
        head_count = (CODE_LINES_TARGET - 1) // 2
        tail_count = CODE_LINES_TARGET - 1 - head_count
        lines = lines[:head_count] + ["// ... (中间省略) ..."] + lines[-tail_count:]
    elif len(lines) < CODE_LINES_TARGET:
        lines.extend([""] * (CODE_LINES_TARGET - len(lines)))

    return lines, metadata


def split_runs(text: str) -> List[Tuple[str, str]]:
    if not text:
        return []

    runs: List[Tuple[str, List[str]]] = []
    current_font = None
    current_chars: List[str] = []

    for ch in text:
        font = CODE_FONT if ord(ch) < 128 else CN_FONT
        if current_font is None or font == current_font:
            current_font = font
            current_chars.append(ch)
        else:
            runs.append((current_font, "".join(current_chars)))
            current_font = font
            current_chars = [ch]

    if current_chars:
        runs.append((current_font or CODE_FONT, "".join(current_chars)))

    return runs


def fit_text(text: str, max_width: float) -> str:
    ellipsis = "..."
    ellipsis_width = pdfmetrics.stringWidth(ellipsis, CODE_FONT, FONT_SIZE)
    width = 0.0
    out: List[str] = []

    for ch in text:
        font = CODE_FONT if ord(ch) < 128 else CN_FONT
        ch_width = pdfmetrics.stringWidth(ch, font, FONT_SIZE)
        if width + ch_width > max_width:
            if width + ellipsis_width <= max_width:
                out.append(ellipsis)
            break
        out.append(ch)
        width += ch_width

    return "".join(out)


def draw_mixed_line(c: canvas.Canvas, x: float, y: float, line: str, width: float) -> None:
    fitted = fit_text(line, width)
    runs = split_runs(fitted)
    cur_x = x
    for font_name, chunk in runs:
        c.setFont(font_name, FONT_SIZE)
        c.drawString(cur_x, y, chunk)
        cur_x += pdfmetrics.stringWidth(chunk, font_name, FONT_SIZE)


def draw_page(c: canvas.Canvas, page_number: int, page_lines: Sequence[str]) -> None:
    c.setStrokeColorRGB(0.1, 0.1, 0.1)
    c.setFillColorRGB(0.0, 0.0, 0.0)

    c.setFont(CN_FONT, 12)
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 1.15 * cm, APP_NAME)
    c.setLineWidth(0.7)
    c.line(LEFT_MARGIN, PAGE_HEIGHT - 1.55 * cm, PAGE_WIDTH - RIGHT_MARGIN, PAGE_HEIGHT - 1.55 * cm)

    footer_text = f"— 第 {page_number} 页 —"
    c.setFont(CN_FONT, 10.5)
    c.drawCentredString(PAGE_WIDTH / 2, 0.85 * cm, footer_text)
    c.line(LEFT_MARGIN, 1.25 * cm, PAGE_WIDTH - RIGHT_MARGIN, 1.25 * cm)

    start_y = PAGE_HEIGHT - TOP_MARGIN
    for idx, raw_line in enumerate(page_lines):
        y = start_y - idx * LINE_HEIGHT
        line_number = (page_number - 1) * LINES_PER_PAGE + idx + 1
        prefix = f"{line_number:04d} | "
        draw_mixed_line(
            c,
            LEFT_MARGIN,
            y,
            prefix + raw_line,
            CONTENT_WIDTH,
        )


def render_pdf(total_lines: Sequence[str]) -> None:
    c = canvas.Canvas(str(PDF_PATH), pagesize=A4)
    c.setTitle(f"{APP_NAME} - 源程序鉴别材料")
    c.setAuthor(OWNER)
    c.setSubject(f"{APP_NAME} {VERSION}")
    c.setCreator("Codex + reportlab")

    for page_idx in range(TOTAL_PAGES):
        page_lines = total_lines[page_idx * LINES_PER_PAGE : (page_idx + 1) * LINES_PER_PAGE]
        draw_page(c, page_idx + 1, page_lines)
        c.showPage()

    c.save()


def verify_pdf(path: Path, expected_pages: int) -> dict:
    reader = PdfReader(str(path))
    page_count = len(reader.pages)
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    checks = {
        "page_count": page_count,
        "contains_v1": "V1.0.0" in text,
        "contains_v2": "V2.0.0" in text,
        "contains_200": "2.0.0" in text,
        "contains_next_env": "next-env" in text,
        "contains_next_config": "next.config" in text,
        "contains_prisma_middleware": "prisma-middleware" in text,
        "contains_ai_provider_factory": "AIProviderFactory" in text or "factory.ts" in text,
        "contains_approve_route": "approve/route" in text,
    }
    if page_count != expected_pages:
        raise RuntimeError(f"Unexpected page count: {page_count} != {expected_pages}")
    if checks["contains_v2"]:
        raise RuntimeError("Found forbidden version string V2.0.0 in PDF text")
    if checks["contains_200"]:
        raise RuntimeError("Found forbidden version string 2.0.0 in PDF text")
    if checks["contains_next_env"] or checks["contains_next_config"]:
        raise RuntimeError("Found forbidden Next.js config text in PDF text")
    if not checks["contains_v1"]:
        raise RuntimeError("Missing V1.0.0 in PDF text")
    if not checks["contains_prisma_middleware"]:
        raise RuntimeError("Missing prisma-middleware in PDF text")
    if not checks["contains_ai_provider_factory"]:
        raise RuntimeError("Missing AI provider factory reference in PDF text")
    if not checks["contains_approve_route"]:
        raise RuntimeError("Missing payment approve route reference in PDF text")
    return checks


def main() -> None:
    register_fonts()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    files = collect_whitelist_files()
    code_lines, metadata = build_code_lines(files)
    total_lines = build_header_lines() + code_lines

    if len(total_lines) != TOTAL_VISIBLE_LINES:
        raise RuntimeError(
            f"Expected exactly {TOTAL_VISIBLE_LINES} visible lines, got {len(total_lines)}"
        )

    render_pdf(total_lines)
    checks = verify_pdf(PDF_PATH, TOTAL_PAGES)

    report = {
        "output": str(PDF_PATH),
        "files": [path.relative_to(ROOT).as_posix() for path in files],
        "file_count": len(files),
        "code_lines": len(code_lines),
        "visible_lines": len(total_lines),
        "pages": TOTAL_PAGES,
        "checks": checks,
    }
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
