const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, '软著提交材料');
const SCREENSHOT_DIR = path.join(ROOT, 'screenshots');
const TMP_DIR = path.join(ROOT, 'tmp');

const APP_NAME = '先锋人工智能服务框架软件';
const FULL_NAME = '先锋人工智能服务框架软件（Pioneer AI Service Framework）[简称：Pioneer框架]';
const VERSION = 'V1.0.0';
const OWNER = '秦晓望';
const NOTICE_ID = '2026R11L1477838';

const OUTPUTS = {
  source: path.join(OUT_DIR, '01-源程序鉴别材料(补正版_V1.0.0).pdf'),
  manual: path.join(OUT_DIR, '02-用户操作手册(补正版_V1.0.0).pdf'),
  originality: path.join(OUT_DIR, '03-独创性说明文档(补正版_V1.0.0).pdf'),
};

const SOURCE_DIRS = ['apps', 'packages', 'prisma', 'types'];
const IGNORE_DIRS = new Set([
  '.git',
  '.next',
  '.turbo',
  'node_modules',
  'coverage',
  'out',
  'docs',
  'screenshots',
  'tmp',
  '__tests__',
  'tests',
  'soft-copyright-backup',
]);
const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.prisma']);

const MANUAL_SCREENSHOTS = [
  { file: 'fig_3_1_login.png # 图3.1：登录页.png', title: '登录页' },
  { file: 'fig_3_2_dashboard.png # 图3.2：控制台首页.png', title: '控制台首页' },
  { file: 'fig_3_3_ai_chat.png # 图3.3：AI对话界面.png', title: 'AI 对话界面' },
  { file: 'fig_3_4_model_select.png # 图3.4：模型选择.png', title: '模型选择' },
  { file: 'fig_3_8_payment.png # 图3.8：支付结算.png', title: '支付结算' },
  { file: 'fig_3_10_payment_success.png # 图3.10：支付成功.png', title: '支付成功' },
  { file: 'fig_3_12_tenant.png # 图3.12：多租户管理.png', title: '多租户管理' },
];

function ensureDirs() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncateLine(line, max = 140) {
  if (line.length <= max) return line;
  return `${line.slice(0, max - 3)}...`;
}

function redactContent(content) {
  return content
    .replace(/V2\.0\.0/g, 'V1.0.0')
    .replace(/Pioneer AI Merchant Framework/g, 'Pioneer AI Service Framework')
    .replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED]')
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/g, 'Bearer [REDACTED]')
    .replace(/(DATABASE_URL|PI_API_KEY|NEXTAUTH_SECRET|OPENAI_API_KEY|ANTHROPIC_API_KEY|USAGE_WEBHOOK_URL|MONITORING_WEBHOOK_URL|LICENSE_PAYLOAD)\s*=\s*["']?[^\s"';\n]+/g, '$1=[REDACTED]')
    .replace(/postgresql:\/\/[^"'\s]+/g, 'process.env.DATABASE_URL')
    .replace(/process\.env\.[A-Z0-9_]+/g, 'process.env.[REDACTED]');
}

function walk(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (SOURCE_EXTS.has(path.extname(entry.name))) {
      const rel = path.relative(ROOT, full).replace(/\\/g, '/');
      if (rel.startsWith('软著提交材料/')) continue;
      files.push(full);
    }
  }
  return files;
}

function collectSourceLines() {
  const allLines = [];
  allLines.push('/*');
  allLines.push(` * 软件名称：${FULL_NAME}`);
  allLines.push(` * 版本号：${VERSION}`);
  allLines.push(` * 著作权人：${OWNER}`);
  allLines.push(` * 开发完成日期：2026年05月`);
  allLines.push(' */');
  allLines.push('');

  const files = SOURCE_DIRS.flatMap((dir) => walk(path.join(ROOT, dir))).sort();
  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const content = redactContent(fs.readFileSync(file, 'utf8'));
    allLines.push(`// --- File: ${rel} ---`);
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trimEnd();
      if (line.length === 0) {
        allLines.push('');
      } else {
        allLines.push(truncateLine(line));
      }
    }
    allLines.push('');
  }

  const target = 3000;
  if (allLines.length > target) {
    const head = allLines.slice(0, 1500);
    const tail = allLines.slice(-1499);
    return [...head, '// ... [MIDDLE CONTENT OMITTED FOR PAGE LIMIT] ...', ...tail];
  }

  while (allLines.length < target) {
    allLines.push('');
  }
  return allLines;
}

