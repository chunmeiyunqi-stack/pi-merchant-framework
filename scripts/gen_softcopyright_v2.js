#!/usr/bin/env node
/**
 * gen_softcopyright_v2.js
 * 中国软著申请三件套 HTML 生成器
 * 规格: A4 margin=2.5cm | 右上角页码(position:absolute) | 页脚居中 | 源码50行/页 9pt
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'softcopyright_output');

/* ══════════════════════════ 公共 CSS ══════════════════════════════════ */
const CSS = `
  @page { size: A4; margin: 2.5cm; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Microsoft YaHei", "SimSun", sans-serif;
    font-size: 10.5pt; line-height: 1.6; color: #000; background: #fff;
  }
  .page {
    position: relative;
    width: 100%; min-height: 24.7cm;
    display: flex; flex-direction: column;
    page-break-after: always; break-after: page;
  }
  .page:last-child { page-break-after: auto; break-after: auto; }

  /* ── 右上角页码 ─────────────────────────────────── */
  .pg-num {
    position: absolute; top: 0; right: 0;
    font-size: 9pt; line-height: 1.4;
    font-family: "Microsoft YaHei", "SimSun", sans-serif;
    color: #000;
  }
  /* ── 页脚 ───────────────────────────────────────── */
  .pg-foot {
    font-size: 9pt; text-align: center;
    border-top: 0.5pt solid #000;
    padding-top: 3px; margin-top: 8px;
    font-family: "Microsoft YaHei", "SimSun", sans-serif;
  }
  /* ── 源代码区域 ─────────────────────────────────── */
  .code-wrap { flex: 1; padding-top: 1.6em; overflow: hidden; }
  pre.code {
    font-family: "Consolas", "Courier New", monospace;
    font-size: 9pt; line-height: 1.2;
    white-space: pre; overflow: hidden;
    margin: 0; padding: 0;
  }
  /* ── 文档区域 ───────────────────────────────────── */
  .doc-wrap { flex: 1; padding-top: 1.6em; }
  h1.dh1 {
    font-size: 15pt; font-weight: bold; text-align: center;
    margin: 0.2cm 0 0.4cm; letter-spacing: 0.06em;
  }
  .meta { text-align: center; font-size: 10pt; color: #222; margin-bottom: 0.4cm; }
  h2 {
    font-size: 12pt; font-weight: bold;
    padding-left: 0.3cm; border-left: 3pt solid #000;
    margin: 0.4cm 0 0.2cm;
  }
  h3 { font-size: 10.5pt; font-weight: bold; margin: 0.25cm 0 0.1cm; }
  p   { text-indent: 2em; margin-bottom: 0.12cm; }
  p.ni { text-indent: 0; }
  ul, ol { margin-left: 2em; margin-bottom: 0.15cm; }
  li { margin-bottom: 0.08cm; }
  table {
    width: 100%; border-collapse: collapse;
    margin: 0.2cm 0; font-size: 10pt;
  }
  th, td { border: 0.5pt solid #555; padding: 0.1cm 0.2cm; vertical-align: top; }
  th { background: #efefef; font-weight: bold; text-align: center; }
  .c  { text-align: center; }
  .hr-line { border: none; border-top: 0.5pt solid #999; margin: 0.25cm 0; }
  code {
    font-family: "Consolas", "Courier New", monospace;
    font-size: 9pt; background: #f5f5f5; padding: 1px 3px;
  }
  .cmd {
    font-family: "Consolas", "Courier New", monospace;
    font-size: 9pt; background: #f5f5f5;
    padding: 0.1cm 0.3cm; margin: 0.1cm 0; display: block;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { page-break-after: always; break-after: page; }
    .page:last-child { page-break-after: auto; break-after: auto; }
  }
`;

const FOOT = '先锋人工智能服务框架软件 V2.1.0 &nbsp;|&nbsp; 著作权人：秦晓望';

function buildHtml(title, pages) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>${CSS}  </style>
</head>
<body>
${pages.join('\n')}
</body>
</html>`;
}

function codePg(n, T, lines) {
  const body = lines
    .map(l => String(l).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'))
    .join('\n');
  return `<div class="page">
  <div class="pg-num">第 ${n} 页 / 共 ${T} 页</div>
  <div class="code-wrap"><pre class="code">${body}</pre></div>
  <div class="pg-foot">${FOOT}</div>
</div>`;
}

function docPg(n, T, body) {
  return `<div class="page">
  <div class="pg-num">第 ${n} 页 / 共 ${T} 页</div>
  <div class="doc-wrap">${body}</div>
  <div class="pg-foot">${FOOT}</div>
