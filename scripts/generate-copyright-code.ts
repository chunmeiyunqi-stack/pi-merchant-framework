import * as fs from 'fs';
import * as path from 'path';

/**
 * Configure target directories and patterns
 */
const TARGET_DIRS = ['packages/pi-sdk/src', 'apps/web/src/app', 'apps/admin/src/app'];

const IGNORE_DIRS = ['node_modules', '.next', 'dist', 'prisma/migrations', '__tests__', 'coverage'];

const ALLOWED_EXTS = ['.ts', '.tsx'];
const OUTPUT_FILE = 'copyright-source-code.txt';
const LINES_PER_PAGE = 50;
const TOTAL_PAGES = 60;
const TOTAL_LINES_NEEDED = LINES_PER_PAGE * TOTAL_PAGES; // 3000

const COPYRIGHT_HEADER = `/*
 * 软件名称：先锋人工智能服务框架软件
 * 版本号：V2.0.0
 * 著作权人：秦晓望
 * 开发完成日期：2026年05月
 */\n\n`;

/**
 * Redaction patterns
 */
const REDACTION_PATTERNS = [
  { pattern: /sk-[a-zA-Z0-9]{32,}/g, replacement: '[REDACTED]' },
  { pattern: /Bearer\s+[a-zA-Z0-9._-]+/g, replacement: 'Bearer [REDACTED]' },
  { pattern: /postgresql:\/\/[^\"\']+/g, replacement: 'process.env.DATABASE_URL' },
  { pattern: /http[s]?:\/\/[^\s\"\'\)]+/g, replacement: '[REDACTED]' },
  { pattern: /\"[0-9a-f]{64}\"/g, replacement: '[REDACTED]' },
  { pattern: /api_key:\s*\"[^\"]+\"/g, replacement: 'api_key: [REDACTED]' },
];

/**
 * Recursively get files
 */
function getFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      if (!IGNORE_DIRS.some((d) => filePath.includes(d))) {
        results = results.concat(getFiles(filePath));
      }
    } else {
      if (ALLOWED_EXTS.includes(path.extname(file))) {
        results.push(filePath);
      }
    }
  });
  return results;
}

/**
 * Clean and process code content
 */
function processCode(content: string): string[] {
  // 1. Redaction
  let processed = content;
  REDACTION_PATTERNS.forEach(({ pattern, replacement }) => {
    processed = processed.replace(pattern, replacement);
  });

  // 2. Remove comments (large blocks and pure text)
  // Remove multi-line comments: /* ... */
  processed = processed.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    // Keep JSDoc style if it seems technical, otherwise strip
    return match.startsWith('/**') ? match : '';
  });

  // 3. Split into lines and filter
  const lines = processed.split(/\r?\n/);
  const cleanedLines: string[] = [];

  const inPureJSX = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();

    // Remove consecutive empty lines
    if (line.trim() === '' && cleanedLines[cleanedLines.length - 1]?.trim() === '') {
      continue;
    }

    // Rudimentary JSX filtering: Skip if line looks like pure HTML tag stack
    // This is a heuristic: if a line starts with < and ends with > and contains no TS logic
    if (/^\s*<[a-zA-Z]+.*>\s*$/.test(line) && !/[={}]/.test(line)) {
      // Very basic heuristic to skip some UI boilerplate
      continue;
    }

    cleanedLines.push(line);
  }

  return cleanedLines;
}

/**
 * Main execution
 */
async function main() {
  console.log('Starting source code extraction for copyright...');

  const allExtractedLines: string[] = [];

  for (const dir of TARGET_DIRS) {
    const absPath = path.resolve(process.cwd(), dir);
    if (!fs.existsSync(absPath)) {
      console.warn(`Directory not found: ${dir}`);
      continue;
    }

    console.log(`Processing directory: ${dir}`);
    const files = getFiles(absPath);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const processedLines = processCode(content);
      allExtractedLines.push(`// --- File: ${path.relative(process.cwd(), file)} ---`);
      allExtractedLines.push(...processedLines);
      allExtractedLines.push(''); // Gap between files
    }
  }

  console.log(`Total lines extracted: ${allExtractedLines.length}`);

  let finalLines: string[] = [];

  if (allExtractedLines.length <= TOTAL_LINES_NEEDED) {
    finalLines = allExtractedLines;
  } else {
    const partSize = TOTAL_LINES_NEEDED / 2; // 1500
    console.log(`Extracting first ${partSize} lines and last ${partSize} lines.`);
    const head = allExtractedLines.slice(0, partSize);
    const tail = allExtractedLines.slice(-partSize);
    finalLines = [...head, '// ... [SKIPPED MIDDLE CONTENT] ...', ...tail];
  }

  // Add Header
  let output = COPYRIGHT_HEADER;

  // Apply pagination
  for (let i = 0; i < finalLines.length; i++) {
    output += finalLines[i] + '\n';
    if ((i + 1) % LINES_PER_PAGE === 0 && i + 1 < finalLines.length) {
      output += '\n--- PAGE BREAK ---\n\n';
    }
  }

  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
  console.log(`Success! Result written to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
