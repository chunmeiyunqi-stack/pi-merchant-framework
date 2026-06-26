/**
 * gen_softcopyright_output.js
 * 生成软著提交所需的源代码文档（每页 50 行，A4，共 60 页）
 * 输出到 softcopyright_output/01_源代码文档(标准50行每页).html
 *
 * 用法: node scripts/gen_softcopyright_output.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── 配置 ──────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_HTML = path.join(ROOT, 'softcopyright_output', '01_源代码文档(标准50行每页).html');
const LINES_PER_PAGE = 50;
const TOTAL_LINES = 3000; // 60 pages × 50 lines

const SOFTWARE_NAME = '先锋人工智能服务框架软件 V2.1.0';
const COPYRIGHT_OWNER = '秦晓望';
const DATE = '2026年6月21日';

// 核心源代码文件列表（按重要性排序）
const SOURCE_FILES = [
  // 安全与认证层
  'apps/web/src/lib/session.ts',
  'apps/web/src/lib/rate-limit.ts',
  'apps/web/src/middleware.ts',
  // AI 核心路由
  'apps/web/src/app/api/ai/stream/route.ts',
  'apps/web/src/app/api/v1/images/generate/route.ts',
  'apps/web/src/app/api/v1/videos/generate/route.ts',
  'apps/web/src/app/api/v1/history/route.ts',
  'apps/web/src/app/api/v1/models/route.ts',
  // SDK 核心
  'packages/pi-sdk/src/ai-providers/factory.ts',
  'packages/pi-sdk/src/ai-providers/openai.ts',
  'packages/pi-sdk/src/ai-providers/anthropic.ts',
  'packages/pi-sdk/src/ai-providers/base.ts',
  'packages/pi-sdk/src/ai-service.ts',
  'packages/pi-sdk/src/tenant/context.ts',
  'packages/pi-sdk/src/tenant/prisma-middleware.ts',
  'packages/pi-sdk/src/tenant/manager.ts',
  'packages/pi-sdk/src/usage/tracker.ts',
  'packages/pi-sdk/src/license/validator.ts',
  'packages/pi-sdk/src/license/manager.ts',
  'packages/pi-sdk/src/payment-service.ts',
  'packages/pi-sdk/src/auth-service.ts',
  // 前端页面
  'apps/web/src/app/history/page.tsx',
  'apps/web/src/app/image-gen/page.tsx',
  'apps/web/src/app/dashboard/page.tsx',
  // Prisma / DB
  'apps/web/src/lib/prisma.ts',
  'apps/web/src/lib/metrics.ts',
  'apps/web/src/lib/metrics-middleware.ts',
  // 认证路由
  'apps/web/src/app/api/auth/pi/route.ts',
  'apps/web/src/app/api/payments/approve/route.ts',
  'apps/web/src/app/api/payments/complete/route.ts',
];

// 敏感信息脱敏规则
const REDACTION_RULES = [
  { pattern: /sk-[a-zA-Z0-9]{20,}/g, replacement: '[REDACTED]' },
  { pattern: /Bearer\s+[a-zA-Z0-9._-]{16,}/g, replacement: 'Bearer [REDACTED]' },
  { pattern: /(postgresql|postgres):\/\/[^"'\s;]+/gi, replacement: 'process.env.DATABASE_URL' },
  { pattern: /[0-9a-fA-F]{64}/g, replacement: '[REDACTED_HEX]' },
];

function redact(code) {
  let result = code;
  for (const rule of REDACTION_RULES) {
    result = result.replace(rule.pattern, rule.replacement);
  }
  return result;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── 收集代码行 ─────────────────────────────────────────────
const allLines = [];

// 文件头
allLines.push(
  `/*`,
  ` * ${SOFTWARE_NAME}`,
  ` * 著作权人：${COPYRIGHT_OWNER}`,
  ` * 开发完成日期：${DATE}`,
  ` * 技术栈：Next.js 14 + TypeScript 5 + Prisma 5 + pnpm Monorepo`,
  ` */`,
  ``
);

for (const relPath of SOURCE_FILES) {
  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) {
    console.warn(`⚠ 跳过（文件不存在）: ${relPath}`);
    continue;
  }

  const code = redact(fs.readFileSync(absPath, 'utf8'));
  const lines = code.split('\n');

  // 文件分隔标注
  allLines.push(
    ``,
    `/* ${'─'.repeat(60)} */`,
    `/* 文件: ${relPath.replace(/\\/g, '/')} */`,
    `/* ${'─'.repeat(60)} */`,
    ``
  );

  allLines.push(...lines);
  console.log(`  ✓ ${relPath} (${lines.length} 行)`);

  if (allLines.length >= TOTAL_LINES * 1.5) break; // 防止超出太多
}

console.log(`\n共收集 ${allLines.length} 行原始代码`);

// 按软著标准取前 30 页（1500 行）+ 后 30 页（1500 行）共 60 页
let selectedLines;
if (allLines.length <= TOTAL_LINES) {
  // 行数不足则全部取，不足补空行
  selectedLines = [...allLines];
  while (selectedLines.length < TOTAL_LINES) selectedLines.push('');
} else {
  const front = allLines.slice(0, 1500);
  const back = allLines.slice(allLines.length - 1500);
  selectedLines = [...front, ...back];
}

// ── 按 50 行分页 ──────────────────────────────────────────
const pages = [];
for (let i = 0; i < selectedLines.length; i += LINES_PER_PAGE) {
  pages.push(selectedLines.slice(i, i + LINES_PER_PAGE));
}

console.log(`生成 ${pages.length} 页`);

// ── 构建 HTML ─────────────────────────────────────────────
const pageHtmlParts = pages.map((pageLines, idx) => {
  const pageNum = idx + 1;
  const codeText = pageLines.map((l, li) => {
    const lineNum = String(idx * LINES_PER_PAGE + li + 1).padStart(4, ' ');
    return `${lineNum}  ${escapeHtml(l)}`;
  }).join('\n');

  return `<div class="page">
  <div class="page-header">${escapeHtml(SOFTWARE_NAME)} — 源代码文档</div>
  <pre class="code-block">${codeText}</pre>
  <div class="page-footer">第 ${pageNum} 页 / 共 ${pages.length} 页 &nbsp;|&nbsp; ${escapeHtml(SOFTWARE_NAME)} &nbsp;|&nbsp; 著作权人：${escapeHtml(COPYRIGHT_OWNER)}</div>