</div>`;
}

/* ══════════════════════════ 文件扫描工具 ══════════════════════════════ */
function walk(dir, exts, excl, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!excl.includes(e.name)) walk(fp, exts, excl, out);
    } else if (exts.includes(path.extname(e.name))) {
      out.push(fp);
    }
  }
  return out;
}

function redact(s) {
  return s
    .replace(/(password|secret|key|token)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
      m => m.replace(/(['"])[^'"]{8,}(['"])/, '$1[REDACTED]$2'))
    .replace(/sk-[A-Za-z0-9]{20,}/g, 'sk-[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]{20,}/g, 'Bearer [REDACTED]');
}

/* ══════════════════════════ TASK 1: 源代码文档 ═══════════════════════ */
function task1() {
  console.log('\n── Task 1: 源代码文档 ──');
  const srcDirs = [
    path.join(ROOT, 'apps/web/src'),
    path.join(ROOT, 'apps/admin/src'),
    path.join(ROOT, 'packages/pi-sdk/src'),
  ];
  const excl = ['node_modules', '.next', '__tests__', 'dist', 'build', '.turbo', 'coverage'];
  const exts = ['.ts', '.tsx'];

  let lines = [];
  for (const d of srcDirs) {
    for (const f of walk(d, exts, excl)) {
      const rel = path.relative(ROOT, f).replace(/\\/g, '/');
      process.stdout.write(`  + ${rel}\n`);
      lines.push(`/* ── ${rel} ──────────────────────── */`);
      let prevBlank = false;
      for (const l of fs.readFileSync(f, 'utf8').split('\n')) {
        const blank = l.trim() === '';
        if (blank && prevBlank) continue;
        lines.push(redact(l));
        prevBlank = blank;
      }
    }
  }
  console.log(`  total: ${lines.length} lines`);

  let sel = lines.length <= 3000
    ? lines
    : [...lines.slice(0, 1500), '/* ... (中间代码省略) ... */', ...lines.slice(-1499)];
  console.log(`  selected: ${sel.length} lines`);

  const LPP = 50;
  const T   = Math.ceil(sel.length / LPP);
  const pages = [];
  for (let i = 0; i < T; i++)
    pages.push(codePg(i + 1, T, sel.slice(i * LPP, (i + 1) * LPP)));

  const outPath = path.join(OUT, '01_源代码文档(标准50行每页).html');
  fs.writeFileSync(outPath, buildHtml('源代码文档 - 先锋人工智能服务框架软件 V2.1.0', pages), 'utf8');
  console.log(`✅ ${T} pages → ${path.basename(outPath)}`);
}

/* ══════════════════════════ TASK 2: 升级说明 ═════════════════════════ */
function task2() {
  console.log('\n── Task 2: V2.1.0 升级说明 ──');
  const T = 4;
  const pages = [];

  /* ── 第1页 ────────────────────────────────────────────────────────── */
  pages.push(docPg(1, T, `
<h1 class="dh1">先锋人工智能服务框架软件 V2.1.0 升级说明</h1>
<p class="meta ni">版本：V2.1.0 &emsp;|&emsp; 发布日期：2026年6月20日 &emsp;|&emsp; 著作权人：秦晓望</p>
<hr class="hr-line">
<h2>一、版本概述</h2>
<p>先锋人工智能服务框架软件 V2.1.0 是对 V2.0.0 版本的重大功能升级，以企业级多租户 SaaS 安全隔离为核心目标，同步完成了 AI 配额管理、前端交互品质提升与工程化水平强化。本次升级共解决 15 项技术问题，新增 8 项功能特性，代码通过 TypeScript 严格模式检查，构建 0 错误、0 警告。</p>
<table>
  <tr><th style="width:20%">升级维度</th><th style="width:50%">核心内容</th><th style="width:15%">起止版本</th><th style="width:15%">状态</th></tr>
  <tr><td>多租户安全</td><td>AsyncLocalStorage 上下文传播，Prisma 中间件自动过滤</td><td class="c">V2.0→V2.1</td><td class="c">✅</td></tr>
  <tr><td>AI 配额管理</td><td>月度/日度限额预检，使用量精准追踪</td><td class="c">新增</td><td class="c">✅</td></tr>
  <tr><td>竞态条件修复</td><td>AbortController + useRef 双重保护</td><td class="c">新增</td><td class="c">✅</td></tr>
  <tr><td>TypeScript 严格模式</td><td>strict: true，全量类型检查，0 错误</td><td class="c">V2.0→V2.1</td><td class="c">✅</td></tr>
  <tr><td>App Router 边界</td><td>loading.tsx 骨架屏 + error.tsx 错误边界</td><td class="c">新增</td><td class="c">✅</td></tr>
  <tr><td>安全加固</td><td>IDOR 修复，签名日志脱敏，限流收紧</td><td class="c">修复</td><td class="c">✅</td></tr>
  <tr><td>数据库变更</td><td>generation_histories 表，GenerationType 枚举</td><td class="c">新增</td><td class="c">✅</td></tr>
  <tr><td>版本号统一</td><td>全部 packages 从 0.1.0 升至 2.1.0</td><td class="c">V0.1→V2.1</td><td class="c">✅</td></tr>
</table>`));

  /* ── 第2页 ────────────────────────────────────────────────────────── */
  pages.push(docPg(2, T, `
