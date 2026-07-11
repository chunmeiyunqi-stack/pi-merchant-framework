from __future__ import annotations

import json
from xml.sax.saxutils import escape
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Sequence

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.flowables import HRFlowable
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "softcopyright_output"
REPORT_PATH = OUT_DIR / "support-docs-report.json"

APP_NAME = "先锋人工智能服务框架软件"
FULL_NAME = "先锋人工智能服务框架软件（Pioneer AI Service Framework）[简称：Pioneer框架]"
VERSION = "V1.0.0"
OWNER = "秦晓望"
NOTICE_ID = "2026R11L1477838"

MANUAL_PDF = OUT_DIR / "02-用户操作手册(补正版_V1.0.0).pdf"
ORIGINALITY_PDF = OUT_DIR / "03-独创性说明文档(补正版_V1.0.0).pdf"

PAGE_SIZE = A4
PAGE_W, PAGE_H = PAGE_SIZE
MARGIN_L = MARGIN_R = 2.5 * cm
MARGIN_T = 2.35 * cm
MARGIN_B = 2.0 * cm
BODY_W = PAGE_W - MARGIN_L - MARGIN_R
BODY_H = PAGE_H - MARGIN_T - MARGIN_B

FONT_CJK = "SimSun"
FONT_CJK_BOLD = "SimSun-Bold"
FONT_MONO = "CourierNew"
FONT_MONO_BOLD = "CourierNew-Bold"


def register_fonts() -> None:
    font_dir = Path(r"C:\WINDOWS\Fonts")
    fonts = {
        FONT_CJK: font_dir / "simsun.ttc",
        FONT_CJK_BOLD: font_dir / "simsun.ttc",
        FONT_MONO: font_dir / "cour.ttf",
        FONT_MONO_BOLD: font_dir / "courbd.ttf",
    }
    for name, path in fonts.items():
        if not path.exists():
            raise FileNotFoundError(f"Missing font: {path}")
        pdfmetrics.registerFont(TTFont(name, str(path)))


def p(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(text, style)


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="BodyCN",
            parent=styles["Normal"],
            fontName=FONT_CJK,
            fontSize=10.5,
            leading=16,
            textColor=colors.HexColor("#111111"),
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SmallCN",
            parent=styles["Normal"],
            fontName=FONT_CJK,
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#333333"),
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TitleCN",
            parent=styles["Normal"],
            fontName=FONT_CJK_BOLD,
            fontSize=22,
            leading=28,
            alignment=1,
            textColor=colors.HexColor("#111111"),
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CoverSub",
            parent=styles["Normal"],
            fontName=FONT_CJK,
            fontSize=12,
            leading=18,
            alignment=1,
            textColor=colors.HexColor("#444444"),
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionCN",
            parent=styles["Normal"],
            fontName=FONT_CJK_BOLD,
            fontSize=15,
            leading=20,
            textColor=colors.HexColor("#111111"),
            spaceBefore=4,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SubCN",
            parent=styles["Normal"],
            fontName=FONT_CJK_BOLD,
            fontSize=11.5,
            leading=16,
            textColor=colors.HexColor("#111111"),
            spaceBefore=4,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CodeBlock",
            parent=styles["Code"],
            fontName=FONT_MONO,
            fontSize=8.6,
            leading=11,
            textColor=colors.HexColor("#0f172a"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="CodeSmall",
            parent=styles["Code"],
            fontName=FONT_MONO,
            fontSize=7.8,
            leading=10,
            textColor=colors.HexColor("#0f172a"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="Caption",
            parent=styles["Normal"],
            fontName=FONT_CJK,
            fontSize=9.2,
            leading=12,
            alignment=1,
            textColor=colors.HexColor("#444444"),
            spaceBefore=4,
        )
    )
    return styles


def header_footer(canvas, doc, *, footer_mode: str = "number") -> None:
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#222222"))
    canvas.setLineWidth(1)
    canvas.setFont(FONT_CJK, 10.5)
    canvas.drawCentredString(PAGE_W / 2, PAGE_H - 1.25 * cm, APP_NAME)
    canvas.line(MARGIN_L, PAGE_H - 1.62 * cm, PAGE_W - MARGIN_R, PAGE_H - 1.62 * cm)

    if footer_mode == "page":
        footer_text = f"— 第 {doc.page} 页 —"
    else:
        footer_text = str(doc.page)
    canvas.setFont(FONT_CJK, 10)
    canvas.drawCentredString(PAGE_W / 2, 0.9 * cm, footer_text)
    canvas.line(MARGIN_L, 1.3 * cm, PAGE_W - MARGIN_R, 1.3 * cm)
    canvas.restoreState()


def build_doc(path: Path, pages: Sequence[list], footer_mode: str = "number") -> None:
    styles = build_styles()
    doc = BaseDocTemplate(
        str(path),
        pagesize=PAGE_SIZE,
        leftMargin=MARGIN_L,
        rightMargin=MARGIN_R,
        topMargin=MARGIN_T,
        bottomMargin=MARGIN_B,
        title=APP_NAME,
        author=OWNER,
        subject=APP_NAME,
    )
    frame = Frame(MARGIN_L, MARGIN_B, BODY_W, BODY_H, id="body")
    doc.addPageTemplates(
        [
            PageTemplate(
                id="main",
                frames=[frame],
                onPage=lambda canvas, doc: header_footer(canvas, doc, footer_mode=footer_mode),
            )
        ]
    )

    story = []
    for page in pages:
        story.extend(page)
        story.append(PageBreak())
    if story:
        story.pop()
    doc.build(story)


def img_path(name: str) -> Path:
    return ROOT / "screenshots" / name


def ensure_img(path: Path) -> None:
    if not path.exists():
        raise FileNotFoundError(path)


def framed_image(path: Path, width: float, max_height: float) -> Image:
    reader = ImageReader(str(path))
    iw, ih = reader.getSize()
    scale = min(width / iw, max_height / ih)
    img = Image(str(path), width=iw * scale, height=ih * scale)
    img.hAlign = "CENTER"
    return img


def note_box(text: str, styles, bg="#f8fafc") -> Table:
    tbl = Table([[p(text, styles["BodyCN"])]], colWidths=[BODY_W - 6])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(bg)),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#cbd5e1")),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return tbl


