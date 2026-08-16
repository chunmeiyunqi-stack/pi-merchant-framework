# -*- coding: utf-8 -*-
"""
gen-manual-pdf.py
生成用户操作手册 PDF 文件。

流程：
  1. 生成包含所有内容和 CSS 的 HTML 文件
  2. 使用 Chrome 无头模式打印为 PDF
  3. 保存到项目根目录

用法: python scripts/gen-manual-pdf.py
输出: 02-用户操作手册-先锋AI服务框架V2.0.0.pdf
"""

import os
import subprocess
import time
import shutil
import json
from pathlib import Path

ROOT_V2 = Path(__file__).resolve().parents[1]
HTML_OUTPUT_V2 = str(ROOT_V2 / 'docs' / 'manual-output.html')
PDF_OUTPUT_V2 = str(ROOT_V2 / '02-用户操作手册-先锋AI服务框架V2.0.0.pdf')


def _convert_to_pdf_v2():
    header_template = (
        '<div style="width:100%;text-align:center;'
        "font-family:'SimSun',serif;font-size:9pt;color:#333;"
        'padding-top:4mm;border-bottom:0.5pt solid #999;">'
        '先锋人工智能服务框架软件 V2.0.0</div>'
    )
    footer_template = (
        '<div style="width:100%;text-align:center;'
        "font-family:'SimSun',serif;font-size:9pt;color:#555;">"
        '—第 <span class="pageNumber"></span> 页 —</div>'
    )

    js_code = f"""
const fs = require('fs');
const puppeteer = require('puppeteer');

const htmlPath = {json.dumps(HTML_OUTPUT_V2)};
const pdfPath = {json.dumps(PDF_OUTPUT_V2)};
const headerTemplate = {json.dumps(header_template)};
const footerTemplate = {json.dumps(footer_template)};
const commonPaths = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];

async function launchBrowser() {{
  try {{
    return await puppeteer.launch({{
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }});
  }} catch (err) {{
    for (const executablePath of commonPaths) {{
      if (fs.existsSync(executablePath)) {{
        return await puppeteer.launch({{
          executablePath,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        }});
      }}
    }}
    throw err;
  }}
}}

(async () => {{
  const browser = await launchBrowser();
  try {{
    const page = await browser.newPage();
    await page.goto('file:///' + htmlPath.replace(/\\\\/g, '/'), {{
      waitUntil: 'networkidle0',
    }});
    await page.addStyleTag({{
      content: '@media print {{ .header, .footer {{ display: none !important; }} }}',
    }});
    await page.pdf({{
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      margin: {{
        top: '22mm',
        bottom: '18mm',
        left: '25mm',
        right: '25mm',
      }},
    }});
  }} finally {{
    await browser.close();
  }}
}})().catch((err) => {{
  console.error(err);
  process.exit(1);
}});
"""

    result = subprocess.run(['node', '-e', js_code], capture_output=True, text=True, timeout=180)
    if result.returncode != 0:
        print('[ERROR] Puppeteer PDF export failed')
        print(result.stdout)
        print(result.stderr)
        return False

    if os.path.exists(HTML_OUTPUT_V2):
        os.remove(HTML_OUTPUT_V2)

    size = os.path.getsize(PDF_OUTPUT_V2)
    print(f'[SUCCESS] PDF 已生成: {PDF_OUTPUT_V2}')
    print(f'         文件大小: {size:,} 字节 ({size/1024:.1f} KB)')
    return True


def build_manual_pdf_v2():
    cleanup()
    generate_html()
    return _convert_to_pdf_v2()

# ── 路径配置 ──────────────────────────────────────────────

ROOT = os.getcwd()
SCREENSHOTS_DIR = os.path.join(ROOT, 'docs', 'screenshots')
HTML_OUTPUT = os.path.join(ROOT, 'docs', 'manual-output.html')
PDF_OUTPUT = os.path.join(ROOT, '02-\u7528\u6237\u64cd\u4f5c\u624b\u518c-\u5148\u950bAI\u670d\u52a1\u6846\u67b6V2.0.0.pdf')
CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
TEMP_PDF = os.path.join('C:\\tmp', 'manual-output-temp.pdf')

# ── 生成 HTML ─────────────────────────────────────────────

def img_tag(name, caption, num):
    path = os.path.join(SCREENSHOTS_DIR, name)
    if os.path.exists(path):
        return (
            f'<img src="screenshots/{name}" alt="{caption}" />\n'
            f'<p class="fig-caption">\u56fe{num}\uff1a{caption}</p>'
        )
    return f'<p class="fig-caption" style="color:#999">[\u56fe{num}: {caption}]</p>'