<h2>二、多租户 AI 安全隔离</h2>
<h3>2.1 AsyncLocalStorage 上下文传播</h3>
<p>V2.1.0 引入 Node.js <code>AsyncLocalStorage</code> 机制，在 <code>packages/pi-sdk/src/tenant/context.ts</code> 中提供 <code>runWithTenant(merchantId, fn)</code> 和 <code>getTenantId()</code> 两个核心 API。所有 AI 路由在执行业务逻辑前，必须通过 <code>runWithTenant()</code> 建立租户上下文，无需在调用链中显式传递 merchantId 参数，大幅降低了因参数传递错误导致跨租户数据泄露的风险。</p>
<h3>2.2 Prisma 中间件自动隔离</h3>
<p><code>packages/pi-sdk/src/tenant/prisma-middleware.ts</code> 实现了 Prisma 查询中间件，在 findMany、findFirst、update、delete 等操作上自动注入 <code>merchantId</code> 过滤器。隔离白名单包含：Customer、Order、Payment、Booking、Membership、Service、GenerationHistory 共 7 个业务模型，涵盖全部多租户敏感数据表。</p>
<h3>2.3 API 路由隔离加固</h3>
<p>以下 4 个 AI API 路由全面完成租户上下文封装，merchantId 均强制从环境变量 <code>NEXT_PUBLIC_MERCHANT_ID</code> 读取，彻底消除 IDOR（不安全直接对象引用）漏洞：</p>
<ul>
  <li><code>/api/ai/stream</code>（SSE 流式对话）</li>
  <li><code>/api/v1/images/generate</code>（DALL-E 图像生成）</li>
  <li><code>/api/v1/videos/generate</code>（视频生成）</li>
  <li><code>/api/v1/history</code>（生成历史查询）</li>
</ul>
<h2>三、AI 配额管理与计费追踪</h2>
<h3>3.1 配额预检</h3>
<p>新增 <code>checkQuota(merchantId)</code>，在每次 AI 调用发出前验证月度/日度余额。超配立即返回 HTTP 429，避免无效调用产生费用。</p>
<h3>3.2 使用量追踪</h3>
<p>新增 <code>trackUsage(merchantId, type, model, result)</code>，成功调用记录 token 消耗，失败调用记录错误类型，数据写入 <code>generation_histories</code> 表，为按量计费提供完整基础数据。</p>
<table>
  <tr><th style="width:50%">环境变量</th><th style="width:30%">说明</th><th style="width:20%">默认值</th></tr>
  <tr><td><code>AI_MAX_REQUESTS_PER_MONTH</code></td><td>每租户每月最大请求数</td><td class="c">1000</td></tr>
  <tr><td><code>AI_MAX_REQUESTS_PER_DAY</code></td><td>每租户每日最大请求数</td><td class="c">100</td></tr>
</table>
<h2>四、前端交互质量提升</h2>
<h3>4.1 竞态条件根治</h3>
<p>历史版本中，快速连续请求可能导致 stale response 覆盖最新结果。V2.1.0 在 <code>/history</code> 和 <code>/image-gen</code> 页面引入 <code>AbortController + useRef</code> 双重保护模式：新请求触发时自动 abort 上一个在途请求，AbortError 静默处理，不影响用户体验。</p>
<h3>4.2 App Router Loading / Error 边界</h3>
<ul>
  <li><strong>loading.tsx</strong>（Server Component）：Skeleton 骨架屏，消除布局跳动</li>
  <li><strong>error.tsx</strong>（Client Component）：错误边界，展示友好信息、错误摘要（digest）及重试按钮</li>
</ul>
<h3>4.3 DALL-E 图像生成增强</h3>
<p>修复 DALL-E 2 和 DALL-E 3 尺寸混用 Bug，实现模型特定尺寸列表；模型切换时 <code>useEffect</code> 自动重置尺寸；跨域图片下载改用 <code>fetch → Blob → createObjectURL → revokeObjectURL</code> 链路，修复跨域失败并消除内存泄漏。</p>`));

  /* ── 第3页 ────────────────────────────────────────────────────────── */
  pages.push(docPg(3, T, `
<h2>五、安全漏洞修复</h2>
<table>
  <tr><th style="width:10%">编号</th><th style="width:35%">漏洞描述</th><th style="width:15%">OWASP 分类</th><th>修复方案</th></tr>
  <tr><td class="c">SEC-01</td><td>Rate limit 绕过 Header 在生产环境可用</td><td class="c">A05 配置错误</td><td>限制为 <code>NODE_ENV !== 'production'</code></td></tr>
  <tr><td class="c">SEC-02</td><td>HMAC 期望签名值在错误日志中明文输出</td><td class="c">A09 日志泄露</td><td>日志中移除 expectedSignature 字段</td></tr>
  <tr><td class="c">SEC-03</td><td>merchantId 来自客户端请求头/Cookie，可伪造</td><td class="c">A01 IDOR</td><td>强制从服务端环境变量读取</td></tr>
  <tr><td class="c">SEC-04</td><td>DALL-E 3 允许 n&gt;1（违反 API 规范）</td><td class="c">A03 注入</td><td>DALL-E 3 的 n 参数强制固定为 1</td></tr>