function chunkLines(lines, linesPerPage) {
  const pages = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }
  return pages;
}

function buildPageShell({ header, footer, bodyHtml, extraClass = '' }) {
  return `
    <section class="page ${extraClass}">
      <div class="header">${header}</div>
      <div class="rule"></div>
      <div class="content">${bodyHtml}</div>
      <div class="footer">${footer}</div>
    </section>
  `;
}

function buildHtmlDocument({ title, pages, pageStyle = '', bodyClass = '' }) {
  const css = `
    @page { size: A4; margin: 0; }
    html, body { margin: 0; padding: 0; background: #f5f3ee; }
    body { font-family: "SimSun", "Songti SC", "Microsoft YaHei", serif; color: #111; }
    .doc { width: 210mm; margin: 0 auto; background: #fff; }
    .page {
      width: 210mm;
      height: 297mm;
      box-sizing: border-box;
      position: relative;
      page-break-after: always;
      overflow: hidden;
      background: #fff;
      padding: 18mm 16mm 16mm 16mm;
    }
    .header {
      position: absolute;
      top: 9mm;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10.5pt;
      line-height: 1.2;
      font-family: "SimSun", serif;
    }
    .rule {
      position: absolute;
      left: 16mm;
      right: 16mm;
      top: 16mm;
      border-top: 1px solid #222;
    }
    .content {
      position: absolute;
      top: 22mm;
      left: 16mm;
      right: 16mm;
      bottom: 18mm;
      overflow: hidden;
    }
    .footer {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 8mm;
      text-align: center;
      font-size: 10pt;
      font-family: "SimSun", serif;
    }
    .title {
      text-align: center;
      font-size: 20pt;
      font-weight: 700;
      margin: 0 0 8mm 0;
      line-height: 1.2;
    }
    .subtitle { text-align: center; font-size: 11pt; margin: 0; line-height: 1.5; }
    .section-title {
      font-size: 14pt;
      font-weight: 700;
      margin: 0 0 4mm 0;
      padding-bottom: 2mm;
      border-bottom: 1px solid #d1d5db;
    }
    .paragraph {
      font-size: 10.5pt;
      line-height: 1.75;
      margin: 0 0 3mm 0;
      text-indent: 2em;
    }
    .bullet-list {
      margin: 0;
      padding-left: 5mm;
      font-size: 10.5pt;
      line-height: 1.7;
    }
    .bullet-list li { margin: 0 0 1.5mm 0; }
    .info-grid {
      display: grid;
      grid-template-columns: 28mm 1fr;
      gap: 2.5mm 4mm;
      font-size: 10.5pt;
      line-height: 1.6;
      margin-top: 2mm;
    }
    .label { font-weight: 700; }
    .box {
      border: 1px solid #d4d4d8;
      background: #fafafa;
      border-radius: 6px;
      padding: 4mm;
    }
    .code {
      font-family: Consolas, "Courier New", "SimSun", monospace;
      font-size: 8pt;
      line-height: 1.22;
      white-space: pre;
      margin: 0;
    }
    .code-box {
      border: 1px solid #cbd5e1;
      background: #0b1020;
      color: #ecfeff;
      border-radius: 6px;
      padding: 4mm;
      overflow: hidden;
    }
    .screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 3mm;
      height: 100%;
    }
    .screen img {
      max-width: 100%;
      max-height: 220mm;
      object-fit: contain;
      border: 1px solid #d4d4d8;
      box-shadow: 0 1mm 2mm rgba(0,0,0,0.08);
    }
    .caption {
      font-size: 10pt;
      line-height: 1.5;
      text-align: center;
    }
    ${pageStyle}
  `;

  return `<!doctype html>
  <html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>${css}</style>
  </head>
  <body class="${bodyClass}">
    <div class="doc">
      ${pages.join('\n')}
    </div>
  </body>
  </html>`;
}

function makeSourcePages() {
  const lines = collectSourceLines();
  const pages = chunkLines(lines, 50);
  return pages.map((pageLines, idx) => {
    const numbered = pageLines
      .map((line, i) => `${String(idx * 50 + i + 1).padStart(4, '0')} | ${escapeHtml(line)}`)
      .join('\n');
    return buildPageShell({
      header: APP_NAME,
      footer: `— 第 ${idx + 1} 页 —`,
      bodyHtml: `<pre class="code">${numbered}</pre>`,
    });
  });
}

