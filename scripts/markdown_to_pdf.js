const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function generateHtmlFromMarkdown(inputPath, outputHtmlPath) {
  let content = fs.readFileSync(inputPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');
  let lines = content.split('\n');

  // Remove trailing empty lines
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();

  const linesPerPage = 50;
  const pageCount = Math.ceil(lines.length / linesPerPage);

  const headerText = '先锋人工智能服务框架软件 V2.0.0';

  // Compute precise line-height so 50 lines fit into content area
  // A4 height = 297mm; top+bottom padding = 20mm + 20mm = 40mm; content height = 257mm
  const contentHeightMm = 297 - 40; // 257mm
  const lineHeightMm = contentHeightMm / linesPerPage; // approx 5.14mm

  const css = `
  @page { size: A4; margin: 0; }
  body { margin:0; padding:0; font-family: 'Courier New', monospace; }
  .page { width:210mm; height:297mm; box-sizing:border-box; padding:20mm 15mm 20mm 20mm; background:white; position:relative; overflow:hidden; page-break-after: always; }
  .header { position:absolute; top:10mm; left:0; right:0; text-align:center; font-size:9pt; border-bottom:1px solid #000; padding-bottom:2mm; font-family: "Microsoft YaHei", "SimSun", sans-serif; }
  .footer { position:absolute; bottom:10mm; left:0; right:0; text-align:center; font-size:9pt; font-family: "Microsoft YaHei", "SimSun", sans-serif; }
  .content { margin-top:8mm; white-space:pre; font-size:10.5pt; line-height: ${lineHeightMm}mm; height: ${contentHeightMm}mm; overflow:hidden; }
  `;

  let html = `<!doctype html><html><head><meta charset="utf-8"><title>源代码 - 软著</title><style>${css}</style></head><body>`;

  for (let i = 0; i < pageCount; i++) {
    const pageLines = lines.slice(i * linesPerPage, (i + 1) * linesPerPage);
    const pageContent = pageLines
      .map((l) => l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
      .join('\n');

    html += `\n<div class="page">\n  <div class="header">${headerText}</div>\n  <div class="content">${pageContent}</div>\n  <div class="footer">- ${i + 1} -</div>\n</div>`;
  }

  html += '</body></html>';
  fs.writeFileSync(outputHtmlPath, html, 'utf8');
  return { lines: lines.length, pages: pageCount, htmlPath: outputHtmlPath };
}

async function htmlToPdf(htmlPath, pdfPath, screenshotPaths = {}) {
  // Try launching Puppeteer; prefer bundled Chromium but fallback to local Chrome/Edge if needed
  const commonPaths = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ];

  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  } catch (err) {
    // try local executables
    let launched = false;
    for (const p of commonPaths) {
      if (fs.existsSync(p)) {
        browser = await puppeteer.launch({
          executablePath: p,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        launched = true;
        break;
      }
    }
    if (!launched) throw err;
  }

  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(htmlPath), { waitUntil: 'networkidle0' });

  // Take screenshots of requested page indices (0-based) if provided
  if (
    screenshotPaths &&
    Array.isArray(screenshotPaths.indices) &&
    screenshotPaths.indices.length > 0
  ) {
    const pages = await page.$$('.page');
    if (pages.length > 0) {
      const outDir = screenshotPaths.dir || path.resolve(process.cwd(), 'screenshots');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      for (let idx of screenshotPaths.indices) {
        if (idx >= 0 && idx < pages.length) {
          const outPath = path.resolve(outDir, `page_${idx + 1}.png`);
          await pages[idx].screenshot({ path: outPath });
        }
      }
    }
  }

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
  });
  await browser.close();
}

(async () => {
  try {
    const input = path.resolve(process.cwd(), 'source_code_v2.0.0_copyright_final.md');
    const tmpHtml = path.resolve(process.cwd(), 'source_code_print_for_pdf.html');
    const outPdf = path.resolve(process.cwd(), 'source_code_v2.0.0_copyright_final.pdf');

    if (!fs.existsSync(input)) {
      console.error('Input markdown not found:', input);
      process.exit(1);
    }

    const info = await generateHtmlFromMarkdown(input, tmpHtml);
    console.log('Generated HTML:', info.htmlPath, 'lines=', info.lines, 'pages=', info.pages);
    // capture pages 1, 30, 57 (0-based indices 0,29,56)
    await htmlToPdf(tmpHtml, outPdf, {
      indices: [0, 29, 56],
      dir: path.resolve(process.cwd(), 'screenshots'),
    });
    console.log('Generated PDF:', outPdf);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(2);
  }
})();