</table>
<h2>六、TypeScript 严格模式升级</h2>
<p>将 <code>apps/web/tsconfig.json</code> 的 <code>"strict": false</code> 修改为 <code>"strict": true</code>，并同步：</p>
<ul>
  <li>新增 <code>src/types/swagger-ui-react.d.ts</code> 类型声明（修复 swagger-ui-react 无官方 @types 问题）</li>
  <li>修复所有因严格模式暴露的隐式 any、可能为 null 的解引用等类型问题</li>
  <li>升级后全量 TypeScript 文件编译错误 = 0，警告 = 0</li>
</ul>
<h2>七、中间件安全加固</h2>
<p><code>apps/web/src/middleware.ts</code>（Edge Runtime）承担两个职责：</p>
<ul>
  <li><strong>速率限制</strong>：基于客户端 IP 的滑动窗口限流，IP 识别优先读取 <code>cf-connecting-ip</code>、<code>x-real-ip</code>、<code>x-forwarded-for</code></li>
  <li><strong>认证守卫</strong>：对 <code>/dashboard</code>、<code>/account</code>、<code>/billing</code>、<code>/history</code>、<code>/image-gen</code> 等受保护路径执行会话 Token 验证</li>
</ul>
<p>由于 Edge Runtime 不支持 <code>AsyncLocalStorage</code>，中间件层不注入租户上下文，由下层 API Route Handler 负责。</p>
<h2>八、SSE 流式 AI 对话增强</h2>
<p><code>/api/ai/stream</code> 路由在本次升级中引入以下改进：</p>
<ul>
  <li>新增 <code>AbortController</code> 60 秒超时保护，防止长连接无限占用</li>
  <li>新增 15 秒 heartbeat ping，防止反向代理因空闲超时断开连接</li>
  <li>在 <code>chunk.done</code>（成功）和 catch（失败）两个分支均调用 <code>trackUsage()</code></li>
  <li>完整包裹在 <code>runWithTenant(merchantId, async () =&gt; { ... })</code> 内，保证 DB 操作的租户隔离</li>
</ul>`));

  /* ── 第4页 ────────────────────────────────────────────────────────── */
  pages.push(docPg(4, T, `
<h2>九、数据库变更</h2>
<p>新增 Prisma 迁移：<code>prisma/migrations/20260610182500_add_generation_history/migration.sql</code></p>
<table>
  <tr><th style="width:25%">变更类型</th><th>内容</th></tr>
  <tr><td>新增枚举</td><td><code>GenerationType</code>：TEXT | IMAGE | VIDEO | AUDIO</td></tr>
  <tr><td>新增数据表</td><td><code>generation_histories</code></td></tr>
  <tr><td>表字段</td><td>id(UUID PK)、merchantId(VARCHAR)、userId(VARCHAR)、type(GenerationType)、model(VARCHAR)、promptHash(VARCHAR)、totalTokens(INT)、cost(DECIMAL 10,6)、status(VARCHAR)、createdAt(TIMESTAMPTZ)、updatedAt(TIMESTAMPTZ)</td></tr>
  <tr><td>索引</td><td>idx_gen_hist_merchant_created (merchantId, createdAt DESC) 复合索引，优化分页查询</td></tr>
  <tr><td>Prisma 中间件</td><td>GenerationHistory 加入租户隔离白名单</td></tr>
</table>
<h2>十、部署变更</h2>
<h3>10.1 环境变量</h3>
<p>重写 <code>.env.example</code>，补充多租户 SaaS 运行所需的全部 22 项配置变量，包括数据库、认证、AI 提供商、配额、监控、邮件等类别。</p>
<h3>10.2 Docker 构建优化</h3>
<p>在 <code>Dockerfile</code> 中新增 <code>ENV DOCKER_BUILD=1</code>，触发 <code>next.config.js</code> 中的条件式 <code>output: 'standalone'</code>，解决 Windows 本地开发时 EPERM 符号链接错误问题。</p>
<h3>10.3 版本号统一</h3>
<p>全部 7 个 package.json 版本从 <code>0.1.0</code> 升至 <code>2.1.0</code>：根 workspace、apps/web、apps/admin、packages/pi-sdk、packages/types、packages/ui、packages/config。</p>
<h2>十一、版本对照</h2>
<table>
  <tr><th style="width:30%">特性</th><th style="width:35%">V2.0.0</th><th style="width:35%">V2.1.0</th></tr>
  <tr><td>租户隔离方式</td><td>手动传参</td><td>AsyncLocalStorage 自动传播</td></tr>
  <tr><td>配额控制</td><td>无</td><td>月度/日度双重限额</td></tr>
  <tr><td>TypeScript 模式</td><td>strict: false</td><td>strict: true（0 错误）</td></tr>
  <tr><td>竞态保护</td><td>无</td><td>AbortController + useRef</td></tr>
  <tr><td>错误边界</td><td>无</td><td>loading.tsx + error.tsx</td></tr>
  <tr><td>Docker standalone</td><td>始终启用</td><td>条件式（CI/Docker 环境）</td></tr>
  <tr><td>包版本</td><td>0.1.0</td><td>2.1.0</td></tr>
  <tr><td>generation_histories</td><td>无</td><td>完整 AI 使用量记录</td></tr>
