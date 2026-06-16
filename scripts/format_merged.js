const fs = require('fs');
const path = require('path');
const infile = path.join(__dirname, '..', 'source_code_v2.0.0_FINAL_SOFTCOPY.md');
const outfile = path.join(__dirname, '..', 'source_code_v2.0.0_FINAL_SOFTCOPY_FORMATTED.md');
let text = fs.readFileSync(infile, 'utf8');
// Split into lines and process fenced code blocks
const lines = text.split(/\r?\n/);
let out = [];
let inFence = false;
let fenceLang = '';
let fenceBuf = [];
function flushFence() {
  if (!inFence) return;
  const code = fenceBuf.join('\n');
  let formatted = code;
  if (fenceLang === 'json') {
    try {
      const obj = JSON.parse(code);
      formatted = JSON.stringify(obj, null, 2);
    } catch (e) {
      // fallback: keep as-is
      formatted = code;
    }
  } else if (fenceLang === 'prisma' || fenceLang === 'schema.prisma') {
    // Basic prisma formatter: ensure braces and each field on its own line
    formatted = code
      .replace(/\r?\n/g, '\n')
      .replace(/\t/g, '  ')
      .split('\n')
      .map((l) => l.trim())
      .join('\n')
      .replace(/\{\s*/g, '{\n')
      .replace(/\s*\}/g, '\n}')
      .replace(/,\s*/g, ',\n')
      .replace(/\)\s*\{/g, ') {\n')
      .replace(/enum\s+([A-Za-z0-9_]+)\s*\{\s*([^}]*)\}/g, (m, name, body) => {
        const vals = body.replace(/\r?\n/g, ' ').trim().split(/\s+/).filter(Boolean);
        return `enum ${name} {\n  ${vals.join('\n  ')}\n}`;
      })
      .replace(/model\s+([A-Za-z0-9_]+)\s*\{\s*([^}]*)\}/g, (m, name, body) => {
        const fields = body
          .trim()
          .split(/;|\n/)
          .map((s) => s.trim())
          .filter(Boolean);
        const fieldLines = fields.map((f) => '  ' + f.replace(/\s+/g, ' '));
        return `model ${name} {\n${fieldLines.join('\n')}\n}`;
      });
  } else if (
    fenceLang === 'typescript' ||
    fenceLang === 'ts' ||
    fenceLang === 'javascript' ||
    fenceLang === 'tsv' ||
    fenceLang === 'tsx' ||
    fenceLang === 'js'
  ) {
    // Heuristic TypeScript formatter
    formatted = code
      .replace(/\t/g, '  ')
      .replace(/\s+$/gm, '')
      // put braces on their own lines
      .replace(/\s*\{\s*/g, ' {\n')
      .replace(/\s*\}\s*/g, '\n}')
      // split multiple statements separated by ; into lines
      .replace(/;\s*/g, ';\n')
      // ensure common keywords start on new lines
      .replace(/\)\s*\{/g, ') {\n')
      .replace(/\}\s*else/g, '}\nelse')
      // split before return, const, let, if, for, export, import, try, catch
      .replace(
        /\s*(?=(return|const |let |if\s*\(|for\s*\(|export |import |try\s*\{|catch\s*\(|await\s))/g,
        '\n'
      )
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        // indent lines consistently: naive block indent by counting braces
        return l;
      })
      .join('\n');
    // Now apply simple indent based on brace depth
    const lines2 = formatted.split('\n');
    let depth = 0;
    for (let i = 0; i < lines2.length; i++) {
      let line = lines2[i].trim();
      if (line === '}') {
        depth = Math.max(0, depth - 1);
      }
      lines2[i] = '  '.repeat(depth) + line;
      if (line.endsWith('{')) depth++;
    }
    formatted = lines2.join('\n');
  }
  out.push('```' + fenceLang);
  out.push(formatted);
  out.push('```');
  inFence = false;
  fenceLang = '';
  fenceBuf = [];
}
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const fenceStart = line.match(/^\s*```\s*(\w+)?/);
  if (fenceStart) {
    if (inFence) {
      // closing fence
      flushFence();
    } else {
      inFence = true;
      fenceLang = (fenceStart[1] || '').toLowerCase();
      out.push('```' + fenceLang);
      // if code block is empty we'll handle on close
    }
    // if opening line may contain nothing else
    // but we skip adding this line again
    // consume until next lines will be part of fenceBuf
    // Next iterations will gather
    // But we must not push the opening line twice
    // For opening, we've already pushed
    // For closing, flushFence handles pushing closing fence
    if (!inFence) {
      // closed immediately
    }
    continue;
  }
  if (inFence) {
    fenceBuf.push(line);
  } else {
    out.push(line);
  }
}
// If file ends while in fence
if (inFence) flushFence();
// Post-processing: ensure metadata header 4 lines at top each on its own line
// Trim leading/trailing blank lines
while (out.length && out[0].trim() === '') out.shift();
while (out.length && out[out.length - 1].trim() === '') out.pop();
// Ensure single blank line after each file separator line
let final = [];
for (let i = 0; i < out.length; i++) {
  final.push(out[i]);
  if (/^\/\/ --- 文件:/.test(out[i])) {
    if (!(i + 1 < out.length && out[i + 1].trim() === '')) final.push('');
  }
}
final = final.join('\n') + '\n';
fs.writeFileSync(outfile, final, 'utf8');
console.log('Wrote formatted file to', outfile);
