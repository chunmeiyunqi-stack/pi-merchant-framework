/**
 * 任务 3：独创性说明文档 PDF 生成器
 * 软件名称：先锋人工智能服务框架软件 V1.0.0
 * 著作权人：秦晓望
 *
 * 输入：软著提交材料/独创性说明文档_补正版.md
 * 输出：softcopyright_output/03-独创性说明文档(补正版).pdf
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MD_FILE = path.join(ROOT, '软著提交材料', '独创性说明文档_补正版.md');
const OUT_DIR = path.join(ROOT, 'softcopyright_output');
const PDF_OUT = path.join(OUT_DIR, '03-独创性说明文档(补正版).pdf');

const SOFT_NAME = '先锋人工智能服务框架软件';
const VERSION = 'V1.0.0';

// ── HTML 转义 ─────────────────────────────────────────────────────
function escHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── 行内格式化（先转义再加标签）──────────────────────────────────
function inlineFormat(text) {
  text = escHtml(text);
  // **bold**
  text = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  // `code`
  text = text.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  return text;
}

// ── Markdown → HTML ───────────────────────────────────────────────
function mdToHtml(md) {
  const lines = md.split('\n');
  const parts = [];

  let inCode = false;
  let codeLang = '';
  let codeLines = [];

  let inTable = false;
  let tableLines = [];

  let inUL = false;
  let ulItems = [];
  let inOL = false;
  let olItems = [];

  function flushUL() {
    if (!inUL) return;
    parts.push('<ul>' + ulItems.map((x) => `<li>${inlineFormat(x)}</li>`).join('') + '</ul>');
    ulItems = [];
    inUL = false;
  }
  function flushOL() {
    if (!inOL) return;
    parts.push('<ol>' + olItems.map((x) => `<li>${inlineFormat(x)}</li>`).join('') + '</ol>');
    olItems = [];
    inOL = false;
  }
  function flushTable() {
    if (!inTable || tableLines.length < 2) {
      tableLines = [];
      inTable = false;
      return;
    }
    let html = '<table>';
    // 表头
    const hCells = tableLines[0]
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    html +=
      '<thead><tr>' + hCells.map((c) => `<th>${inlineFormat(c)}</th>`).join('') + '</tr></thead>';
    html += '<tbody>';
    // 跳过分隔行（index 1）
    for (let i = 2; i < tableLines.length; i++) {
      const cells = tableLines[i]
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      html += '<tr>' + cells.map((c) => `<td>${inlineFormat(c)}</td>`).join('') + '</tr>';
    }
    html += '</tbody></table>';
    parts.push(html);
    tableLines = [];
    inTable = false;
  }
  function flushAll() {
    flushUL();
    flushOL();
    flushTable();
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ── 代码块 ──
    if (!inCode) {
      const fenceMatch = line.match(/^```(\w*)$/);
      if (fenceMatch) {
        flushAll();
        inCode = true;
        codeLang = fenceMatch[1] || '';
        codeLines = [];
        continue;
      }
    } else {
      if (line === '```') {
        inCode = false;
        const escaped = escHtml(codeLines.join('\n'));
        parts.push(`<pre><code class="lang-${codeLang}">${escaped}</code></pre>`);
        codeLines = [];
      } else {
        codeLines.push(line);
      }
      continue;
    }

    // ── 表格 ──
    if (line.startsWith('|')) {
      flushUL();
      flushOL();
      inTable = true;
      tableLines.push(line);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // ── 标题 ──
    if (line.startsWith('#### ')) {
      flushAll();
      parts.push(`<h4>${inlineFormat(line.slice(5))}</h4>`);
    } else if (line.startsWith('### ')) {
      flushAll();
      parts.push(`<h3>${inlineFormat(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      flushAll();
      parts.push(`<h2 class="section-h2">${inlineFormat(line.slice(3))}</h2>`);
    } else if (line.startsWith('# ')) {
      flushAll();
      parts.push(`<h1>${inlineFormat(line.slice(2))}</h1>`);
    }
    // ── 分隔线 ──
    else if (/^---+$/.test(line.trim())) {
      flushAll();
      parts.push('<hr>');
    }
    // ── 无序列表 ──
    else if (/^- /.test(line)) {
      flushOL();
      inUL = true;
      ulItems.push(line.slice(2));
    }
    // ── 有序列表 ──
    else if (/^\d+\. /.test(line)) {
      flushUL();
      inOL = true;
      olItems.push(line.replace(/^\d+\. /, ''));
    }
    // ── 尾注斜体行（_..._ 开头）──
    else if (line.startsWith('_') && line.endsWith('_')) {
      flushAll();
      parts.push(`<p class="footnote">${inlineFormat(line.slice(1, -1))}</p>`);
    }
    // ── 空行 ──
    else if (line.trim() === '') {
      flushAll();
    }
    // ── 普通段落 ──
    else {
      flushAll();
      parts.push(`<p>${inlineFormat(line)}</p>`);
    }
  }

  flushAll();
  return parts.join('\n');
}

// ── 构建完整 HTML ─────────────────────────────────────────────────
function buildHtml(mdContent) {
  const body = mdToHtml(mdContent);
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
  /* Puppeteer 控制边距，CSS @page 置零避免叠加 */
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body {
    font-family: SimSun, '宋体', serif;
    font-size: 11pt;
    line-height: 1.8;
    color: #000;
    background: white;
  }
  h1 {
    font-size: 17pt;
    font-weight: bold;
    text-align: center;
    margin: 18pt 0 6pt;
    font-family: SimHei, '黑体', sans-serif;
    page-break-after: avoid;
  }
  h2.section-h2 {
    font-size: 14pt;
    font-weight: bold;
    margin: 18pt 0 6pt;
    font-family: SimHei, '黑体', sans-serif;
    border-bottom: 1pt solid #333;
    padding-bottom: 3pt;
    page-break-after: avoid;
  }
  h3 {
    font-size: 12pt;
    font-weight: bold;
    margin: 14pt 0 4pt;
    font-family: SimHei, '黑体', sans-serif;
    page-break-after: avoid;
  }
  h4 {
    font-size: 11pt;
    font-weight: bold;
    margin: 10pt 0 3pt;
    page-break-after: avoid;
  }
  p {
    margin: 5pt 0;
    text-indent: 2em;
  }
  p.footnote {
    font-size: 9pt;
    color: #555;
    text-indent: 0;
    font-style: italic;
    margin-top: 16pt;
    border-top: 0.5pt solid #ccc;
    padding-top: 6pt;
  }
  ul, ol {
    margin: 5pt 0 5pt 2.2em;
  }
  li {
    margin: 2pt 0;
    line-height: 1.7;
  }
  pre {
    background: #f5f5f5;
    border: 0.5pt solid #ccc;
    border-left: 3pt solid #555;
    padding: 7pt 9pt;
    font-family: 'Courier New', Consolas, monospace;
    font-size: 8pt;
    line-height: 1.4;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    margin: 7pt 0;
    page-break-inside: avoid;
  }
  code {
    font-family: 'Courier New', Consolas, monospace;
    font-size: 9pt;
    background: #f0f0f0;
    padding: 1pt 3pt;
    border-radius: 2pt;
  }
  pre code {
    background: transparent;
    padding: 0;
    font-size: 8pt;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 7pt 0;
    font-size: 10pt;
    page-break-inside: avoid;
  }
  th, td {
    border: 0.5pt solid #999;
    padding: 4pt 7pt;
    text-align: left;
    line-height: 1.5;
    vertical-align: top;
  }
  th { background: #eee; font-weight: bold; }
  hr {
    border: none;
    border-top: 0.5pt solid #aaa;
    margin: 12pt 0;
  }
  strong { font-weight: bold; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

// ── 主流程 ────────────────────────────────────────────────────────
async function main() {
  console.log('=== 独创性说明文档 PDF 生成器 ===');
  console.log(`软件：${SOFT_NAME} ${VERSION}`);

  if (!fs.existsSync(MD_FILE)) {
    console.error(`[ERROR] 找不到文件: ${MD_FILE}`);
    process.exit(1);
  }

  const mdContent = fs.readFileSync(MD_FILE, 'utf-8');
  const lineCount = mdContent.split('\n').length;
  console.log(`[INFO] Markdown 读取成功：${lineCount} 行`);

  const html = buildHtml(mdContent);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const puppeteer = require('puppeteer');

  const CHROME_PATHS = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.CHROME_PATH,
  ].filter(Boolean);
  const executablePath = CHROME_PATHS.find((p) => fs.existsSync(p));

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');

    const headerTemplate = `
      <div style="font-size:9pt; font-family:SimSun,'宋体',serif;
                  text-align:center; width:100%; color:#555; padding-top:4pt;">
        ${SOFT_NAME} — 独创性说明文档（补正版）
      </div>`;
    const footerTemplate = `
      <div style="font-size:9pt; font-family:SimSun,'宋体',serif;
                  text-align:center; width:100%; color:#555; padding-bottom:4pt;">
        — 第 <span class="pageNumber"></span> 页，共 <span class="totalPages"></span> 页 —
      </div>`;

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      margin: {
        top: '2cm',
        bottom: '2cm',
        left: '2.54cm',
        right: '2.54cm',
      },
    });

    fs.writeFileSync(PDF_OUT, pdfBuffer);

    // 估算页数（统计 PDF 内部 /Page 对象数）
    const pageCount = (pdfBuffer.toString('binary').match(/\/Type\s*\/Page[^s]/g) || []).length;
    console.log(`[PDF] 已输出：${PDF_OUT}`);
    console.log(`[PDF] 估计页数：${pageCount} 页`);
    console.log('=== 任务完成 ===');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