</table>
<hr class="hr-line">
<p class="ni" style="font-size:9pt;color:#555;margin-top:0.15cm;">文档生成日期：2026年6月20日 &emsp;|&emsp; 先锋人工智能服务框架软件 V2.1.0 &emsp;|&emsp; 著作权人：秦晓望</p>`));

  const outPath = path.join(OUT, '02_V2.1.0升级说明.html');
  fs.writeFileSync(outPath, buildHtml('V2.1.0升级说明 - 先锋人工智能服务框架软件', pages), 'utf8');
  console.log(`✅ Task 2: ${T} pages → ${path.basename(outPath)}`);
}

/* ══════════════════════════ TASK 3: 用户使用手册 ═════════════════════ */
function task3() {
  console.log('\n── Task 3: 用户使用手册 ──');
  const T = 6;
  const pages = [];

  /* ── 第1页 ────────────────────────────────────────────────────────── */
  pages.push(docPg(1, T, `
<h1 class="dh1">先锋人工智能服务框架软件<br>用户使用手册</h1>
<p class="meta ni">版本：V2.1.0 &emsp;|&emsp; 日期：2026年6月20日 &emsp;|&emsp; 著作权人：秦晓望</p>
<hr class="hr-line">
<h2>一、系统概述</h2>
<p>先锋人工智能服务框架软件（Pioneer AI Merchant Framework）是一款面向企业级多租户部署的 AI 服务管理平台。系统基于 Next.js 14 App Router、TypeScript 5、Prisma 5、pnpm Monorepo 技术栈构建，提供 AI 对话、图像生成、视频生成等核心能力，并通过 AsyncLocalStorage + Prisma 中间件的双层多租户隔离机制保障各商户数据安全。</p>
<h3>1.1 系统架构</h3>
<table>
  <tr><th style="width:20%">层次</th><th style="width:35%">组件</th><th>说明</th></tr>
  <tr><td>商户端</td><td>apps/web（Next.js 14）</td><td>用户界面，AI 功能交互，会话管理</td></tr>
  <tr><td>管理后台</td><td>apps/admin（Next.js 14）</td><td>平台管理，租户管理，配额监控</td></tr>
  <tr><td>SDK 核心</td><td>packages/pi-sdk</td><td>AI 路由、租户上下文、配额管理、使用量追踪</td></tr>
  <tr><td>数据层</td><td>Prisma 5 + PostgreSQL 14+</td><td>持久化存储，多租户 Row-level 隔离</td></tr>
  <tr><td>AI 提供商</td><td>OpenAI / Anthropic / Ollama</td><td>统一接口抽象，自动 Fallback</td></tr>
</table>
<h3>1.2 主要功能</h3>
<ul>
  <li><strong>AI 对话</strong>：支持 GPT-4o、GPT-4o Mini、Claude 3.5 Sonnet 等 7 个模型，SSE 流式输出，60 秒超时保护</li>
  <li><strong>图像生成</strong>：集成 DALL-E 2 和 DALL-E 3，支持 6 种输出尺寸规格</li>
  <li><strong>视频生成</strong>：Runway ML 接口集成，支持扩展</li>
  <li><strong>生成历史</strong>：分页查询，按租户完全隔离，支持类型过滤</li>
  <li><strong>配额管理</strong>：月度/日度双重限额，超额自动拒绝，使用量实时追踪</li>
  <li><strong>多租户</strong>：AsyncLocalStorage 上下文 + Prisma 中间件两层隔离</li>
</ul>`));

  /* ── 第2页 ────────────────────────────────────────────────────────── */
  pages.push(docPg(2, T, `
<h2>二、环境要求</h2>
<table>
  <tr><th style="width:25%">组件</th><th style="width:25%">最低版本</th><th>获取方式</th></tr>
  <tr><td>Node.js</td><td>20.0.0 LTS</td><td>https://nodejs.org（推荐 nvm 管理）</td></tr>
  <tr><td>pnpm</td><td>11.7.0</td><td><span class="cmd">npm install -g pnpm@11.7.0</span></td></tr>
  <tr><td>PostgreSQL</td><td>14.0+</td><td>本地安装或 Docker 容器</td></tr>
  <tr><td>Docker</td><td>24.0+（可选）</td><td>生产环境推荐，Docker Desktop 即可</td></tr>
