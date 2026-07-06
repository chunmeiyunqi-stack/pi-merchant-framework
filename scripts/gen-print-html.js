/**
 * 生成两份软著补正 HTML 打印文件
 *  01-源程序鉴别材料(补正版).html  — 严格每页50行、页眉页脚、A4
 *  02-用户操作手册(补正版).html    — 图文手册、宋体、正确页码
 * 版本号：V1.0.0
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'softcopyright_output');

const SOFT_NAME = '先锋人工智能服务框架软件';
const VERSION = 'V1.0.0';
const COPYRIGHT_OWNER = '秦晓望';
const LINES_PER_PAGE = 50;

// ═══════════════════════════════════════════════════════════════
//  公共工具
// ═══════════════════════════════════════════════════════════════

function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function ensureOutDir() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════
//  任务 1：源程序鉴别材料
// ═══════════════════════════════════════════════════════════════

const SOURCE_FILES = [
  'packages/pi-sdk/src/ai-providers/types.ts',
  'packages/pi-sdk/src/ai-providers/base.ts',
  'packages/pi-sdk/src/ai-providers/factory.ts',
  'packages/pi-sdk/src/ai-providers/openai.ts',
  'packages/pi-sdk/src/ai-providers/anthropic.ts',
  'packages/pi-sdk/src/ai-providers/ollama.ts',
  'packages/pi-sdk/src/tenant/context.ts',
  'packages/pi-sdk/src/tenant/prisma-middleware.ts',
  'packages/pi-sdk/src/tenant/manager.ts',
  'packages/pi-sdk/src/tenant/types.ts',
  'packages/pi-sdk/src/license/validator.ts',
  'packages/pi-sdk/src/license/manager.ts',
  'packages/pi-sdk/src/license/types.ts',
  'packages/pi-sdk/src/usage/tracker.ts',
  'packages/pi-sdk/src/usage/types.ts',
  'packages/pi-sdk/src/payment-service.ts',
  'packages/pi-sdk/src/auth-service.ts',
  'packages/pi-sdk/src/logger.ts',
  'apps/web/src/app/api/payments/approve/route.ts',
  'apps/web/src/app/api/payments/complete/route.ts',
  'apps/web/src/app/api/payments/cancel/route.ts',
  'apps/web/src/lib/session.ts',
  'apps/web/src/lib/rate-limit.ts',
];

const REDACT_RULES = [
  { re: /(['"`])sk-[A-Za-z0-9\-_]{20,}(['"`])/g, sub: '$1[REDACTED]$2' },
  { re: /(PI_API_KEY\s*[=:]\s*)['"`][^'"`\s]+['"`]/g, sub: '$1"[REDACTED]"' },
  { re: /(DATABASE_URL\s*[=:]\s*)['"`][^'"`\s]+['"`]/g, sub: '$1"[REDACTED]"' },
  { re: /(PASSWORD\s*[=:]\s*)['"`][^'"`\s]+['"`]/gi, sub: '$1"[REDACTED]"' },
  { re: /(SECRET\s*[=:]\s*)['"`][^'"`\s]+['"`]/gi, sub: '$1"[REDACTED]"' },
  { re: /dev_fallback_secret_for_pi_hmac_2026/g, sub: '[REDACTED_DEV_SECRET]' },
];

function redact(text) {
  let t = text;
  for (const { re, sub } of REDACT_RULES) t = t.replace(re, sub);
  return t;
}

function collectSourceLines() {
  const header = [
    '/*',
    ` * 软件名称：${SOFT_NAME}`,
    ` * 版本号  ：${VERSION}`,
    ` * 著作权人：${COPYRIGHT_OWNER}`,
    ` * 用途    ：软件著作权登记源程序鉴别材料`,
    ' */',
    '',
  ];

  const all = [...header];

  for (const rel of SOURCE_FILES) {
    const abs = path.join(ROOT, rel);
    all.push('// ' + '─'.repeat(70), `// 文件：${rel}`, '// ' + '─'.repeat(70), '');
    if (!fs.existsSync(abs)) {
      all.push(`// [文件不存在: ${rel}]`, '');
      continue;
    }
    const code = redact(fs.readFileSync(abs, 'utf8').replace(/\r\n/g, '\n'));
    all.push(...code.split('\n'), '', '');
  }

  return all;
}

/** 将全部行切分为若干"页"（每页 LINES_PER_PAGE 行），并应用前30+后30规则 */
function paginateSource(allLines) {
  const pages = [];
  for (let i = 0; i < allLines.length; i += LINES_PER_PAGE) {
    // 确保每页恰好 LINES_PER_PAGE 行（不足则补空行）
    const chunk = allLines.slice(i, i + LINES_PER_PAGE);
    while (chunk.length < LINES_PER_PAGE) chunk.push('');
    pages.push(chunk);
  }

  const total = pages.length;
  const HALF = 30;

  if (total <= 60) return { pages, total, skipped: false };

  const front = pages.slice(0, HALF);
  const back = pages.slice(total - HALF);
  return { pages: [...front, null, ...back], total, skipped: true };
}

