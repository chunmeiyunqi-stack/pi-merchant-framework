/**
 * 任务 2：用户操作手册 PDF 生成器（含自动截图）
 * 软件名称：先锋人工智能服务框架软件 V1.0.0
 * 著作权人：秦晓望
 *
 * 输出：
 *   docs/screenshots/01-home.png  ..  06-settings.png
 *   softcopyright_output/02-用户操作手册(补正版).pdf
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHOT_DIR = path.join(ROOT, 'docs', 'screenshots');
const OUT_DIR = path.join(ROOT, 'softcopyright_output');
const PDF_OUT = path.join(OUT_DIR, '02-用户操作手册(补正版).pdf');

const SOFT_NAME = '先锋人工智能服务框架软件';
const VERSION = 'V1.0.0';
const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

// ─── 需要截图的页面列表 ───────────────────────────────────────────
const PAGES_TO_CAPTURE = [
  { route: '/login', name: '01-login', caption: '图1：系统登录界面' },
  { route: '/dashboard', name: '02-dashboard', caption: '图2：客户仪表盘界面' },
  { route: '/ai', name: '03-ai', caption: '图3：AI 智能助手界面' },
  { route: '/checkout', name: '04-payment', caption: '图4：支付确认界面' },
  { route: '/payment/history', name: '05-history', caption: '图5：支付历史记录' },
  { route: '/admin', name: '06-admin', caption: '图6：管理后台数据概览' },
  { route: '/settings', name: '07-settings', caption: '图7：店铺设置界面' },
];

// ─── 自动截图（Playwright）────────────────────────────────────────
async function takeScreenshots() {
  if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

  // 动态 require playwright，如未安装则静默跳过并使用占位图
  let playwright;
  try {
    playwright = require('playwright');
  } catch (_e) {
    console.warn('[WARN] Playwright 未安装，使用占位截图');
    return generatePlaceholderScreenshots();
  }

  const CHROME_PATHS = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.CHROME_PATH,
  ].filter(Boolean);
  const chromeExe = CHROME_PATHS.find((p) => require('fs').existsSync(p));

  const browser = await playwright.chromium.launch({
    headless: true,
    executablePath: chromeExe,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  const results = [];

  for (const item of PAGES_TO_CAPTURE) {
    const outPath = path.join(SHOT_DIR, `${item.name}.png`);
    try {
      await page.goto(`${BASE_URL}${item.route}`, {
        waitUntil: 'networkidle',
        timeout: 15000,
      });
      await page.waitForTimeout(1000); // 等待动画稳定
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`[截图] ${item.name}.png ✓`);
      results.push({ ...item, path: outPath, ok: true });
    } catch (err) {
      console.warn(`[截图] ${item.name} 失败：${err.message}，使用占位图`);
      generateOnePlaceholder(outPath, item.caption);
      results.push({ ...item, path: outPath, ok: false });
    }
  }

  await browser.close();
  return results;
}

// ─── 占位截图（SVG → PNG via sharp 或直接生成 SVG）────────────────
function generatePlaceholderScreenshots() {
  const results = [];
  for (const item of PAGES_TO_CAPTURE) {
    const outPath = path.join(SHOT_DIR, `${item.name}.png`);
    generateOnePlaceholder(outPath, item.caption);
    results.push({ ...item, path: outPath, ok: false });
  }
  return results;
}

function generateOnePlaceholder(outPath, caption) {
  // 写一个最小 PNG（1×1 白色像素），后续 HTML 渲染时会在占位框中显示文字
  // 实际上此处直接标记 path 为 null，HTML 侧用文字占位框替代
  try {
    fs.writeFileSync(outPath, Buffer.alloc(0));
  } catch (_e) {
    /* skip */
  }
}