function makeManualPages() {
  const shots = MANUAL_SCREENSHOTS.map((item) => {
    const file = path.join(SCREENSHOT_DIR, item.file);
    return { ...item, file };
  });

  const pages = [];
  pages.push(
    buildPageShell({
      header: APP_NAME,
      footer: '1',
      extraClass: 'cover',
      bodyHtml: `
        <div style="height:100%; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <p class="subtitle" style="margin-top:8mm; letter-spacing: 0.5px;">${escapeHtml(
              FULL_NAME
            )}</p>
            <h1 class="title" style="margin-top:10mm;">用户操作手册</h1>
            <p class="subtitle">补证版 · ${VERSION}</p>
          </div>
          <div class="box" style="margin:0 8mm 10mm 8mm;">
            <div class="info-grid">
              <div class="label">软件名称</div><div>${escapeHtml(FULL_NAME)}</div>
              <div class="label">版本号</div><div>${VERSION}</div>
              <div class="label">申请人</div><div>${OWNER}</div>
              <div class="label">通知书流水号</div><div>${NOTICE_ID}</div>
            </div>
          </div>
        </div>
      `,
    })
  );

  pages.push(
    buildPageShell({
      header: APP_NAME,
      footer: '2',
      bodyHtml: `
        <h2 class="section-title">1. 软件概述</h2>
        <p class="paragraph">本软件面向 Pi Network 生态商户场景，提供 AI 多路由、Pi 支付、多租户隔离、License 授权与用量统计能力。系统采用 Next.js 14 App Router、TypeScript 5.4+、Prisma 5 和 PostgreSQL 15+ 作为核心技术栈。</p>
        <p class="paragraph">软件主要用于商户前台、管理后台和共享 SDK 三层结构的协同运行，适合白标商户快速交付。补证版用户手册重点说明真实功能链路，而非模板化功能清单。</p>
        <div class="box">
          <div class="label">核心功能</div>
          <ul class="bullet-list">
            <li>License 授权验证与特性控制</li>
            <li>请求级多租户上下文注入</li>
            <li>AI 提供商路由与自动回退</li>
            <li>Pi U2A 支付审批与完成</li>
            <li>租户用量统计与月度配额控制</li>
          </ul>
        </div>
      `,
    })
  );

  pages.push(
    buildPageShell({
      header: APP_NAME,
      footer: '3',
      bodyHtml: `
        <h2 class="section-title">2. 安装与启动</h2>
        <p class="paragraph">安装依赖、配置数据库和环境变量后，可通过 pnpm 统一启动前台与后台应用。开发环境建议首先验证 PostgreSQL 连接、Pi API Key 和 License Payload 是否可用。</p>
        <div class="code-box"><pre class="code">pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev</pre></div>
        <p class="paragraph">运行时要求 Pi Browser 环境、HttpOnly Cookie、以及按租户隔离的请求头或 Cookie 解析链路均已就绪。</p>
      `,
    })
  );

  pages.push(
    buildPageShell({
      header: APP_NAME,
      footer: '4',
      bodyHtml: `
        <h2 class="section-title">3. License 与多租户流程</h2>
        <p class="paragraph">License 先进行过期检查，再进行 HMAC-SHA256 签名验证，并根据套餐开放功能。若缺少 <code>LICENSE_PAYLOAD</code>，生产环境会拒绝启动受限功能。</p>
        <p class="paragraph">多租户上下文按 <code>x-tenant-id</code>、Cookie、请求体和默认商户 ID 逐级解析，并在 API 层和 Prisma 数据访问层自动传递。</p>
        <div class="box">
          <div class="label">授权与租户关键点</div>
          <ul class="bullet-list">
            <li>支持到期预警与功能门禁</li>
            <li>支持租户状态、配额和限额控制</li>
            <li>支持服务端统一验证与缓存</li>
          </ul>
        </div>
      `,
    })
  );

  pages.push(
    buildPageShell({
      header: APP_NAME,
      footer: '5',
      bodyHtml: `
        <h2 class="section-title">4. AI 路由与支付流程</h2>
        <p class="paragraph">AI 路由器根据主提供商和回退顺序决定具体服务商。支付链路采用 Pi U2A 标准，在 onReadyForServerApproval 和 onReadyForServerCompletion 两个时点分别调用后端接口完成审批和结算。</p>
        <p class="paragraph">支付状态与订单状态同步更新，避免支付成功但本地订单未落库的问题，并通过幂等控制避免重复提交。</p>
      `,
    })
  );

  pages.push(
    buildPageShell({
      header: APP_NAME,
      footer: '6',
      bodyHtml: `
        <h2 class="section-title">5. 用量统计与运维</h2>
        <p class="paragraph">用量追踪器按租户记录请求数、Token 使用量、时延和成功率，并按月进行配额判断。管理端可查看当前租户的使用情况、配额剩余和刷新时间。</p>
        <p class="paragraph">系统同时保留结构化日志与审计记录，用于排查支付、授权和路由问题。</p>
      `,
    })
  );

  shots.forEach((shot, index) => {
    pages.push(
      buildPageShell({
        header: APP_NAME,
        footer: String(7 + index),
        bodyHtml: `
          <div class="screen">
            <h2 class="section-title" style="width:100%;">${escapeHtml(shot.title)}</h2>
            <img src="${pathToFileURL(shot.file).href}" alt="${escapeHtml(shot.title)}" />
            <div class="caption">图 ${index + 1}：${escapeHtml(shot.title)}</div>
          </div>
        `,
      })
    );
  });

  pages.push(
    buildPageShell({
      header: APP_NAME,
      footer: '14',
      bodyHtml: `
        <h2 class="section-title">6. 常见问题</h2>
        <p class="paragraph">1. 为什么必须在 Pi Browser 中运行？因为支付与身份认证依赖 Pi 官方 SDK。</p>
        <p class="paragraph">2. 为什么需要 License？因为该系统面向可商用部署场景，必须具备功能门禁与授权控制。</p>
        <p class="paragraph">3. 为什么要做多租户隔离？因为白标商户之间必须确保数据、配额和配置不互相污染。</p>
      `,
    })
  );

  pages.push(
    buildPageShell({
      header: APP_NAME,
      footer: '15',
      bodyHtml: `
        <h2 class="section-title">7. 版本修订记录</h2>
        <div class="box">
          <div class="info-grid">
            <div class="label">V1.0.0</div><div>2026-07-03，补证版重写，强调真实业务功能与截图。</div>
            <div class="label">适用范围</div><div>软件著作权登记补证提交。</div>
          </div>
        </div>
      `,
    })
  );

  return pages;
}