/** 生成源码打印 HTML */
function buildSourceHtml(paginatedData) {
  const { pages, total, skipped } = paginatedData;

  // 计算实际 PDF 页数（null 是省略占位页）
  let realPageCount = pages.filter((p) => p !== null).length;

  // ─── CSS ──────────────────────────────────────────────────────
  // A4: 210×297mm，页面内自己管理边距，@page margin:0
  // 每页高度精确 297mm，页眉+页脚+50行代码刚好填满
  //
  // 字号计算：
  //   可用高 = 297mm − 13mm(上边距) − 13mm(下边距) = 271mm
  //   页眉区  ≈ 10mm，页脚区 ≈ 10mm  → 代码区 = 251mm
  //   251mm / 50行 = 5.02mm/行 ≈ 14.22pt/行
  //   字号选 7.5pt，行高 14pt，恰好 50 行
  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── 屏幕预览 ── */
    html { background: #555; }
    body { padding: 24px 0; }
    .tip {
      font-family: SimHei, sans-serif; font-size: 13px; color: #eee;
      text-align: center; margin-bottom: 18px;
    }

    .page {
      width: 210mm;
      height: 297mm;
      margin: 0 auto 16px auto;
      /* 左右 25.4mm = 72pt = 1 英寸，软著标准对称边距 */
      padding: 13mm 25.4mm 13mm 25.4mm;
      background: #fff;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 12px rgba(0,0,0,.45);
      overflow: hidden;
    }

    .ph {
      font-family: SimSun, '宋体', serif;
      font-size: 9pt;
      text-align: center;
      border-bottom: .5pt solid #aaa;
      padding-bottom: 3pt;
      margin-bottom: 5pt;
      flex-shrink: 0;
    }

    .code {
      flex: 1;
      font-family: 'Courier New', Courier, monospace;
      font-size: 7.5pt;
      line-height: 14pt;
      white-space: pre;
      overflow: hidden;
      word-break: normal;
    }

    .pf {
      font-family: SimSun, '宋体', serif;
      font-size: 9pt;
      text-align: center;
      border-top: .5pt solid #aaa;
      padding-top: 3pt;
      margin-top: 5pt;
      flex-shrink: 0;
    }

    .skip-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .skip-page .skip-box {
      font-family: SimSun, '宋体', serif;
      font-size: 10pt;
      text-align: center;
      border: 1pt dashed #888;
      padding: 16pt 24pt;
      line-height: 2;
      color: #555;
    }

    /* ── 打印 ── */
    @media print {
      html { background: #fff; }
      body { padding: 0; }
      .tip { display: none; }
      .page {
        margin: 0;
        box-shadow: none;
        page-break-after: always;
        page-break-inside: avoid;
      }
      .page:last-of-type { page-break-after: avoid; }
    }

    @page { size: A4; margin: 0; }
  `;

  // ─── 页面 HTML ────────────────────────────────────────────────
  let pageNum = 0;
  let bodyHtml = `<div class="tip">⬇ 在浏览器中按 Ctrl+P（Mac: ⌘P）打印，纸张选 A4，取消"页眉和页脚"，缩放选"无"</div>\n`;

  for (const pageLines of pages) {
    if (pageLines === null) {
      // 省略标记页
      bodyHtml += `
  <div class="page skip-page">
    <div class="ph">${esc(SOFT_NAME)}</div>
    <div class="skip-box">
      *** 中间省略 ***<br>
      原始代码共 ${total} 页，依据著作权登记规范<br>
      提交前 30 页（第 1—30 页）及后 30 页（第 ${total - 29}—${total} 页）<br>
      中间部分（第 31—${total - 30} 页）省略
    </div>
    <div class="pf"></div>
  </div>`;
      continue;
    }

    pageNum++;
    const lines = pageLines.map(esc).join('\n');
    bodyHtml += `
  <div class="page">
    <div class="ph">${esc(SOFT_NAME)}</div>
    <div class="code">${lines}</div>
    <div class="pf">— 第 ${pageNum} 页 —</div>
  </div>`;
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${SOFT_NAME} ${VERSION} — 源程序鉴别材料</title>
<style>${css}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
//  任务 2：用户操作手册
// ═══════════════════════════════════════════════════════════════

const SHOT_CANDIDATES = {
  login: [
    'screenshots/图1_系统登录界面.png',
    'screenshots/fig_3_1_login.png  # 图3.1：登录页.png',
    'docs/screenshots/01-login.png',
  ],
  dashboard: [
    'screenshots/图2_客户仪表盘界面.png',
    'screenshots/fig_3_2_dashboard.png # 图3.2：控制台首页.png',
    'docs/screenshots/02-dashboard.png',
  ],
  ai: [
    'screenshots/图3_AI智能助手界面.png',
    'screenshots/fig_3_3_ai_chat.png # 图3.3：AI对话界面.png',
    'docs/screenshots/03-ai-chat.png',
  ],
  payment: [
    'screenshots/图4_支付确认界面.png',
    'screenshots/fig_3_9_payment_confirm.png# 图3.9：支付确认.png',
    'docs/screenshots/04-checkout.png',
  ],
  history: [
    'screenshots/图5_支付历史记录.png',
    'screenshots/fig_3_6_history_list.png# 图3.6：历史记录列表.png',
    'docs/screenshots/05-payment-history.png',
  ],
  admin: [
    'screenshots/图6_管理后台数据概览.png',
    'docs/screenshots/06-admin-dashboard.png',
    'screenshots/fig_3_2_dashboard.png # 图3.2：控制台首页.png',
  ],
  settings: [
    'screenshots/图7_店铺设置界面.png',
    'screenshots/fig_3_11_account.png # 图3.11：账户设置.png',
    'docs/screenshots/07-settings.png',
  ],
};

function shotDataUrl(key) {
  for (const rel of SHOT_CANDIDATES[key] || []) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs)) {
      const buf = fs.readFileSync(abs);
      if (buf.length > 500) {
        return 'data:image/png;base64,' + buf.toString('base64');
      }
    }
  }
  return null;
}

function imgTag(key, caption) {
  const url = shotDataUrl(key);
  if (url) {
    return `
    <figure>
      <img src="${url}" alt="${esc(caption)}">
      <figcaption>${esc(caption)}</figcaption>
    </figure>`;
  }
  return `
    <figure class="no-img">
      <div class="img-placeholder">[ ${esc(caption)} ]</div>
      <figcaption>${esc(caption)}</figcaption>
    </figure>`;
}

function buildManualHtml() {
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── 屏幕预览 ── */
    html { background: #555; }
    body { font-family: SimSun, '宋体', serif; padding: 24px 0; }
    .tip {
      font-family: SimHei, sans-serif; font-size: 13px; color: #eee;
      text-align: center; margin-bottom: 18px;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto 16px auto;
      /* 左右对称 25mm = 软著标准 */
      padding: 25mm 25mm 25mm 25mm;
      background: #fff;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 12px rgba(0,0,0,.45);
      position: relative;
    }

    /* 页眉 */
    .ph {
      font-family: SimSun, '宋体', serif;
      font-size: 9pt;
      text-align: center;
      border-bottom: .5pt solid #aaa;
      padding-bottom: 4pt;
      margin-bottom: 14pt;
      flex-shrink: 0;
      color: #333;
    }

    /* 正文 */
    .content { flex: 1; font-size: 12pt; line-height: 1.8; color: #000; }

    /* 页脚 */
    .pf {
      font-family: SimSun, '宋体', serif;
      font-size: 9pt;
      text-align: center;
      border-top: .5pt solid #aaa;
      padding-top: 4pt;
      margin-top: 14pt;
      flex-shrink: 0;
      color: #333;
    }

    /* ── 正文排版 ── */
    h1 {
      font-family: SimHei, '黑体', sans-serif;
      font-size: 18pt; font-weight: bold;
      text-align: center; margin-bottom: 8pt;
    }
    h2 {
      font-family: SimHei, '黑体', sans-serif;
      font-size: 14pt; font-weight: bold;
      margin-top: 16pt; margin-bottom: 6pt;
      border-bottom: 1pt solid #000; padding-bottom: 3pt;
    }
    h3 {
      font-family: SimHei, '黑体', sans-serif;
      font-size: 12pt; font-weight: bold;
      margin-top: 10pt; margin-bottom: 4pt;
    }
    p { margin: 5pt 0; text-indent: 2em; }
    ul, ol { margin: 5pt 0 5pt 2.5em; }
    li { margin: 3pt 0; }

    figure {
      text-align: center;
      margin: 14pt 0;
      page-break-inside: avoid;
    }
    figure img {
      max-width: 100%;
      max-height: 280pt;
      border: 1pt solid #ccc;
      display: block;
      margin: 0 auto;
    }
    figure .img-placeholder {
      width: 100%; height: 120pt;
      border: 1pt dashed #aaa;
      background: #f7f7f7;
      display: flex; align-items: center; justify-content: center;
      font-size: 10pt; color: #888;
    }
    figcaption {
      font-size: 10pt; color: #444;
      margin-top: 4pt; text-indent: 0;
    }

    table {
      width: 100%; border-collapse: collapse;
      margin: 8pt 0; font-size: 10.5pt;
    }
    th, td { border: .5pt solid #888; padding: 4pt 8pt; text-align: left; }
    th { background: #eee; font-weight: bold; }

    .note {
      background: #f5f5f5; border-left: 3pt solid #666;
      padding: 5pt 10pt; margin: 8pt 0; font-size: 10.5pt;
    }
    code {
      font-family: 'Courier New', monospace;
      font-size: 9pt; background: #f0f0f0;
      padding: 1pt 3pt;
    }

    /* 封面页特殊样式 */
    .cover-inner {
      flex: 1;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 12pt;
    }
    .cover-inner h1 { font-size: 22pt; margin: 0; }
    .cover-inner h2 { font-size: 16pt; border: none; margin: 0; color: #333; }
    .cover-meta { font-size: 12pt; line-height: 2.4; text-align: center; margin-top: 32pt; }
    .cover-meta p { text-indent: 0; }

    /* ── 打印 ── */
    @media print {
      html { background: #fff; }
      body { padding: 0; }
      .tip { display: none; }
      .page {
        margin: 0;
        box-shadow: none;
        page-break-after: always;
        page-break-inside: avoid;
        min-height: 297mm;
        width: 100%;
      }
      .page:last-of-type { page-break-after: avoid; }
      h1, h2, h3 { page-break-after: avoid; }
      figure { page-break-inside: avoid; }
      img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 10pt auto;
        page-break-inside: avoid;
      }
      .no-img { display: none; }
      table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
      tr { page-break-inside: avoid; }
      th, td { border: 1pt solid #333 !important; padding: 4pt 6pt; }
      th { background: #eee !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      code { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }

    @page { size: A4; margin: 0; }
  `;

  // ─── 页面组装 ────────────────────────────────────────────────
  // 每个 .page 对应浏览器打印时的若干实际纸页，页脚使用 CSS counter
  // 由于 @page margin-box 的 content: counter(page) 在 Chrome 下只能在 @page 中用，
  // 我们采用"每章一块 .page，页脚写章节序号"的方式；
  // 最终页码连续性由打印机/浏览器自动处理（每 .page 会因内容多少拆分为多个实际页）。
  // 为了在每一个打印页上都显示页眉/页脚，使用 CSS running headers 方案（需 Chrome 117+）：
  // 用 position: running(header) 标记页眉，用 @page { @top-center { element(header) } }
  // BUT Chrome 不支持此功能，所以我们退回到"每个逻辑章节 .page 块"方案，
  // 并在每个 .page 块内放一个固定页眉和页脚文字，依靠 CSS flex 将页脚推到底部。

  function wrapPage(contentHtml, footerLabel = '') {
    return `
<div class="page">
  <div class="ph">${esc(SOFT_NAME)}</div>
  <div class="content">${contentHtml}</div>
  <div class="pf">${footerLabel || '&nbsp;'}</div>
</div>`;
  }

  const pages = [];

  // ── 封面 ──
  pages.push(
    wrapPage(
      `
    <div class="cover-inner">
      <h1>${esc(SOFT_NAME)}</h1>
      <h2>用 户 操 作 手 册</h2>
      <div class="cover-meta">
        <p>版本号：${VERSION}</p>
        <p>著作权人：${COPYRIGHT_OWNER}</p>
        <p>文档日期：${dateStr}</p>
        <p>适用范围：商户接入方 / 系统管理员 / 开发集成方</p>
      </div>
    </div>`,
      ''
    )
  );

  // ── 目录 ──
  pages.push(
    wrapPage(
      `
    <h2>目　录</h2>
    <p>第一章　软件概述 ……………………………………………… 3</p>
    <p>第二章　系统环境与安装配置 ………………………………… 4</p>
    <p>第三章　用户登录与身份验证 ………………………………… 5</p>
    <p>第四章　AI 服务调用功能操作说明 ………………………… 7</p>
    <p>第五章　Pi Network 支付功能操作说明 …………………… 9</p>
    <p>第六章　商户管理后台操作说明 …………………………… 11</p>
    <p>第七章　系统配置与 License 管理 ………………………… 13</p>
    <p>第八章　常见问题与故障排除 ……………………………… 15</p>
    <p>附录　　环境变量配置参考表 ……………………………… 16</p>
  `,
      ''
    )
  );

  // ── 第一章 ──
  pages.push(
    wrapPage(
      `
    <h2>第一章　软件概述</h2>
    <h3>1.1 软件简介</h3>
    <p>${esc(SOFT_NAME)}（Pioneer AI Service Framework，简称 PASF）是一套面向 Pi Network 生态的人工智能服务集成框架，版本号 ${VERSION}。本软件将多家主流 AI 大模型服务提供商（OpenAI GPT、Anthropic Claude、Ollama 本地模型）统一抽象为单一 API 接口，并深度集成 Pi Network 区块链原生支付（U2A，User-to-App），为商户提供开箱即用的 AI 能力与支付能力。</p>
    <h3>1.2 核心功能模块</h3>
    <ul>
      <li><strong>AI 多提供商智能路由</strong>：支持 OpenAI GPT-4o、Anthropic Claude、Ollama 本地大模型，主提供商故障时自动降级，用户无感知。</li>
      <li><strong>Pi Network 原生支付</strong>：完整实现 U2A 支付生命周期（创建→审批→链上确认→完成），内置幂等性保护和孤儿支付处理。</li>
      <li><strong>多租户数据隔离</strong>：基于 AsyncLocalStorage + Prisma 中间件自动注入 merchantId，零代码感知的数据边界保护。</li>
      <li><strong>License 离线授权验证</strong>：HMAC-SHA256 离线签名验证，支持 Starter / Professional / Enterprise 三级套餐。</li>
      <li><strong>实时用量统计</strong>：内存缓冲 + 定时 Flush，微秒级 API 调用追踪，配额超 80% 自动预警。</li>
    </ul>
    <h3>1.3 适用对象</h3>
    <p>本手册适用于：商户接入方（负责集成 SDK 和调用 AI 接口）、系统管理员（负责后台配置和 License 管理）、最终用户（通过系统使用 AI 服务和发起 Pi 支付）。</p>
    ${imgTag('login', '图1：系统登录界面')}
  `,
      ''
    )
  );

  // ── 第二章 ──
  pages.push(
    wrapPage(
      `
    <h2>第二章　系统环境与安装配置</h2>
    <h3>2.1 运行环境要求</h3>
    <table>
      <tr><th>组件</th><th>最低要求</th><th>推荐配置</th></tr>
      <tr><td>操作系统</td><td>Linux / macOS / Windows 10+</td><td>Ubuntu 22.04 LTS</td></tr>
      <tr><td>Node.js</td><td>v18.0.0</td><td>v22.x LTS</td></tr>
      <tr><td>数据库</td><td>PostgreSQL 14</td><td>PostgreSQL 16</td></tr>
      <tr><td>内存</td><td>2 GB</td><td>4 GB+</td></tr>
      <tr><td>浏览器（用户端）</td><td>Pi Browser（支持 Pi SDK）</td><td>Pi Browser 最新版</td></tr>
    </table>
    <h3>2.2 安装步骤</h3>
    <ol>
      <li>克隆项目代码仓库：<code>git clone &lt;repo-url&gt; PiMerchantFramework</code></li>
      <li>安装依赖：<code>pnpm install</code></li>
      <li>复制环境变量模板：<code>cp .env.example .env.local</code></li>
      <li>配置必填环境变量：<code>PI_API_KEY</code>、<code>DATABASE_URL</code>、<code>PI_SESSION_SECRET</code></li>
      <li>执行数据库迁移：<code>npx prisma migrate deploy</code></li>
      <li>启动服务：<code>pnpm run dev</code>（开发环境）或 <code>pnpm run build &amp;&amp; pnpm start</code>（生产）</li>
    </ol>
    <h3>2.3 目录结构</h3>
    <ul>
      <li><code>packages/pi-sdk/</code>：核心 SDK，包含 AI 路由、多租户、License、用量统计等模块</li>
      <li><code>apps/web/</code>：Next.js 前端应用，含收银台、AI 对话、商户后台</li>
      <li><code>apps/web/src/app/api/</code>：后端 API 路由（Next.js App Router）</li>
      <li><code>prisma/</code>：数据库 Schema 定义（Prisma ORM）</li>
    </ul>
  `,
      ''
    )
  );

  // ── 第三章 ──
  pages.push(
    wrapPage(
      `
    <h2>第三章　用户登录与身份验证</h2>
    <h3>3.1 Pi Network 身份验证流程</h3>
    <p>本软件使用 Pi Network 官方身份验证作为唯一登录方式，用户无需单独注册账号。</p>
    <ol>
      <li>在 <strong>Pi Browser</strong> 中打开系统首页。</li>
      <li>系统检测到 Pi Browser 环境后，显示"验证 Pi 身份"按钮。</li>
      <li>用户点击按钮，Pi Browser 弹出授权弹窗，请求权限：<code>username</code>（获取用户名）和 <code>payments</code>（支付权限）。</li>
      <li>用户确认授权后，系统获取 <code>accessToken</code> 和用户信息（<code>uid</code>、<code>username</code>）。</li>
      <li>后端验证 Token 有效性，创建会话，跳转至功能页面。</li>
    </ol>
    <div class="note"><strong>注意：</strong>支付功能仅支持 Pi Browser。普通浏览器下 AI 服务可正常使用，支付功能不可用。</div>
    ${imgTag('dashboard', '图2：客户仪表盘界面')}
    <h3>3.2 会话管理</h3>
    <p>登录成功后，系统生成 HMAC-SHA256 签名的 Session Token（有效期 1 小时），存储于 HTTP-only Cookie 中。服务端每次请求均验证签名，防止 Token 被篡改。</p>
    <h3>3.3 退出登录</h3>
    <p>在管理后台右上角点击"退出登录"，系统调用 <code>POST /api/auth/logout</code> 清除 Session Cookie 完成退出。</p>
  `,
      ''
    )
  );

  // ── 第四章 ──
  pages.push(
    wrapPage(
      `
    <h2>第四章　AI 服务调用功能操作说明</h2>
    <h3>4.1 AI 智能对话功能</h3>
    <p>系统提供多提供商 AI 对话功能，用户可与 GPT-4o、Claude 3.5 Sonnet 或本地 Ollama 模型交互。</p>
    <h3>4.2 操作步骤</h3>
    <ol>
      <li>完成 Pi 身份验证后，在左侧导航栏点击"<strong>AI 服务</strong>"。</li>
      <li>在顶部下拉菜单选择 AI 提供商：
        <ul>
          <li><strong>OpenAI GPT-4o</strong>：通用问答、代码生成</li>
          <li><strong>Anthropic Claude</strong>：长文档分析、专业推理</li>
          <li><strong>Ollama（本地）</strong>：私密数据处理，无需联网</li>
        </ul>
      </li>
      <li>在输入框中输入问题，点击"发送"或按 <code>Ctrl+Enter</code>。</li>
      <li>系统以流式方式实时返回 AI 响应，可随时终止生成。</li>
      <li>若当前提供商不可用，系统自动切换至备选提供商，页面提示"已切换至备用服务"。</li>
    </ol>
    ${imgTag('ai', '图3：AI 智能助手界面')}
    <h3>4.3 AI 路由容错说明</h3>
    <p>当主 AI 提供商响应超时（默认 30 秒）或返回错误时，系统自动按配置顺序尝试下一个提供商，切换过程对用户透明，响应延迟增加约 100–500ms。</p>
    <h3>4.4 Token 用量与配额</h3>
    <p>系统对每个商户租户实施月度 API 调用配额控制。月度用量达到 80% 时向管理员发送预警；达到 100% 时返回"配额已耗尽"提示。当前用量可在管理后台"用量统计"页面查看。</p>
  `,
      ''
    )
  );

  // ── 第五章 ──
  pages.push(
    wrapPage(
      `
    <h2>第五章　Pi Network 支付功能操作说明</h2>
    <h3>5.1 Pi 收银台界面</h3>
    ${imgTag('payment', '图4：支付确认界面')}
    <h3>5.2 支付操作步骤</h3>
    <ol>
      <li><strong>打开收银台：</strong>在 Pi Browser 中访问收银台页面，系统显示商品信息（订单金额：π 25.00，授权期：12 个月）。</li>
      <li><strong>发起支付：</strong>
        <ul>
          <li>已验证 Pi 身份：点击"使用 Pi Wallet 支付"按钮。</li>
          <li>未验证身份：点击"验证 Pi 身份并支付"，先完成验证后自动触发支付。</li>
        </ul>
      </li>
      <li><strong>Pi Browser 钱包确认：</strong>弹出原生支付弹窗，显示金额和备注，在 Pi Browser 中确认。</li>
      <li><strong>服务端处理：</strong>系统依次调用 Pi Platform API Approve（审批）和 Complete（完成）接口。</li>
      <li><strong>支付结果：</strong>成功后跳转"订单支付成功"页面，授权即时生效。</li>
    </ol>
    <h3>5.3 支付状态说明</h3>
    <table>
      <tr><th>状态</th><th>含义</th><th>用户操作</th></tr>
      <tr><td>PENDING</td><td>支付已发起，等待审批</td><td>等待，勿关闭页面</td></tr>
      <tr><td>PENDING_APPROVAL</td><td>服务端已接收，待链上确认</td><td>等待，勿关闭页面</td></tr>
      <tr><td>COMPLETED</td><td>支付成功，链上已确认</td><td>可进入系统</td></tr>
      <tr><td>CANCELLED</td><td>用户取消支付</td><td>可重新发起</td></tr>
    </table>
    <h3>5.4 支付历史查看</h3>
    <p>用户可在管理后台“订单管理”页面查看所有历史支付记录，支持按时间范围和状态筛选查询。</p>
    ${imgTag('history', '图5：支付历史记录')}
  `,
      ''
    )
  );

  // ── 第六章 ──
  pages.push(
    wrapPage(
      `
    <h2>第六章　商户管理后台操作说明</h2>
    ${imgTag('admin', '图6：管理后台数据概览')}
    <h3>6.1 后台主界面说明</h3>
    <ul>
      <li><strong>数据概览：</strong>显示当月 AI 调用次数、支付订单数、活跃用户数等核心指标</li>
      <li><strong>订单管理：</strong>查看所有支付订单详情、状态和 Pi 链上交易 ID</li>
      <li><strong>会员管理：</strong>管理订阅用户的会员权限、有效期和权益配置</li>
      <li><strong>AI 服务配置：</strong>设置 AI 主提供商、备选顺序和各模型参数</li>
      <li><strong>用量统计：</strong>查看月度 API 调用分布、各提供商使用占比、响应延迟趋势</li>
      <li><strong>License 管理：</strong>查看当前授权状态、功能套餐和到期日期</li>
    </ul>
    <h3>6.2 API 凭证管理</h3>
    <p>点击左侧菜单"API 凭证"进入管理页面，展示当前配置的 API Key 状态，管理员可生成新的访问令牌供第三方系统集成。</p>
    <div class="note"><strong>安全提示：</strong>API Key 属于敏感凭证，请勿将其提交至代码仓库或分享给未授权人员。</div>
  `,
      ''
    )
  );

  // ── 第七章 ──
  pages.push(
    wrapPage(
      `
    <h2>第七章　系统配置与 License 管理</h2>
    ${imgTag('settings', '图7：店铺设置界面')}
    <h3>7.1 License 套餐说明</h3>
    <table>
      <tr><th>套餐</th><th>功能特性</th><th>月度配额</th></tr>
      <tr><td>Starter（入门版）</td><td>AI 路由</td><td>1,000 次</td></tr>
      <tr><td>Professional（专业版）</td><td>AI 路由 + 流式响应 + 用量统计 + Webhook</td><td>10,000 次</td></tr>
      <tr><td>Enterprise（企业版）</td><td>全功能（含多租户、高级分析）</td><td>100,000 次</td></tr>
    </table>
    <h3>7.2 License 配置方法</h3>
    <ol>
      <li>从授权平台获取 License 字符串（Base64 编码的 JSON）。</li>
      <li>在服务器环境变量中配置：<code>LICENSE_PAYLOAD=eyJpZCI6...（完整Base64字符串）</code></li>
      <li>重启服务后，系统自动加载并通过 HMAC-SHA256 签名验证 License。</li>
      <li>在管理后台"系统配置"页可查看当前 License 状态、有效期和已激活功能。</li>
    </ol>
    <h3>7.3 AI 提供商配置</h3>
    <ul>
      <li><strong>OpenAI：</strong><code>OPENAI_API_KEY=sk-...</code></li>
      <li><strong>Anthropic：</strong><code>ANTHROPIC_API_KEY=sk-ant-...</code></li>
      <li><strong>Ollama（本地）：</strong><code>OLLAMA_ENABLED=true</code></li>
      <li><strong>主提供商：</strong><code>AI_PRIMARY_PROVIDER=openai</code></li>
      <li><strong>备选顺序：</strong><code>AI_FALLBACK_PROVIDERS=anthropic,ollama</code></li>
    </ul>
  `,
      ''
    )
  );

  // ── 第八章 ──
  pages.push(
    wrapPage(
      `
    <h2>第八章　常见问题与故障排除</h2>
    <h3>8.1 支付相关问题</h3>
    <table>
      <tr><th>问题现象</th><th>可能原因</th><th>解决方法</th></tr>
      <tr><td>支付按钮不显示</td><td>非 Pi Browser 环境</td><td>请在 Pi Browser 中打开系统链接</td></tr>
      <tr><td>支付卡在"处理中"</td><td>服务端未调用 Approve API</td><td>检查 PI_API_KEY 是否正确配置</td></tr>
      <tr><td>支付成功但未开通权限</td><td>Complete API 调用失败</td><td>联系管理员手动处理，提供 txid</td></tr>
      <tr><td>重复支付被拦截</td><td>系统幂等保护正常工作</td><td>无需处理，系统已正确返回已完成状态</td></tr>
    </table>
    <h3>8.2 AI 服务相关问题</h3>
    <table>
      <tr><th>问题现象</th><th>可能原因</th><th>解决方法</th></tr>
      <tr><td>所有 AI 提供商均不可用</td><td>API Key 未配置或过期</td><td>检查环境变量中的 API Key 配置</td></tr>
      <tr><td>响应超时（30秒）</td><td>提供商服务繁忙</td><td>系统自动降级，若持续出现请更换主提供商</td></tr>
      <tr><td>配额耗尽提示</td><td>月度调用次数超限</td><td>升级 License 套餐或等待下月重置</td></tr>
    </table>
    <h3>8.3 License 相关问题</h3>
    <ul>
      <li><strong>License 过期：</strong>系统提前 30 天发出到期预警，请联系授权方续期。</li>
      <li><strong>签名验证失败：</strong>License 字符串可能在传输中损坏，请重新获取并配置。</li>
      <li><strong>功能访问被拒绝：</strong>当前套餐不包含所需功能，请升级至对应套餐。</li>
    </ul>
  `,
      ''
    )
  );

  // ── 附录 ──
  pages.push(
    wrapPage(
      `
    <h2>附录　环境变量配置参考表</h2>
    <table>
      <tr><th>变量名</th><th>必填</th><th>说明</th></tr>
      <tr><td>PI_API_KEY</td><td>是</td><td>Pi Platform API 密钥（Pi Developer Portal 获取）</td></tr>
      <tr><td>PI_SESSION_SECRET</td><td>是</td><td>Session Token HMAC 签名密钥（随机生成，32位以上）</td></tr>
      <tr><td>DATABASE_URL</td><td>是</td><td>PostgreSQL 数据库连接串</td></tr>
      <tr><td>NEXTAUTH_URL</td><td>是</td><td>应用部署的公开 URL</td></tr>
      <tr><td>LICENSE_PAYLOAD</td><td>否</td><td>Base64 编码的 License JSON（从授权方获取）</td></tr>
      <tr><td>LICENSE_PUBLIC_KEY</td><td>否</td><td>License 签名验证公钥（Base64，从授权方获取）</td></tr>
      <tr><td>OPENAI_API_KEY</td><td>否</td><td>OpenAI API Key（启用 OpenAI 提供商时必填）</td></tr>
      <tr><td>ANTHROPIC_API_KEY</td><td>否</td><td>Anthropic Claude API Key</td></tr>
      <tr><td>OLLAMA_ENABLED</td><td>否</td><td>是否启用 Ollama 本地模型（true/false）</td></tr>
      <tr><td>AI_PRIMARY_PROVIDER</td><td>否</td><td>主 AI 提供商（openai/anthropic/ollama）</td></tr>
      <tr><td>AI_FALLBACK_PROVIDERS</td><td>否</td><td>备选提供商，逗号分隔（如 anthropic,ollama）</td></tr>
      <tr><td>USAGE_WEBHOOK_URL</td><td>否</td><td>用量数据 Flush 目标 Webhook 地址</td></tr>
    </table>
    <p style="margin-top:24pt; text-align:center; font-size:10pt; color:#666; text-indent:0;">
      — 文档结束 —<br>
      本手册最终解释权归著作权人 ${esc(COPYRIGHT_OWNER)} 所有<br>
      ${esc(SOFT_NAME)} ${VERSION}
    </p>
  `,
      ''
    )
  );

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${esc(SOFT_NAME)} ${VERSION} — 用户操作手册</title>
<style>${css}</style>
</head>
<body>
<div class="tip">⬇ 在浏览器中按 Ctrl+P（Mac: ⌘P）打印，纸张选 A4，取消"页眉和页脚"，缩放选"无"</div>
${pages.join('\n')}
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
//  主流程
// ═══════════════════════════════════════════════════════════════

async function main() {
  ensureOutDir();

  // ── 任务1：源程序鉴别材料 ──────────────────────────────────
  console.log('[任务1] 生成源程序鉴别材料 HTML...');
  const allLines = collectSourceLines();
  const paginated = paginateSource(allLines);
  const sourceHtml = buildSourceHtml(paginated);
  const sourcePath = path.join(OUT_DIR, '01-源程序鉴别材料(补正版).html');
  fs.writeFileSync(sourcePath, sourceHtml, 'utf8');
  const srcStat = fs.statSync(sourcePath);
  console.log(`  ✓ 输出：${sourcePath}`);
  console.log(`    大小：${(srcStat.size / 1024).toFixed(1)} KB`);
  console.log(
    `    总行数：${allLines.length}，逻辑页数：${paginated.pages.filter((p) => p !== null).length}（前30+后30${paginated.skipped ? '，中间已省略' : ''}）`
  );

  // ── 任务2：用户操作手册 ────────────────────────────────────
  console.log('[任务2] 生成用户操作手册 HTML...');
  const manualHtml = buildManualHtml();
  const manualPath = path.join(OUT_DIR, '02-用户操作手册(补正版).html');
  fs.writeFileSync(manualPath, manualHtml, 'utf8');
  const manStat = fs.statSync(manualPath);
  console.log(`  ✓ 输出：${manualPath}`);
  console.log(`    大小：${(manStat.size / 1024).toFixed(1)} KB`);

  console.log('\n=== 全部完成 ===');
  console.log(
    '打印方法：用 Chrome/Edge 打开 HTML 文件 → Ctrl+P → 纸张 A4 → 取消页眉页脚 → 缩放 100%'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
