# -*- coding: utf-8 -*-
"""
gen-copyright-pdf.py
读取 copyright-source-code.txt 并生成符合中国软件标准的 PDF 文件。
依赖: reportlab (bundled with Codex runtime)
用法: python scripts/gen-copyright-pdf.py
输出: 01-源代码文档-先锋AI服务框架V2.0.0.pdf
"""

import os
import re
import sys
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.colors import black

# ════════════════════════════════════════════════════════════════════════════════

FONT_SIMSUN = 'C:\\Windows\\Fonts\\simsun.ttc'
FONT_COURIER = 'C:\\Windows\\Fonts\\cour.ttf'

pdfmetrics.registerFont(TTFont('SimSun', FONT_SIMSUN, subfontIndex=0))
pdfmetrics.registerFont(TTFont('CourierNew', FONT_COURIER))

# ════════════════════════════════════════════════════════════════════════════════

PAGE_W, PAGE_H = A4  # 595.27 x 841.89 pt
MARGIN_LEFT = 25 * mm
MARGIN_RIGHT = 22 * mm
MARGIN_TOP = 22 * mm
MARGIN_BOTTOM = 18 * mm

CONTENT_WIDTH = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT
CONTENT_HEIGHT = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM

LINES_PER_PAGE = 50
LINE_HEIGHT = CONTENT_HEIGHT / LINES_PER_PAGE

FONT_SIZE_CODE = 10.5   # 五号
FONT_SIZE_HEADER = 9    # 小五
FONT_SIZE_FOOTER = 9    # 小五

HEADER_TEXT = u'\u5148\u950b\u4eba\u5de5\u667a\u80fd\u670d\u52a1\u6846\u67b6\u8f6f\u4ef6 V2.0.0'

INPUT_FILE = 'copyright-source-code.txt'
OUTPUT_FILE = '01-\u6e90\u4ee3\u7801\u6587\u6863-\u5148\u950bAI\u670d\u52a1\u6846\u67b6V2.0.0.pdf'

PAGE_BREAK_MARKER = '--- PAGE BREAK ---'


def draw_header(c, page_num):
    c.saveState()
    c.setFont('SimSun', FONT_SIZE_HEADER)
    c.setFillColor(black)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 12 * mm, HEADER_TEXT)
    c.setStrokeColor(black)
    c.setLineWidth(0.5)
    c.line(MARGIN_LEFT, PAGE_H - 14 * mm, PAGE_W - MARGIN_RIGHT, PAGE_H - 14 * mm)
    c.restoreState()


def draw_footer(c, page_num):
    c.saveState()
    c.setFont('SimSun', FONT_SIZE_FOOTER)
    c.setFillColor(black)
    c.drawCentredString(PAGE_W / 2, 10 * mm, str(page_num))
    c.restoreState()


def draw_code_line(c, text, x, y):
    text = text.replace('\t', '    ')
    c.drawString(x, y, text)


