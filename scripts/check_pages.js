const fs = require('fs');
const path = require('path');
const htmlPath = path.resolve(process.cwd(), 'source_code_print_for_pdf.html');
if (!fs.existsSync(htmlPath)) {
  console.error('HTML not found:', htmlPath);
  process.exit(1);
}
const html = fs.readFileSync(htmlPath, 'utf8');
const parts = html.split(/<div class="page">/g).slice(1);
console.log('pages=', parts.length);
let bad = [];
for (let i = 0; i < parts.length; i++) {
  const p = parts[i];
  const headerMatch = p.match(/<div class="header">([\s\S]*?)<\/div>/);
  const footerMatch = p.match(/<div class="footer">([\s\S]*?)<\/div>/);
  const contentMatch = p.match(/<div class="content">([\s\S]*?)<\/div>/);
  const header = headerMatch ? headerMatch[1].trim() : '';
  const footer = footerMatch ? footerMatch[1].trim() : '';
  const content = contentMatch ? contentMatch[1] : '';
  const decoded = content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const lines = decoded.split('\n');
  if (lines.length !== 50) bad.push({ page: i + 1, lines: lines.length });
  if (i === 29)
    console.log(
      'page30 last line:',
      lines[lines.length - 1] ? lines[lines.length - 1].trim() : '<empty>'
    );
  if (i === 30) console.log('page31 first line:', lines[0] ? lines[0].trim() : '<empty>');
  // print header/footer for first page
  if (i === 0) console.log('page1 header:', header, 'footer:', footer);
}
console.log('pages with !=50 lines count=', bad.length);
if (bad.length > 0) console.log('examples:', JSON.stringify(bad.slice(0, 10), null, 2));
process.exit(0);
