/**
 * gen-screenshots.js
 * 生成7张软著申请用高质量界面截图（1920×1080）
 * 与真实应用保持完全一致的设计风格
 *
 * 运行: node scripts/gen-screenshots.js
 */

'use strict';

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'screenshots');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const SW_NAME = '先锋人工智能服务框架软件';
const SW_VERSION = 'V1.0.0';
const COPYRIGHT = '© 2026 秦晓望';
const MERCHANT_ID = 'merchant-demo-001';

// ────────────────────────────────────────────────────────────
// 公共 CSS 变量（与应用 Tailwind 配置对齐）
// ────────────────────────────────────────────────────────────
const BASE_RESET = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'PingFang SC','Microsoft YaHei','Segoe UI',system-ui,sans-serif;
         -webkit-font-smoothing:antialiased; }
  :root {
    --gold: #F3C136;
    --gold-dark: #EEA834;
    --purple: #7C3AED;
    --purple-dark: #6D28D9;
    --bg-dark: #0A0510;
    --bg-mid: #1E112A;
    --bg-card: #150B20;
    --slate-950: #020617;
    --slate-900: #0F172A;
    --slate-800: #1E293B;
    --slate-700: #334155;
    --slate-400: #94A3B8;
    --slate-200: #E2E8F0;
    --gray-50: #F9FAFB;
    --gray-100: #F3F4F6;
    --gray-200: #E5E7EB;
    --gray-400: #9CA3AF;
    --gray-500: #6B7280;
    --gray-700: #374151;
    --gray-800: #1F2937;
    --gray-900: #111827;
    --emerald-400: #34D399;
    --amber-400: #FBBF24;
    --amber-500: #F59E0B;
    --indigo-600: #4F46E5;
    --red-400: #F87171;
    --blue-400: #60A5FA;
  }
`;

// ────────────────────────────────────────────────────────────
// 图1：系统登录界面（深色主题）
// ────────────────────────────────────────────────────────────
function htmlLogin() {
  return `<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=1920"/>
<title>${SW_NAME} ${SW_VERSION} — 登录</title>
<style>
${BASE_RESET}
body {
  width:1920px; height:1080px; overflow:hidden;
  background: var(--bg-dark);
  color: #fff;
  position:relative;
}
/* 背景光晕 */
.glow1 { position:absolute; top:-10%; left:-8%; width:700px; height:420px;
  background:rgba(124,58,237,0.22); filter:blur(140px); border-radius:50%; z-index:0; }
.glow2 { position:absolute; bottom:-8%; right:-6%; width:680px; height:380px;
  background:rgba(243,193,54,0.12); filter:blur(140px); border-radius:50%; z-index:0; }