def code_box(code: str, styles, title: str | None = None) -> KeepTogether:
    parts = []
    if title:
        parts.append(p(title, styles["SubCN"]))
    code_tbl = Table(
        [[p(escape(code).replace("\n", "<br/>"), styles["CodeSmall"])]],
        colWidths=[BODY_W - 14],
    )
    code_tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ffffff")),
                ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#cbd5e1")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    parts.append(code_tbl)
    return KeepTogether(parts)


def cover_page(styles) -> list:
    return [
        Spacer(1, 1.2 * cm),
        p(f"<font name='{FONT_CJK_BOLD}' size='12'>{FULL_NAME}</font>", styles["CoverSub"]),
        Spacer(1, 0.8 * cm),
        p("用户操作手册", styles["TitleCN"]),
        p("补正版 · V1.0.0", styles["CoverSub"]),
        Spacer(1, 0.9 * cm),
        note_box(
            f"<b>软件名称：</b>{FULL_NAME}<br/>"
            f"<b>版本号：</b>{VERSION}<br/>"
            f"<b>申请人：</b>{OWNER}<br/>"
            f"<b>流水号：</b>{NOTICE_ID}",
            styles,
        ),
        Spacer(1, 0.7 * cm),
        p(
            "本手册围绕登录、控制台、AI 对话、模型切换、流式响应、支付结算、"
            "多租户管理与限流机制展开，重点展示真实系统界面和操作路径。",
            styles["BodyCN"],
        ),
    ]


def overview_page(styles) -> list:
    data = [
        ["核心模块", "说明"],
        ["AI 多路由", "OpenAI / Anthropic / Ollama 统一接入，支持主备切换"],
        ["多租户隔离", "按 merchantId 注入请求上下文并自动约束 Prisma 查询"],
        ["License 授权", "支持签名校验、到期控制与 Feature Gate"],
        ["Pi 支付", "支付审批、完成与取消路由联动订单状态"],
        ["用量统计", "按租户聚合请求、Token、延迟与配额情况"],
    ]
    tbl = Table(data, colWidths=[32 * mm, BODY_W - 32 * mm])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), FONT_CJK_BOLD),
                ("FONTNAME", (0, 1), (-1, -1), FONT_CJK),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("LEADING", (0, 0), (-1, -1), 14),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dbe4f0")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    return [
        p("1. 产品概述", styles["SectionCN"]),
        p(
            "本软件面向 Pi Network 生态商户场景，提供 AI 服务路由、多租户隔离、"
            "License 授权控制、支付编排和用量统计能力。",
            styles["BodyCN"],
        ),
        note_box(
            "手册中的截图均来自实际系统页面，不使用占位图或通用模板图。"
            "截图内容聚焦真实业务流转：登录、控制台、AI 对话、支付和租户管理。",
            styles,
        ),
        Spacer(1, 0.15 * cm),
        tbl,
    ]