</table>
<h2>三、本地开发快速开始</h2>
<h3>3.1 获取代码</h3>
<span class="cmd">git clone &lt;repository-url&gt; PiMerchantFramework<br>cd PiMerchantFramework</span>
<h3>3.2 安装依赖</h3>
<span class="cmd">pnpm install</span>
<h3>3.3 配置环境变量</h3>
<span class="cmd">cp .env.example .env</span>
<p>必须填写的核心配置项：</p>
<table>
  <tr><th style="width:45%">变量名</th><th style="width:15%">必填</th><th>说明</th></tr>
  <tr><td><code>DATABASE_URL</code></td><td class="c">是</td><td>PostgreSQL 连接字符串</td></tr>
  <tr><td><code>PI_SESSION_SECRET</code></td><td class="c">是</td><td>HMAC-SHA256 会话签名密钥（≥32字符随机串）</td></tr>
  <tr><td><code>NEXT_PUBLIC_MERCHANT_ID</code></td><td class="c">是</td><td>本商户唯一标识符</td></tr>
  <tr><td><code>NEXTAUTH_SECRET</code></td><td class="c">是</td><td>NextAuth 会话加密密钥</td></tr>
  <tr><td><code>OPENAI_API_KEY</code></td><td class="c">是*</td><td>OpenAI API 密钥</td></tr>
  <tr><td><code>ANTHROPIC_API_KEY</code></td><td class="c">否</td><td>Claude 模型密钥（可选，用于 Fallback）</td></tr>
  <tr><td><code>AI_MAX_REQUESTS_PER_MONTH</code></td><td class="c">否</td><td>月度配额上限，默认 1000</td></tr>
  <tr><td><code>AI_MAX_REQUESTS_PER_DAY</code></td><td class="c">否</td><td>日度配额上限，默认 100</td></tr>
