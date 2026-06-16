/**
 * gen-copyright-code.js
 * 为软著申请生成 60 页标准源代码文档
 *
 * 用法: node scripts/gen-copyright-code.js
 * 输出: copyright-source-code.txt (项目根目录)
 */

const fs = require('fs');
const path = require('path');

// ---- 配置 ----

const TARGET_DIRS = ['packages/pi-sdk/src', 'apps/web/src/app', 'apps/admin/src/app'];

const IGNORE_DIRS = ['node_modules', '.next', 'dist', '__tests__', '.turbo'];

const ALLOWED_EXTS = ['.ts', '.tsx'];

const OUTPUT_FILE = 'copyright-source-code.txt';

const LINES_PER_PAGE = 50;
const TOTAL_PAGES = 60;
const TOTAL_LINES_NEEDED = LINES_PER_PAGE * TOTAL_PAGES; // 3000

const COPYRIGHT_HEADER = `/*
 * 先锋人工智能服务框架软件 V2.0.0
 * 著作权人：秦晓望
 * 开发完成日期：2026年05月
 */\n\n`;

// ---- 脱敏规则 ----

const REDACTION_RULES = [
  // API Key 模式: sk- 开头的密钥
  { pattern: /sk-[a-zA-Z0-9]{20,}/gi, replacement: '[REDACTED]' },
  // Authorization: Bearer token
  { pattern: /Bearer\s+[a-zA-Z0-9._-]+/g, replacement: 'Bearer [REDACTED]' },
  // 数据库连接 URL
  {
    pattern: /(postgresql|postgres|mysql):\/\/[^"';\s]+/gi,
    replacement: 'process.env.DATABASE_URL',
  },
  // 通用的敏感环境变量值（等号后可能是密码/key 的内容）
  {
    pattern:
      /(DATABASE_URL|PI_API_KEY|NEXTAUTH_SECRET|OPENAI_API_KEY|ANTHROPIC_API_KEY|USAGE_WEBHOOK_URL|MONITORING_WEBHOOK_URL|LICENSE_PAYLOAD)\s*=\s*["']?[^\s"';\n]+/g,
    replacement: '$1=[REDACTED]',
  },
  // 64 位十六进制字符串（通常是密钥或签名）
  { pattern: /["'][0-9a-fA-F]{64}["']/g, replacement: '"[REDACTED]"' },
  // api_key 字段
  {
    pattern: /(api[_-]?key|secret|password)\s*:\s*["'`][^"'`]+["'`]/gi,
    replacement: '$1: "[REDACTED]"',
  },
  // URL 中的敏感信息
  { pattern: /https?:\/\/[^\s"'`)\]]+/g, replacement: '[REDACTED_URL]' },
];

// ---- 工具函数 ----

function getFiles(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        if (!IGNORE_DIRS.some((d) => filePath.includes(d.replace(/\\/g, '/')))) {
          results = results.concat(getFiles(filePath));
        }
      } else {
        const ext = path.extname(file);
        if (ALLOWED_EXTS.includes(ext)) {
          results.push(filePath);
        }
      }
    }
  } catch {
    // 目录不存在则跳过
  }
  return results;
}

function redactContent(content) {
  let result = content;
  for (const { pattern, replacement } of REDACTION_RULES) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function collectLines() {
  const allLines = [];

  for (const dir of TARGET_DIRS) {
    const absPath = path.resolve(process.cwd(), dir);
    if (!fs.existsSync(absPath)) {
      console.warn(`[WARN] 目录不存在，跳过: ${dir}`);
      continue;
    }
    console.log(`[INFO] 扫描目录: ${dir}`);
    const files = getFiles(absPath);
    console.log(`       => 发现 ${files.length} 个源文件`);

    for (const file of files) {
      try {
        let content = fs.readFileSync(file, 'utf-8');
        content = redactContent(content);

        const relativePath = path.relative(process.cwd(), file);
        allLines.push(`// --- File: ${relativePath} ---`);
        const fileLines = content.split(/\r?\n/);
        for (const line of fileLines) {
          const trimmed = line.trimEnd();
          if (trimmed === '' && allLines[allLines.length - 1] === '') {
            continue; // 跳过连续空行
          }
          allLines.push(trimmed);
        }
        allLines.push(''); // 文件间空行
      } catch (err) {
        console.warn(`[WARN] 读取失败: ${file}`, err.message);
      }
    }
  }

  return allLines;
}

function sliceLines(lines) {
  if (lines.length <= TOTAL_LINES_NEEDED) {
    console.log(`[INFO] 总行数 ${lines.length} <= ${TOTAL_LINES_NEEDED}，取全部行`);
    return lines;
  }

  const half = Math.floor(TOTAL_LINES_NEEDED / 2);
  console.log(
    `[INFO] 总行数 ${lines.length} > ${TOTAL_LINES_NEEDED}，取前 ${half} 行 + 后 ${half} 行`
  );
  const head = lines.slice(0, half);
  const tail = lines.slice(-half);
  return [...head, '// ... [SKIPPED MIDDLE CONTENT] ...', ...tail];
}

function paginate(lines) {
  let output = COPYRIGHT_HEADER;

  for (let i = 0; i < lines.length; i++) {
    output += lines[i] + '\n';
    if ((i + 1) % LINES_PER_PAGE === 0 && i + 1 < lines.length) {
      output += '\n--- PAGE BREAK ---\n\n';
    }
  }

  return output;
}

// ---- 主流程 ----

function main() {
  const rootDir = process.cwd();
  console.log(`[INFO] 工作目录: ${rootDir}`);
  console.log('[INFO] 开始提取源代码...\n');

  const extractedLines = collectLines();
  console.log(`\n[INFO] 提取总行数: ${extractedLines}`);

  const finalLines = sliceLines(extractedLines);
  console.log(`[INFO] 最终行数: ${finalLines.length}`);

  const outputPath = path.resolve(rootDir, OUTPUT_FILE);
  const outputContent = paginate(finalLines);

  fs.writeFileSync(outputPath, outputContent, 'utf-8');
  console.log(`\n[SUCCESS] 已生成: ${outputPath}`);
  console.log(`         总行数: ${finalLines.length}`);
  console.log(`         分页数: ${Math.ceil(finalLines.length / LINES_PER_PAGE)}`);
}

main();