def setup_page(styles) -> list:
    code = "pnpm install\npnpm db:migrate\npnpm db:seed\npnpm dev"
    return [
        p("2. 安装与启动", styles["SectionCN"]),
        p(
            "完成依赖安装与环境变量配置后，可通过 pnpm 统一启动前后端。"
            "开发环境建议先检查 PostgreSQL 连接、Pi API Key 和 License Payload 是否可用。",
            styles["BodyCN"],
        ),
        code_box(code, styles, "启动命令"),
        p(
            "运行后，系统会在 Pi Browser 场景下工作。登录成功后可以依次查看控制台、"
            "AI 对话、支付中心、历史记录和账户设置。",
            styles["BodyCN"],
        ),
    ]


def workflow_page(styles) -> list:
    return [
        p("3. 操作流程", styles["SectionCN"]),
        p(
            "推荐的操作路径为：登录系统 -> 检查控制台状态 -> 发起 AI 对话 -> "
            "切换模型 -> 完成支付 -> 查看租户与配额信息。",
            styles["BodyCN"],
        ),
        note_box(
            "补证版手册的重点不是展示 UI 花哨程度，而是证明系统具备完整、可重复的真实业务闭环。",
            styles,
        ),
        p("以下 7 张截图按真实操作链路依次排列。", styles["BodyCN"]),
    ]


def screenshot_page(styles, title: str, file_name: str, caption: str, note: str) -> list:
    path = img_path(file_name)
    ensure_img(path)
    return [
        p(title, styles["SectionCN"]),
        framed_image(path, BODY_W, 13.5 * cm),
        p(caption, styles["Caption"]),
        note_box(note, styles),
    ]


def faq_page(styles) -> list:
    return [
        p("4. 常见问题", styles["SectionCN"]),
        p("Q1. 为什么必须在 Pi Browser 中使用？", styles["SubCN"]),
        p(
            "A1. 支付与身份验证流程依赖 Pi 官方能力，浏览器环境可保证前端交互与授权流程一致。",
            styles["BodyCN"],
        ),
        p("Q2. 为什么要做多租户隔离？", styles["SubCN"]),
        p(
            "A2. 商户数据、额度和配置必须隔离，避免不同租户之间发生数据串扰或配额误判。",
            styles["BodyCN"],
        ),
        p("Q3. 截图为什么保留深色主题？", styles["SubCN"]),
        p(
            "A3. 截图来自真实系统页面，保留当前产品主题和布局有助于证明材料的真实性与一致性。",
            styles["BodyCN"],
        ),
    ]


def closing_page(styles) -> list:
    return [
        p("5. 修订记录", styles["SectionCN"]),
        note_box(
            f"<b>版本：</b>{VERSION}<br/>"
            f"<b>修订日期：</b>2026-07-03<br/>"
            f"<b>本次修订重点：</b>补证材料版本统一、截图真实清晰、页面编号连续、"
            "标题页与页眉保持一致。",
            styles,
        ),
        Spacer(1, 0.4 * cm),
        p(
            "本手册可与源程序鉴别材料、独创性说明文档、材料清单和提交报告一并提交。"
            "若后续需要再次修订，只需替换截图或调整版本号即可。",
            styles["BodyCN"],
        ),
    ]


def originality_cover(styles) -> list:
    return [
        Spacer(1, 1.1 * cm),
        p("独创性说明文档", styles["TitleCN"]),
        p("补正版 · V1.0.0", styles["CoverSub"]),
        Spacer(1, 0.9 * cm),
        note_box(
            f"<b>软件版本：</b>{VERSION}<br/>"
            f"<b>软件名称：</b>{FULL_NAME}<br/>"
            f"<b>申请人：</b>{OWNER}<br/>"
            f"<b>流水号：</b>{NOTICE_ID}",
            styles,
        ),
        Spacer(1, 0.6 * cm),
        p(
            "本说明文档突出 5 个可审查、可复现、可对照源码的核心创新点，"
            "并给出真实代码片段以证明系统并非模板化拼装。",
            styles["BodyCN"],
        ),
    ]


def innovation_summary(styles) -> list:
    data = [
        ["创新点", "实现方式"],
        ["AI 多路由", "统一提供商接口 + 主备切换 + 流式 fallback"],
        ["多租户隔离", "AsyncLocalStorage + Prisma 中间件自动注入 merchantId"],
        ["License 控制", "签名校验 + 授权过期判断 + Feature Gate"],
        ["支付编排", "Approve / Complete / Cancel 三路由协同"],
        ["用量治理", "请求计数、月度统计、配额预警和 webhook flush"],
    ]
    tbl = Table(data, colWidths=[34 * mm, BODY_W - 34 * mm])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), FONT_CJK_BOLD),
                ("FONTNAME", (0, 1), (-1, -1), FONT_CJK),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dbe4f0")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    return [
        p("1. 五大核心创新点", styles["SectionCN"]),
        p(
            "软件的独创性不是单个界面，而是围绕商户业务链路形成的完整框架：授权、隔离、路由、支付与配额。",
            styles["BodyCN"],
        ),
        tbl,
    ]