def parse_input(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    raw_pages = content.split(PAGE_BREAK_MARKER)

    pages = []
    for page_content in raw_pages:
        lines = page_content.split('\n')
        while lines and lines[0].strip() == '':
            lines.pop(0)
        while lines and lines[-1].strip() == '':
            lines.pop()
        if lines:
            pages.append(lines)

    return pages


def build_pdf():
    root_dir = os.getcwd()
    input_path = os.path.join(root_dir, INPUT_FILE)
    if not os.path.exists(input_path):
        print(f"[ERROR] Input file not found: {input_path}")
        sys.exit(1)

    pages = parse_input(input_path)
    print(f"[INFO] Parsed {len(pages)} non-empty pages")

    for i, p in enumerate(pages):
        print(f"  Page {i+1}: {len(p)} lines")

    output_path = os.path.join(root_dir, OUTPUT_FILE)
    c = canvas.Canvas(output_path, pagesize=A4)
    c.setTitle(u'\u5148\u950b\u4eba\u5de5\u667a\u80fd\u670d\u52a1\u6846\u67b6\u8f6f\u4ef6 V2.0.0 - \u6e90\u4ee3\u7801')
    c.setAuthor(u'\u79e6\u6653\u671b')

    total_pages = len(pages)

    for page_idx, page_lines in enumerate(pages):
        page_num = page_idx + 1
        print(f"[INFO] Generating page {page_num}/{total_pages} ({len(page_lines)} lines)")

        draw_header(c, page_num)

        c.saveState()
        c.setFont('SimSun', FONT_SIZE_CODE)
        c.setFillColor(black)

        y_start = PAGE_H - MARGIN_TOP - LINE_HEIGHT * 0.25
        x_pos = MARGIN_LEFT

        for line_idx in range(min(len(page_lines), LINES_PER_PAGE)):
            line = page_lines[line_idx]
            y = y_start - line_idx * LINE_HEIGHT
            draw_code_line(c, line, x_pos, y)

        c.restoreState()

        draw_footer(c, page_num)

        if page_num < total_pages:
            c.showPage()

    c.save()
    print(f"\n[SUCCESS] PDF saved: {output_path}")
    print(f"         Total pages: {total_pages}")
    print(f"         Lines per page: {LINES_PER_PAGE}")
    print(f"         Code font: SimSun {FONT_SIZE_CODE}pt")
    print(f"         Header/footer font: SimSun {FONT_SIZE_HEADER}pt")


ROOT_DIR = Path(__file__).resolve().parents[1]
INPUT_FILE = ROOT_DIR / 'copyright-source-code.txt'
OUTPUT_FILE = ROOT_DIR / '01-源代码文档-先锋AI服务框架V2.0.0.pdf'
PAGE_BREAK_MARKER = '--- PAGE BREAK ---'
EXPECTED_TOTAL_PAGES = 60
CHINESE_RE = re.compile(r'[\u4e00-\u9fff]')
CHINESE_FONT_NAME = 'SimSun'
ASCII_FONT_NAME = 'CourierNew'


def _resolve_font_path(candidates):
    for candidate in candidates:
        if os.path.exists(candidate):
            return candidate
    raise FileNotFoundError(f'No font found from candidates: {candidates}')


def register_fonts_v2():
    simsun_path = _resolve_font_path(
        [
            r'C:\Windows\Fonts\simsun.ttc',
            r'C:\Windows\Fonts\simsun.ttf',
            r'C:\Windows\Fonts\msyh.ttc',
        ]
    )
    pdfmetrics.registerFont(TTFont(CHINESE_FONT_NAME, simsun_path, subfontIndex=0))

    courier_path = None
    for candidate in (r'C:\Windows\Fonts\cour.ttf', r'C:\Windows\Fonts\consola.ttf'):
        if os.path.exists(candidate):
            courier_path = candidate
            break
    if courier_path:
        pdfmetrics.registerFont(TTFont(ASCII_FONT_NAME, courier_path))


def parse_input_v2(filepath):
    content = filepath.read_text(encoding='utf-8').replace('\r\n', '\n').replace('\r', '\n')
    pages = []
    for block_index, page_content in enumerate(content.split(PAGE_BREAK_MARKER), start=1):
        lines = page_content.split('\n')
        while lines and lines[0].strip() == '':
            lines.pop(0)
        while lines and lines[-1].strip() == '':
            lines.pop()
        if not lines:
            continue
        if len(lines) != LINES_PER_PAGE:
            raise ValueError(
                f'Page {len(pages) + 1} has {len(lines)} lines, expected {LINES_PER_PAGE}. '
                f'Check block #{block_index}.'
            )
        pages.append(lines)

    if len(pages) != EXPECTED_TOTAL_PAGES:
        raise ValueError(f'Expected {EXPECTED_TOTAL_PAGES} pages, got {len(pages)}.')
    return pages


def _font_for_line(line):
    return CHINESE_FONT_NAME if CHINESE_RE.search(line) else ASCII_FONT_NAME


def draw_header_v2(c):
    c.saveState()
    c.setFont(CHINESE_FONT_NAME, FONT_SIZE_HEADER)
    c.setFillColor(black)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 12 * mm, '先锋人工智能服务框架软件 V2.0.0')
    c.setStrokeColor(black)
    c.setLineWidth(0.5)
    c.line(MARGIN_LEFT, PAGE_H - 14 * mm, PAGE_W - MARGIN_RIGHT, PAGE_H - 14 * mm)
    c.restoreState()


def draw_footer_v2(c, page_num):
    c.saveState()
    c.setFont(CHINESE_FONT_NAME, FONT_SIZE_FOOTER)
    c.setFillColor(black)
    c.drawCentredString(PAGE_W / 2, 10 * mm, f'—第 {page_num} 页 —')
    c.restoreState()


def draw_code_line_v2(c, text, x, y):
    clean = text.replace('\t', '    ')
    c.setFont(_font_for_line(clean), FONT_SIZE_CODE)
    c.drawString(x, y, clean)


def build_pdf_v2():
    if not INPUT_FILE.exists():
        print(f'[ERROR] Input file not found: {INPUT_FILE}')
        sys.exit(1)

    register_fonts_v2()
    pages = parse_input_v2(INPUT_FILE)

    for index, lines in enumerate(pages, start=1):
        print(f'[INFO] Page {index}: {len(lines)} lines')

    c = canvas.Canvas(str(OUTPUT_FILE), pagesize=A4)
    c.setTitle('先锋人工智能服务框架软件 V2.0.0 - 源代码')
    c.setAuthor('秦晓望')

    y_start = PAGE_H - MARGIN_TOP - LINE_HEIGHT * 0.25

    for page_idx, page_lines in enumerate(pages, start=1):
        print(f'[INFO] Generating page {page_idx}/{EXPECTED_TOTAL_PAGES}')
        draw_header_v2(c)
        for line_idx, line in enumerate(page_lines):
            y = y_start - line_idx * LINE_HEIGHT
            draw_code_line_v2(c, line, MARGIN_LEFT, y)
        draw_footer_v2(c, page_idx)
        if page_idx < EXPECTED_TOTAL_PAGES:
            c.showPage()

    c.save()
    print(f'[SUCCESS] PDF saved: {OUTPUT_FILE}')
    print(f'[SUCCESS] Total pages: {EXPECTED_TOTAL_PAGES}, lines/page: {LINES_PER_PAGE}')


if __name__ == '__main__':
    build_pdf_v2()