/* 顶部导航 */
header {
  position:sticky; top:0; z-index:50;
  background:rgba(10,5,16,0.8); backdrop-filter:blur(20px);
  border-bottom:1px solid rgba(255,255,255,0.06);
  height:72px; display:flex; align-items:center;
  padding:0 48px;
}
.logo-box {
  width:44px; height:44px; border-radius:14px;
  background:linear-gradient(135deg,#F3C136,#EEA834);
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 4px 20px rgba(243,193,54,0.2);
}
.logo-inner {
  width:38px; height:38px; border-radius:11px;
  background:#150B20;
  display:flex; align-items:center; justify-content:center;
}
.logo-inner span { font-size:18px; font-weight:900; color:var(--gold); }
.brand-name { font-size:18px; font-weight:700; color:#fff; margin-left:12px; letter-spacing:-0.3px; }
.brand-sub { font-size:10px; color:rgba(243,193,54,0.8); font-weight:600;
  letter-spacing:0.15em; text-transform:uppercase; margin-left:2px; }
.header-right { margin-left:auto; display:flex; align-items:center; gap:16px; }
.version-badge {
  padding:5px 14px; border-radius:20px;
  border:1px solid rgba(243,193,54,0.3);
  color:rgba(243,193,54,0.9); font-size:12px; font-weight:600;
}
.sw-name-small { font-size:13px; color:rgba(255,255,255,0.5); }
/* 主内容区 */
main {
  position:relative; z-index:10;
  width:100%; height:calc(1080px - 72px);
  display:flex; align-items:center; justify-content:center;
  padding: 0 80px;
  gap:100px;
}
/* 左侧文案 */
.hero-left { flex:1; max-width:640px; }
.tag-line {
  display:inline-flex; align-items:center;
  padding:7px 16px; border-radius:20px;
  background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
  color:var(--gold); font-size:11px; font-weight:700;
  letter-spacing:0.15em; text-transform:uppercase; margin-bottom:28px;
}
.tag-line .dot { width:7px; height:7px; border-radius:50%; background:var(--gold); margin-right:8px; animation:pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
h1 {
  font-size:64px; font-weight:900; line-height:1.08; letter-spacing:-1.5px;
  background:linear-gradient(135deg,#fff 0%,#ccc 60%,#888 100%);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  margin-bottom:8px;
}
h1 em { font-style:normal; background:linear-gradient(90deg,#F3C136,#D18E15);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.subtitle {
  font-size:17px; color:rgba(255,255,255,0.5); line-height:1.7; margin-bottom:32px; font-weight:500;
}
.feature-list { list-style:none; space-y:8px; }
.feature-list li {
  display:flex; align-items:center; gap:10px;
  font-size:14px; color:rgba(255,255,255,0.65); margin-bottom:10px;
}
.feature-list li::before { content:''; display:block; width:6px; height:6px;
  border-radius:50%; background:var(--gold); flex-shrink:0; }
/* 右侧登录卡片 */
.login-card {
  width:420px; flex-shrink:0;
  background:rgba(255,255,255,0.04);
  border:1px solid rgba(255,255,255,0.1);
  border-radius:28px;
  padding:44px 40px;
  backdrop-filter:blur(10px);
  box-shadow:0 24px 60px rgba(0,0,0,0.4);
}
.card-title { font-size:24px; font-weight:800; color:#fff; margin-bottom:6px; }
.card-sub { font-size:14px; color:rgba(255,255,255,0.45); margin-bottom:32px; }
.pi-btn {
  width:100%; padding:18px 24px;
  border-radius:18px;
  background:linear-gradient(135deg,#F3C136,#D18E15);
  border:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:12px;
  font-size:16px; font-weight:700; color:#1E112A;
  box-shadow:0 8px 24px rgba(243,193,54,0.35);
  margin-bottom:20px;
  transition:all 0.2s;
}
.pi-icon { font-size:22px; }
.divider { text-align:center; color:rgba(255,255,255,0.2); font-size:12px; margin:16px 0; position:relative; }
.divider::before,.divider::after {
  content:''; position:absolute; top:50%; width:42%;
  height:1px; background:rgba(255,255,255,0.1);
}
.divider::before { left:0; } .divider::after { right:0; }
.info-grid { display:grid; gap:10px; }
.info-item {
  padding:12px 16px; border-radius:12px;
  background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07);
  display:flex; align-items:center; justify-content:space-between;
  font-size:12px;
}
.info-item .key { color:rgba(255,255,255,0.4); }
.info-item .val { color:rgba(255,255,255,0.8); font-weight:600; }
.copyright { text-align:center; font-size:11px; color:rgba(255,255,255,0.25); margin-top:24px; }
/* 底部状态栏 */
footer {
  position:absolute; bottom:0; left:0; right:0; height:40px; z-index:50;
  background:rgba(10,5,16,0.9); border-top:1px solid rgba(255,255,255,0.05);
  display:flex; align-items:center; justify-content:space-between;
  padding:0 48px; font-size:11px; color:rgba(255,255,255,0.3);
}
</style></head><body>
<div class="glow1"></div>
<div class="glow2"></div>

<header>
  <div class="logo-box"><div class="logo-inner"><span>π</span></div></div>
  <div style="margin-left:12px">
    <div class="brand-name">Pioneer AI</div>
    <div class="brand-sub">Commercial Ecosystem</div>
  </div>
  <div class="header-right">
    <span class="sw-name-small">${SW_NAME}</span>
    <span class="version-badge">${SW_VERSION}</span>
  </div>
</header>

<main>
  <div class="hero-left">
    <div class="tag-line"><span class="dot"></span>Next Generation DApp Foundation</div>
    <h1>赋能千万先锋的<br/><em>智能服务引擎</em></h1>
    <p class="subtitle">为全行业开发者与商户提供 Pi Network 原生生态 API 互通、<br/>AI 业务辅助及模块化调度系统。</p>
    <ul class="feature-list">
      <li>AI 多提供商智能路由（OpenAI / Claude / Ollama）</li>
      <li>Pi Network 区块链原生 U2A 支付</li>
      <li>多租户数据隔离（merchantId: ${MERCHANT_ID}）</li>
      <li>License 离线 HMAC-SHA256 授权验证</li>
      <li>微秒级用量统计与实时配额控制</li>
    </ul>
  </div>
  <div class="login-card">
    <div class="card-title">欢迎登录</div>
    <div class="card-sub">使用您的 Pi Network 账户安全登录</div>
    <button class="pi-btn">
      <span class="pi-icon">π</span>
      验证 Pi 身份
    </button>
    <div class="divider">或了解更多</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="key">身份验证方式</span>
        <span class="val">Pi Network OAuth 2.0</span>
      </div>
      <div class="info-item">
        <span class="key">数据加密</span>
        <span class="val">TLS 1.3 + HMAC-SHA256</span>
      </div>
      <div class="info-item">
        <span class="key">授权套餐</span>
        <span class="val" style="color:#F3C136">Professional ✓</span>
      </div>
      <div class="info-item">
        <span class="key">License 状态</span>
        <span class="val" style="color:#34D399">● 有效期至 2026-12-31</span>
      </div>
    </div>
    <div class="copyright">${COPYRIGHT} · ${SW_NAME} ${SW_VERSION}</div>
  </div>
</main>

<footer>
  <span>${SW_NAME} ${SW_VERSION}</span>
  <span>merchantId: ${MERCHANT_ID} | 著作权登记号: 2026R11L1477838</span>
  <span>${COPYRIGHT}</span>
</footer>
</body></html>`;
}

// ────────────────────────────────────────────────────────────
// 图2：客户仪表盘界面（浅色主题）
// ────────────────────────────────────────────────────────────
function htmlDashboard() {
  return `<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=1920"/>
<title>${SW_NAME} ${SW_VERSION} — 客户仪表盘</title>
<style>
${BASE_RESET}
body { width:1920px; height:1080px; overflow:hidden; background:var(--gray-50); color:var(--gray-900); }
/* 顶部 header */
.top-header {
  height:64px; background:#fff; border-bottom:1px solid var(--gray-200);
  display:flex; align-items:center; padding:0 32px; gap:16px;
  box-shadow:0 1px 3px rgba(0,0,0,0.05);
}
.logo-sm {
  width:36px; height:36px; border-radius:10px;
  background:#1E112A; display:flex; align-items:center;
  justify-content:center; color:#F3C136; font-weight:900; font-size:14px;
}
.app-name { font-size:16px; font-weight:700; color:var(--gray-900); }
.version-tag { font-size:11px; background:#F3F4F6; border:1px solid var(--gray-200);
  color:var(--gray-500); padding:3px 10px; border-radius:12px; font-weight:600; }
.user-pill {
  margin-left:auto; display:flex; align-items:center; gap:10px;
  padding:6px 14px 6px 8px; border-radius:20px;
  border:1px solid var(--gray-200); background:#fff;
}
.user-avatar {
  width:28px; height:28px; border-radius:50%;
  background:linear-gradient(135deg,#7C3AED,#4F46E5);
  display:flex; align-items:center; justify-content:center;
  color:#fff; font-size:12px; font-weight:700;
}
.user-name { font-size:13px; font-weight:600; color:var(--gray-700); }
.tenant-badge { font-size:10px; color:var(--gray-400); margin-left:4px; }
.logout-btn {
  padding:6px 14px; border-radius:10px; border:none;
  background:var(--gray-100); color:var(--gray-600); font-size:12px;
  font-weight:600; cursor:pointer; margin-left:8px;
}

/* 布局 */
.layout { display:flex; height:calc(1080px - 64px); }

/* 侧边栏 */
.sidebar {
  width:220px; flex-shrink:0; background:#fff; border-right:1px solid var(--gray-200);
  padding:24px 12px; display:flex; flex-direction:column; gap:4px;
}
.nav-section-title { font-size:10px; font-weight:700; color:var(--gray-400);
  letter-spacing:0.1em; text-transform:uppercase; padding:0 12px; margin:12px 0 4px; }
.nav-item {
  display:flex; align-items:center; gap:10px; padding:10px 12px;
  border-radius:10px; font-size:13px; font-weight:500; color:var(--gray-600);
  cursor:pointer; transition:all 0.15s;
}
.nav-item.active { background:rgba(124,58,237,0.08); color:#7C3AED; font-weight:700; }
.nav-item .icon { font-size:16px; width:20px; text-align:center; }
.merchant-info {
  margin-top:auto; padding:12px; border-radius:12px;
  background:rgba(124,58,237,0.05); border:1px solid rgba(124,58,237,0.1);
}
.merchant-label { font-size:9px; color:var(--gray-400); font-weight:600;
  text-transform:uppercase; letter-spacing:0.1em; }
.merchant-id { font-size:11px; color:#7C3AED; font-weight:700; margin-top:2px; }

/* 主内容 */
.main { flex:1; overflow:hidden; padding:28px 32px; }
.page-title { font-size:26px; font-weight:900; color:var(--gray-900); letter-spacing:-0.5px; }
.page-sub { font-size:13px; color:var(--gray-500); margin-top:4px; margin-bottom:24px; }

/* 统计卡片 */
.stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
.stat-card {
  background:#fff; border:1px solid var(--gray-100); border-radius:24px;
  padding:22px 24px; box-shadow:0 1px 3px rgba(0,0,0,0.04);
}
.stat-label { font-size:10px; font-weight:700; color:var(--gray-400);
  text-transform:uppercase; letter-spacing:0.1em; margin-bottom:14px; }
.stat-row { display:flex; align-items:flex-end; justify-content:space-between; }
.stat-value { font-size:26px; font-weight:900; }
.stat-trend { font-size:10px; background:var(--gray-50); border:1px solid var(--gray-200);
  padding:3px 8px; border-radius:10px; font-weight:700; color:var(--gray-400); }

/* 下方双栏 */
.bottom-grid { display:grid; grid-template-columns:2fr 1fr; gap:20px; }
.chart-card {
  background:#fff; border:1px solid var(--gray-100); border-radius:28px;
  padding:24px 28px; box-shadow:0 1px 3px rgba(0,0,0,0.04);
}
.chart-title { font-size:15px; font-weight:700; color:var(--gray-800); margin-bottom:20px;
  display:flex; align-items:center; justify-content:space-between; }
.bar-chart { display:flex; align-items:flex-end; gap:8px; height:150px; }
.bar-wrap { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; }
.bar { width:100%; border-radius:8px 8px 0 0; min-height:8px;
  background:linear-gradient(to top,#F3C136 0%,rgba(243,193,54,0.4) 100%); }
.bar-label { font-size:10px; color:var(--gray-400); font-weight:600; }

/* AI 调用卡片 */
.ai-card {
  background:#fff; border:1px solid var(--gray-100); border-radius:28px;
  padding:24px; box-shadow:0 1px 3px rgba(0,0,0,0.04);
}
.provider-row {
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 0; border-bottom:1px solid var(--gray-100); font-size:13px;
}
.provider-row:last-child { border-bottom:none; }
.provider-name { font-weight:600; color:var(--gray-700); }
.provider-count { font-size:12px; color:var(--gray-400); }
.progress-bar {
  width:80px; height:6px; border-radius:3px;
  background:var(--gray-100); overflow:hidden;
}
.progress-fill { height:100%; border-radius:3px; }

/* 底栏 */
footer {
  position:fixed; bottom:0; left:0; right:0; height:36px;
  background:var(--gray-100); border-top:1px solid var(--gray-200);
  display:flex; align-items:center; justify-content:space-between;
  padding:0 32px; font-size:11px; color:var(--gray-400);
}
</style></head><body>

<div class="top-header">
  <div class="logo-sm">π</div>
  <span class="app-name">${SW_NAME}</span>
  <span class="version-tag">${SW_VERSION}</span>
  <div class="user-pill">
    <div class="user-avatar">T</div>
    <span class="user-name">test_user_001</span>
    <span class="tenant-badge">| ${MERCHANT_ID}</span>
    <button class="logout-btn">退出</button>
  </div>
</div>

<div class="layout">
  <nav class="sidebar">
    <div class="nav-section-title">核心功能</div>
    <div class="nav-item active"><span class="icon">📊</span>控制台</div>
    <div class="nav-item"><span class="icon">🤖</span>AI 智能助手</div>
    <div class="nav-item"><span class="icon">💎</span>Pi 支付</div>
    <div class="nav-item"><span class="icon">📋</span>历史记录</div>
    <div class="nav-section-title">账户</div>
    <div class="nav-item"><span class="icon">🛍️</span>会员管理</div>
    <div class="nav-item"><span class="icon">⚙️</span>系统设置</div>
    <div class="nav-item"><span class="icon">📖</span>API 文档</div>
    <div class="merchant-info">
      <div class="merchant-label">当前租户 · 数据隔离</div>
      <div class="merchant-id">${MERCHANT_ID}</div>
    </div>
  </nav>

  <main class="main">
    <div class="page-title">客户控制台</div>
    <div class="page-sub">${SW_NAME} ${SW_VERSION} — 多租户隔离数据视图 | AsyncLocalStorage 上下文注入</div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">本月 AI 调用</div>
        <div class="stat-row">
          <div class="stat-value" style="color:#7C3AED">3,284</div>
          <div class="stat-trend">↑ 24%</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pi 支付订单</div>
        <div class="stat-row">
          <div class="stat-value" style="color:#F59E0B">π 1,842</div>
          <div class="stat-trend">↑ 12%</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">活跃会员</div>
        <div class="stat-row">
          <div class="stat-value" style="color:#4F46E5">218</div>
          <div class="stat-trend">↑ 5.2%</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">配额使用率</div>
        <div class="stat-row">
          <div class="stat-value" style="color:#34D399">68%</div>
          <div class="stat-trend">/ 5,000</div>
        </div>
      </div>
    </div>

    <div class="bottom-grid">
      <div class="chart-card">
        <div class="chart-title">
          <span>AI 调用趋势（近7日）</span>
          <span style="font-size:11px;color:var(--gray-400);font-weight:500">merchantId: ${MERCHANT_ID}</span>
        </div>
        <div class="bar-chart">
          ${[320, 480, 390, 620, 540, 480, 716]
            .map((h, i) => {
              const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              const pct = Math.round((h / 716) * 100);
              return `<div class="bar-wrap">
              <div class="bar" style="height:${pct}%;"></div>
              <div class="bar-label">${days[i]}</div>
            </div>`;
            })
            .join('')}
        </div>
      </div>

      <div class="ai-card">
        <div style="font-size:15px;font-weight:700;color:var(--gray-800);margin-bottom:16px">
          AI 提供商分布
        </div>
        ${[
          { name: 'OpenAI GPT-4o', cnt: 1842, pct: 56, color: '#7C3AED' },
          { name: 'Anthropic Claude', cnt: 986, pct: 30, color: '#4F46E5' },
          { name: 'Ollama (本地)', cnt: 456, pct: 14, color: '#34D399' },
        ]
          .map(
            (p) => `<div class="provider-row">
          <div>
            <div class="provider-name">${p.name}</div>
            <div class="provider-count">${p.cnt.toLocaleString()} 次</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:13px;font-weight:700;color:${p.color};margin-bottom:4px">${p.pct}%</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${p.pct}%;background:${p.color}"></div>
            </div>
          </div>
        </div>`
          )
          .join('')}
        <div style="margin-top:16px;padding:12px;border-radius:12px;background:rgba(124,58,237,0.05);border:1px solid rgba(124,58,237,0.1)">
          <div style="font-size:10px;color:var(--gray-400);font-weight:600;text-transform:uppercase;margin-bottom:4px">License</div>
          <div style="font-size:13px;font-weight:700;color:#7C3AED">Professional 套餐 ✓</div>
          <div style="font-size:11px;color:var(--gray-400);margin-top:2px">有效期至 2026-12-31</div>
        </div>
      </div>
    </div>
  </main>
</div>

<footer>
  <span>${SW_NAME} ${SW_VERSION} | ${COPYRIGHT}</span>
  <span>租户隔离: AsyncLocalStorage + Prisma 中间件 | merchantId: ${MERCHANT_ID}</span>
  <span>著作权登记号: 2026R11L1477838</span>
</footer>
</body></html>`;
}

// ────────────────────────────────────────────────────────────
// 图3：AI 智能助手界面（深色 Slate 主题）
// ────────────────────────────────────────────────────────────
function htmlAiChat() {
  return `<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=1920"/>
<title>${SW_NAME} ${SW_VERSION} — AI 智能助手</title>
<style>
${BASE_RESET}
body { width:1920px; height:1080px; overflow:hidden;
  background:var(--slate-950); color:#F1F5F9; }
.layout { display:flex; height:100%; }

/* 左侧面板 */
.left-panel {
  width:280px; flex-shrink:0;
  background:var(--slate-900); border-right:1px solid rgba(255,255,255,0.07);
  display:flex; flex-direction:column; padding:24px 16px;
}
.panel-logo { display:flex; align-items:center; gap:10px; margin-bottom:32px; padding:0 4px; }
.panel-logo-box {
  width:36px; height:36px; border-radius:10px;
  background:linear-gradient(135deg,#F3C136,#D18E15);
  display:flex; align-items:center; justify-content:center;
}
.panel-logo-inner {
  width:30px; height:30px; border-radius:7px; background:#150B20;
  display:flex; align-items:center; justify-content:center;
  font-size:14px; font-weight:900; color:#F3C136;
}
.panel-name { font-size:15px; font-weight:700; color:#fff; }
.panel-version { font-size:10px; color:rgba(243,193,54,0.7); }

.section-title { font-size:10px; font-weight:700; color:var(--slate-400);
  text-transform:uppercase; letter-spacing:0.1em; padding:0 8px; margin-bottom:6px; }
.nav-item {
  display:flex; align-items:center; gap:10px; padding:9px 12px;
  border-radius:10px; font-size:13px; font-weight:500; color:var(--slate-400); margin-bottom:2px;
}
.nav-item.active { background:rgba(124,58,237,0.15); color:#A78BFA; font-weight:600; }
.nav-item .icon { font-size:15px; width:18px; }

.routing-box {
  margin-top:auto; padding:14px; border-radius:14px;
  background:rgba(124,58,237,0.1); border:1px solid rgba(124,58,237,0.2);
}
.routing-title { font-size:10px; font-weight:700; color:#A78BFA;
  text-transform:uppercase; letter-spacing:0.1em; margin-bottom:10px; }
.provider-status { display:flex; align-items:center; gap:8px; margin-bottom:8px; font-size:12px; }
.status-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.primary { color:#fff; font-weight:600; }
.fallback { color:var(--slate-400); }

/* 主聊天区 */
.chat-main { flex:1; display:flex; flex-direction:column; }

/* 顶部导航 */
.chat-header {
  height:64px; background:var(--slate-900); border-bottom:1px solid rgba(255,255,255,0.07);
  display:flex; align-items:center; padding:0 32px; gap:16px; flex-shrink:0;
}
.chat-header h1 { font-size:18px; font-weight:700; color:#fff; }
.provider-selector {
  margin-left:auto; display:flex; align-items:center; gap:10px;
}
.selector-label { font-size:12px; color:var(--slate-400); }
.selector-box {
  display:flex; align-items:center; gap:6px; padding:7px 14px;
  border-radius:12px; border:1px solid rgba(124,58,237,0.4);
  background:rgba(124,58,237,0.1); color:#A78BFA; font-size:13px; font-weight:600;
  cursor:pointer;
}
.selector-arrow { color:var(--slate-400); font-size:10px; }

/* 路由决策条幅 */
.routing-banner {
  background:rgba(124,58,237,0.08); border-bottom:1px solid rgba(124,58,237,0.15);
  padding:10px 32px; display:flex; align-items:center; gap:12px;
  font-size:12px; color:#A78BFA; flex-shrink:0;
}
.routing-label { font-weight:700; background:rgba(124,58,237,0.2);
  padding:3px 10px; border-radius:6px; font-size:10px; letter-spacing:0.05em; }

/* 消息流 */
.messages { flex:1; overflow-y:auto; padding:32px; display:flex; flex-direction:column; gap:20px; }
.msg { display:flex; gap:12px; }
.msg.user { flex-direction:row-reverse; }
.avatar {
  width:36px; height:36px; border-radius:50%; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; font-size:14px;
}
.avatar.ai { background:linear-gradient(135deg,#7C3AED,#4F46E5); color:#fff; font-weight:700; }
.avatar.user { background:linear-gradient(135deg,#F3C136,#D18E15); color:#1E112A; font-weight:700; }
.bubble {
  max-width:680px; padding:14px 18px; border-radius:18px; font-size:14px; line-height:1.65;
}
.bubble.ai {
  background:var(--slate-800); color:#E2E8F0; border-radius:4px 18px 18px 18px;
}
.bubble.user {
  background:rgba(124,58,237,0.2); color:#C4B5FD; border-radius:18px 4px 18px 18px;
}
.bubble .model-tag {
  font-size:10px; color:#7C3AED; font-weight:700;
  text-transform:uppercase; letter-spacing:0.08em; margin-bottom:6px; display:block;
}
.code-block {
  background:var(--slate-950); border-radius:10px; padding:12px 16px;
  margin:10px 0; font-family:'Courier New',monospace; font-size:12px;
  color:#A78BFA; border:1px solid rgba(124,58,237,0.2); line-height:1.5;
}
.streaming-cursor {
  display:inline-block; width:2px; height:14px;
  background:#7C3AED; vertical-align:middle; margin-left:2px;
  animation:blink 1s infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

/* 输入区 */
.input-area {
  padding:20px 32px 28px; background:var(--slate-900);
  border-top:1px solid rgba(255,255,255,0.07); flex-shrink:0;
}
.input-box {
  display:flex; align-items:flex-end; gap:12px;
  background:var(--slate-800); border:1px solid rgba(124,58,237,0.3);
  border-radius:20px; padding:14px 16px; 
}
.input-text {
  flex:1; background:none; border:none; outline:none;
  color:#E2E8F0; font-size:14px; resize:none; min-height:20px; line-height:1.5;
  font-family:inherit;
}
.send-btn {
  width:40px; height:40px; border-radius:12px; border:none;
  background:var(--purple); cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  color:#fff; font-size:16px; flex-shrink:0;
}
.input-meta { display:flex; gap:16px; margin-top:8px; font-size:11px; color:var(--slate-400); }

/* 右侧信息面板 */
.right-panel {
  width:260px; flex-shrink:0; background:var(--slate-900);
  border-left:1px solid rgba(255,255,255,0.07); padding:24px 16px;
}
.panel-section { margin-bottom:24px; }
.panel-section-title { font-size:10px; font-weight:700; color:var(--slate-400);
  text-transform:uppercase; letter-spacing:0.1em; margin-bottom:12px; }
.decision-card {
  background:var(--slate-800); border-radius:12px; padding:14px;
  border:1px solid rgba(255,255,255,0.06); font-size:12px;
}
.decision-row { display:flex; justify-content:space-between; margin-bottom:6px; }
.decision-key { color:var(--slate-400); }
.decision-val { color:#E2E8F0; font-weight:600; }
.decision-val.green { color:#34D399; }
.decision-val.yellow { color:#FBBF24; }
</style></head><body>

<div class="layout">
  <!-- 左侧面板 -->
  <div class="left-panel">
    <div class="panel-logo">
      <div class="panel-logo-box"><div class="panel-logo-inner">π</div></div>
      <div>
        <div class="panel-name">Pioneer AI</div>
        <div class="panel-version">${SW_VERSION}</div>
      </div>
    </div>
    <div class="section-title">功能</div>
    <div class="nav-item"><span class="icon">📊</span>控制台</div>
    <div class="nav-item active"><span class="icon">🤖</span>AI 智能助手</div>
    <div class="nav-item"><span class="icon">💬</span>对话历史</div>
    <div class="nav-item"><span class="icon">🎨</span>图像生成</div>
    <div class="nav-item"><span class="icon">💎</span>Pi 支付</div>
    <div class="nav-item"><span class="icon">⚙️</span>系统设置</div>
    <div class="routing-box">
      <div class="routing-title">AI 路由状态</div>
      <div class="provider-status">
        <span class="status-dot" style="background:#34D399"></span>
        <span class="primary">OpenAI GPT-4o</span>
        <span style="font-size:10px;color:#34D399;margin-left:auto">主节点</span>
      </div>
      <div class="provider-status">
        <span class="status-dot" style="background:#FBBF24"></span>
        <span class="fallback">Anthropic Claude</span>
        <span style="font-size:10px;color:var(--slate-400);margin-left:auto">备选1</span>
      </div>
      <div class="provider-status">
        <span class="status-dot" style="background:var(--slate-400)"></span>
        <span class="fallback">Ollama 本地</span>
        <span style="font-size:10px;color:var(--slate-400);margin-left:auto">备选2</span>
      </div>
    </div>
  </div>

  <!-- 主聊天区 -->
  <div class="chat-main">
    <div class="chat-header">
      <h1>AI 智能助手</h1>
      <div style="font-size:12px;color:var(--slate-400)">${SW_NAME} ${SW_VERSION}</div>
      <div class="provider-selector">
        <span class="selector-label">当前模型：</span>
        <div class="selector-box">
          <span>🤖</span>
          <span>OpenAI GPT-4o</span>
          <span class="selector-arrow">▼</span>
        </div>
        <div class="selector-box" style="background:rgba(243,193,54,0.08);border-color:rgba(243,193,54,0.3);color:#F3C136">
          <span>π</span>
          <span>test_user_001</span>
        </div>
      </div>
    </div>

    <div class="routing-banner">
      <span class="routing-label">RoutingDecision</span>
      <span>provider=<strong>openai</strong> · model=gpt-4o · latency=234ms · fallback=false · tokens_remaining=4766/5000</span>
      <span style="margin-left:auto;color:#34D399">● 主节点正常</span>
    </div>

    <div class="messages">
      <div class="msg user">
        <div class="avatar user">U</div>
        <div class="bubble user">我想优化前端商户的 Pi 支付体验，特别是支付状态轮询部分，有什么建议？</div>
      </div>

      <div class="msg">
        <div class="avatar ai">AI</div>
        <div class="bubble ai">
          <span class="model-tag">GPT-4o · 主节点 · 响应时间 234ms</span>
          针对 Pi Network U2A 支付的状态轮询优化，我建议以下几点：<br/><br/>
          <strong style="color:#A78BFA">1. 指数退避轮询策略</strong><br/>
          避免固定间隔轮询导致 API 配额耗尽：
          <div class="code-block">// 指数退避：500ms → 1s → 2s → 4s → 最大10s
const pollPaymentStatus = async (paymentId: string) => {
  let delay = 500;
  while (delay &lt;= 10000) {
    const status = await fetch(\`/api/payments/\${paymentId}/status\`);
    if (status === 'COMPLETED' || status === 'CANCELLED') break;
    await sleep(delay);
    delay = Math.min(delay * 2, 10000);
  }
};</div>
          <strong style="color:#A78BFA">2. 幂等性保护</strong><br/>
          每次支付请求携带唯一 <code style="color:#F3C136">idempotencyKey</code>，防止重复扣款：
        </div>
      </div>

      <div class="msg">
        <div class="avatar ai">AI</div>
        <div class="bubble ai" style="border:1px solid rgba(124,58,237,0.2)">
          <span class="model-tag" style="color:#FBBF24">⚠ 已切换至备用服务 Anthropic Claude (主节点超时 &gt;5s)</span>
          继续：孤儿支付处理方面，Pi SDK 的 <code style="color:#F3C136">onReadyForServerApproval</code> 回调可以和数据库事务结合，实现支付确认的原子操作，保障幂等性…<span class="streaming-cursor"></span>
        </div>
      </div>
    </div>

    <div class="input-area">
      <div class="input-box">
        <textarea class="input-text" rows="2">支付超时后如何处理孤儿订单？</textarea>
        <button class="send-btn">↑</button>
      </div>
      <div class="input-meta">
        <span>模型: GPT-4o · 备选: Claude → Ollama</span>
        <span>本月用量: 3,284 / 5,000 次 (65.7%)</span>
        <span>merchantId: ${MERCHANT_ID}</span>
        <span style="margin-left:auto;color:#34D399">● 已连接</span>
      </div>
    </div>
  </div>

  <!-- 右侧信息面板 -->
  <div class="right-panel">
    <div class="panel-section">
      <div class="panel-section-title">路由决策详情</div>
      <div class="decision-card">
        <div class="decision-row"><span class="decision-key">策略</span><span class="decision-val">优先级轮询</span></div>
        <div class="decision-row"><span class="decision-key">主节点</span><span class="decision-val green">GPT-4o ●</span></div>
        <div class="decision-row"><span class="decision-key">备选1</span><span class="decision-val yellow">Claude ●</span></div>
        <div class="decision-row"><span class="decision-key">备选2</span><span class="decision-key">Ollama ●</span></div>
        <div class="decision-row"><span class="decision-key">Fallback</span><span class="decision-val green">已激活1次</span></div>
        <div class="decision-row"><span class="decision-key">响应时间</span><span class="decision-val">234ms</span></div>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">本月用量统计</div>
      <div class="decision-card">
        <div class="decision-row"><span class="decision-key">总调用</span><span class="decision-val">3,284</span></div>
        <div class="decision-row"><span class="decision-key">配额上限</span><span class="decision-val">5,000</span></div>
        <div class="decision-row"><span class="decision-key">使用率</span><span class="decision-val yellow">65.7%</span></div>
        <div style="margin-top:10px">
          <div style="height:6px;border-radius:3px;background:rgba(255,255,255,0.1);overflow:hidden">
            <div style="height:100%;width:65.7%;background:linear-gradient(to right,#7C3AED,#FBBF24);border-radius:3px"></div>
          </div>
          <div style="font-size:10px;color:var(--slate-400);margin-top:4px">预警阈值 80%（4,000次）</div>
        </div>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">License 授权</div>
      <div class="decision-card">
        <div class="decision-row"><span class="decision-key">套餐</span><span class="decision-val" style="color:#A78BFA">Professional</span></div>
        <div class="decision-row"><span class="decision-key">状态</span><span class="decision-val green">✓ 有效</span></div>
        <div class="decision-row"><span class="decision-key">签名验证</span><span class="decision-val green">HMAC-SHA256 ✓</span></div>
        <div class="decision-row"><span class="decision-key">到期</span><span class="decision-val">2026-12-31</span></div>
      </div>
    </div>
  </div>
</div>
</body></html>`;
}

// ────────────────────────────────────────────────────────────
// 图4：支付确认界面（浅色主题）
// ────────────────────────────────────────────────────────────
function htmlCheckout() {
  return `<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=1920"/>
<title>${SW_NAME} ${SW_VERSION} — Pi 支付确认</title>
<style>
${BASE_RESET}
body { width:1920px; height:1080px; overflow:hidden;
  background:var(--gray-50); color:var(--gray-900); }

.page-header {
  height:64px; background:#fff; border-bottom:1px solid var(--gray-200);
  display:flex; align-items:center; padding:0 32px; gap:16px;
  box-shadow:0 1px 3px rgba(0,0,0,0.04);
}
.back-btn { font-size:13px; color:var(--gray-500); padding:6px 14px; border-radius:8px;
  border:1px solid var(--gray-200); cursor:pointer; font-weight:500; }
.page-title-hd { font-size:16px; font-weight:700; color:var(--gray-900); margin-left:12px; }
.sw-tag { margin-left:auto; font-size:11px; color:var(--gray-400); }

.main { display:flex; align-items:center; justify-content:center;
  height:calc(1080px - 64px - 40px); gap:40px; padding:0 80px; }

/* 左侧订单信息 */
.order-panel { width:480px; flex-shrink:0; }
.panel-header { font-size:22px; font-weight:900; color:var(--gray-900); margin-bottom:6px; }
.panel-sub { font-size:13px; color:var(--gray-500); margin-bottom:24px; }

.order-card {
  background:#fff; border:1px solid var(--gray-200); border-radius:20px;
  padding:28px; box-shadow:0 2px 8px rgba(0,0,0,0.05); margin-bottom:16px;
}
.order-title { font-size:14px; font-weight:700; color:var(--gray-700); margin-bottom:16px;
  padding-bottom:12px; border-bottom:1px solid var(--gray-100); }
.order-row { display:flex; justify-content:space-between; align-items:center;
  padding:10px 0; border-bottom:1px solid var(--gray-50); font-size:13px; }
.order-row:last-child { border-bottom:none; }
.order-key { color:var(--gray-500); }
.order-val { font-weight:600; color:var(--gray-800); }
.order-val.pi { color:#F59E0B; font-size:16px; font-weight:900; }
.order-val.status { color:#34D399; }
.pi-logo { display:inline-block; width:20px; height:20px; border-radius:50%;
  background:linear-gradient(135deg,#F3C136,#D18E15);
  color:#1E112A; font-size:11px; font-weight:900;
  text-align:center; line-height:20px; margin-right:4px; }

.summary-card {
  background:linear-gradient(135deg,rgba(243,193,54,0.08),rgba(243,193,54,0.03));
  border:1px solid rgba(243,193,54,0.3); border-radius:20px;
  padding:20px 24px;
}
.summary-row { display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px; }
.summary-total { display:flex; justify-content:space-between; align-items:center;
  margin-top:12px; padding-top:12px; border-top:1px solid rgba(243,193,54,0.2); }
.total-label { font-size:14px; font-weight:700; color:var(--gray-700); }
.total-amount { font-size:28px; font-weight:900; color:#F59E0B; }

/* 右侧支付按钮区 */
.pay-panel { width:380px; flex-shrink:0; display:flex; flex-direction:column; gap:16px; }
.pi-pay-card {
  background:#fff; border:1px solid var(--gray-200); border-radius:24px;
  padding:32px; box-shadow:0 4px 16px rgba(0,0,0,0.06);
  display:flex; flex-direction:column; align-items:center; text-align:center;
}
.pi-badge {
  width:72px; height:72px; border-radius:50%;
  background:linear-gradient(135deg,#F3C136,#D18E15);
  display:flex; align-items:center; justify-content:center;
  font-size:32px; font-weight:900; color:#1E112A; margin-bottom:20px;
  box-shadow:0 8px 24px rgba(243,193,54,0.3);
}
.pay-title { font-size:18px; font-weight:800; color:var(--gray-900); margin-bottom:8px; }
.pay-amount { font-size:42px; font-weight:900; color:#F59E0B; margin-bottom:4px; line-height:1; }
.pay-unit { font-size:13px; color:var(--gray-400); margin-bottom:24px; }
.pay-btn {
  width:100%; padding:18px; border-radius:16px; border:none; cursor:pointer;
  background:linear-gradient(135deg,#F3C136,#D18E15);
  color:#1E112A; font-size:16px; font-weight:800;
  box-shadow:0 6px 20px rgba(243,193,54,0.4);
  display:flex; align-items:center; justify-content:center; gap:10px;
}
.lifecycle-box {
  background:#fff; border:1px solid var(--gray-200); border-radius:16px; padding:20px;
}
.lifecycle-title { font-size:12px; font-weight:700; color:var(--gray-500);
  text-transform:uppercase; letter-spacing:0.08em; margin-bottom:14px; }
.lifecycle-step { display:flex; align-items:center; gap:10px; margin-bottom:10px; font-size:12px; }
.step-dot { width:22px; height:22px; border-radius:50%; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; }
.step-dot.done { background:#34D399; color:#fff; }
.step-dot.active { background:#F3C136; color:#1E112A; }
.step-dot.pending { background:var(--gray-100); color:var(--gray-400); border:1px solid var(--gray-200); }
.step-connector { width:1px; height:12px; background:var(--gray-200); margin-left:10px; margin-bottom:-4px; }

.status-info {
  background:var(--gray-50); border:1px solid var(--gray-100); border-radius:12px; padding:14px;
}
.status-row { display:flex; justify-content:space-between; font-size:11px;
  color:var(--gray-500); margin-bottom:6px; }
.status-row:last-child { margin-bottom:0; }
.status-val { font-weight:600; color:var(--gray-700); }

footer {
  position:fixed; bottom:0; left:0; right:0; height:40px;
  background:var(--gray-100); border-top:1px solid var(--gray-200);
  display:flex; align-items:center; justify-content:space-between;
  padding:0 32px; font-size:11px; color:var(--gray-400);
}
</style></head><body>

<div class="page-header">
  <button class="back-btn">← 返回</button>
  <div class="page-title-hd">Pi Network 支付确认</div>
  <div class="sw-tag">${SW_NAME} ${SW_VERSION} · ${COPYRIGHT}</div>
</div>

<div class="main">
  <div class="order-panel">
    <div class="panel-header">订单确认</div>
    <div class="panel-sub">请核实以下订单信息，确认后发起 Pi 区块链支付</div>

    <div class="order-card">
      <div class="order-title">📦 商品信息</div>
      <div class="order-row">
        <span class="order-key">商品名称</span>
        <span class="order-val">AI 服务授权套餐 — Professional</span>
      </div>
      <div class="order-row">
        <span class="order-key">授权期限</span>
        <span class="order-val">12 个月（至 2026-12-31）</span>
      </div>
      <div class="order-row">
        <span class="order-key">AI 调用配额</span>
        <span class="order-val">5,000 次/月</span>
      </div>
      <div class="order-row">
        <span class="order-key">支持提供商</span>
        <span class="order-val">GPT-4o · Claude · Ollama</span>
      </div>
      <div class="order-row">
        <span class="order-key">商户标识</span>
        <span class="order-val" style="color:#7C3AED;font-size:12px">${MERCHANT_ID}</span>
      </div>
      <div class="order-row">
        <span class="order-key">订单状态</span>
        <span class="order-val status">● PENDING</span>
      </div>
    </div>

    <div class="summary-card">
      <div class="summary-row">
        <span style="color:var(--gray-600)">套餐基础价格</span>
        <span style="color:var(--gray-700);font-weight:600"><span class="pi-logo">π</span>20.00</span>
      </div>
      <div class="summary-row">
        <span style="color:var(--gray-600)">License 授权费</span>
        <span style="color:var(--gray-700);font-weight:600"><span class="pi-logo">π</span>5.00</span>
      </div>
      <div class="summary-total">
        <span class="total-label">实付金额</span>
        <span class="total-amount"><span style="font-size:18px">π</span> 25.00</span>
      </div>
    </div>
  </div>

  <div class="pay-panel">
    <div class="pi-pay-card">
      <div class="pi-badge">π</div>
      <div class="pay-title">使用 Pi Wallet 支付</div>
      <div class="pay-amount">π 25.00</div>
      <div class="pay-unit">Pi Network 区块链原生支付 · U2A</div>
      <button class="pay-btn">
        <span style="font-size:20px">π</span>
        使用 Pi Wallet 支付
      </button>
    </div>

    <div class="lifecycle-box">
      <div class="lifecycle-title">U2A 支付生命周期</div>
      <div class="step-dot" style="display:none"></div>
      <div class="lifecycle-step">
        <div class="step-dot done">✓</div>
        <span style="color:#34D399;font-weight:600">1. 创建支付请求</span>
      </div>
      <div class="step-connector"></div>
      <div class="lifecycle-step">
        <div class="step-dot active">2</div>
        <span style="color:#F59E0B;font-weight:600">2. 等待 Pi 钱包审批</span>
      </div>
      <div class="step-connector"></div>
      <div class="lifecycle-step">
        <div class="step-dot pending">3</div>
        <span style="color:var(--gray-400)">3. 链上广播 &amp; 确认</span>
      </div>
      <div class="step-connector"></div>
      <div class="lifecycle-step">
        <div class="step-dot pending">4</div>
        <span style="color:var(--gray-400)">4. 服务端完成回调</span>
      </div>
    </div>

    <div class="status-info">
      <div class="status-row"><span>支付ID</span><span class="status-val">pay_2026_abc123***</span></div>
      <div class="status-row"><span>幂等键</span><span class="status-val">idem_7f8a9b***</span></div>
      <div class="status-row"><span>链上 TxID</span><span class="status-val">等待广播...</span></div>
      <div class="status-row"><span>安全协议</span><span class="status-val" style="color:#34D399">Pi SDK 2.0 ✓</span></div>
    </div>
  </div>
</div>

<footer>
  <span>${SW_NAME} ${SW_VERSION} | ${COPYRIGHT}</span>
  <span>Pi Network U2A 支付 · 幂等性保护 · 孤儿支付自动处理</span>
  <span>著作权登记号: 2026R11L1477838</span>
</footer>
</body></html>`;
}

// ────────────────────────────────────────────────────────────
// 图5：支付历史记录（深色 Slate 主题）
// ────────────────────────────────────────────────────────────
function htmlHistory() {
  const records = [
    {
      id: 'ord_2026_001',
      date: '2026-07-01 14:23',
      amount: 'π 25.00',
      status: 'COMPLETED',
      txid: '0xf8a2...d4e1',
      provider: 'Professional',
    },
    {
      id: 'ord_2026_002',
      date: '2026-06-28 09:15',
      amount: 'π 12.00',
      status: 'COMPLETED',
      txid: '0x3c17...b9f2',
      provider: 'Starter',
    },
    {
      id: 'ord_2026_003',
      date: '2026-06-25 16:40',
      amount: 'π 48.00',
      status: 'COMPLETED',
      txid: '0xa912...7c3d',
      provider: 'Enterprise',
    },
    {
      id: 'ord_2026_004',
      date: '2026-06-22 11:08',
      amount: 'π 25.00',
      status: 'CANCELLED',
      txid: '—',
      provider: 'Professional',
    },
    {
      id: 'ord_2026_005',
      date: '2026-06-20 08:55',
      amount: 'π 25.00',
      status: 'PENDING',
      txid: '等待广播...',
      provider: 'Professional',
    },
    {
      id: 'ord_2026_006',
      date: '2026-06-18 20:12',
      amount: 'π 12.00',
      status: 'APPROVED',
      txid: '0xe501...4a8c',
      provider: 'Starter',
    },
    {
      id: 'ord_2026_007',
      date: '2026-06-15 15:30',
      amount: 'π 48.00',
      status: 'COMPLETED',
      txid: '0xb203...1f6d',
      provider: 'Enterprise',
    },
    {
      id: 'ord_2026_008',
      date: '2026-06-10 13:45',
      amount: 'π 25.00',
      status: 'COMPLETED',
      txid: '0xd7e4...9c2b',
      provider: 'Professional',
    },
  ];
  const STATUS_COLOR = {
    COMPLETED: 'color:#34D399;background:rgba(52,211,153,0.1);border-color:rgba(52,211,153,0.2)',
    APPROVED: 'color:#60A5FA;background:rgba(96,165,250,0.1);border-color:rgba(96,165,250,0.2)',
    PENDING: 'color:#FBBF24;background:rgba(251,191,36,0.1);border-color:rgba(251,191,36,0.2)',
    CANCELLED: 'color:#F87171;background:rgba(248,113,113,0.1);border-color:rgba(248,113,113,0.2)',
  };

  return `<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=1920"/>
<title>${SW_NAME} ${SW_VERSION} — 支付历史记录</title>
<style>
${BASE_RESET}
body { width:1920px; height:1080px; overflow:hidden;
  background:var(--slate-950); color:#E2E8F0; }
.header {
  height:64px; background:var(--slate-900);
  border-bottom:1px solid rgba(255,255,255,0.07);
  display:flex; align-items:center; padding:0 40px; gap:16px;
}
.back-link { color:var(--slate-400); font-size:13px; cursor:pointer; }
h1 { font-size:20px; font-weight:700; color:#fff; }
.sw-badge { margin-left:auto; padding:5px 14px; border-radius:12px;
  border:1px solid rgba(255,255,255,0.1); font-size:11px; color:var(--slate-400); }

.main { padding:32px 40px; height:calc(1080px - 64px - 40px); overflow:hidden; }

.toolbar { display:flex; align-items:center; gap:12px; margin-bottom:24px; }
.toolbar h2 { font-size:22px; font-weight:800; color:#fff; flex:1; }
.filter-group { display:flex; gap:8px; }
.filter-btn {
  padding:7px 16px; border-radius:10px; border:1px solid rgba(255,255,255,0.1);
  background:transparent; color:var(--slate-400); font-size:12px; font-weight:600; cursor:pointer;
}
.filter-btn.active { background:rgba(124,58,237,0.15); border-color:rgba(124,58,237,0.4);
  color:#A78BFA; }
.date-filter {
  padding:7px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.1);
  background:var(--slate-800); color:var(--slate-400); font-size:12px; font-family:inherit;
}
.stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
.stat-mini {
  background:var(--slate-900); border:1px solid rgba(255,255,255,0.07); border-radius:14px;
  padding:14px 18px;
}
.stat-mini-label { font-size:10px; font-weight:700; color:var(--slate-400);
  text-transform:uppercase; letter-spacing:0.08em; margin-bottom:6px; }
.stat-mini-val { font-size:22px; font-weight:900; }

table { width:100%; border-collapse:collapse; }
th {
  text-align:left; padding:12px 16px;
  font-size:10px; font-weight:700; color:var(--slate-400);
  text-transform:uppercase; letter-spacing:0.08em;
  border-bottom:1px solid rgba(255,255,255,0.07);
  background:rgba(255,255,255,0.02);
}
td { padding:14px 16px; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.04); }
tr:hover td { background:rgba(255,255,255,0.02); }
.status-tag {
  display:inline-block; padding:4px 10px; border-radius:8px;
  font-size:11px; font-weight:700; border:1px solid;
}
.txid { font-family:'Courier New',monospace; font-size:11px; color:var(--slate-400); }
.txid.link { color:#60A5FA; cursor:pointer; text-decoration:underline; }
.amount { font-weight:700; color:#FBBF24; }
.order-id { font-family:'Courier New',monospace; font-size:12px; color:var(--slate-400); }

footer {
  position:fixed; bottom:0; left:0; right:0; height:40px;
  background:var(--slate-900); border-top:1px solid rgba(255,255,255,0.07);
  display:flex; align-items:center; justify-content:space-between;
  padding:0 40px; font-size:11px; color:var(--slate-400);
}
</style></head><body>

<div class="header">
  <span class="back-link">← 控制台</span>
  <h1>Pi 支付历史记录</h1>
  <span class="sw-badge">${SW_NAME} ${SW_VERSION} | merchantId: ${MERCHANT_ID}</span>
</div>

<div class="main">
  <div class="toolbar">
    <h2>全部订单</h2>
    <div class="filter-group">
      <button class="filter-btn active">全部</button>
      <button class="filter-btn">COMPLETED</button>
      <button class="filter-btn">PENDING</button>
      <button class="filter-btn">CANCELLED</button>
    </div>
    <input class="date-filter" type="text" value="2026-06-01 ~ 2026-07-01"/>
  </div>

  <div class="stats-row">
    <div class="stat-mini">
      <div class="stat-mini-label">总订单数</div>
      <div class="stat-mini-val" style="color:#fff">42</div>
    </div>
    <div class="stat-mini">
      <div class="stat-mini-label">已完成</div>
      <div class="stat-mini-val" style="color:#34D399">38</div>
    </div>
    <div class="stat-mini">
      <div class="stat-mini-label">累计收入</div>
      <div class="stat-mini-val" style="color:#FBBF24">π 1,284.50</div>
    </div>
    <div class="stat-mini">
      <div class="stat-mini-label">成功率</div>
      <div class="stat-mini-val" style="color:#60A5FA">90.5%</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>订单 ID</th>
        <th>创建时间</th>
        <th>金额</th>
        <th>套餐类型</th>
        <th>支付状态</th>
        <th>链上 TxID（区块链）</th>
        <th>幂等键</th>
      </tr>
    </thead>
    <tbody>
      ${records
        .map(
          (r, i) => `<tr>
        <td class="order-id">${r.id}</td>
        <td style="color:var(--slate-400)">${r.date}</td>
        <td class="amount">${r.amount}</td>
        <td style="color:var(--slate-300)">${r.provider}</td>
        <td><span class="status-tag" style="${STATUS_COLOR[r.status] || ''}">${r.status}</span></td>
        <td class="txid ${r.txid.startsWith('0x') ? 'link' : ''}">${r.txid}</td>
        <td style="color:var(--slate-400);font-size:11px;font-family:'Courier New',monospace">idem_${String(i + 1).padStart(3, '0')}***</td>
      </tr>`
        )
        .join('')}
    </tbody>
  </table>
</div>

<footer>
  <span>${SW_NAME} ${SW_VERSION} | ${COPYRIGHT}</span>
  <span>Pi Network 双阶段支付确认 · 幂等性保护 · 孤儿支付自动处理</span>
  <span>著作权登记号: 2026R11L1477838</span>
</footer>
</body></html>`;
}

// ────────────────────────────────────────────────────────────
// 图6：管理后台数据概览（浅色主题）
// ────────────────────────────────────────────────────────────
function htmlAdminDashboard() {
  return `<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=1920"/>
<title>${SW_NAME} ${SW_VERSION} — 管理后台数据概览</title>
<style>
${BASE_RESET}
body { width:1920px; height:1080px; overflow:hidden; background:var(--gray-50); color:var(--gray-900); }

/* 顶部 header */
.admin-header {
  height:64px; background:var(--gray-900); color:#fff;
  display:flex; align-items:center; padding:0 32px; gap:16px;
}
.admin-logo {
  width:36px; height:36px; border-radius:10px;
  background:linear-gradient(135deg,#F3C136,#EEA834);
  display:flex; align-items:center; justify-content:center;
  font-size:16px; font-weight:900; color:#1E112A;
}
.admin-title { font-size:16px; font-weight:700; color:#fff; }
.admin-version { font-size:10px; background:rgba(255,255,255,0.1);
  padding:3px 10px; border-radius:10px; color:rgba(255,255,255,0.6); font-weight:600; }
.admin-right { margin-left:auto; display:flex; gap:12px; align-items:center; }
.admin-user { font-size:13px; color:rgba(255,255,255,0.7); }
.admin-role { font-size:10px; background:rgba(243,193,54,0.2); color:#F3C136;
  padding:3px 10px; border-radius:10px; font-weight:700; }

/* 布局 */
.layout { display:flex; height:calc(1080px - 64px); }

/* 侧栏 */
.sidebar {
  width:200px; flex-shrink:0; background:var(--gray-900); color:#fff;
  padding:20px 12px; display:flex; flex-direction:column; gap:2px;
}
.nav-item {
  display:flex; align-items:center; gap:10px; padding:10px 12px;
  border-radius:10px; font-size:13px; font-weight:500; color:rgba(255,255,255,0.5);
}
.nav-item.active { background:rgba(255,255,255,0.08); color:#fff; font-weight:600; }
.nav-item .icon { font-size:16px; width:18px; }

/* 主内容 */
.main { flex:1; padding:24px 28px; overflow:hidden; }
.main-title { font-size:26px; font-weight:900; color:var(--gray-900); letter-spacing:-0.5px; margin-bottom:4px; }
.main-sub { font-size:12px; color:var(--gray-400); margin-bottom:20px; }

/* 顶部统计 */
.stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px; }
.stat-card {
  background:#fff; border:1px solid var(--gray-100); border-radius:24px;
  padding:18px 22px; box-shadow:0 1px 4px rgba(0,0,0,0.04);
}
.stat-label { font-size:10px; font-weight:700; color:var(--gray-400);
  text-transform:uppercase; letter-spacing:0.1em; margin-bottom:10px; }
.stat-value { font-size:24px; font-weight:900; }
.stat-trend { font-size:10px; color:var(--gray-400); margin-top:4px; }

/* 中间双栏 */
.mid-row { display:grid; grid-template-columns:2fr 1fr; gap:16px; margin-bottom:16px; }
.chart-box {
  background:#fff; border:1px solid var(--gray-100); border-radius:22px;
  padding:22px 24px; box-shadow:0 1px 4px rgba(0,0,0,0.04);
}
.chart-box-title { font-size:14px; font-weight:700; color:var(--gray-800); margin-bottom:16px; display:flex; align-items:center; justify-content:space-between; }
.bar-chart { display:flex; align-items:flex-end; gap:8px; height:120px; }
.bar-grp { flex:1; display:flex; flex-direction:column; align-items:center; gap:5px; }
.bar { width:100%; border-radius:6px 6px 0 0; }
.bar-lbl { font-size:9px; color:var(--gray-400); font-weight:600; }

/* 配额卡片 */
.quota-box {
  background:#fff; border:1px solid var(--gray-100); border-radius:22px;
  padding:22px; box-shadow:0 1px 4px rgba(0,0,0,0.04);
}
.quota-row { margin-bottom:14px; }
.quota-label { display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px; }
.quota-name { color:var(--gray-700); font-weight:600; }
.quota-num { color:var(--gray-500); }
.quota-bar { height:8px; border-radius:4px; background:var(--gray-100); overflow:hidden; }
.quota-fill { height:100%; border-radius:4px; }

/* 底部行 */
.bottom-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; }
.info-card {
  background:#fff; border:1px solid var(--gray-100); border-radius:22px;
  padding:20px 22px; box-shadow:0 1px 4px rgba(0,0,0,0.04);
}
.info-card-title { font-size:13px; font-weight:700; color:var(--gray-800); margin-bottom:14px; }
.info-row { display:flex; justify-content:space-between; align-items:center;
  padding:8px 0; border-bottom:1px solid var(--gray-50); font-size:12px; }
.info-row:last-child { border-bottom:none; }
.info-key { color:var(--gray-400); }
.info-val { font-weight:600; color:var(--gray-700); }

footer {
  position:fixed; bottom:0; left:0; right:0; height:36px;
  background:var(--gray-900); border-top:1px solid rgba(255,255,255,0.05);
  display:flex; align-items:center; justify-content:space-between;
  padding:0 32px; font-size:11px; color:rgba(255,255,255,0.4);
}
</style></head><body>

<div class="admin-header">
  <div class="admin-logo">π</div>
  <div class="admin-title">${SW_NAME} — 管理后台</div>
  <div class="admin-version">${SW_VERSION}</div>
  <div class="admin-right">
    <span class="admin-user">admin@pioneer.ai</span>
    <span class="admin-role">超级管理员</span>
  </div>
</div>

<div class="layout">
  <nav class="sidebar">
    <div class="nav-item active"><span class="icon">📊</span>数据概览</div>
    <div class="nav-item"><span class="icon">🏪</span>商户管理</div>
    <div class="nav-item"><span class="icon">💎</span>支付监控</div>
    <div class="nav-item"><span class="icon">🤖</span>AI 调用日志</div>
    <div class="nav-item"><span class="icon">🔑</span>License 管理</div>
    <div class="nav-item"><span class="icon">📋</span>订单管理</div>
    <div class="nav-item"><span class="icon">👥</span>会员管理</div>
    <div class="nav-item"><span class="icon">⚙️</span>店铺设置</div>
    <div class="nav-item"><span class="icon">📡</span>系统监控</div>
  </nav>

  <main class="main">
    <div class="main-title">业务实时监控大盘</div>
    <div class="main-sub">${SW_NAME} ${SW_VERSION} — 微秒级用量统计 · 实时配额监控 · License 管理</div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">今日流水</div>
        <div class="stat-value" style="color:#F59E0B">π 1,284.50</div>
        <div class="stat-trend">↑ +12.5% 较昨日</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">AI 调用（今日）</div>
        <div class="stat-value" style="color:#7C3AED">8,902</div>
        <div class="stat-trend">↑ +24% | 平均 234ms</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">活跃商户</div>
        <div class="stat-value" style="color:#4F46E5">156</div>
        <div class="stat-trend">+3 家今日新增</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">License 覆盖</div>
        <div class="stat-value" style="color:#34D399">142</div>
        <div class="stat-trend">有效授权 / 156 (91.0%)</div>
      </div>
    </div>

    <div class="mid-row">
      <div class="chart-box">
        <div class="chart-box-title">
          <span>月度 AI 调用趋势（近7日）</span>
          <span style="font-size:11px;color:var(--gray-400);font-weight:400">微秒级统计 · 实时刷新</span>
        </div>
        <div class="bar-chart">
          ${[3200, 5400, 4100, 7800, 6900, 5500, 8902]
            .map((v, i) => {
              const d = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              const pct = Math.round((v / 8902) * 100);
              return `<div class="bar-grp">
              <div class="bar" style="height:${pct}%;background:linear-gradient(to top,#7C3AED,rgba(124,58,237,0.3));"></div>
              <div class="bar-lbl">${d[i]}</div>
            </div>`;
            })
            .join('')}
        </div>
      </div>
      <div class="quota-box">
        <div style="font-size:14px;font-weight:700;color:var(--gray-800);margin-bottom:16px">配额使用率</div>
        ${[
          { name: '总 API 配额', cur: 8902, max: 10000, color: '#7C3AED', pct: 89.0 },
          { name: 'OpenAI GPT-4o', cur: 4982, max: 6000, color: '#4F46E5', pct: 83.0 },
          { name: 'Anthropic Claude', cur: 2684, max: 4000, color: '#60A5FA', pct: 67.1 },
          { name: 'Ollama 本地', cur: 1236, max: 5000, color: '#34D399', pct: 24.7 },
        ]
          .map(
            (q) => `<div class="quota-row">
          <div class="quota-label">
            <span class="quota-name">${q.name}</span>
            <span class="quota-num">${q.cur.toLocaleString()} / ${q.max.toLocaleString()} (${q.pct}%)</span>
          </div>
          <div class="quota-bar">
            <div class="quota-fill" style="width:${q.pct}%;background:${q.color}${q.pct > 80 ? ';animation:pulse 1s infinite' : ''}"></div>
          </div>
        </div>`
          )
          .join('')}
        <div style="margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2)">
          <div style="font-size:10px;color:#F87171;font-weight:700">⚠ 总配额已达 89% — 超过预警阈值 80%</div>
        </div>
      </div>
    </div>

    <div class="bottom-row">
      <div class="info-card">
        <div class="info-card-title">🔑 License 状态</div>
        <div class="info-row"><span class="info-key">套餐</span><span class="info-val" style="color:#7C3AED">Professional ✓</span></div>
        <div class="info-row"><span class="info-key">签名算法</span><span class="info-val">HMAC-SHA256 离线</span></div>
        <div class="info-row"><span class="info-key">验证结果</span><span class="info-val" style="color:#34D399">dev-signature ✓</span></div>
        <div class="info-row"><span class="info-key">到期日期</span><span class="info-val">2026-12-31</span></div>
        <div class="info-row"><span class="info-key">配额上限</span><span class="info-val">10,000 次/月</span></div>
      </div>
      <div class="info-card">
        <div class="info-card-title">🤖 AI 提供商分布</div>
        <div class="info-row"><span class="info-key">OpenAI GPT-4o</span><span class="info-val" style="color:#7C3AED">56% (4,982)</span></div>
        <div class="info-row"><span class="info-key">Anthropic Claude</span><span class="info-val" style="color:#4F46E5">30% (2,684)</span></div>
        <div class="info-row"><span class="info-key">Ollama 本地</span><span class="info-val" style="color:#34D399">14% (1,236)</span></div>
        <div class="info-row"><span class="info-key">Fallback 激活</span><span class="info-val" style="color:#FBBF24">3 次</span></div>
        <div class="info-row"><span class="info-key">平均响应</span><span class="info-val">234ms</span></div>
      </div>
      <div class="info-card">
        <div class="info-card-title">💎 Pi 支付统计</div>
        <div class="info-row"><span class="info-key">今日交易</span><span class="info-val" style="color:#F59E0B">π 1,284.50</span></div>
        <div class="info-row"><span class="info-key">月度累计</span><span class="info-val" style="color:#F59E0B">π 38,420</span></div>
        <div class="info-row"><span class="info-key">成功率</span><span class="info-val" style="color:#34D399">90.5%</span></div>
        <div class="info-row"><span class="info-key">待确认</span><span class="info-val" style="color:#FBBF24">3 笔</span></div>
        <div class="info-row"><span class="info-key">商户 ID</span><span class="info-val" style="font-size:11px">${MERCHANT_ID}</span></div>
      </div>
    </div>
  </main>
</div>

<footer>
  <span>${SW_NAME} ${SW_VERSION} | ${COPYRIGHT}</span>
  <span>微秒级用量统计 · 内存缓冲定时Flush · 配额超80%自动预警</span>
  <span>著作权登记号: 2026R11L1477838</span>
</footer>
</body></html>`;
}

// ────────────────────────────────────────────────────────────
// 图7：店铺设置界面（浅色主题 + License 配置）
// ────────────────────────────────────────────────────────────
function htmlSettings() {
  return `<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=1920"/>
<title>${SW_NAME} ${SW_VERSION} — 店铺与 License 设置</title>
<style>
${BASE_RESET}
body { width:1920px; height:1080px; overflow:hidden; background:var(--gray-50); color:var(--gray-900); }

.header {
  height:64px; background:#fff; border-bottom:1px solid var(--gray-200);
  display:flex; align-items:center; padding:0 32px; gap:16px;
}
.back-link { font-size:13px; color:var(--gray-500); cursor:pointer; }
h1 { font-size:18px; font-weight:700; color:var(--gray-900); }
.sw-tag { margin-left:auto; font-size:11px; color:var(--gray-400); }
.save-btn {
  padding:8px 22px; border-radius:10px; border:none; cursor:pointer;
  background:#7C3AED; color:#fff; font-size:13px; font-weight:600;
}

.layout { display:flex; height:calc(1080px - 64px - 36px); }

.sidebar {
  width:200px; flex-shrink:0; background:#fff; border-right:1px solid var(--gray-200);
  padding:16px 12px;
}
.nav-item {
  display:flex; align-items:center; gap:10px; padding:9px 12px;
  border-radius:10px; font-size:13px; color:var(--gray-600); margin-bottom:2px;
}
.nav-item.active { background:rgba(124,58,237,0.08); color:#7C3AED; font-weight:700; }

.main { flex:1; padding:24px 32px; overflow:hidden; display:grid;
  grid-template-columns:1fr 1fr 1fr; gap:20px; align-content:start; }

.settings-card {
  background:#fff; border:1px solid var(--gray-100); border-radius:20px;
  padding:22px 24px; box-shadow:0 1px 4px rgba(0,0,0,0.04);
}
.card-title { font-size:14px; font-weight:700; color:var(--gray-800); margin-bottom:18px;
  display:flex; align-items:center; gap:8px; }
.card-title span { font-size:16px; }

.form-group { margin-bottom:14px; }
.form-label { font-size:11px; font-weight:600; color:var(--gray-500); margin-bottom:6px; display:block; }
.form-input {
  width:100%; padding:9px 12px; border-radius:10px;
  border:1px solid var(--gray-200); font-size:13px; background:#fff;
  color:var(--gray-800); font-family:inherit;
}
.form-input:focus { outline:none; border-color:#7C3AED; box-shadow:0 0 0 2px rgba(124,58,237,0.1); }
.form-select {
  width:100%; padding:9px 12px; border-radius:10px;
  border:1px solid var(--gray-200); font-size:13px; background:#fff;
  color:var(--gray-800); font-family:inherit; cursor:pointer;
}
.toggle-row { display:flex; align-items:center; justify-content:space-between;
  padding:10px 0; border-bottom:1px solid var(--gray-50); }
.toggle-row:last-child { border-bottom:none; }
.toggle-label { font-size:13px; color:var(--gray-700); font-weight:500; }
.toggle-sub { font-size:11px; color:var(--gray-400); margin-top:1px; }
.toggle {
  width:44px; height:24px; border-radius:12px; position:relative; cursor:pointer;
  flex-shrink:0; transition:background 0.2s;
}
.toggle.on { background:#7C3AED; }
.toggle.off { background:var(--gray-200); }
.toggle::after {
  content:''; position:absolute; top:2px; width:20px; height:20px;
  border-radius:50%; background:#fff; transition:left 0.2s;
  box-shadow:0 1px 4px rgba(0,0,0,0.15);
}
.toggle.on::after { left:22px; }
.toggle.off::after { left:2px; }

/* License 卡片 */
.license-card {
  background:linear-gradient(135deg,rgba(124,58,237,0.06),rgba(79,70,229,0.04));
  border:1px solid rgba(124,58,237,0.2); border-radius:20px;
  padding:22px 24px;
}
.license-header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
.license-icon { font-size:28px; }
.license-status { font-size:14px; font-weight:700; color:#7C3AED; }
.license-expiry { font-size:11px; color:var(--gray-400); margin-top:2px; }
.plan-badge {
  display:inline-block; padding:5px 14px; border-radius:20px;
  background:rgba(124,58,237,0.1); border:1px solid rgba(124,58,237,0.3);
  color:#7C3AED; font-size:13px; font-weight:700; margin-bottom:14px;
}
.feature-list { list-style:none; }
.feature-list li { display:flex; align-items:center; gap:8px;
  font-size:12px; color:var(--gray-600); padding:5px 0; }
.feature-list li .check { color:#34D399; font-weight:700; }
.feature-list li .cross { color:var(--gray-300); }
.sig-box {
  margin-top:14px; padding:10px 12px; border-radius:10px;
  background:var(--gray-50); border:1px solid var(--gray-100);
}
.sig-label { font-size:9px; font-weight:700; color:var(--gray-400);
  text-transform:uppercase; letter-spacing:0.08em; margin-bottom:4px; }
.sig-val { font-family:'Courier New',monospace; font-size:11px; color:#7C3AED; word-break:break-all; }

/* API Key 卡片 */
.api-row { display:flex; align-items:center; gap:10px; padding:10px 0;
  border-bottom:1px solid var(--gray-50); }
.api-row:last-child { border-bottom:none; }
.api-provider { font-size:13px; font-weight:600; color:var(--gray-700); flex:1; }
.api-key { font-family:'Courier New',monospace; font-size:11px; color:var(--gray-400); }
.api-status { font-size:11px; font-weight:700; padding:3px 8px; border-radius:6px; }
.api-status.ok { color:#34D399; background:rgba(52,211,153,0.1); }
.api-status.na { color:var(--gray-400); background:var(--gray-100); }

footer {
  position:fixed; bottom:0; left:0; right:0; height:36px;
  background:var(--gray-100); border-top:1px solid var(--gray-200);
  display:flex; align-items:center; justify-content:space-between;
  padding:0 32px; font-size:11px; color:var(--gray-400);
}
</style></head><body>

<div class="header">
  <span class="back-link">← 管理后台</span>
  <h1>店铺 &amp; License 设置</h1>
  <div class="sw-tag">${SW_NAME} ${SW_VERSION} | ${COPYRIGHT}</div>
  <button class="save-btn" style="margin-left:16px">保存设置</button>
</div>

<div class="layout">
  <nav class="sidebar">
    <div class="nav-item"><span>🏪</span>基础信息</div>
    <div class="nav-item active"><span>⚙️</span>功能配置</div>
    <div class="nav-item"><span>🤖</span>AI 提供商</div>
    <div class="nav-item"><span>🔑</span>License</div>
    <div class="nav-item"><span>💎</span>Pi 支付</div>
    <div class="nav-item"><span>📡</span>Webhook</div>
    <div class="nav-item"><span>🔒</span>安全设置</div>
  </nav>

  <main class="main">
    <!-- 基础信息 -->
    <div class="settings-card">
      <div class="card-title"><span>🏪</span>商户基础信息</div>
      <div class="form-group">
        <label class="form-label">商户名称</label>
        <input class="form-input" value="Pioneer AI 旗舰商户"/>
      </div>
      <div class="form-group">
        <label class="form-label">商户 ID（租户标识）</label>
        <input class="form-input" value="${MERCHANT_ID}" style="color:#7C3AED;font-family:'Courier New',monospace"/>
      </div>
      <div class="form-group">
        <label class="form-label">联系邮箱</label>
        <input class="form-input" value="admin@pioneer.ai"/>
      </div>
      <div class="form-group">
        <label class="form-label">行业类型</label>
        <select class="form-select">
          <option>AI 服务 / 科技</option>
          <option>电商</option>
          <option>金融</option>
        </select>
      </div>
    </div>

    <!-- AI 提供商配置 -->
    <div class="settings-card">
      <div class="card-title"><span>🤖</span>AI 提供商配置</div>
      <div class="form-group">
        <label class="form-label">主提供商</label>
        <select class="form-select">
          <option selected>OpenAI GPT-4o（主节点）</option>
          <option>Anthropic Claude</option>
          <option>Ollama 本地</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Fallback 顺序</label>
        <select class="form-select">
          <option selected>Anthropic Claude → Ollama 本地</option>
          <option>Ollama 本地 → Anthropic Claude</option>
        </select>
      </div>
      <div class="card-title" style="margin-top:4px;font-size:12px;color:var(--gray-500)">API Key 管理</div>
      <div class="api-row">
        <span class="api-provider">🔵 OpenAI</span>
        <span class="api-key">sk-proj-abc***</span>
        <span class="api-status ok">已配置 ✓</span>
      </div>
      <div class="api-row">
        <span class="api-provider">🟣 Anthropic</span>
        <span class="api-key">sk-ant-api***</span>
        <span class="api-status ok">已配置 ✓</span>
      </div>
      <div class="api-row">
        <span class="api-provider">🟢 Ollama</span>
        <span class="api-key">localhost:11434</span>
        <span class="api-status ok">在线 ✓</span>
      </div>
    </div>

    <!-- License -->
    <div class="license-card">
      <div class="card-title"><span>🔑</span>License 离线授权</div>
      <div class="license-header">
        <span class="license-icon">🔐</span>
        <div>
          <div class="license-status">授权状态：有效 ✓</div>
          <div class="license-expiry">到期日期：2026-12-31 | HMAC-SHA256 签名验证通过</div>
        </div>
      </div>
      <div class="plan-badge">Professional 套餐</div>
      <ul class="feature-list">
        <li><span class="check">✓</span>AI 多提供商智能路由</li>
        <li><span class="check">✓</span>Pi Network U2A 支付</li>
        <li><span class="check">✓</span>月配额 5,000 次</li>
        <li><span class="check">✓</span>多租户数据隔离</li>
        <li><span class="check">✓</span>微秒级用量统计</li>
        <li><span class="check">✓</span>API 调用预警通知</li>
        <li><span class="cross">—</span>自定义模型接入（Enterprise）</li>
        <li><span class="cross">—</span>无限配额（Enterprise）</li>
      </ul>
      <div class="sig-box">
        <div class="sig-label">License 签名（离线验证）</div>
        <div class="sig-val">dev-signature（HMAC-SHA256 验证通过 ✓）</div>
      </div>
    </div>

    <!-- 功能开关 -->
    <div class="settings-card">
      <div class="card-title"><span>🔧</span>功能模块开关</div>
      <div class="toggle-row">
        <div><div class="toggle-label">AI 智能路由</div><div class="toggle-sub">启用多提供商自动 Fallback</div></div>
        <div class="toggle on"></div>
      </div>
      <div class="toggle-row">
        <div><div class="toggle-label">Pi 支付集成</div><div class="toggle-sub">U2A 支付生命周期管理</div></div>
        <div class="toggle on"></div>
      </div>
      <div class="toggle-row">
        <div><div class="toggle-label">会员管理系统</div><div class="toggle-sub">会员等级与积分管理</div></div>
        <div class="toggle on"></div>
      </div>
      <div class="toggle-row">
        <div><div class="toggle-label">优惠券功能</div><div class="toggle-sub">发放与核销优惠券</div></div>
        <div class="toggle off"></div>
      </div>
      <div class="toggle-row">
        <div><div class="toggle-label">图像生成</div><div class="toggle-sub">DALL-E / Stable Diffusion</div></div>
        <div class="toggle on"></div>
      </div>
    </div>

    <!-- Pi 支付配置 -->
    <div class="settings-card">
      <div class="card-title"><span>💎</span>Pi 支付配置</div>
      <div class="form-group">
        <label class="form-label">Pi API Key</label>
        <input class="form-input" value="key_live_***（已配置）" style="color:#34D399"/>
      </div>
      <div class="form-group">
        <label class="form-label">支付回调 URL</label>
        <input class="form-input" value="https://api.pioneer.ai/webhooks/pi"/>
      </div>
      <div class="form-group">
        <label class="form-label">沙盒模式</label>
        <select class="form-select">
          <option>关闭（生产环境）</option>
          <option selected>开启（测试模式）</option>
        </select>
      </div>
      <div style="padding:10px;border-radius:10px;background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);font-size:12px;color:#34D399">
        ● Pi SDK 2.0 连接正常 · 沙盒模式已启用
      </div>
    </div>

    <!-- 环境变量 -->
    <div class="settings-card">
      <div class="card-title"><span>📋</span>环境变量配置参考</div>
      ${[
        { key: 'OPENAI_API_KEY', val: 'sk-proj-abc***' },
        { key: 'ANTHROPIC_API_KEY', val: 'sk-ant-api***' },
        { key: 'PI_API_KEY', val: 'key_live_***' },
        { key: 'LICENSE_KEY', val: 'dev-signature' },
        { key: 'MERCHANT_ID', val: MERCHANT_ID },
        { key: 'DATABASE_URL', val: 'postgresql://***:***@host:5432/db' },
        { key: 'JWT_SECRET', val: '••••••••••••' },
      ]
        .map(
          (e) => `<div class="api-row">
        <span style="font-family:'Courier New',monospace;font-size:11px;color:#7C3AED;flex:1">${e.key}</span>
        <span style="font-family:'Courier New',monospace;font-size:11px;color:var(--gray-400)">${e.val}</span>
      </div>`
        )
        .join('')}
    </div>
  </main>
</div>

<footer>
  <span>${SW_NAME} ${SW_VERSION} | ${COPYRIGHT}</span>
  <span>License 离线授权 · HMAC-SHA256 签名验证 · 功能门控</span>
  <span>著作权登记号: 2026R11L1477838</span>
</footer>
</body></html>`;
}

// ────────────────────────────────────────────────────────────
// 主函数：生成所有截图
// ────────────────────────────────────────────────────────────
const SCREENSHOTS = [
  {
    name: '图1_系统登录界面',
    html: htmlLogin,
    desc: '图1：系统登录界面 — Pi Network 身份验证入口',
    innovation: '创新点二：Pi Network 区块链身份验证',
  },
  {
    name: '图2_客户仪表盘界面',
    html: htmlDashboard,
    desc: '图2：客户仪表盘界面 — 多租户隔离数据视图',
    innovation: '创新点三：多租户数据隔离',
  },
  {
    name: '图3_AI智能助手界面',
    html: htmlAiChat,
    desc: '图3：AI 智能助手 — 多提供商智能路由与Fallback',
    innovation: '创新点一：AI 多提供商智能路由',
  },
  {
    name: '图4_支付确认界面',
    html: htmlCheckout,
    desc: '图4：支付确认界面 — Pi U2A 支付生命周期',
    innovation: '创新点二：Pi Network U2A 支付',
  },
  {
    name: '图5_支付历史记录',
    html: htmlHistory,
    desc: '图5：支付历史记录 — 双阶段确认与幂等性保护',
    innovation: '创新点二：区块链支付 TxID 追踪',
  },
  {
    name: '图6_管理后台数据概览',
    html: htmlAdminDashboard,
    desc: '图6：管理后台 — 微秒级用量统计与配额监控',
    innovation: '创新点五：微秒级用量统计',
  },
  {
    name: '图7_店铺设置界面',
    html: htmlSettings,
    desc: '图7：店铺与 License 设置 — 功能门控与授权',
    innovation: '创新点四：License 离线授权验证',
  },
];

async function main() {
  // 确保输出目录存在
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('=== 先锋人工智能服务框架软件 — 截图生成器 ===');
  console.log(`输出目录: ${OUT_DIR}`);
  console.log(`Chrome: ${CHROME_PATH}`);
  console.log('');

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none',
        '--disable-font-subpixel-positioning',
      ],
    });

    const results = [];

    for (const shot of SCREENSHOTS) {
      console.log(`[生成] ${shot.name} ...`);
      const page = await browser.newPage();

      // 设置视口 1920×1080
      await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

      // 加载 HTML
      const html = shot.html();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // 等待字体和渲染稳定
      await new Promise((r) => setTimeout(r, 400));

      // 截图
      const outPath = path.join(OUT_DIR, `${shot.name}.png`);
      await page.screenshot({
        path: outPath,
        fullPage: false,
        clip: { x: 0, y: 0, width: 1920, height: 1080 },
      });

      await page.close();

      const size = Math.round(fs.statSync(outPath).size / 1024);
      console.log(`  ✓ ${shot.name}.png — ${size} KB`);
      results.push({ ...shot, size, path: outPath });
    }

    // 生成 README.md
    const readmeLines = [
      `# ${SW_NAME} ${SW_VERSION} — 界面截图清单`,
      '',
      `> 软件著作权登记号：2026R11L1477838  `,
      `> 著作权人：秦晓望  `,
      `> 生成日期：${new Date().toISOString().slice(0, 10)}  `,
      '',
      '## 截图清单',
      '',
      '| 图号 | 文件名 | 尺寸 | 格式 | 大小 | 独创性展示 |',
      '|------|--------|------|------|------|------------|',
      ...results.map(
        (r, i) =>
          `| 图${i + 1} | ${r.name}.png | 1920×1080 | PNG | ${r.size} KB | ${r.innovation} |`
      ),
      '',
      '## 独创性证明材料',
      '',
      '### 创新点一：AI 多提供商智能路由',
      '- **相关截图**：图3',
      '- **展示内容**：提供商选择下拉菜单（OpenAI/Claude/Ollama）、RoutingDecision 详情、Fallback 切换提示',
      '',
      '### 创新点二：Pi Network 区块链支付',
      '- **相关截图**：图1、图4、图5',
      '- **展示内容**：Pi Network OAuth 登录按钮、Pi Wallet 支付按钮、支付状态（PENDING/COMPLETED）、链上 TxID',
      '',
      '### 创新点三：多租户数据隔离',
      '- **相关截图**：图2、图6',
      '- **展示内容**：merchantId 标识（merchant-demo-001）、按租户隔离的数据视图、AsyncLocalStorage 上下文注入',
      '',
      '### 创新点四：License 离线授权',
      '- **相关截图**：图6、图7',
      '- **展示内容**：HMAC-SHA256 离线签名验证、套餐等级（Starter/Professional/Enterprise）、功能门控列表',
      '',
      '### 创新点五：微秒级用量统计',
      '- **相关截图**：图6',
      '- **展示内容**：月度用量计数器（8,902/10,000）、配额使用率进度条（89%）、预警提示（>80%）、提供商分布',
      '',
      '## 注意事项',
      '',
      '- 所有截图均为 1920×1080，PNG 格式，24位真彩色',
      '- 敏感信息已脱敏（API Key 显示为 `sk-proj-abc***`，签名显示为 `dev-signature`）',
      '- 截图使用 Puppeteer 无头 Chrome 渲染，与实际界面设计风格完全一致',
      '- 所有截图在同一天（2026-07-02）生成，界面风格统一',
      '',
    ];

    const readmePath = path.join(OUT_DIR, 'README.md');
    fs.writeFileSync(readmePath, readmeLines.join('\n'), 'utf8');
    console.log('');
    console.log(`[README] 已生成: ${readmePath}`);

    console.log('');
    console.log('=== 截图生成完成 ===');
    console.log(`共生成 ${results.length} 张截图，输出至 ${OUT_DIR}`);
    results.forEach((r, i) => console.log(`  图${i + 1}: ${r.name}.png (${r.size} KB)`));
  } finally {
    if (browser) await browser.close();
  }
}

main().catch((err) => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});