</div>`;
});

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>源代码文档 - ${SOFTWARE_NAME}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm 1.5cm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: "Consolas", "Courier New", "SimSun", monospace;
      font-size: 9.5pt;
      line-height: 1.32;
      color: #000;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .page {
      width: 100%;
      min-height: 25.7cm;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      break-after: page;
      padding: 0;
      overflow: hidden;
    }
    .page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .page-header {
      font-size: 8.5pt;
      color: #333;
      border-bottom: 0.5pt solid #999;
      padding-bottom: 3px;
      margin-bottom: 6px;
      white-space: nowrap;
      overflow: hidden;
    }
    .code-block {
      flex: 1;
      margin: 0;
      padding: 0;
      white-space: pre;
      overflow: hidden;
      font-size: 9pt;
      line-height: 1.32;
      word-break: break-all;
      font-family: inherit;
    }
    .page-footer {
      font-size: 8pt;
      color: #555;
      border-top: 0.5pt solid #999;
      padding-top: 3px;
      margin-top: 4px;
      text-align: center;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { page-break-after: always; break-after: page; }
      .page:last-child { page-break-after: auto; break-after: auto; }
    }
  </style>
</head>
<body>
${pageHtmlParts.join('\n')}
</body>
</html>`;

// ── 写出文件 ──────────────────────────────────────────────
fs.mkdirSync(path.dirname(OUTPUT_HTML), { recursive: true });
fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
const sizeKB = (fs.statSync(OUTPUT_HTML).size / 1024).toFixed(1);
console.log(`\n✅ 生成成功: ${OUTPUT_HTML}`);
console.log(`   文件大小: ${sizeKB} KB`);
console.log(`   页数: ${pages.length} 页 (${selectedLines.length} 行)`);
console.log(`\n📌 打印指南：Edge/Chrome 打开 → Ctrl+P → 边距选"无" → 勾选"背景图形" → 打印/另存为 PDF`);
