const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '..', 'output_combined.txt');
const outputFile = path.join(__dirname, '..', 'source_code_print.html');

let content = fs.readFileSync(inputFile, 'utf-8');
// Normalize line endings to avoid empty line issues
content = content.replace(/\r\n/g, '\n');
let lines = content.split('\n');

// Remove empty lines at the very end
while (lines[lines.length - 1].trim() === '') {
  lines.pop();
}

// Add the copyright header to the beginning
const headerLines = [
  '/* ===========================================================================',
  ' * Pioneer AI Service Framework V1.0.0',
  ' * 版权所有 © 2026 [秦晓望]',
  ' * 提交日期：2026-05-04',
  ' * =========================================================================== */',
  '',
];

lines = [...headerLines, ...lines];

// For soft copyright in China, if lines > 3000, take first 1500 and last 1500
if (lines.length > 3000) {
  const firstHalf = lines.slice(0, 1500);
  const secondHalf = lines.slice(lines.length - 1500);
  lines = [...firstHalf, ...secondHalf];
}

const linesPerPage = 50;
let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>源代码 - 软著申请专用</title>
<style>
  @page {
    size: A4;
    margin: 0;
  }
  body {
    margin: 0;
    padding: 0;
    background: #525659; /* Like PDF viewer background */
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: 'Courier New', Courier, monospace;
    font-size: 10.5pt; /* 5号字 */
    line-height: 14.5pt;
  }
  .page {
    width: 210mm;
    height: 297mm;
    box-sizing: border-box;
    padding: 20mm 15mm 20mm 20mm;
    position: relative;
    overflow: hidden;
    background: white;
    margin: 10mm 0;
    box-shadow: 0 0 10mm rgba(0,0,0,0.5);
  }
  @media print {
    body {
      background: white;
      display: block;
    }
    .page {
      margin: 0;
      box-shadow: none;
      page-break-after: always;
    }
  }
  .header {
    position: absolute;
    top: 10mm;
    left: 20mm;
    right: 15mm;
    text-align: right;
    font-size: 9pt;
    border-bottom: 1px solid #000;
    padding-bottom: 2mm;
    font-family: "Microsoft YaHei", "SimSun", sans-serif;
    color: #000;
  }
  .footer {
    position: absolute;
    bottom: 10mm;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 9pt;
    font-family: "Microsoft YaHei", "SimSun", sans-serif;
    color: #000;
  }
  .content {
    margin-top: 8mm; /* Adjust to ensure 50 lines fit perfectly without touching footer */
    white-space: pre; /* Ensure no wrapping */
    overflow: hidden;
    color: #000;
  }
</style>
</head>
<body>
`;

let pageCount = Math.ceil(lines.length / linesPerPage);

for (let i = 0; i < pageCount; i++) {
  const pageLines = lines.slice(i * linesPerPage, (i + 1) * linesPerPage);

  // Replace HTML special characters
  const pageContent = pageLines
    .map((l) => l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    .join('\n');

  html += `
  <div class="page">
    <div class="header">Pioneer AI Service Framework V1.0.0</div>
    <div class="content">${pageContent}</div>
    <div class="footer">- ${i + 1} -</div>
  </div>
  `;
}

html += `
</body>
</html>
`;

fs.writeFileSync(outputFile, html, 'utf-8');
console.log('Successfully generated', outputFile);
console.log('Total lines processed:', lines.length);
console.log('Total pages:', pageCount);
