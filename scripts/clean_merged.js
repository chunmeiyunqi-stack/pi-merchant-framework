const fs = require('fs');
const path = require('path');
const infile = path.join(__dirname, '..', 'source_code_v2.0.0_final_FIXED.md');
const outfile = path.join(__dirname, '..', 'source_code_v2.0.0_final_CLEANED.md');
let s = fs.readFileSync(infile, 'utf8');
// 1. Sensitive replacements (preserve process.env.*)
// Replace template-literal patterns like `Bearer ${accessToken}` and `Bearer ${config.apiKey}` and `Key ${apiKey}`
s = s.replace(/Authorization:\s*`?Bearer \s*\${?accessToken}?`?/g, "Authorization: Bearer [REDACTED]");
s = s.replace(/Authorization:\s*`?Bearer \s*\${?config\.apiKey}?`?/g, "Authorization: Bearer [REDACTED]");
// Replace localhost:11434 -> [LOCAL_OLLAMA_URL]
s = s.replace(/localhost:11434/g, '[LOCAL_OLLAMA_URL]');
// Replace http://localhost (any) -> http://[LOCAL_HOST]
s = s.replace(/http:\/\/localhost(?![A-Za-z0-9_\-\.])/g, 'http://[LOCAL_HOST]');
// Replace pi_ long ids (20+ chars) -> pi_YOUR_APP_ID
s = s.replace(/pi_[A-Za-z0-9]{20,}/g, 'pi_YOUR_APP_ID');

// 2. Remove /* */ comment blocks (multiline)
s = s.replace(/\/\*[\s\S]*?\*\//g, '');

// 3. Process line-by-line for // standalone comments, empty lines, and braces-only lines
const lines = s.split(/\r?\n/);
let out = [];
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  // Preserve file separator lines
  if (/^\s*\/\/ --- 文件:/.test(line)) {
    // push separator
    out.push(line.trim());
    // ensure following is a blank line (we'll add a single blank line)
    out.push('');
    // skip subsequent blank lines
    while (i+1 < lines.length && lines[i+1].trim() === '') i++;
    continue;
  }
  // Preserve code fence lines (```...)
  if (/^\s*```/.test(line)) {
    out.push(line.trim());
    continue;
  }
  // Remove lines that are only comments (// ...), but keep inline // comments (have code before)
  if (/^\s*\/\//.test(line)) {
    continue;
  }
  // Remove lines that only contain { or } (with optional spaces)
  if (/^\s*[{}]\s*$/.test(line)) {
    continue;
  }
  // Remove empty lines
  if (line.trim() === '') {
    continue;
  }
  // Normalize leading tabs to 2 spaces
  line = line.replace(/^\t+/g, (m) => '  '.repeat(m.length));
  // Convert sequences of 4 spaces to 2 spaces (basic normalization)
  line = line.replace(/^(( {4})+)/, (m) => '  '.repeat(m.length/4));
  // Trim trailing spaces
  line = line.replace(/\s+$/,'');
  out.push(line);
}
// Reconstruct ensuring file separators are followed by one blank line (already inserted)
let result = out.join('\n');
fs.writeFileSync(outfile, result, 'utf8');
console.log('Wrote cleaned file to', outfile);
process.exit(0);