def code_pages(styles) -> list[list]:
    snippets = [
        (
            "2. AIProviderFactory",
            """export class AIProviderFactory {
  async route(request: AIProviderRequest, requestedProvider?: AIProviderName) {
    const providersToTry: AIProviderName[] = [
      this.primaryProvider,
      ...this.fallbackOrder.filter((name) => name !== this.primaryProvider),
    ];

    for (const providerName of providersToTry) {
      const provider = this.providers.get(providerName);
      if (!provider || !provider.isAvailable()) continue;

      try {
        const response = await provider.chat(request);
        return { ...response, routing: { actual: providerName, fallback: providerName !== this.primaryProvider } };
      } catch (error) {
        // fallback to the next provider
      }
    }
    throw new Error('All AI providers failed');
  }
}""",
        ),
        (
            "3. 多租户上下文",
            """export const runWithTenant = <T>(id: string, fn: () => T): T => {
  return tenantStore!.run(id, fn) as T;
};

export const getTenantId = (): string | undefined => tenantStore?.getStore();""",
        ),
        (
            "4. Prisma 中间件",
            """export function applyTenantMiddleware(prisma: PrismaClient) {
  prisma.$use(async (params: any, next: (params: any) => Promise<unknown>) => {
    const tenantId = getTenantId();
    if (tenantId && params.model && modelsRequiringIsolation.includes(params.model)) {
      params.args = params.args || {};
      params.args.where = { ...params.args.where, merchantId: tenantId };
    }
    return next(params);
  });
}""",
        ),
        (
            "5. 支付审批路由",
            """const piRes = await fetch(`${piApiBase}/v2/payments/${paymentId}/approve`, {
  method: 'POST',
  headers: { Authorization: `Key ${apiKey}` },
});

if (!piRes.ok) {
  const errText = await piRes.text();
  if (!errText.includes('already approved')) {
    return NextResponse.json({ success: false, error: `Pi API Error: ${errText}` }, { status: 502 });
  }
}""",
        ),
        (
            "6. 用量统计",
            """export function checkQuota(
  tenantId: string,
  merchantId: string,
  maxRequestsPerMonth: number
): QuotaStatus {
  const used = monthlyCounters.get(key) ?? 0;
  return {
    remainingRequests: Math.max(0, maxRequestsPerMonth - used),
    isExceeded: maxRequestsPerMonth > 0 && used >= maxRequestsPerMonth,
  };
}""",
        ),
    ]

    pages: list[list] = []
    first = [p("2. 代码片段与实现证据", styles["SectionCN"])]
    for idx, (title, code) in enumerate(snippets[:3], start=1):
        first.append(p(title, styles["SubCN"]))
        first.append(note_box(
            "下面代码片段直接对应仓库中的核心实现逻辑，主要用于证明功能确实来自业务代码而非模板拼装。",
            styles,
            bg="#ffffff",
        ))
        first.append(code_box(code, styles))
        if idx != 3:
            first.append(Spacer(1, 0.2 * cm))
    pages.append(first)

    second = [p("3. 代码片段与实现证据（续）", styles["SectionCN"])]
    for title, code in snippets[3:]:
        second.append(p(title, styles["SubCN"]))
        second.append(code_box(code, styles))
        second.append(Spacer(1, 0.15 * cm))
    pages.append(second)
    return pages


def closing_summary(styles) -> list:
    return [
        p("4. 结论", styles["SectionCN"]),
        note_box(
            "独创性体现在整体架构：授权控制、租户隔离、AI 路由、支付编排、用量治理五条链路彼此联动，"
            "不是单一页面或常规模板可以替代的。",
            styles,
        ),
        Spacer(1, 0.35 * cm),
        p(
            "以上说明可与源程序鉴别材料和用户操作手册一起提交，形成完整、可核验的补证组合。",
            styles["BodyCN"],
        ),
        p(f"软件版本：{VERSION}", styles["SubCN"]),
        p(f"申请人：{OWNER}", styles["SubCN"]),
    ]


