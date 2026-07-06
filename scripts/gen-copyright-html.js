/**
 * Step 2：源程序鉴别材料排版 HTML 生成器
 * 软件名称：先锋人工智能服务框架软件 V1.0.0
 *
 * 逻辑：
 *   1. 读取纯文本源码（softcopyright_output/copyright-source-code-v2.txt）
 *   2. 若总行数 > 3000，截取前 1500 行 + 后 1500 行 = 3000 行
 *   3. 按每 50 行切分成 60 个页块
 *   4. 输出 60 个 <div class="page">，各含一个 <pre class="code-block">
 *   5. 保存到 softcopyright_output/source-code-60pages.html
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'softcopyright_output');
const TXT_IN = path.join(OUT_DIR, 'copyright-source-code-v2.txt');
const HTML_OUT = path.join(OUT_DIR, 'source-code-60pages.html');

const LINES_PER_PAGE = 50;
const TARGET_PAGES = 60;
const TARGET_LINES = LINES_PER_PAGE * TARGET_PAGES; // 3000
const HALF_LINES = TARGET_LINES / 2; // 1500

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function loadLines() {
  if (!fs.existsSync(TXT_IN)) {
    console.error(`[ERROR] 找不到纯文本数据：${TXT_IN}`);
    console.error('        请先运行 scripts/gen-source-pdf.js 生成脱敏源码文本。');
    process.exit(1);
  }
  const raw = fs.readFileSync(TXT_IN, 'utf8').replace(/\r\n/g, '\n');
  let lines = raw.split('\n');
  // 去掉尾部可能的空行造成的多余元素
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  console.log(`[INFO] 原始文本行数：${lines.length}`);

  if (lines.length > TARGET_LINES) {
    const front = lines.slice(0, HALF_LINES);
    const back = lines.slice(lines.length - HALF_LINES);
    lines = [...front, ...back];
    console.log(`[INFO] 超过 ${TARGET_LINES} 行，截取前 ${HALF_LINES} 行 + 后 ${HALF_LINES} 行`);
  } else {
    while (lines.length < TARGET_LINES) lines.push('');
    console.log(`[INFO] 不足 ${TARGET_LINES} 行，补空行至 ${TARGET_LINES}`);
  }
  return lines; // 恰好 3000 行
}

function buildHtml(lines) {
  // 切分成 60 页，每页 50 行
  const pages = [];
  for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
    pages.push(lines.slice(i, i + LINES_PER_PAGE));
  }

  const pageDivs = pages
    .map((pageLines, idx) => {
      // 每页强制 50 行，末页若不足补空行
      const padded = [...pageLines];
      while (padded.length < LINES_PER_PAGE) padded.push('');
      const body = padded.map(escapeHtml).join('\n');
      return `  <div class="page" data-page="${idx + 1}"><pre class="code-block">${body}</pre></div>`;
    })
    .join('\n');

  // ── 像素级排版参数（严禁修改，直接写入 CSS）──
  const css = `
    @page {
      size: A4;
      /* 不在 CSS 声明 margin：物理页边距完全交由 Puppeteer 的 margin 选项控制。
         若在此写 margin:0，会覆盖 Puppeteer 使正文贴顶，导致页眉压在正文上。 */
    }
    body {
      margin: 0;
      padding: 0;
    }
    .page {
      /* 不强制固定页高：每页已预切为 50 行(50*13pt=650pt≈229mm < 可打印 247mm)，
         由 page-break-after 精确分页。强制 height:247mm 会撑满可打印区、破坏顶部
         页边距内缩，导致页眉压在正文上 —— 故移除。 */
      width: 100%;
      page-break-after: always;
      overflow: hidden;
    }
    .page:last-child {
      page-break-after: avoid; /* 防止末页后产生一张空白页导致 61 页 */
    }
    pre.code-block {
      font-family: 'Courier New', Courier, monospace; /* 强制等宽字体 */
      /* 字号 6.5pt：正文宽 160mm(A4 210 - 左右各 25) 需容纳最长 116 字符的代码行而不截断，
         Courier 字宽=0.6em，116*0.6*fs <= 160mm(453.5pt) => fs <= 6.5pt。
         注意：字号与行高无关，line-height 固定 13pt 仍保证每页精确 50 行、共 60 页。 */
      font-size: 6.5pt;
      line-height: 13pt; /* 核心魔法：固定行高 13pt，50 行 * 13pt = 650pt，完美适配 A4 */
      margin: 0;
      padding: 0;
      white-space: pre;
      word-wrap: normal;
      overflow: hidden;
    }`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>先锋人工智能服务框架软件 V1.0.0 — 源程序鉴别材料</title>
<style>${css}
</style>
</head>
<body>
${pageDivs}
</body>
</html>`;
}

function main() {
  console.log('=== Step 2：生成排版 HTML ===');
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const lines = loadLines();
  const html = buildHtml(lines);
  fs.writeFileSync(HTML_OUT, html, 'utf8');

  const pageCount = (html.match(/class="page"/g) || []).length;
  console.log(`[HTML] 已输出：${HTML_OUT}`);
  console.log(`[HTML] 页块数：${pageCount}（每页 ${LINES_PER_PAGE} 行，共 ${lines.length} 行）`);
  if (pageCount !== TARGET_PAGES) {
    console.error(`[WARN] 页块数不是 ${TARGET_PAGES}，请检查数据源行数`);
    process.exit(1);
  }
  console.log('=== Step 2 完成 ===');
}

main();