</table>
<p class="ni" style="font-size:9pt;color:#555;">* 至少需要 OPENAI_API_KEY 或 ANTHROPIC_API_KEY 之一</p>
<h3>3.4 初始化数据库</h3>
<span class="cmd">pnpm prisma migrate deploy<br>pnpm prisma generate</span>
<h3>3.5 启动开发服务器</h3>
<span class="cmd">pnpm dev</span>
<p>启动成功后访问：商户端 <code>http://localhost:3000</code>，管理后台 <code>http://localhost:3001</code>。</p>`));

  /* ── 第3页 ────────────────────────────────────────────────────────── */
  pages.push(docPg(3, T, `
<h2>四、Docker 生产部署</h2>
<h3>4.1 构建生产镜像</h3>
<span class="cmd">docker build -t pi-merchant-framework:v2.1.0 .</span>
<p>构建说明：基础镜像 <code>node:20-bullseye-slim</code>，多阶段构建（builder + runner），构建时自动设置 <code>DOCKER_BUILD=1</code> 启用 Next.js standalone 模式，最终镜像约 300–400 MB。</p>
<h3>4.2 使用 docker-compose 启动</h3>
<span class="cmd">docker-compose -f docker-compose.prod.yml up -d</span>
<table>
  <tr><th style="width:20%">服务</th><th style="width:15%">端口</th><th>说明</th></tr>
  <tr><td>web</td><td>3000</td><td>商户端 Next.js 应用</td></tr>
  <tr><td>admin</td><td>3001</td><td>管理后台 Next.js 应用</td></tr>
  <tr><td>postgres</td><td>5432</td><td>PostgreSQL 14 数据库（数据卷持久化）</td></tr>
  <tr><td>nginx</td><td>80/443</td><td>反向代理，SSL 终止（配置位于 deploy/nginx/）</td></tr>
</table>
<h3>4.3 数据库迁移（生产）</h3>
<span class="cmd">docker exec pi-web pnpm prisma migrate deploy</span>
<h3>4.4 健康检查端点</h3>
<table>
  <tr><th style="width:40%">端点</th><th>正常响应</th></tr>
  <tr><td><code>GET /api/health</code>（商户端）</td><td><code>{"status":"ok","timestamp":"..."}</code></td></tr>
  <tr><td><code>GET /api/health</code>（管理后台）</td><td><code>{"status":"ok","timestamp":"..."}</code></td></tr>
</table>
<h2>五、监控与日志</h2>
<p>项目集成 Prometheus + Grafana 监控方案，配置文件位于 <code>prometheus.yml</code> 和 <code>grafana/dashboards/</code>。启动监控栈：</p>
<span class="cmd">docker-compose -f docker-compose.monitoring.yml up -d</span>
<p>Grafana 面板访问地址：<code>http://localhost:3100</code>（默认账号 admin/admin）。内置仪表板指标：API 请求量、P99 延迟、AI 配额消耗趋势、错误率。</p>
<h2>六、安全配置建议</h2>
<ul>
  <li>生产环境必须为 <code>PI_SESSION_SECRET</code>、<code>JWT_SECRET</code>、<code>NEXTAUTH_SECRET</code> 生成独立的高强度随机值（推荐 <code>openssl rand -base64 48</code>）</li>
  <li>数据库连接串中的密码应通过 Docker Secret 或 Vault 注入，不得明文写入镜像</li>
  <li>Nginx 配置中应强制启用 TLS 1.2+，禁用弱密码套件</li>
  <li>设置 <code>NODE_ENV=production</code> 以禁用调试日志和 rate limit bypass</li>
</ul>`));

  /* ── 第4页 ────────────────────────────────────────────────────────── */
  pages.push(docPg(4, T, `
<h2>七、核心功能使用说明</h2>
<h3>7.1 AI 对话（流式）</h3>
<p>调用端点：<code>POST /api/ai/stream</code>，响应格式：Server-Sent Events（SSE）</p>
<table>
  <tr><th style="width:20%">参数</th><th style="width:20%">类型</th><th style="width:15%">必填</th><th>说明</th></tr>
  <tr><td>model</td><td>string</td><td class="c">是</td><td>模型 ID（见下方列表）</td></tr>
  <tr><td>messages</td><td>array</td><td class="c">是</td><td>对话历史：<code>[{"role":"user","content":"..."}]</code></td></tr>
  <tr><td>stream</td><td>boolean</td><td class="c">否</td><td>默认 true，使用 SSE 流式返回</td></tr>
</table>
<p>可用模型（通过 <code>GET /api/v1/models</code> 获取实时列表）：</p>
<table>
  <tr><th style="width:30%">模型 ID</th><th style="width:30%">提供商</th><th>说明</th></tr>
  <tr><td>gpt-4o</td><td>OpenAI</td><td>旗舰对话模型</td></tr>
  <tr><td>gpt-4o-mini</td><td>OpenAI</td><td>轻量高速版</td></tr>
  <tr><td>dall-e-3</td><td>OpenAI</td><td>图像生成专用</td></tr>
  <tr><td>claude-3-5-sonnet</td><td>Anthropic</td><td>高质量长文处理</td></tr>
  <tr><td>claude-3-haiku</td><td>Anthropic</td><td>轻量快速版</td></tr>
  <tr><td>llama3.1</td><td>Ollama（本地）</td><td>开源模型，需本地部署</td></tr>
  <tr><td>mistral</td><td>Ollama（本地）</td><td>欧洲开源模型</td></tr>
</table>
<h3>7.2 图像生成</h3>
<p>调用端点：<code>POST /api/v1/images/generate</code></p>
<table>
  <tr><th style="width:20%">参数</th><th style="width:20%">类型</th><th style="width:15%">必填</th><th>说明</th></tr>
  <tr><td>model</td><td>string</td><td class="c">是</td><td>dall-e-2 或 dall-e-3</td></tr>
  <tr><td>prompt</td><td>string</td><td class="c">是</td><td>图像描述文本（最长 4000 字符）</td></tr>
  <tr><td>size</td><td>string</td><td class="c">是</td><td>见下方有效尺寸</td></tr>
  <tr><td>n</td><td>integer</td><td class="c">否</td><td>数量（DALL-E 3 固定为 1）</td></tr>
</table>
<p>有效尺寸：DALL-E 2：256×256、512×512、1024×1024；DALL-E 3：1024×1024、1792×1024、1024×1792。</p>
<h3>7.3 生成历史查询</h3>
<p>调用端点：<code>GET /api/v1/history?page=1&amp;pageSize=20</code></p>
<table>
  <tr><th style="width:25%">参数</th><th style="width:20%">类型</th><th>说明</th></tr>
  <tr><td>page</td><td>integer</td><td>页码，默认 1</td></tr>
  <tr><td>pageSize</td><td>integer</td><td>每页条数，默认 20，最大 100</td></tr>
  <tr><td>type</td><td>string</td><td>过滤类型：TEXT / IMAGE / VIDEO / AUDIO</td></tr>
</table>
<p>Prisma 中间件自动保证查询结果仅包含当前租户（<code>merchantId</code>）的数据。</p>`));

  /* ── 第5页 ────────────────────────────────────────────────────────── */
  pages.push(docPg(5, T, `
<h2>八、配额与限流管理</h2>
<h3>8.1 配额配置</h3>
<table>
  <tr><th style="width:50%">环境变量</th><th style="width:20%">默认值</th><th>说明</th></tr>
  <tr><td><code>AI_MAX_REQUESTS_PER_MONTH</code></td><td class="c">1000</td><td>每商户每月 AI 请求上限</td></tr>
  <tr><td><code>AI_MAX_REQUESTS_PER_DAY</code></td><td class="c">100</td><td>每商户每日 AI 请求上限</td></tr>
</table>
<h3>8.2 超限响应格式</h3>
<span class="cmd">HTTP/1.1 429 Too Many Requests<br>{"error":"quota_exceeded","message":"月度配额已用尽","resetAt":"2026-07-01T00:00:00Z"}</span>
<h3>8.3 速率限制</h3>
<table>
  <tr><th style="width:25%">维度</th><th>规则</th></tr>
  <tr><td>算法</td><td>滑动窗口（Sliding Window），5 分钟自动清理过期记录</td></tr>
  <tr><td>IP 识别</td><td>优先 CF-Connecting-IP → X-Real-IP → X-Forwarded-For → 请求 IP</td></tr>
  <tr><td>超限返回</td><td>HTTP 429，含 Retry-After、X-RateLimit-Remaining 标准响应头</td></tr>
  <tr><td>调试绕过</td><td>x-k6-bypass-rate-limit Header 仅在 NODE_ENV !== 'production' 有效</td></tr>
</table>
<h2>九、多租户使用说明</h2>
<p>每个商户独立配置 <code>NEXT_PUBLIC_MERCHANT_ID</code>，系统在三个层面保证数据隔离：</p>
<ul>
  <li><strong>API 层</strong>：merchantId 强制从服务端环境变量读取，客户端无法通过请求头或 Cookie 伪造</li>
  <li><strong>业务层</strong>：<code>runWithTenant(merchantId, fn)</code> 在 AsyncLocalStorage 中建立不可篡改的上下文</li>
  <li><strong>数据层</strong>：Prisma 中间件在 Customer、Order、Payment、Booking、Membership、Service、GenerationHistory 共 7 个模型的所有查询/修改/删除操作中自动追加 <code>WHERE merchantId = ?</code> 条件</li>
</ul>
<h2>十、用户界面功能</h2>
<table>
  <tr><th style="width:25%">路由</th><th style="width:30%">功能</th><th>特性说明</th></tr>
  <tr><td>/dashboard</td><td>控制台首页</td><td>使用量概览、快捷入口</td></tr>
  <tr><td>/image-gen</td><td>图像生成</td><td>模型切换、尺寸联动、跨域安全下载</td></tr>
  <tr><td>/history</td><td>生成历史</td><td>分页列表、类型过滤、竞态保护</td></tr>
  <tr><td>/account</td><td>账户设置</td><td>个人信息管理</td></tr>
  <tr><td>/billing</td><td>计费与配额</td><td>使用量统计、剩余配额显示</td></tr>
</table>`));

  /* ── 第6页 ────────────────────────────────────────────────────────── */
  pages.push(docPg(6, T, `
<h2>十一、常见问题解答（FAQ）</h2>
<h3>Q1：启动提示 "DATABASE_URL not configured"</h3>
<p><strong>原因</strong>：.env 文件未配置或 DATABASE_URL 格式错误。</p>
<p><strong>解决</strong>：确认项目根目录存在 .env 文件，DATABASE_URL 格式为：<code>postgresql://user:password@localhost:5432/dbname</code>。执行 <code>pnpm prisma migrate status</code> 验证连接。</p>
<h3>Q2：AI 对话无响应或返回 502</h3>
<p><strong>原因</strong>：AI 提供商 API Key 未配置或已失效，或提供商服务不可达。</p>
<p><strong>解决</strong>：检查 OPENAI_API_KEY 或 ANTHROPIC_API_KEY 是否正确设置；确认配置了 <code>AI_FALLBACK_PROVIDERS</code> 备用列表；检查网络连通性。</p>
<h3>Q3：图像生成报 "invalid_size" 错误</h3>
<p><strong>解决</strong>：DALL-E 2 使用 256×256、512×512 或 1024×1024；DALL-E 3 使用 1024×1024、1792×1024 或 1024×1792，不支持其他尺寸。</p>
<h3>Q4：收到 HTTP 429，区分原因</h3>
<p><strong>限流触发</strong>：响应体含 <code>"error":"rate_limit"</code>，等待 Retry-After 秒数后重试。</p>
<p><strong>配额超限</strong>：响应体含 <code>"error":"quota_exceeded"</code>，当日或当月配额已耗尽，需等待重置或联系管理员调整配额。</p>
<h3>Q5：Docker 构建失败，提示 EPERM 符号链接错误</h3>
<p><strong>解决</strong>：确认 Dockerfile 包含 <code>ENV DOCKER_BUILD=1</code>；Windows 环境下确保 Docker Desktop 已启用文件共享权限；或在 WSL2 环境中构建。</p>
<h3>Q6：如何切换 AI 提供商？</h3>
<p>修改 .env 中 <code>AI_PRIMARY_PROVIDER</code>（可选值：openai、anthropic、ollama），并确保对应 API Key 已配置。主提供商不可用时，系统自动按 <code>AI_FALLBACK_PROVIDERS</code> 列表顺序切换备用提供商。</p>
<h3>Q7：如何在本地使用 Ollama 开源模型？</h3>
<p>安装并启动 Ollama：<code>ollama serve</code>，拉取模型 <code>ollama pull llama3.1</code>，然后在 .env 设置 <code>AI_PRIMARY_PROVIDER=ollama</code> 和 <code>OLLAMA_BASE_URL=http://localhost:11434</code>。</p>
<hr class="hr-line">
<table>
  <tr><th style="width:25%">文档信息</th><th>内容</th></tr>
  <tr><td>软件名称</td><td>先锋人工智能服务框架软件 V2.1.0</td></tr>
  <tr><td>著作权人</td><td>秦晓望</td></tr>
  <tr><td>完成日期</td><td>2026年6月20日</td></tr>
  <tr><td>文档版本</td><td>V2.1.0</td></tr>
</table>`));

  const outPath = path.join(OUT, '03_用户使用手册.html');
  fs.writeFileSync(outPath, buildHtml('用户使用手册 - 先锋人工智能服务框架软件 V2.1.0', pages), 'utf8');
  console.log(`✅ Task 3: ${T} pages → ${path.basename(outPath)}`);
}

/* ══════════════════════════════ MAIN ══════════════════════════════════ */
console.log('═'.repeat(60));
console.log('  软著申请文档生成器 V2 — 先锋人工智能服务框架软件 V2.1.0');
console.log('═'.repeat(60));
task1();
task2();
task3();
console.log('\n' + '═'.repeat(60));
console.log('  所有文档已生成: ' + OUT);
console.log('═'.repeat(60));
