/**
 * 任务 1：源程序鉴别材料 PDF 生成器
 * 软件名称：先锋人工智能服务框架软件 V1.0.0
 * 著作权人：秦晓望
 *
 * 输出：
 *   softcopyright_output/copyright-source-code-v2.txt   (纯文本)
 *   softcopyright_output/01-源程序鉴别材料(补正版).pdf   (PDF)
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── 待提取文件清单（按顺序拼接） ─────────────────────────────────
const FILE_LIST = [
  // 1. AI 多提供商路由（核心独创模块）
  'packages/pi-sdk/src/ai-providers/types.ts',
  'packages/pi-sdk/src/ai-providers/base.ts',
  'packages/pi-sdk/src/ai-providers/factory.ts',
  'packages/pi-sdk/src/ai-providers/openai.ts',
  'packages/pi-sdk/src/ai-providers/anthropic.ts',
  'packages/pi-sdk/src/ai-providers/ollama.ts',
  // 2. 多租户隔离
  'packages/pi-sdk/src/tenant/context.ts',
  'packages/pi-sdk/src/tenant/prisma-middleware.ts',
  'packages/pi-sdk/src/tenant/manager.ts',
  'packages/pi-sdk/src/tenant/types.ts',
  // 3. License 离线授权验证
  'packages/pi-sdk/src/license/validator.ts',
  'packages/pi-sdk/src/license/manager.ts',
  'packages/pi-sdk/src/license/types.ts',
  // 4. 用量统计
  'packages/pi-sdk/src/usage/tracker.ts',
  'packages/pi-sdk/src/usage/types.ts',
  // 5. SDK 入口
  'packages/pi-sdk/src/payment-service.ts',
  'packages/pi-sdk/src/auth-service.ts',
  'packages/pi-sdk/src/logger.ts',
  // 6. Pi 支付 API 路由
  'apps/web/src/app/api/payments/approve/route.ts',
  'apps/web/src/app/api/payments/complete/route.ts',
  'apps/web/src/app/api/payments/cancel/route.ts',
  // 7. 安全基础设施
  'apps/web/src/lib/session.ts',
  'apps/web/src/lib/rate-limit.ts',
];

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'softcopyright_output');
const TXT_OUT = path.join(OUT_DIR, 'copyright-source-code-v2.txt');
const PDF_OUT = path.join(OUT_DIR, '01-源程序鉴别材料(补正版).pdf');

const LINES_PER_PAGE = 50;
const SOFT_NAME = '先锋人工智能服务框架软件';
const VERSION = 'V1.0.0';
const COPYRIGHT_OWNER = '秦晓望';

// ─── 敏感词替换规则 ──────────────────────────────────────────────
const REDACT_PATTERNS = [
  { re: /(['"`])sk-[A-Za-z0-9\-_]{20,}(['"`])/g, rep: '$1[REDACTED]$2' },
  { re: /(['"`])AKIA[A-Z0-9]{16}(['"`])/g, rep: '$1[REDACTED]$2' },
  { re: /(['"`])anthropic-key-[A-Za-z0-9\-_]{20,}(['"`])/g, rep: '$1[REDACTED]$2' },
  { re: /(PI_API_KEY\s*[=:]\s*)['"`][^'"`\s]+['"`]/g, rep: '$1"[REDACTED]"' },
  { re: /(DATABASE_URL\s*[=:]\s*)['"`][^'"`\s]+['"`]/g, rep: '$1"[REDACTED]"' },
  { re: /(PASSWORD\s*[=:]\s*)['"`][^'"`\s]+['"`]/gi, rep: '$1"[REDACTED]"' },
  { re: /(SECRET\s*[=:]\s*)['"`][^'"`\s]+['"`]/gi, rep: '$1"[REDACTED]"' },
  { re: /dev_fallback_secret_for_pi_hmac_2026/g, rep: '[REDACTED_DEV_SECRET]' },
];

function redact(code) {
  let out = code;
  for (const { re, rep } of REDACT_PATTERNS) {
    out = out.replace(re, rep);
  }
  return out;
}

// ─── 读取并合并所有源文件 ─────────────────────────────────────────
function buildRawLines() {
  const COPYRIGHT_HEADER = [
    '/*',
    ` * 软件名称：${SOFT_NAME}`,
    ` * 版本号  ：${VERSION}`,
    ` * 著作权人：${COPYRIGHT_OWNER}`,
    ` * 说明    ：本材料为软件著作权登记鉴别材料，仅供审查使用`,
    ' */',
    '',
  ];

  const allLines = [...COPYRIGHT_HEADER];

  for (const relPath of FILE_LIST) {
    const absPath = path.join(ROOT, relPath);
    if (!fs.existsSync(absPath)) {
      allLines.push(`// [警告] 文件不存在: ${relPath}`, '');
      continue;
    }
    const raw = fs.readFileSync(absPath, 'utf8');
    const code = redact(raw);

    // 文件分隔标题
    allLines.push('// ' + '='.repeat(72), `// 文件：${relPath}`, '// ' + '='.repeat(72), '');

    const fileLines = code.replace(/\r\n/g, '\n').split('\n');
    allLines.push(...fileLines, '', '');
  }

  return allLines;
}