def generate_html():
    imgs = {
        1: img_tag('01-login.png', '\u767b\u5f55\u754c\u9762', 1),
        2: img_tag('02-dashboard.png', '\u5ba2\u6237\u4eea\u8868\u76d8\u754c\u9762', 2),
        3: img_tag('03-ai-chat.png', 'AI \u667a\u80fd\u52a9\u624b\u754c\u9762', 3),
        4: img_tag('04-checkout.png', '\u652f\u4ed8\u786e\u8ba4\u754c\u9762', 4),
        5: img_tag('05-payment-history.png', '\u652f\u4ed8\u5386\u53f2\u8bb0\u5f55', 5),
        6: img_tag('06-admin-dashboard.png', '\u7ba1\u7406\u540e\u53f0\u6570\u636e\u6982\u89c8', 6),
        7: img_tag('07-settings.png', '\u5e97\u94fa\u8bbe\u7f6e\u754c\u9762', 7),
    }

    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
  @page {{
    size: A4;
    margin: 2.5cm 2.5cm 2.2cm 2.5cm;
  }}

  body {{
    font-family: SimSun, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #222;
    padding-top: 1.3cm;
    padding-bottom: 0.8cm;
  }}

  .header {{
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    text-align: center;
    font-family: SimSun, serif;
    font-size: 9pt;
    color: #333;
    padding: 12px 0 4px 0;
    border-bottom: 0.5pt solid #999;
    background: white;
    z-index: 100;
  }}

  .footer {{
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    font-family: SimSun, serif;
    font-size: 9pt;
    color: #555;
    padding: 6px 0 10px 0;
    background: white;
    z-index: 100;
  }}

  .footer .page-number::after {{
    counter-increment: page;
    content: counter(page);
  }}

  h1 {{
    font-family: SimHei, sans-serif;
    font-size: 20pt;
    text-align: center;
    margin: 40px 0 20px 0;
    letter-spacing: 1pt;
  }}

  h2 {{
    font-family: SimHei, sans-serif;
    font-size: 15pt;
    margin: 30px 0 12px 0;
    border-bottom: 1px solid #ccc;
    padding-bottom: 5px;
    color: #1a1a2e;
  }}

  h3 {{
    font-family: SimHei, sans-serif;
    font-size: 13pt;
    margin: 20px 0 8px 0;
    color: #2d2d4e;
  }}

  p {{ margin: 6px 0; text-indent: 2em; }}
  p.no-indent {{ text-indent: 0; }}

  table {{
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
    font-size: 10.5pt;
  }}

  th, td {{
    border: 1px solid #888;
    padding: 5px 8px;
    text-align: left;
  }}

  th {{
    background: #e8e0f0;
    font-family: SimHei, sans-serif;
    font-weight: bold;
  }}

  pre, code {{
    font-family: 'Courier New', Consolas, monospace;
    font-size: 9pt;
  }}

  pre {{
    background: #f5f3f7;
    padding: 10px 12px;
    border-radius: 4px;
    overflow-x: auto;
    line-height: 1.35;
    border: 1px solid #ddd;
    margin: 10px 0;
  }}

  code {{
    background: #f0ecf5;
    padding: 1px 4px;
    border-radius: 3px;
  }}

  pre code {{
    background: none;
    padding: 0;
  }}

  img {{
    max-width: 100%;
    height: auto;
    display: block;
    margin: 12px auto;
    border: 1px solid #ddd;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }}

  .fig-caption {{
    text-align: center;
    font-size: 11pt;
    color: #555;
    margin: 2px 0 18px 0;
    text-indent: 0;
  }}

  ul, ol {{ margin: 6px 0; padding-left: 2.5em; }}
  li {{ margin: 3px 0; }}

  blockquote {{
    border-left: 3px solid #9B59B6;
    margin: 12px 0;
    padding: 8px 15px;
    background: #f7f3fa;
  }}

  .page-break {{ page-break-before: always; }}
</style>
</head>
<body>

<div class="header">\u5148\u950b\u4eba\u5de5\u667a\u80fd\u670d\u52a1\u6846\u67b6\u8f6f\u4ef6 V2.0.0</div>
<div class="footer">\u2014 \u7b2c <span class="page-number"></span> \u9875 \u2014</div>

<h1>\u5148\u950b\u4eba\u5de5\u667a\u80fd\u670d\u52a1\u6846\u67b6\u8f6f\u4ef6<br />\u7528\u6237\u64cd\u4f5c\u624b\u518c V2.0.0</h1>

<p class="no-indent" style="text-align:center"><strong>\u8f6f\u4ef6\u540d\u79f0\uff1a</strong>\u5148\u950b\u4eba\u5de5\u667a\u80fd\u670d\u52a1\u6846\u67b6\u8f6f\u4ef6\uff08Pioneer AI Merchant Framework\uff09</p>
<p class="no-indent" style="text-align:center"><strong>\u7248\u672c\u53f7\uff1a</strong>V2.0.0 &nbsp;|&nbsp; <strong>\u8457\u4f5c\u6743\u4eba\uff1a</strong>\u79e6\u6653\u671b &nbsp;|&nbsp; <strong>\u7f16\u5236\u65e5\u671f\uff1a</strong>2026\u5e7405\u6708</p>

<div class="page-break"></div>

<h2>\u4e00\u3001\u7cfb\u7edf\u6982\u8ff0</h2>

<h3>1.1 \u7cfb\u7edf\u7b80\u4ecb</h3>

<p>\u5148\u950b\u4eba\u5de5\u667a\u80fd\u670d\u52a1\u6846\u67b6\u8f6f\u4ef6\uff08Pioneer AI Merchant Framework\uff09\u662f\u4e00\u5957\u9762\u5411 Pi Network \u751f\u6001\u7684\u767d\u6807\u5546\u6237\u5e94\u7528\u6a21\u677f\u6846\u67b6\u3002\u7cfb\u7edf\u91c7\u7528 Monorepo \u67b6\u6784\uff08pnpm + Turborepo\uff09\uff0c\u4ee5 Next.js 14 App Router + TypeScript \u4e3a\u6838\u5fc3\u6280\u672f\u6808\uff0c\u5185\u7f6e\u4f01\u4e1a\u7ea7 AI \u670d\u52a1\u8def\u7531\u5f15\u64ce\uff0c\u652f\u6301 OpenAI / Anthropic / Ollama \u591a\u6a21\u578b\u52a8\u6001\u5207\u6362\u4e0e\u81ea\u52a8\u5bb9\u9519\u3002</p>

<p>\u7cfb\u7edf\u8bbe\u8ba1\u7406\u5ff5\u4e3a\u201c80% \u901a\u7528\u5e95\u5ea7 + 20% \u884c\u4e1a\u914d\u7f6e\u201d\uff0c\u901a\u8fc7\u884c\u4e1a\u9884\u8bbe\u4e0e\u5546\u6237\u914d\u7f6e\u673a\u5236\uff0c\u53ef\u5728\u6781\u77ed\u5468\u671f\u5185\u4ea4\u4ed8\u5b9a\u5236\u5316\u5546\u6237\u5e94\u7528\uff0c\u8986\u76d6\u7f8e\u5bb9\u7f8e\u7532\u3001\u5065\u8eab\u3001\u57f9\u8bad\u3001\u54a8\u8be2\u7b49\u591a\u79cd\u5782\u76f4\u884c\u4e1a\u3002</p>

<h3>1.2 \u6838\u5fc3\u7279\u6027</h3>

<ul>
<li><strong>\u591a AI \u63d0\u4f9b\u5546\u667a\u80fd\u8def\u7531</strong>：基于 Strategy + Factory 设计模式，支持 OpenAI、Anthropic (Claude)、Ollama 三大 AI 服务提供商的动态选择与自动容错降级</li>
<li><strong>Pi Network 原生支付</strong>：完整集成 Pi U2A（User-to-App）支付流程，包括创建支付、审批、链上确认、完成的完整生命周期管理</li>
<li><strong>多租户架构</strong>：V2.0.0 新增商户级数据硬隔离，支持单一框架实例服务海量商户</li>
<li><strong>License 授权验证</strong>：基于 HMAC-SHA256 的离线授权验证，支持多层级商业授权控制</li>
<li><strong>用量统计与配额管理</strong>：微秒级 API 调用与 Token 消耗追踪，支持月度订阅制计费模型</li>
<li><strong>Monorepo 工程化</strong>：基于 pnpm Workspace + Turborepo 的高性能构建体系</li>
<li><strong>安全认证体系</strong>：Pi SDK 认证 + HMAC 签名 Session + HttpOnly Cookie 的多层安全防护</li>
<li><strong>行业配置化</strong>：通过结构化配置驱动 UI 渲染、功能模块开关与业务流程定制</li>
</ul>

{imgs[1]}

<h3>1.3 \u6280\u672f\u6808</h3>

<table>
<tr><th>\u5c42\u7ea7</th><th>\u6280\u672f\u9009\u578b</th><th>\u8bf4\u660e</th></tr>
<tr><td>\u524d\u7aef\u6846\u67b6</td><td>Next.js 14 (App Router)</td><td>React Server Components + 流式渲染</td></tr>
<tr><td>\u7f16\u7a0b\u8bed\u8a00</td><td>TypeScript 5.4+</td><td>\u4e25\u683c\u6a21\u5f0f\uff0c\u5168\u9879\u76ee\u7c7b\u578b\u5b89\u5168</td></tr>
<tr><td>UI \u6837\u5f0f</td><td>Tailwind CSS 3</td><td>\u539f\u5b50\u5316 CSS\uff0c\u6309\u9700\u7f16\u8bd1</td></tr>
<tr><td>\u540e\u7aef</td><td>Next.js API Routes</td><td>\u540c\u6784\u670d\u52a1\u7aef\uff0c\u65e0\u9700\u72ec\u7acb\u540e\u7aef</td></tr>
<tr><td>\u6570\u636e\u5e93</td><td>PostgreSQL 15+</td><td>\u5173\u7cfb\u578b\u6570\u636e\u5e93\uff0cPrisma ORM \u6620\u5c04</td></tr>
<tr><td>ORM</td><td>Prisma 5</td><td>\u7c7b\u578b\u5b89\u5168\u7684\u6570\u636e\u5e93\u8bbf\u95ee\u5c42</td></tr>
<tr><td>\u5305\u7ba1\u7406</td><td>pnpm 8 (Monorepo)</td><td>\u9ad8\u6548\u4f9d\u8d56\u89e3\u6790\u4e0e\u78c1\u76d8\u5229\u7528</td></tr>
<tr><td>AI \u5f15\u64ce</td><td>\u591a\u63d0\u4f9b\u5546\u8def\u7531\u5668</td><td>OpenAI / Anthropic / Ollama \u667a\u80fd\u5207\u6362</td></tr>
<tr><td>\u652f\u4ed8</td><td>Pi Network U2A</td><td>\u94fe\u4e0a\u652f\u4ed8\uff0cPi Platform API \u96c6\u6210</td></tr>
</table>

<div class="page-break"></div>

<h2>\u4e8c\u3001\u5feb\u901f\u5b89\u88c5\u4e0e\u90e8\u7f72</h2>

<h3>2.1 \u73af\u5883\u8981\u6c42</h3>

<table>
<tr><th>\u9879\u76ee</th><th>\u6700\u4f4e\u8981\u6c42</th></tr>
<tr><td>\u64cd\u4f5c\u7cfb\u7edf</td><td>Windows 10+ / macOS 12+ / Ubuntu 20.04+</td></tr>
<tr><td>Node.js</td><td>≥ 18.0.0</td></tr>
<tr><td>pnpm</td><td>≥ 8.0.0</td></tr>
<tr><td>PostgreSQL</td><td>≥ 15.0</td></tr>
<tr><td>\u5185\u5b58</td><td>≥ 4 GB</td></tr>
</table>

<h3>2.2 \u5b89\u88c5\u6b65\u9aa4</h3>

<pre><code># 1. \u5b89\u88c5 pnpm
npm install -g pnpm

# 2. \u514b\u9686\u9879\u76ee\u5e76\u5b89\u88c5\u4f9d\u8d56
git clone &lt;repository-url&gt;
cd PiMerchantFramework
pnpm install

# 3. \u914d\u7f6e\u73af\u5883\u53d8\u91cf
cp .env.example .env
# \u7f16\u8f91 .env\uff0c\u586b\u5199\u6570\u636e\u5e93\u8fde\u63a5\u3001API Key \u7b49

# 4. \u521d\u59cb\u5316\u6570\u636e\u5e93
pnpm db:migrate
pnpm db:seed

# 5. \u540e\u52a8\u5f00\u53d1\u670d\u52a1\u5668
pnpm dev</code></pre>

<h3>2.3 \u73af\u5883\u53d8\u91cf\u914d\u7f6e</h3>

<table>
<tr><th>\u53d8\u91cf\u540d</th><th>\u5fc5\u586b</th><th>\u8bf4\u660e</th></tr>
<tr><td>DATABASE_URL</td><td>\u662f</td><td>PostgreSQL \u8fde\u63a5\u5b57\u7b26\u4e32</td></tr>
<tr><td>PI_API_KEY</td><td>\u662f</td><td>Pi Developer Portal API Key</td></tr>
<tr><td>NEXT_PUBLIC_MERCHANT_ID</td><td>\u662f</td><td>\u9ed8\u8ba4\u5546\u6237 ID</td></tr>
<tr><td>AI_PRIMARY_PROVIDER</td><td>\u5426</td><td>\u4e3b AI \u63d0\u4f9b\u5546\uff08openai/anthropic/ollama\uff09</td></tr>
<tr><td>AI_FALLBACK_PROVIDERS</td><td>\u5426</td><td>\u5bb9\u9519\u964d\u7ea7\u987a\u5e8f\uff08\u9017\u53f7\u5206\u9694\uff09</td></tr>
<tr><td>OPENAI_API_KEY</td><td>\u6761\u4ef6*</td><td>OpenAI API \u5bc6\u94a5</td></tr>
<tr><td>ANTHROPIC_API_KEY</td><td>\u6761\u4ef6*</td><td>Anthropic API \u5bc6\u94a5</td></tr>
<tr><td>OLLAMA_API_BASE</td><td>\u5426</td><td>Ollama \u670d\u52a1\u5730\u5740</td></tr>
<tr><td>LICENSE_PAYLOAD</td><td>\u6761\u4ef6*</td><td>\u5546\u4e1a\u7248 License\uff08base64 \u7f16\u7801 JSON\uff09</td></tr>
</table>

<div class="page-break"></div>

<h2>\u4e09\u3001\u5ba2\u6237\u754c\u9762\u64cd\u4f5c</h2>

<h3>3.1 \u767b\u5f55</h3>

<p>\u7528\u6237\u5728 Pi Browser \u4e2d\u6253\u5f00\u5546\u6237\u5e94\u7528\u540e\uff0c\u7cfb\u7edf\u81ea\u52a8\u663e\u793a Pi \u8ba4\u8bc1\u767b\u5f55\u754c\u9762\u3002\u70b9\u51fb\u201cPi \u767b\u5f55\u201d\u6309\u94ae\uff0c\u7cfb\u7edf\u5c06\u8c03\u7528 Pi SDK \u8fdb\u884c\u8eab\u4efd\u8ba4\u8bc1\u3002\u8ba4\u8bc1\u901a\u8fc7\u540e\uff0c\u7528\u6237\u81ea\u52a8\u8fdb\u5165\u5ba2\u6237\u4eea\u8868\u76d8\u3002</p>

{imgs[1]}

<h3>3.2 \u5ba2\u6237\u4eea\u8868\u76d8</h3>

<p>\u4eea\u8868\u76d8\u5c55\u793a\u4eca\u65e5\u8ba2\u5355\u6570\u91cf\u3001\u672c\u6708\u6536\u5165\u6982\u89c8\u3001\u6d3b\u8dc3\u7528\u6237\u6570\u7b49\u6838\u5fc3\u7edf\u8ba1\u6570\u636e\u3002\u4e0b\u65b9\u5217\u51fa\u5546\u6237\u63d0\u4f9b\u7684\u6240\u6709\u670d\u52a1\u9879\u76ee\uff0c\u7528\u6237\u53ef\u70b9\u51fb\u9009\u62e9\u6240\u9700\u670d\u52a1\u3002</p>

{imgs[2]}

<h3>3.3 AI \u667a\u80fd\u52a9\u624b</h3>

<p>\u7cfb\u7edf\u5185\u7f6e AI \u667a\u80fd\u52a9\u624b\uff0c\u7528\u6237\u53ef\u76f4\u63a5\u5728\u804a\u5929\u754c\u9762\u8f93\u5165\u95ee\u9898\u3002AI \u52a9\u624b\u53ef\u56de\u7b54\u8ba2\u5355\u67e5\u8be2\u3001\u6570\u636e\u7edf\u8ba1\u3001\u4f18\u5316\u5efa\u8bae\u7b49\u95ee\u9898\u3002\u7cfb\u7edf\u652f\u6301\u6d41\u5f0f\u54cd\u5e94\uff08SSE\uff09\uff0c\u5b9e\u65f6\u5c55\u793a AI \u56de\u7b54\u5185\u5bb9\u3002</p>

<p>AI \u8def\u7531\u7cfb\u7edf\u81ea\u52a8\u9009\u62e9\u6700\u4f18\u63d0\u4f9b\u5546\uff1a\u9ed8\u8ba4\u4f7f\u7528 OpenAI GPT-4o-mini\uff0c\u8d85\u65f6\u6216\u5931\u8d25\u65f6\u81ea\u52a8\u5207\u6362\u5230 Anthropic Claude\uff0c\u518d\u5931\u8d25\u5207\u6362\u5230\u672c\u5730 Ollama\uff0c\u786e\u4fdd\u670d\u52a1\u6301\u7eed\u53ef\u7528\u3002</p>

{imgs[3]}

<div class="page-break"></div>

<h2>\u56db\u3001\u652f\u4ed8\u6d41\u7a0b</h2>

<h3>4.1 \u652f\u4ed8\u786e\u8ba4</h3>

<p>\u7528\u6237\u9009\u62e9\u670d\u52a1\u540e\u8fdb\u5165\u652f\u4ed8\u786e\u8ba4\u9875\u9762\uff0c\u7cfb\u7edf\u663e\u793a\u670d\u52a1\u540d\u79f0\u3001\u91d1\u989d\uff08Pi \u8ba1\u4ef7\uff09\u3002\u70b9\u51fb\u201c\u786e\u8ba4\u652f\u4ed8\u201d\u540e\uff0cPi SDK \u53d1\u8d77 U2A \u652f\u4ed8\u8bf7\u6c42\uff0c\u7528\u6237\u5728 Pi \u94b1\u5305\u4e2d\u786e\u8ba4\u4ea4\u6613\u3002\u652f\u4ed8\u5b8c\u6210\u540e\u81ea\u52a8\u8df3\u8f6c\u5230\u7ed3\u679c\u9875\u9762\u3002</p>

{imgs[4]}

<h3>4.2 \u652f\u4ed8\u5b89\u5168\u4fdd\u969c</h3>

<ul>
<li>\u6240\u6709\u652f\u4ed8\u5ba1\u6279/\u5b8c\u6210\u64cd\u4f5c\u5747\u5728\u670d\u52a1\u7aef\u6267\u884c\uff0c\u524d\u7aef\u7981\u6b62\u76f4\u63a5\u8c03\u7528 Pi Platform API</li>
<li>\u652f\u4ed8\u56de\u8c03\u5e42\u7b49\u5904\u7406\uff0c\u9632\u6b62\u91cd\u590d\u63d0\u4ea4</li>
<li>\u672a\u5b8c\u6210\u652f\u4ed8\u81ea\u52a8\u6062\u590d\u673a\u5236\uff08\u5728\u7528\u6237\u91cd\u65b0\u8ba4\u8bc1\u65f6\u89e6\u53d1\uff09</li>
<li>\u4f7f\u7528 HttpOnly Session \u9a8c\u8bc1\u7528\u6237\u8eab\u4efd</li>
</ul>

<h3>4.3 \u652f\u4ed8\u5386\u53f2\u8bb0\u5f55</h3>

<p>\u7528\u6237\u53ef\u67e5\u770b\u6240\u6709\u5386\u53f2\u652f\u4ed8\u8bb0\u5f55\uff0c\u5305\u62ec\u8ba2\u5355\u53f7\u3001\u91d1\u989d\u3001\u72b6\u6001\uff08\u5df2\u5b8c\u6210/\u5f85\u5904\u7406/\u5df2\u53d6\u6d88\uff09\u53ca\u65f6\u95f4\u3002</p>

{imgs[5]}

<div class="page-break"></div>

<h2>\u4e94\u3001\u7ba1\u7406\u540e\u53f0\u64cd\u4f5c</h2>

<h3>5.1 \u6570\u636e\u6982\u89c8</h3>

<p>\u7ba1\u7406\u540e\u53f0\u9996\u9875\u5c55\u793a\u603b\u8ba2\u5355\u6570\u3001\u603b\u6536\u5165\u3001\u6d3b\u8dc3\u79df\u6237\u6570\u7b49\u5168\u5c40\u7edf\u8ba1\u4fe1\u606f\u3002\u8868\u683c\u5217\u51fa\u5404\u79df\u6237\u7684\u8fd0\u884c\u72b6\u6001\u3001\u4f7f\u7528\u91cf\u53ca\u7ba1\u7406\u64cd\u4f5c\u5165\u53e3\u3002</p>

{imgs[6]}

<h3>5.2 \u5e97\u94fa\u8bbe\u7f6e</h3>

<p>\u5728\u8bbe\u7f6e\u9875\u9762\u4e2d\uff0c\u7ba1\u7406\u5458\u53ef\u914d\u7f6e\u5546\u6237\u540d\u79f0\u3001\u8054\u7cfb\u7535\u8bdd\u3001\u884c\u4e1a\u76ae\u80a4\uff08beauty/fitness/education/consulting/generic\uff09\u3001AI \u670d\u52a1\u63d0\u4f9b\u5546\uff08\u4e3b\u63d0\u4f9b\u5546\u548c\u5bb9\u9519\u964d\u7ea7\u5e8f\u5217\uff09\uff0c\u4ee5\u53ca\u529f\u80fd\u6a21\u5757\u5f00\u5173\uff08\u9884\u7ea6\u7ba1\u7406\u3001\u4f1a\u5458\u65b9\u6848\u7b49\uff09\u3002</p>

{imgs[7]}

<div class="page-break"></div>

<h2>\u516d\u3001\u6280\u672f\u67b6\u6784</h2>

<h3>6.1 Monorepo \u5de5\u7a0b\u7ed3\u6784</h3>

<pre><code>PiMerchantFramework/
\u251c\u2500\u2500 apps/
\u2502   \u251c\u2500\u2500 web/          # \u5546\u6237\u524d\u53f0\uff08\u5ba2\u6237\u4f7f\u7528\uff0cPi Browser \u4e2d\u8fd0\u884c\uff09
\u2502   \u2514\u2500\u2500 admin/        # \u5546\u6237\u540e\u53f0\uff08\u7ba1\u7406\u5458\u4f7f\u7528\uff09
\u251c\u2500\u2500 packages/
\u2502   \u251c\u2500\u2500 pi-sdk/       # \u6838\u5fc3 SDK\uff08\u652f\u4ed8+\u8ba4\u8bc1+AI+\u5546\u4e1a\u6a21\u5757\uff09
\u2502   \u251c\u2500\u2500 config/       # \u5546\u6237\u914d\u7f6e\u7c7b\u578b+\u884c\u4e1a\u9884\u8bbe
\u2502   \u251c\u2500\u2500 types/        # \u901a\u7528\u4e1a\u52a1\u7c7b\u578b
\u2502   \u2514\u2500\u2500 ui/           # \u901a\u7528 UI \u7ec4\u4ef6
\u251c\u2500\u2500 prisma/           # \u6570\u636e\u5e93 Schema+\u8fc1\u79fb+Seed
\u2514\u2500\u2500 docs/             # \u6280\u672f\u6587\u6863</code></pre>

<h3>6.2 \u6570\u636e\u5e93\u8bbe\u8ba1</h3>

<table>
<tr><th>\u8868\u540d</th><th>\u804c\u8d23</th></tr>
<tr><td>merchants</td><td>\u5546\u6237\u57fa\u672c\u4fe1\u606f</td></tr>
<tr><td>customers</td><td>\u987e\u5ba2\u6863\u6848</td></tr>
<tr><td>services</td><td>\u670d\u52a1\u76ee\u5f55</td></tr>
<tr><td>orders</td><td>\u8ba2\u5355\u8bb0\u5f55</td></tr>
<tr><td>payments</td><td>Pi \u652f\u4ed8\u8bb0\u5f55</td></tr>
<tr><td>memberships</td><td>\u4f1a\u5458\u65b9\u6848</td></tr>
<tr><td>bookings</td><td>\u9884\u7ea6\u8bb0\u5f55</td></tr>
</table>

<h3>6.3 \u8ba4\u8bc1\u4f53\u7cfb</h3>

<p>\u7cfb\u7edf\u91c7\u7528\u4e09\u5c42\u8ba4\u8bc1\u673a\u5236\uff1aPi SDK \u7aef\u8ba4\u8bc1 \u2192 Pi Platform API \u4e8c\u6b21\u9a8c\u8bc1 \u2192 HMAC \u7b7e\u540d Session\u3002Session \u5b58\u50a8\u5728 HttpOnly + Secure Cookie \u4e2d\uff0c\u6709\u6548\u671f 7 \u5929\uff0c\u9632\u6b62 XSS \u548c CSRF \u653b\u51fb\u3002</p>

<div class="page-break"></div>

<h2>\u4e03\u3001AI \u8def\u7531\u7cfb\u7edf\u8be6\u89e3</h2>

<h3>7.1 \u591a\u63d0\u4f9b\u5546\u67b6\u6784</h3>

<p>\u7cfb\u7edf\u91c7\u7528 Strategy + Factory \u8bbe\u8ba1\u6a21\u5f0f\u3002\u7edf\u4e00\u63a5\u53e3 AIProvider \u5b9a\u4e49\u4e86\u6240\u6709\u63d0\u4f9b\u5546\u7684\u6807\u51c6\u65b9\u6cd5\uff08chat/isAvailable/healthCheck\uff09\uff0c\u62bd\u8c61\u57fa\u7c7b BaseAIProvider \u5c01\u88c5\u4e86\u8d85\u65f6\u63a7\u5236\u3001HTTP \u9519\u8bef\u5904\u7406\u548c\u65e5\u5fd7\u8bb0\u5f55\u7b49\u901a\u7528\u903b\u8f91\u3002</p>

<table>
<tr><th>\u63d0\u4f9b\u5546</th><th>\u8ba4\u8bc1\u65b9\u5f0f</th><th>\u9ed8\u8ba4\u6a21\u578b</th></tr>
<tr><td>OpenAI</td><td>Bearer Token</td><td>gpt-4o-mini</td></tr>
<tr><td>Anthropic</td><td>x-api-key \u5934</td><td>claude-sonnet-4</td></tr>
<tr><td>Ollama</td><td>\u65e0\u9700\u8ba4\u8bc1</td><td>llama3.1</td></tr>
</table>

<h3>7.2 \u81ea\u52a8\u5bb9\u9519\u964d\u7ea7</h3>

<p>\u5f53\u4e3b\u63d0\u4f9b\u5546\uff08\u5982 OpenAI\uff09API \u8c03\u7528\u5931\u8d25\u65f6\uff0c\u7cfb\u7edf\u6309\u914d\u7f6e\u7684 AI_FALLBACK_PROVIDERS \u987a\u5e8f\u5c1d\u8bd5\u5907\u9009\u63d0\u4f9b\u5546\u3002\u6240\u6709\u63d0\u4f9b\u5546\u5747\u5931\u8d25\u65f6\uff0c\u8fd4\u56de\u5305\u542b\u5b8c\u6574\u5931\u8d25\u94fe\u8def\u7684\u805a\u5408\u9519\u8bef\u4fe1\u606f\u3002</p>

<h3>7.3 \u6d41\u5f0f\u54cd\u5e94\u652f\u6301</h3>

<p>\u7cfb\u7edf\u652f\u6301 AI \u54cd\u5e94\u7684 Server-Sent Events (SSE) \u6d41\u5f0f\u8f93\u51fa\uff0c\u7aef\u70b9\u4e3a POST /api/ai/stream\u3002\u6bcf 15 \u79d2\u53d1\u9001\u5fc3\u8df3\u4fe1\u53f7\u9632\u6b62\u8fde\u63a5\u8d85\u65f6\uff0c\u652f\u6301\u5ba2\u6237\u7aef\u4e2d\u65ad\u53d6\u6d88\u3002</p>

<div class="page-break"></div>

<h2>\u516b\u3001V2.0.0 \u65b0\u589e\u5546\u4e1a\u529f\u80fd</h2>

<h3>8.1 License \u6388\u6743\u9a8c\u8bc1</h3>

<p>\u91c7\u7528 HMAC-SHA256 \u7684\u79bb\u7ebf\u6388\u6743\u9a8c\u8bc1\u673a\u5236\uff0c\u652f\u6301 Starter / Professional / Enterprise \u4e09\u7ea7\u5957\u9910\u63a7\u5236\u3002\u5f00\u53d1\u73af\u5883\u4e0b\u81ea\u52a8\u9881\u53d1\u4f01\u4e1a\u7ea7\u8bb8\u53ef\uff0c\u65e0\u9700\u989d\u5916\u914d\u7f6e\u3002\u751f\u4ea7\u73af\u5883\u9700\u8bbe\u7f6e LICENSE_PAYLOAD \u73af\u5883\u53d8\u91cf\u3002</p>

<table>
<tr><th>\u5957\u9910\u7b49\u7ea7</th><th>\u529f\u80fd</th></tr>
<tr><td>Starter</td><td>ai_routing</td></tr>
<tr><td>Professional</td><td>ai_routing, streaming, usage_tracking, webhook_monitoring</td></tr>
<tr><td>Enterprise</td><td>ai_routing, streaming, multi_tenant, usage_tracking, webhook_monitoring, advanced_analytics</td></tr>
</table>

<h3>8.2 \u591a\u79df\u6237\u67b6\u6784</h3>

<p>\u5b9e\u73b0\u5546\u6237\u7ea7\u6570\u636e\u786c\u9694\u79bb\u3002\u901a\u8fc7 AsyncLocalStorage \u6ce8\u5165\u79df\u6237\u4e0a\u4e0b\u6587\uff0cPrisma \u4e2d\u95f4\u4ef6\u81ea\u52a8\u5728\u6570\u636e\u5e93\u67e5\u8be2\u4e2d\u6ce8\u5165 merchantId \u8fc7\u6ee4\u6761\u4ef6\uff0c\u9632\u6b62\u8de8\u79df\u6237\u6570\u636e\u8bbf\u95ee\u3002\u652f\u6301 Active / Suspended / Cancelled \u4e09\u79cd\u751f\u547d\u5468\u671f\u72b6\u6001\u3002</p>

<h3>8.3 \u7528\u91cf\u7edf\u8ba1\u4e0e\u914d\u989d</h3>

<p>\u652f\u6301\u5fae\u79d2\u7ea7 API \u8c03\u7528\u8ffd\u8e2a\u548c\u6708\u5ea6\u914d\u989d\u7ba1\u7406\u3002\u5185\u5b58\u7f13\u51b2\u67b6\u6784\u96f6 IO \u963b\u585e\uff0c\u5b9a\u65f6 Flush \u81f3 Webhook \u5ba1\u8ba1\u7cfb\u7edf\u3002\u914d\u989d\u4f7f\u7528\u7387\u8fbe\u5230 80% \u65f6\u89e6\u53d1\u9884\u8b66\u3002</p>

<div class="page-break"></div>

<h2>\u4e5d\u3001\u5b89\u5168\u4e0e\u5408\u89c4</h2>

<h3>9.1 \u9690\u79c1\u4fdd\u62a4</h3>

<ul>
<li><strong>\u6700\u5c0f\u5316\u6570\u636e\u6536\u96c6</strong>：平台仅收集必要标识（merchantId）与会话验证令牌</li>
<li><strong>\u672c\u5730\u4f18\u5148\u7b56\u7565</strong>：敏感凭证不以明文上传至外部存储</li>
<li><strong>\u591a\u79df\u6237\u786c\u9694\u79bb</strong>：AsyncLocalStorage + Prisma 中间件双重隔离</li>
</ul>

<h3>9.2 \u514d\u8d23\u58f0\u660e</h3>

<ul>
<li><strong>AI \u5185\u5bb9\u514d\u8d23</strong>：AI 输出仅供参考，用户需自行验证准确性</li>
<li><strong>\u94fe\u4e0a\u4ea4\u6613\u514d\u8d23</strong>：平台对网络拥堵等不可控因素导致的交易延迟不承担责任</li>
<li><strong>\u7b2c\u4e09\u65b9\u670d\u52a1</strong>：依赖 OpenAI/Anthropic/Ollama 等第三方服务，中断或变更可能影响功能</li>
</ul>

<h3>9.3 \u5408\u89c4\u4e0e\u7528\u6237\u6743\u5229</h3>

<p>\u7cfb\u7edf\u8bbe\u8ba1\u9075\u5faa GDPR \u98ce\u9669\u5bf9\u9f50\u539f\u5219\uff0c\u652f\u6301\u5bf9\u7528\u6237\u6570\u636e\u7684\u8bbf\u95ee\u3001\u66f4\u6b63\u4e0e\u5220\u9664\u8bf7\u6c42\u3002\u65e5\u5fd7\u4e0e\u7528\u91cf\u8bb0\u5f55\u4ee5\u7ed3\u6784\u5316\u65b9\u5f0f\u8f93\u51fa\uff0c\u654f\u611f\u5b57\u6bb5\u5728\u4e0a\u62a5\u65f6\u5e94\u4e88\u4ee5\u8131\u654f\u3002</p>

</body>
</html>'''

    with open(HTML_OUTPUT, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'[OK] HTML \u5df2\u751f\u6210: {HTML_OUTPUT}')


# ── 转换为 PDF ─────────────────────────────────────────────

def convert_to_pdf():
    file_uri = 'file:///' + HTML_OUTPUT.replace('\\', '/')
    # Note: Chrome's --print-to-pdf CLI does not support header/footer templates.
    # We embed headers/footers in HTML via position:fixed for print.
    
    # File uri: file:///D:/PiMerchantFramework/docs/manual-output.html
    # Convert D: to proper URI
    # Actually need: file:///D:/PiMerchantFramework/... 
    # Already handled above
    
    cmd = [
        CHROME_PATH,
        '--headless',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--print-to-pdf=' + TEMP_PDF,
        file_uri
    ]
    
    print(f'[INFO] \u8c03\u7528 Chrome \u751f\u6210 PDF...')
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    time.sleep(1)
    
    if os.path.exists(TEMP_PDF):
        shutil.copy2(TEMP_PDF, PDF_OUTPUT)
        size = os.path.getsize(PDF_OUTPUT)
        os.remove(TEMP_PDF)
        
        # Clean up temp HTML
        if os.path.exists(HTML_OUTPUT):
            os.remove(HTML_OUTPUT)
        
        print(f'[SUCCESS] PDF \u5df2\u751f\u6210: {PDF_OUTPUT}')
        print(f'         \u6587\u4ef6\u5927\u5c0f: {size:,} \u5b57\u8282 ({size/1024:.1f} KB)')
        return True
    else:
        print(f'[ERROR] Chrome \u8f93\u51fa: {result.stdout[:300]}')
        print(f'[ERROR] Chrome \u9519\u8bef: {result.stderr[:500]}')
        print(f'[ERROR] PDF \u672a\u751f\u6210')
        return False


# ── 清理 ──────────────────────────────────────────────────

def cleanup():
    for f in [os.path.join(ROOT, 'docs', 'test-manual-output.html'),
              os.path.join(ROOT, 'docs', 'test-fixed.html'),
              os.path.join(ROOT, 'docs', 'test-page.html')]:
        if os.path.exists(f):
            os.remove(f)


# ── 主流程 ─────────────────────────────────────────────────

if __name__ == '__main__':
    success = build_manual_pdf_v2()
    if success:
        print()
        print('[INFO] \u683c\u5f0f\u89c4\u683c:')
        print('      \u7eb8\u5f20: A4')
        print('      \u9875\u7709: \u5148\u950b\u4eba\u5de5\u667a\u80fd\u670d\u52a1\u6846\u67b6\u8f6f\u4ef6 V2.0.0 (\u5b8b\u4f53 9pt)')
        print('      \u9875\u811a: \u7b2c X \u9875 (\u5b8b\u4f53 9pt)')
        print('      \u6b63\u6587: \u5b8b\u4f53 12pt\uff0c1.5 \u500d\u884c\u8ddd')
        print('      \u6807\u9898: \u9ed1\u4f53')
        print('      \u4ee3\u7801: Courier New')
        print(f'      \u622a\u56fe: 7 \u5f20')
    else:
        print('[ERROR] PDF \u751f\u6210\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5 Chrome \u662f\u5426\u5b89\u88c5\u5728\u9ed8\u8ba4\u8def\u5f84')