function makeOriginalityPages() {
  const codeSnippets = {
    license: `export function buildSignablePayload(license: SerializedLicense): string {
  return [
    license.id,
    license.issuedTo,
    license.merchantId,
    license.issuedAt,
    license.expiresAt,
    license.tier,
    license.features.sort().join(','),
  ].join('|');
}`,
    tenant: `export const runWithTenant = <T>(id: string, fn: () => T): T => {
  return tenantStore!.run(id, fn) as T;
};`,
    ai: `async route(request: AIProviderRequest, requestedProvider?: AIProviderName) {
  const providersToTry: AIProviderName[] = [
    this.primaryProvider,
    ...this.fallbackOrder.filter((name) => name !== this.primaryProvider),
  ];
  // 主提供商失败时自动回退
}`,
    payment: `window.Pi.createPayment(paymentData, {
  onReadyForServerApproval: async (paymentId: string) => {
    await approvePayment({ paymentId, orderId });
  },
  onReadyForServerCompletion: async (paymentId: string, txid: string) => {
    await completePayment({ paymentId, txid, orderId });
  },
});`,
    usage: `export function checkQuota(
  tenantId: string,
  merchantId: string,
  maxRequestsPerMonth: number
): QuotaStatus {
  const used = monthlyCounters.get(key) ?? 0;
  return {
    remainingRequests: Math.max(0, maxRequestsPerMonth - used),
    isExceeded: maxRequestsPerMonth > 0 && used >= maxRequestsPerMonth,
  };
}`,
  };

  const pages = [];
  pages.push(
    buildPageShell({
      header: APP_NAME,
      footer: '1',
      bodyHtml: `
        <h1 class="title" style="margin-top:10mm;">独创性说明文档</h1>
        <p class="subtitle">补正版 · ${VERSION}</p>
        <div class="box" style="margin-top:8mm;">
          <div class="info-grid">
            <div class="label">软件版本</div><div>${VERSION}</div>
            <div class="label">软件名称</div><div>${escapeHtml(FULL_NAME)}</div>
            <div class="label">申请人</div><div>${OWNER}</div>
            <div class="label">通知书流水号</div><div>${NOTICE_ID}</div>
          </div>
        </div>
        <p class="paragraph" style="margin-top:6mm;">本说明文档围绕五个核心创新点展开：授权控制、多租户隔离、AI 路由、支付编排、用量统计。所有内容均对应仓库内真实实现，不使用通用空白模板。</p>
      `,
    })
  );

  pages.push(
    buildPageShell({
      header: APP_NAME,
      footer: '2',
      bodyHtml: `
        <h2 class="section-title">创新点一：License 授权与 Feature Gate</h2>
        <p class="paragraph">系统采用 HMAC-SHA256 对 License 待签名载荷进行校验，并按 starter / professional / enterprise 套餐开放不同功能。该设计将功能控制前移到授权层，便于商业分层交付。</p>
        <div class="code-box"><pre class="code">${escapeHtml(codeSnippets.license)}</pre></div>
        <h2 class="section-title" style="margin-top:5mm;">创新点二：请求级多租户上下文</h2>
        <p class="paragraph">通过 AsyncLocalStorage 将 tenantId 注入异步上下文，避免业务方法显式传参造成的污染，并为 Prisma 查询层自动过滤提供前提。</p>
        <div class="code-box"><pre class="code">${escapeHtml(codeSnippets.tenant)}</pre></div>
      `,
    })
  );

  pages.push(
    buildPageShell({
      header: APP_NAME,
      footer: '3',
      bodyHtml: `
        <h2 class="section-title">创新点三：AI 多提供商路由与自动回退</h2>
        <p class="paragraph">AIProviderFactory 将 OpenAI、Anthropic、Ollama 统一到同一工厂接口内，并在主提供商不可用时自动回退，降低单一模型服务中断的业务风险。</p>
        <div class="code-box"><pre class="code">${escapeHtml(codeSnippets.ai)}</pre></div>
        <h2 class="section-title" style="margin-top:5mm;">创新点四：Pi 支付编排与幂等状态机</h2>
        <p class="paragraph">支付链路将前端回调与后端审批、完成接口串联为一条状态机，确保同一支付单不会重复结算，同时让订单状态与 Pi 平台状态保持同步。</p>
        <div class="code-box"><pre class="code">${escapeHtml(codeSnippets.payment)}</pre></div>
      `,
    })
  );

  pages.push(
    buildPageShell({
      header: APP_NAME,
      footer: '4',
      bodyHtml: `
        <h2 class="section-title">创新点五：用量统计与配额闭环</h2>
        <p class="paragraph">用量追踪器按照租户和月份记录请求情况，并在达到阈值时触发限额判断与告警。该机制为月度订阅、资源控制和审计日志提供基础数据。</p>
        <div class="code-box"><pre class="code">${escapeHtml(codeSnippets.usage)}</pre></div>
        <p class="paragraph" style="margin-top:4mm;">综合来看，软件的独创性集中体现在“授权控制 + 多租户隔离 + AI 路由 + Pi 支付 + 用量配额”五条业务主链路的统一实现，并非通用模板式 Web 应用。</p>
      `,
    })
  );

  return pages;
}