// ─── 图片 → base64 DataURL ────────────────────────────────────────
// 优先使用 docs/screenshots/ 中已有截图，再尝试 screenshots/ 目录
const SHOT_CANDIDATES = {
  '01-login': [
    'screenshots/图1_系统登录界面.png',
    'screenshots/fig_3_1_login.png  # 图3.1：登录页.png',
    'docs/screenshots/01-login.png',
  ],
  '02-dashboard': [
    'screenshots/图2_客户仪表盘界面.png',
    'screenshots/fig_3_2_dashboard.png # 图3.2：控制台首页.png',
    'docs/screenshots/02-dashboard.png',
  ],
  '03-ai': [
    'screenshots/图3_AI智能助手界面.png',
    'screenshots/fig_3_3_ai_chat.png # 图3.3：AI对话界面.png',
    'docs/screenshots/03-ai-chat.png',
  ],
  '04-payment': [
    'screenshots/图4_支付确认界面.png',
    'screenshots/fig_3_9_payment_confirm.png# 图3.9：支付确认.png',
    'docs/screenshots/04-checkout.png',
  ],
  '05-history': [
    'screenshots/图5_支付历史记录.png',
    'screenshots/fig_3_6_history_list.png# 图3.6：历史记录列表.png',
    'docs/screenshots/05-payment-history.png',
  ],
  '06-admin': [
    'screenshots/图6_管理后台数据概览.png',
    'docs/screenshots/06-admin-dashboard.png',
    'screenshots/fig_3_2_dashboard.png # 图3.2：控制台首页.png',
  ],
  '07-settings': [
    'screenshots/图7_店铺设置界面.png',
    'screenshots/fig_3_11_account.png # 图3.11：账户设置.png',
    'docs/screenshots/07-settings.png',
  ],
};

function imgToDataUrl(imgPath) {
  if (!imgPath) return null;
  const abs = path.isAbsolute(imgPath) ? imgPath : path.join(ROOT, imgPath);
  if (!fs.existsSync(abs)) return null;
  const buf = fs.readFileSync(abs);
  if (buf.length < 500) return null; // 占位空文件
  return 'data:image/png;base64,' + buf.toString('base64');
}

function findBestShot(name) {
  const candidates = SHOT_CANDIDATES[name] || [];
  for (const c of candidates) {
    const abs = path.join(ROOT, c);
    if (fs.existsSync(abs) && fs.statSync(abs).size > 500) {
      return abs;
    }
  }
  return null;
}