// ─── 分页：严格 60 页 × 50 行 ────────────────────────────────────
// 若原始行数超过 60 页，取前 30 页 + 中间省略说明（内嵌为注释行）+ 后 30 页，
// 使总行数恰好 = 3000 行，分页后严格 60 页、每页 50 行。
function paginateLines(allLines) {
  const TARGET_PAGES = 60;
  const TARGET_LINES = TARGET_PAGES * LINES_PER_PAGE; // 3000
  const HALF_LINES = TARGET_LINES / 2; // 1500
  const totalPages = Math.ceil(allLines.length / LINES_PER_PAGE);

  let finalLines;
  let skipped = false;

  if (allLines.length <= TARGET_LINES) {
    // 不足 60 页：补空行至 50 的整数倍
    finalLines = [...allLines];
    while (finalLines.length % LINES_PER_PAGE !== 0) finalLines.push('');
  } else {
    // 超过 60 页：前 1500 行 + 省略说明 + 后 (1500 - 说明行数) 行 = 恰好 3000 行
    skipped = true;
    const skippedPages = totalPages - TARGET_PAGES;
    const notice = [
      '',
      '// ' + '='.repeat(72),
      `// 【中间省略】原始源代码经分页后共 ${totalPages} 页，依据软件著作权登记规范，`,
      `//   此处省略中间 ${skippedPages} 页，仅提交前 30 页与后 30 页，合计 60 页。`,
      '// ' + '='.repeat(72),
      '',
    ];
    const front = allLines.slice(0, HALF_LINES);
    const back = allLines.slice(allLines.length - (HALF_LINES - notice.length));
    finalLines = [...front, ...notice, ...back];
  }

  const pages = [];
  for (let i = 0; i < finalLines.length; i += LINES_PER_PAGE) {
    pages.push(finalLines.slice(i, i + LINES_PER_PAGE));
  }
  return { pages, skipped, totalPages };
}

// ─── 生成纯文本文件 ───────────────────────────────────────────────
function writeTxt(allLines) {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(TXT_OUT, allLines.join('\n'), 'utf8');
  console.log(`[TXT] 已输出：${TXT_OUT}（${allLines.length} 行）`);
}

// ─── 转义 HTML ────────────────────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── 生成 HTML ────────────────────────────────────────────────────
function buildHtml(pages) {
  const FONT_SIZE = '7.5pt';
  const LINE_HEIGHT = '13.8pt';

  const pageStyle = `
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', Courier, monospace; font-size: ${FONT_SIZE}; }
    .page {
      width: 100%;
      page-break-after: always;
    }
    .page:last-child { page-break-after: avoid; }
    pre {
      font-family: 'Courier New', Courier, monospace;
      font-size: ${FONT_SIZE};
      line-height: ${LINE_HEIGHT};
      white-space: pre-wrap;
      word-break: break-all;
      overflow: hidden;
    }
    .skip-notice {
      font-family: SimSun, '宋体', serif;
      font-size: 9pt;
      text-align: center;
      padding: 20pt 0;
      border: 1pt dashed #666;
      margin: 5pt 0;
    }
  `;

  function renderPage(lines, pageNum) {
    // 补全到 LINES_PER_PAGE 行，保证每页行数一致
    const padded = [...lines];
    while (padded.length < LINES_PER_PAGE) padded.push('');
    return `<div class="page"><pre>${padded.map(escapeHtml).join('\n')}</pre></div>`;
  }

  let bodyHtml = '';
  pages.forEach((lines, idx) => {
    bodyHtml += renderPage(lines, idx + 1);
  });

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>${pageStyle}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

// ─── 使用 Puppeteer 生成 PDF ──────────────────────────────────────
async function generatePdf(html) {
  const puppeteer = require('puppeteer');

  const CHROME_PATHS = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.CHROME_PATH,
  ].filter(Boolean);
  const executablePath = CHROME_PATHS.find((p) => require('fs').existsSync(p));

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    // 设置视口为 A4 尺寸（96dpi：210mm=794px，297mm=1123px），确保渲染比例准确
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

    const headerTemplate = `
      <div style="font-size:8pt; font-family:SimSun,'宋体',serif;
                  text-align:center; width:100%; color:#333;
                  padding-top:4pt;">
        ${SOFT_NAME}
      </div>`;

    const footerTemplate = `
      <div style="font-size:8pt; font-family:SimSun,'宋体',serif;
                  text-align:center; width:100%; color:#333;
                  padding-bottom:4pt;">
        — 第 <span class="pageNumber"></span> 页 —
      </div>`;

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: false,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      // 四边完全对称 72pt（2.54cm = 1英寸），页眉页脚渲染在页边距内
      margin: { top: '2.54cm', bottom: '2.54cm', left: '2.54cm', right: '2.54cm' },
    });

    fs.writeFileSync(PDF_OUT, pdfBuffer);
    console.log(`[PDF] 已输出：${PDF_OUT}`);

    // 获取页数
    const pageCount = await page.evaluate(() => document.querySelectorAll('.page').length);
    console.log(`[PDF] 渲染页数：${pageCount} 页`);
  } finally {
    await browser.close();
  }
}

// ─── 主流程 ───────────────────────────────────────────────────────
async function main() {
  console.log('=== 源程序鉴别材料生成器 ===');
  console.log(`软件：${SOFT_NAME} ${VERSION}`);

  const allLines = buildRawLines();
  const { pages, skipped, totalPages } = paginateLines(allLines);

  console.log(`[INFO] 原始总行数：${allLines.length}，原始总页数：${totalPages}`);
  if (skipped) console.log(`[INFO] 超过 60 页，取前 30 页 + 中间省略说明 + 后 30 页 = ${pages.length} 页`);
  console.log(`[INFO] 最终页数：${pages.length}，每页 ${LINES_PER_PAGE} 行`);

  writeTxt(allLines);

  const html = buildHtml(pages);
  await generatePdf(html);

  console.log('=== 任务 1 完成 ===');
}

main().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});