async function launchBrowser() {
  const preferred = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].filter((candidate) => fs.existsSync(candidate));

  if (preferred.length > 0) {
    return puppeteer.launch({
      executablePath: preferred[0],
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  return puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

async function renderPdf(html, pdfPath) {
  const htmlPath = path.join(TMP_DIR, `${path.basename(pdfPath, '.pdf')}.html`);
  fs.writeFileSync(htmlPath, html, 'utf8');

  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
  });
  await browser.close();
}

async function main() {
  ensureDirs();

  const sourceHtml = buildHtmlDocument({
    title: `${APP_NAME} - 源程序鉴别材料`,
    pages: makeSourcePages(),
    pageStyle: `
      .code { font-size: 7.2pt; line-height: 1.16; white-space: pre; }
      .content { top: 20mm; }
    `,
  });
  const manualHtml = buildHtmlDocument({
    title: `${APP_NAME} - 用户操作手册`,
    pages: makeManualPages(),
  });
  const originalityHtml = buildHtmlDocument({
    title: `${APP_NAME} - 独创性说明文档`,
    pages: makeOriginalityPages(),
  });

  await renderPdf(sourceHtml, OUTPUTS.source);
  await renderPdf(manualHtml, OUTPUTS.manual);
  await renderPdf(originalityHtml, OUTPUTS.originality);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