// ─── 生成手册 HTML ────────────────────────────────────────────────
function buildManualHtml(shotResults) {
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

  function screenshotBlock(item) {
    const bestPath = findBestShot(item.name);
    const dataUrl = bestPath ? imgToDataUrl(bestPath) : null;
    if (dataUrl) {
      return `
        <figure class="screenshot">
          <img src="${dataUrl}" alt="${item.caption}" />
          <figcaption>${item.caption}</figcaption>
        </figure>`;
    }
    return `
      <figure class="screenshot placeholder">
        <div class="placeholder-box">[ 截图：${item.caption} ]<br>
          <small>（实际运行界面截图，请在系统启动后重新生成）</small></div>
        <figcaption>${item.caption}</figcaption>
      </figure>`;
  }

  const shotMap = {};
  for (const r of shotResults) shotMap[r.name] = r;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
  @page {
    size: A4;
    margin: 0;
  }
  * { box-sizing: border-box; }
  body {
    font-family: SimSun, '宋体', serif;
    font-size: 12pt;
    line-height: 1.8;
    color: #000;
  }
  h1 {
    font-size: 18pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 6pt;
    font-family: SimHei, '黑体', sans-serif;
  }
  h2 {
    font-size: 14pt;
    font-weight: bold;
    margin-top: 18pt;
    margin-bottom: 6pt;
    font-family: SimHei, '黑体', sans-serif;
    border-bottom: 1pt solid #000;
    padding-bottom: 3pt;
  }
  h3 {
    font-size: 12pt;
    font-weight: bold;
    margin-top: 12pt;
    margin-bottom: 4pt;
  }
  p { margin: 6pt 0; text-indent: 2em; }
  ul, ol { margin: 6pt 0 6pt 2em; }
  li { margin: 3pt 0; }
  .cover {
    text-align: center;
    padding: 60pt 0;
    page-break-after: always;
  }
  .cover p { text-indent: 0; }
  .cover .meta { margin-top: 40pt; font-size: 11pt; line-height: 2.2; }
  .section { page-break-inside: avoid; }
  .chapter { page-break-before: always; }
  figure.screenshot {
    text-align: center;
    margin: 16pt 0;
    page-break-inside: avoid;
  }
  figure.screenshot img {
    max-width: 100%;
    max-height: 320pt;
    border: 1pt solid #ccc;
    box-shadow: 2pt 2pt 4pt rgba(0,0,0,0.15);
  }
  figure.screenshot .placeholder-box {
    width: 100%;
    height: 160pt;
    border: 1pt dashed #999;
    background: #f8f8f8;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 10pt;
    color: #666;
    line-height: 1.6;
  }
  figcaption {
    font-size: 10pt;
    color: #444;
    margin-top: 4pt;
    text-indent: 0;
  }
  .note {
    background: #f5f5f5;
    border-left: 3pt solid #666;
    padding: 6pt 10pt;
    margin: 8pt 0;
    font-size: 10.5pt;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8pt 0;
    font-size: 10.5pt;
  }
  th, td {
    border: 0.5pt solid #999;
    padding: 4pt 8pt;
    text-align: left;
  }
  th { background: #eee; font-weight: bold; }
  code {
    font-family: 'Courier New', monospace;
    font-size: 9pt;
    background: #f0f0f0;
    padding: 1pt 3pt;
    border-radius: 2pt;
  }
</style>
</head>
<body>

<!-- ═══ 封面页 ═══ -->
<div class="cover">
  <h1>${SOFT_NAME}</h1>
  <h2 style="border:none; font-size:14pt; text-align:center;">用户操作手册</h2>
  <div class="meta">
    <p>版本号：${VERSION}</p>
    <p>著作权人：秦晓望</p>
    <p>文档日期：${dateStr}</p>
    <p>适用范围：商户接入方 / 系统管理员 / 开发集成方</p>
  </div>
</div>

<!-- ═══ 目录 ═══ -->
<div class="chapter">
  <h2>目录</h2>
  <p>第一章　软件概述 ……………………………………………… 3</p>
  <p>第二章　系统环境与安装配置 ………………………………… 4</p>
  <p>第三章　用户登录与身份验证 ………………………………… 5</p>
  <p>第四章　AI 服务调用功能操作说明 ………………………… 7</p>
  <p>第五章　Pi Network 支付功能操作说明 …………………… 9</p>
  <p>第六章　商户管理后台操作说明 …………………………… 11</p>
  <p>第七章　系统配置与 License 管理 ………………………… 13</p>
  <p>第八章　常见问题与故障排除 ……………………………… 15</p>
  <p>附录　　环境变量配置参考表 ……………………………… 16</p>
</div>

<!-- ═══ 第一章 ═══ -->
<div class="chapter">
  <h2>第一章　软件概述</h2>

  <h3>1.1 软件简介</h3>
  <p>${SOFT_NAME}（Pioneer AI Service Framework，简称 PASF）是一套面向 Pi Network 生态的人工智能服务集成框架。本软件将多家主流 AI 大模型服务提供商（OpenAI、Anthropic Claude、Ollama 本地模型）统一抽象为单一 API 接口，并深度集成 Pi Network 区块链原生支付（U2A，User-to-App），为商户提供开箱即用的 AI 能力与支付能力。</p>

  <h3>1.2 核心功能模块</h3>
  <ul>
    <li><strong>AI 多提供商智能路由</strong>：支持 OpenAI GPT、Anthropic Claude、Ollama 本地大模型，主提供商故障时自动降级切换，用户无感知。</li>
    <li><strong>Pi Network 原生支付</strong>：完整实现 U2A 支付生命周期（创建→审批→链上确认→完成），内置幂等性保护和孤儿支付处理。</li>
    <li><strong>多租户数据隔离</strong>：基于 AsyncLocalStorage + Prisma 中间件自动注入 merchantId，零代码感知的数据边界保护。</li>
    <li><strong>License 离线授权验证</strong>：HMAC-SHA256 离线签名验证，支持 Starter / Professional / Enterprise 三级套餐。</li>
    <li><strong>实时用量统计</strong>：内存缓冲 + 定时 Flush，微秒级 API 调用追踪，配额超 80% 自动预警。</li>
  </ul>

  <h3>1.3 适用对象</h3>
  <p>本手册适用于以下角色的用户：商户接入方（负责集成 SDK 和调用 AI 接口）、系统管理员（负责后台配置和 License 管理）、最终用户（通过系统使用 AI 服务和发起 Pi 支付）。</p>

  ${screenshotBlock(shotMap['01-login'])}
</div>

<!-- ═══ 第二章 ═══ -->
<div class="chapter">
  <h2>第二章　系统环境与安装配置</h2>

  <h3>2.1 运行环境要求</h3>
  <table>
    <tr><th>组件</th><th>最低要求</th><th>推荐配置</th></tr>
    <tr><td>操作系统</td><td>Linux / macOS / Windows 10+</td><td>Ubuntu 22.04 LTS</td></tr>
    <tr><td>Node.js</td><td>v18.0.0</td><td>v22.x LTS</td></tr>
    <tr><td>数据库</td><td>PostgreSQL 14</td><td>PostgreSQL 16</td></tr>
    <tr><td>内存</td><td>2 GB</td><td>4 GB+</td></tr>
    <tr><td>浏览器（用户端）</td><td>Pi Browser（支持 Pi SDK）</td><td>Pi Browser 最新版</td></tr>
  </table>

  <h3>2.2 安装步骤</h3>
  <ol>
    <li>克隆项目代码仓库：<code>git clone &lt;repo-url&gt; PiMerchantFramework</code></li>
    <li>安装依赖：<code>pnpm install</code></li>
    <li>复制环境变量模板：<code>cp .env.example .env.local</code></li>
    <li>配置必填环境变量（详见附录）：<code>PI_API_KEY</code>、<code>DATABASE_URL</code>、<code>PI_SESSION_SECRET</code></li>
    <li>执行数据库迁移：<code>npx prisma migrate deploy</code></li>
    <li>启动服务：<code>pnpm run dev</code>（开发环境）或 <code>pnpm run build &amp;&amp; pnpm start</code>（生产环境）</li>
  </ol>

  <h3>2.3 目录结构说明</h3>
  <p>项目采用 pnpm Monorepo 结构，主要目录如下：</p>
  <ul>
    <li><code>packages/pi-sdk/</code>：核心 SDK 包，包含 AI 路由、多租户、License、用量统计等核心模块</li>
    <li><code>apps/web/</code>：面向最终用户的 Next.js 前端应用，包含收银台、AI 对话界面、商户后台</li>
    <li><code>apps/web/src/app/api/</code>：后端 API 路由（Next.js App Router）</li>
    <li><code>prisma/</code>：数据库 Schema 定义（Prisma ORM）</li>
  </ul>
</div>

<!-- ═══ 第三章 ═══ -->
<div class="chapter">
  <h2>第三章　用户登录与身份验证</h2>

  <h3>3.1 Pi Network 身份验证流程</h3>
  <p>本软件使用 Pi Network 官方身份验证（Pi Authentication）作为唯一登录方式。用户无需注册账号，直接使用 Pi Network 账户完成身份验证。</p>

  <p><strong>身份验证步骤：</strong></p>
  <ol>
    <li>用户在 <strong>Pi Browser</strong> 中打开系统首页（地址见部署配置）。</li>
    <li>系统检测到 Pi Browser 环境后，显示"验证 Pi 身份"按钮。</li>
    <li>用户点击按钮，Pi Browser 弹出授权弹窗，请求以下权限：<code>username</code>（获取用户名）和 <code>payments</code>（支付权限）。</li>
    <li>用户在 Pi Browser 中确认授权后，系统获取 <code>accessToken</code> 和用户信息（<code>uid</code>、<code>username</code>）。</li>
    <li>系统后端调用 Pi Platform API 验证 Token 有效性，验证通过后创建会话，跳转至对应功能页面。</li>
  </ol>

  <div class="note">
    <strong>注意：</strong>本系统仅支持在 Pi Browser 中运行的支付功能。若在普通浏览器中访问，支付功能将显示"请在 Pi Browser 中打开以使用支付功能"提示，但 AI 服务功能可正常使用。
  </div>

  ${screenshotBlock(shotMap['02-dashboard'])}

  <h3>3.2 会话管理</h3>
  <p>登录成功后，系统生成 HMAC-SHA256 签名的 Session Token（有效期 1 小时），存储在 HTTP-only Cookie 中。Token 包含用户的 Pi UID 和过期时间，服务端每次请求均验证签名，防止 Token 被篡改。</p>

  <h3>3.3 退出登录</h3>
  <p>用户可在管理后台右上角点击"退出登录"按钮，系统调用 <code>POST /api/auth/logout</code> 清除 Session Cookie，完成退出。</p>
</div>

<!-- ═══ 第四章 ═══ -->
<div class="chapter">
  <h2>第四章　AI 服务调用功能操作说明</h2>

  <h3>4.1 AI 智能对话功能</h3>
  <p>系统提供多提供商 AI 对话功能，用户可在 AI 服务界面与 GPT-4o、Claude 3.5 Sonnet 或本地 Ollama 模型进行交互。</p>

  <h3>4.2 操作步骤</h3>
  <ol>
    <li>完成 Pi 身份验证并登录后台后，在左侧导航栏点击"<strong>AI 服务</strong>"。</li>
    <li>在顶部下拉菜单选择 AI 提供商（默认使用系统配置的主提供商）：
      <ul>
        <li><strong>OpenAI GPT-4o</strong>：适合通用问答、代码生成</li>
        <li><strong>Anthropic Claude</strong>：适合长文档分析、专业推理</li>
        <li><strong>Ollama（本地）</strong>：适合私密数据处理，无需联网</li>
      </ul>
    </li>
    <li>在输入框中输入问题或指令，点击"发送"或按 <code>Ctrl+Enter</code>。</li>
    <li>系统实时以流式方式返回 AI 响应，用户可随时终止生成。</li>
    <li>若当前选择的提供商不可用，系统自动切换至备选提供商，页面提示"已切换至备用服务"。</li>
  </ol>

  ${screenshotBlock(shotMap['03-ai'])}

  <h3>4.3 AI 路由容错说明</h3>
  <p>系统内置自动容错降级机制。当主 AI 提供商响应超时（默认 30 秒）或返回错误时，系统自动按配置顺序尝试下一个提供商。整个切换过程对用户透明，响应延迟增加约 100-500ms。容错切换事件将记录在系统日志中，管理员可在后台"系统日志"页面查看。</p>

  <h3>4.4 Token 用量与配额</h3>
  <p>系统对每个商户租户实施月度 API 调用配额控制。当月度用量达到配额上限的 80% 时，系统向管理员发送预警通知；达到 100% 时，AI 服务调用将返回"配额已耗尽"错误提示，可联系服务商升级套餐。当前用量可在管理后台的"用量统计"页面实时查看。</p>
</div>

<!-- ═══ 第五章 ═══ -->
<div class="chapter">
  <h2>第五章　Pi Network 支付功能操作说明</h2>

  <h3>5.1 Pi 收银台界面</h3>
  <p>系统提供完整的 Pi 原生支付流程，用户通过 Pi Browser 访问收银台页面完成支付。</p>

  ${screenshotBlock(shotMap['04-payment'])}

  <h3>5.2 支付操作步骤</h3>
  <ol>
    <li><strong>身份验证</strong>：打开收银台页面后，系统检测 Pi Browser 环境，显示商品信息（订单金额：π 25.00，授权期：12 个月）。</li>
    <li><strong>发起支付</strong>：
      <ul>
        <li>若已通过 Pi 身份验证：页面显示"使用 Pi Wallet 支付"按钮，用户名已显示在界面上方。</li>
        <li>若尚未验证：按钮显示"验证 Pi 身份并支付"，点击后先完成身份验证再自动触发支付。</li>
      </ul>
    </li>
    <li><strong>Pi Browser 钱包确认</strong>：Pi Browser 弹出原生支付弹窗，显示支付金额和备注（先锋 AI 框架 - 专业架构版 年度授权），用户在 Pi Browser 中确认支付。</li>
    <li><strong>服务端处理</strong>：系统后端依次调用 Pi Platform API 的 Approve（审批）和 Complete（完成）接口，完成链上确认。</li>
    <li><strong>支付结果</strong>：支付成功后跳转至"订单支付成功"页面，授权许可即时生效，可进入管理后台。</li>
  </ol>

  <h3>5.3 支付状态说明</h3>
  <table>
    <tr><th>状态</th><th>含义</th><th>用户操作</th></tr>
    <tr><td>PENDING</td><td>支付已发起，等待审批</td><td>等待，勿关闭页面</td></tr>
    <tr><td>PENDING_APPROVAL</td><td>服务端已接收，待链上确认</td><td>等待，勿关闭页面</td></tr>
    <tr><td>COMPLETED</td><td>支付成功，链上已确认</td><td>可进入系统</td></tr>
    <tr><td>CANCELLED</td><td>用户取消支付</td><td>可重新发起</td></tr>
  </table>
  <h3>5.4 支付历史查看</h3>
  <p>用户可在管理后台“订单管理”页面查看所有历史支付记录，包括支付时间、金额、链上状态和交易 ID（txid），支持按时间范围和支付状态筛选查询。</p>

  ${screenshotBlock(shotMap['05-history'])}</div>

<!-- ═══ 第六章 ═══ -->
<div class="chapter">
  <h2>第六章　商户管理后台操作说明</h2>

  ${screenshotBlock(shotMap['06-admin'])}

  <h3>6.1 后台主界面说明</h3>
  <p>管理后台提供商户运营的全面管理功能，主要包括以下功能区：</p>
  <ul>
    <li><strong>数据概览</strong>：显示当月 AI 调用次数、支付订单数、活跃用户数等核心指标</li>
    <li><strong>订单管理</strong>：查看所有支付订单的详情、状态和 Pi 链上交易 ID</li>
    <li><strong>会员管理</strong>：管理订阅用户的会员权限、有效期和权益配置</li>
    <li><strong>AI 服务配置</strong>：设置 AI 主提供商、备选顺序和各模型参数</li>
    <li><strong>用量统计</strong>：查看月度 API 调用分布、各提供商使用占比、响应延迟趋势</li>
    <li><strong>License 管理</strong>：查看当前授权状态、功能套餐和到期日期</li>
  </ul>

  <h3>6.2 API 凭证管理</h3>
  <p>点击左侧菜单"API 凭证"进入凭证管理页面。该页面展示当前配置的 API Key 状态（已配置/未配置），管理员可在此生成新的访问令牌供第三方系统集成使用。</p>

  <div class="note">
    <strong>安全提示：</strong>API Key 属于敏感凭证，请勿将其提交至代码仓库或分享给未授权人员。建议定期轮换 API Key，并通过环境变量（非硬编码）方式配置。
  </div>
</div>

<!-- ═══ 第七章 ═══ -->
<div class="chapter">
  <h2>第七章　系统配置与 License 管理</h2>

  ${screenshotBlock(shotMap['07-settings'])}

  <h3>7.1 License 套餐说明</h3>
  <table>
    <tr><th>套餐</th><th>功能特性</th><th>月度配额</th></tr>
    <tr><td>Starter（入门版）</td><td>AI 路由</td><td>1,000 次</td></tr>
    <tr><td>Professional（专业版）</td><td>AI 路由 + 流式响应 + 用量统计 + Webhook 监控</td><td>10,000 次</td></tr>
    <tr><td>Enterprise（企业版）</td><td>全功能（含多租户、高级分析）</td><td>100,000 次</td></tr>
  </table>

  <h3>7.2 License 配置方法</h3>
  <ol>
    <li>从授权平台获取 License 字符串（Base64 编码的 JSON）。</li>
    <li>在服务器环境变量中配置：<code>LICENSE_PAYLOAD=eyJpZCI6...（完整Base64字符串）</code></li>
    <li>重启服务后，系统自动加载并验证 License（HMAC-SHA256 签名验证）。</li>
    <li>在管理后台"系统配置"页面可查看当前 License 状态、有效期和已激活功能。</li>
  </ol>

  <h3>7.3 AI 提供商配置</h3>
  <p>在 <code>.env.local</code> 文件中配置以下环境变量启用各 AI 提供商：</p>
  <ul>
    <li><strong>OpenAI</strong>：<code>OPENAI_API_KEY=sk-...</code>（可选：<code>OPENAI_API_BASE</code> 指定代理地址）</li>
    <li><strong>Anthropic Claude</strong>：<code>ANTHROPIC_API_KEY=sk-ant-...</code></li>
    <li><strong>Ollama（本地）</strong>：<code>OLLAMA_ENABLED=true</code>（默认连接 <code>localhost:11434</code>）</li>
    <li><strong>主提供商</strong>：<code>AI_PRIMARY_PROVIDER=openai</code>（或 <code>anthropic</code>/<code>ollama</code>）</li>
    <li><strong>备选顺序</strong>：<code>AI_FALLBACK_PROVIDERS=anthropic,ollama</code></li>
  </ul>
</div>

<!-- ═══ 第八章 ═══ -->
<div class="chapter">
  <h2>第八章　常见问题与故障排除</h2>

  <h3>8.1 支付相关问题</h3>
  <table>
    <tr><th>问题现象</th><th>可能原因</th><th>解决方法</th></tr>
    <tr><td>支付按钮不显示</td><td>非 Pi Browser 环境</td><td>请在 Pi Browser 中打开系统链接</td></tr>
    <tr><td>支付卡在"处理中"</td><td>服务端未调用 Approve API</td><td>检查 PI_API_KEY 是否正确配置</td></tr>
    <tr><td>支付成功但未开通权限</td><td>Complete API 调用失败</td><td>联系管理员手动处理，提供 txid</td></tr>
    <tr><td>重复支付被拦截</td><td>系统幂等保护正常工作</td><td>无需处理，系统会正确返回已完成状态</td></tr>
  </table>

  <h3>8.2 AI 服务相关问题</h3>
  <table>
    <tr><th>问题现象</th><th>可能原因</th><th>解决方法</th></tr>
    <tr><td>所有 AI 提供商均不可用</td><td>API Key 未配置或过期</td><td>检查环境变量中的 API Key 配置</td></tr>
    <tr><td>响应超时（30秒）</td><td>提供商服务繁忙</td><td>系统自动降级，若持续出现请更换主提供商</td></tr>
    <tr><td>配额耗尽提示</td><td>月度调用次数超限</td><td>升级 License 套餐或等待下月重置</td></tr>
  </table>

  <h3>8.3 License 相关问题</h3>
  <ul>
    <li><strong>License 过期</strong>：系统提前 30 天发出到期预警，请联系授权方续期。</li>
    <li><strong>签名验证失败</strong>：License 字符串可能在传输中损坏，请重新获取并配置。</li>
    <li><strong>功能访问被拒绝</strong>：当前套餐不包含所需功能，请升级至对应套餐。</li>
  </ul>
</div>

<!-- ═══ 附录 ═══ -->
<div class="chapter">
  <h2>附录　环境变量配置参考表</h2>

  <table>
    <tr><th>变量名</th><th>必填</th><th>说明</th><th>示例值</th></tr>
    <tr><td>PI_API_KEY</td><td>是</td><td>Pi Platform API 密钥</td><td>（从 Pi Developer Portal 获取）</td></tr>
    <tr><td>PI_SESSION_SECRET</td><td>是</td><td>Session Token HMAC 签名密钥</td><td>（随机生成，32位以上）</td></tr>
    <tr><td>DATABASE_URL</td><td>是</td><td>PostgreSQL 数据库连接串</td><td>postgresql://user:pass@host:5432/db</td></tr>
    <tr><td>NEXTAUTH_URL</td><td>是</td><td>应用部署的公开 URL</td><td>https://your-domain.com</td></tr>
    <tr><td>LICENSE_PAYLOAD</td><td>否</td><td>Base64 编码的 License JSON</td><td>eyJpZCI6...（从授权方获取）</td></tr>
    <tr><td>LICENSE_PUBLIC_KEY</td><td>否</td><td>License 签名验证公钥（Base64）</td><td>（从授权方获取）</td></tr>
    <tr><td>OPENAI_API_KEY</td><td>否</td><td>OpenAI API Key</td><td>（启用 OpenAI 提供商时必填）</td></tr>
    <tr><td>ANTHROPIC_API_KEY</td><td>否</td><td>Anthropic Claude API Key</td><td>（启用 Claude 提供商时必填）</td></tr>
    <tr><td>OLLAMA_ENABLED</td><td>否</td><td>是否启用 Ollama 本地模型</td><td>true / false</td></tr>
    <tr><td>AI_PRIMARY_PROVIDER</td><td>否</td><td>主 AI 提供商</td><td>openai / anthropic / ollama</td></tr>
    <tr><td>AI_FALLBACK_PROVIDERS</td><td>否</td><td>备选提供商（逗号分隔）</td><td>anthropic,ollama</td></tr>
    <tr><td>USAGE_WEBHOOK_URL</td><td>否</td><td>用量数据 Flush 目标 Webhook</td><td>https://audit.example.com/usage</td></tr>
  </table>

  <p style="margin-top:16pt; text-align:center; font-size:10pt; color:#666;">
    — 文档结束 —<br>
    本手册最终解释权归著作权人秦晓望所有
  </p>
</div>

</body>
</html>`;
}

// ─── 使用 Puppeteer 生成 PDF ──────────────────────────────────────
async function generatePdf(html) {
  const puppeteer = require('puppeteer');

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const CHROME_PATHS = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.CHROME_PATH,
  ].filter(Boolean);
  const executablePath = CHROME_PATHS.find((p) => require('fs').existsSync(p));

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--font-render-hinting=none',
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    // 允许字体加载完成
    await page.evaluateHandle('document.fonts.ready');

    const headerTemplate = `
      <div style="font-size:9pt; font-family:SimSun,'宋体',serif;
                  text-align:center; width:100%; color:#333; padding-top:6pt;">
        先锋人工智能服务框架软件
      </div>`;

    const footerTemplate = `
      <div style="font-size:9pt; font-family:SimSun,'宋体',serif;
                  text-align:center; width:100%; color:#333; padding-bottom:6pt;">
        — 第 <span class="pageNumber"></span> 页 —
      </div>`;

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      margin: { top: '2.5cm', bottom: '2.5cm', left: '2cm', right: '2cm' },
    });

    fs.writeFileSync(PDF_OUT, pdfBuffer);
    console.log(`[PDF] 已输出：${PDF_OUT}`);

    // 获取总页数
    const pageCount = await page.evaluate(() => {
      const pages = document.querySelectorAll('.chapter, .cover');
      return pages.length;
    });
    console.log(`[PDF] 章节数：${pageCount}（最终 PDF 页数由 Puppeteer 自动计算）`);
  } finally {
    await browser.close();
  }
}

// ─── 主流程 ───────────────────────────────────────────────────────
async function main() {
  console.log('=== 用户操作手册生成器 ===');
  console.log(`软件：${SOFT_NAME} ${VERSION}`);
  console.log(`截图目标：${BASE_URL}`);

  // 步骤1：自动截图
  console.log('\n[步骤1] 自动截图...');
  let shotResults;
  try {
    shotResults = await takeScreenshots();
  } catch (err) {
    console.warn('[WARN] 截图步骤异常，使用占位图继续：', err.message);
    shotResults = generatePlaceholderScreenshots();
  }

  // 步骤2：生成 HTML 手册
  console.log('\n[步骤2] 生成 HTML 手册...');
  const html = buildManualHtml(shotResults);

  // 步骤3：转换 PDF
  console.log('\n[步骤3] 生成 PDF...');
  await generatePdf(html);

  console.log('\n=== 任务 2 完成 ===');
}

main().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});
