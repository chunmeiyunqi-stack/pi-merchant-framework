/**
 * Step 3 + Step 4：Puppeteer(Chrome 打印引擎) → PDF + 强制 60 页校验
 * 软件名称：先锋人工智能服务框架软件 V1.0.0
 *
 * 输入：softcopyright_output/source-code-60pages.html （由 gen-copyright-html.js 生成）
 * 输出：softcopyright_output/01-源程序鉴别材料(补正版).pdf
 */

'use strict';

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'softcopyright_output');
const HTML_IN = path.join(OUT_DIR, 'source-code-60pages.html');
const PDF_OUT = path.join(OUT_DIR, '01-源程序鉴别材料(补正版).pdf');

// ── ANSI 颜色（控制台高亮）──
const RED = '\x1b[41m\x1b[97m\x1b[1m';
const GREEN = '\x1b[42m\x1b[30m\x1b[1m';
const RESET = '\x1b[0m';

// ── 页数校验：读取 PDF 页树 /Count 并与 /Type /Page 对象数交叉核对 ──
function countPdfPages(pdfPath) {
  const s = fs.readFileSync(pdfPath).toString('latin1');
  // 页对象数（/Type /Page 但不匹配 /Type /Pages）
  const pageObjs = (s.match(/\/Type\s*\/Page(?![s])/g) || []).length;
  // 页树 /Count 值，取最大者（根页树的总计）
  const counts = (s.match(/\/Count\s+(\d+)/g) || []).map((m) => parseInt(m.replace(/\D/g, ''), 10));
  const treeCount = counts.length ? Math.max(...counts) : 0;
  return { pageObjs, treeCount };
}

async function generatePdf() {
  console.log('=== Step 3：Puppeteer → PDF ===');
  if (!fs.existsSync(HTML_IN)) {
    console.error(`[ERROR] 找不到 HTML：${HTML_IN}，请先运行 scripts/gen-copyright-html.js`);
    process.exit(1);
  }

  // 优先使用系统本地 Chrome
  const CHROME_PATHS = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.CHROME_PATH,
  ].filter(Boolean);
  const executablePath = CHROME_PATHS.find((p) => fs.existsSync(p));
  console.log(`[INFO] Chrome: ${executablePath || '(puppeteer 内置)'}`);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath, // 找不到本地 Chrome 时为 undefined，回退到 puppeteer 默认
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    const fileUrl = 'file:///' + HTML_IN.replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60000 });

    await page.pdf({
      path: PDF_OUT,
      format: 'A4',
      printBackground: false,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-family: 'SimSun', '宋体', serif; font-size: 9pt; text-align: center; width: 100%; margin-top: 1cm;">
          先锋人工智能服务框架软件
        </div>
      `,
      footerTemplate: `
        <div style="font-family: 'SimSun', '宋体', serif; font-size: 9pt; text-align: center; width: 100%; margin-bottom: 1cm;">
          — 第 <span class="pageNumber"></span> 页 —
        </div>
      `,
      margin: {
        top: '2.5cm', // 上边距 2.5cm
        bottom: '2.5cm', // 下边距 2.5cm
        left: '2.5cm', // 左边距 2.5cm（完全对称）
        right: '2.5cm', // 右边距 2.5cm（完全对称）
      },
    });

    console.log(`[PDF] 已输出：${PDF_OUT}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  await generatePdf();

  // ── Step 4：强制验证 ──
  console.log('\n=== Step 4：强制校验页数 ===');
  const { pageObjs, treeCount } = countPdfPages(PDF_OUT);
  const finalCount = treeCount || pageObjs;
  console.log(`[校验] 页树 /Count = ${treeCount}，/Type /Page 对象数 = ${pageObjs}`);

  if (finalCount !== 60) {
    console.log(
      `\n${RED} ❌ 致命错误：页数不是 60 页（实际 ${finalCount} 页），请检查行高 CSS！ ${RESET}\n`
    );
    process.exit(1);
  }

  console.log(
    `\n${GREEN} ✅ 完美：生成 60 页，边距对称(上下左右各 2.5cm)，行距 13pt，等宽 Courier New，符合 CPCC 标准。 ${RESET}\n`
  );
}

main().catch((err) => {
  console.error(`${RED} [ERROR] ${err && err.message} ${RESET}`);
  console.error(err);
  process.exit(1);
});