def generate_manual(styles) -> None:
    pages = [
        cover_page(styles),
        overview_page(styles),
        setup_page(styles),
        workflow_page(styles),
        screenshot_page(
            styles,
            "4. 登录页",
            "fig_3_1_login.png  # 图3.1：登录页.png",
            "图 3.1  登录页",
            "这是系统首次进入时的真实登录界面，展示 Pi Network 登录入口与页面整体主题。",
        ),
        screenshot_page(
            styles,
            "5. 控制台首页",
            "fig_3_2_dashboard.png # 图3.2：控制台首页.png",
            "图 3.2  控制台首页",
            "首页展示 API 调用、Pi 代币消耗、活跃会话和系统状态，属于真实运营视图。",
        ),
        screenshot_page(
            styles,
            "6. AI 对话界面",
            "fig_3_3_ai_chat.png # 图3.3：AI对话界面.png",
            "图 3.3  AI 对话界面",
            "AI 对话页展示用户提问与模型响应，体现多模型接入与对话式交互能力。",
        ),
        screenshot_page(
            styles,
            "7. 模型选择",
            "fig_3_4_model_select.png  # 图3.4：模型选择.png",
            "图 3.4  模型选择",
            "模型选择页展示可切换的对话模型，体现路由层和前端配置的联动。",
        ),
        screenshot_page(
            styles,
            "8. 流式响应",
            "fig_3_5_streaming.png # 图3.5：流式响应.png",
            "图 3.5  流式响应",
            "流式响应页用于证明系统支持逐段输出和实时返回，符合 AI 场景的实际交互需求。",
        ),
        screenshot_page(
            styles,
            "9. 历史记录列表",
            "fig_3_6_history_list.png# 图3.6：历史记录列表.png",
            "图 3.6  历史记录列表",
            "历史记录页用于查看历史会话，体现数据留痕和可追溯性。",
        ),
        screenshot_page(
            styles,
            "10. 历史记录筛选",
            "fig_3_7_history_filter.png# 图3.7：历史记录筛选.png",
            "图 3.7  历史记录筛选",
            "筛选页展示按模型、时间或状态进行过滤，说明系统具备可操作的管理能力。",
        ),
        screenshot_page(
            styles,
            "11. 支付结算",
            "fig_3_8_payment.png   # 图3.8：支付结算.png",
            "图 3.8  支付结算",
            "支付页展示 Pi 付款发起与金额信息，属于真实业务结算界面。",
        ),
        screenshot_page(
            styles,
            "12. 支付确认",
            "fig_3_9_payment_confirm.png# 图3.9：支付确认.png",
            "图 3.9  支付确认",
            "确认页展示支付前最终核对信息，可作为审批与完成流程的证据。",
        ),
        screenshot_page(
            styles,
            "13. 支付成功",
            "fig_3_10_payment_success.png # 图3.10：支付成功.png",
            "图 3.10  支付成功",
            "支付成功页说明审批和回调链路已经打通，能形成完整闭环。",
        ),
        screenshot_page(
            styles,
            "14. 多租户管理",
            "fig_3_12_tenant.png   # 图3.12：多租户管理.png",
            "图 3.12  多租户管理",
            "多租户页面展示 merchant 级别的配置和状态，体现隔离与管理能力。",
        ),
        faq_page(styles),
        closing_page(styles),
    ]
    build_doc(MANUAL_PDF, pages, footer_mode="page")


def generate_originality(styles) -> None:
    pages = [
        originality_cover(styles),
        innovation_summary(styles),
        *code_pages(styles),
        closing_summary(styles),
    ]
    build_doc(ORIGINALITY_PDF, pages, footer_mode="page")


def verify_pdf(path: Path, min_pages: int, max_pages: int | None = None) -> dict:
    reader = PdfReader(str(path))
    pages = len(reader.pages)
    if pages < min_pages:
        raise RuntimeError(f"{path.name}: page count {pages} is below expected minimum {min_pages}")
    if max_pages is not None and pages > max_pages:
        raise RuntimeError(f"{path.name}: page count {pages} is above expected maximum {max_pages}")
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    return {
        "pages": pages,
        "contains_v1": "V1.0.0" in text,
        "contains_v2": "V2.0.0" in text or "v2.0.0" in text or "2.0.0" in text,
        "contains_next_env": "next-env" in text,
        "contains_next_config": "next.config" in text,
        "contains_redacted": "[REDACTED]" in text,
    }


def main() -> None:
    register_fonts()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    styles = build_styles()
    generate_manual(styles)
    generate_originality(styles)

    report = {
        "manual": str(MANUAL_PDF),
        "originality": str(ORIGINALITY_PDF),
        "manual_check": verify_pdf(MANUAL_PDF, 15, 20),
        "originality_check": verify_pdf(ORIGINALITY_PDF, 3, 5),
    }
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
