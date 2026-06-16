const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

async function main() {
  const root = process.cwd();
  const srcFile = path.join(root, 'user_manual_v2.0.0.html');
  const outFile = path.join(root, 'user_manual_FINAL.html');
  const screenshotsDir = path.join(root, 'screenshots');

  const mapping = {
    3.1: { prefix: 'fig_3_1_login', desc: 'Pi Network 登录界面' },
    3.2: { prefix: 'fig_3_2_dashboard', desc: '控制台首页' },
    3.3: { prefix: 'fig_3_3_ai_chat', desc: 'AI 对话界面' },
    3.4: { prefix: 'fig_3_4_model_select', desc: '模型选择界面' },
    3.5: { prefix: 'fig_3_5_streaming', desc: '流式响应生成中' },
    3.6: { prefix: 'fig_3_6_history_list', desc: '历史记录列表' },
    3.7: { prefix: 'fig_3_7_history_filter', desc: '历史记录高级筛选' },
    3.8: { prefix: 'fig_3_8_payment', desc: '支付结算中心' },
    3.9: { prefix: 'fig_3_9_payment_confirm', desc: 'Pi 支付确认弹窗' },
    '3.10': { prefix: 'fig_3_10_payment_success', desc: '支付成功页面' },
    3.11: { prefix: 'fig_3_11_account', desc: '账户设置页面' },
    3.12: { prefix: 'fig_3_12_tenant', desc: '多租户管理界面' },
    3.13: { prefix: 'fig_3_13_rate_limit', desc: '速率限制提示 429' },
    3.14: { prefix: 'fig_3_14_api_docs', desc: 'API 开发者文档' },
    3.15: { prefix: 'fig_3_15_error_500', desc: '系统错误处理 500' },
  };

  try {
    const html = await fs.readFile(srcFile, 'utf8');

    const regex = /【\s*图\s*3\.(\d{1,2})\s*[:：][^】]*】/g;
    const matches = Array.from(html.matchAll(regex));
    if (matches.length === 0) {
      console.log('未在源文件中找到任何匹配的占位符。');
      await fs.writeFile(outFile, html, 'utf8');
      return;
    }

    let newHtml = html;
    let inserted = 0;

    for (const m of matches) {
      const full = m[0];
      const num = m[1];
      const key = `3.${num}`;
      const map = mapping[key];
      if (!map) {
        console.warn(`跳过未映射图号: ${key}`);
        continue;
      }

      // 从文件系统获取实际的文件名（带注释部分）
      let actualFile = null;
      try {
        const files = fsSync.readdirSync(screenshotsDir);
        for (const f of files) {
          if (f.startsWith(map.prefix) && f.endsWith('.png')) {
            actualFile = f;
            break;
          }
        }
      } catch (err) {
        console.warn(`读取截图目录失败: ${err.message}`);
        continue;
      }

      if (!actualFile) {
        console.warn(`未找到匹配前缀的文件: ${map.prefix}, 跳过 ${key}`);
        continue;
      }

      const imgPath = path.join(screenshotsDir, actualFile);
      let b64 = null;
      try {
        const buf = await fs.readFile(imgPath);
        b64 = buf.toString('base64');
      } catch (err) {
        console.warn(`图片文件读取失败: ${imgPath}，跳过 ${key}，错误: ${err.message}`);
        continue;
      }

      const replacement = `\n<div style="text-align: center; margin: 30px 0; page-break-inside: avoid;">\n    <img src="data:image/png;base64,${b64}" \n         style="max-width: 90%; max-height: 500px; border: 1px solid #ddd; border-radius: 6px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">\n    <p style="margin-top: 12px; font-size: 13px; color: #555; font-weight: bold;">图 ${num}：${map.desc}</p>\n</div>\n`;

      newHtml = newHtml.replace(full, replacement);
      inserted += 1;
      console.log(`✅ 已插入：图 ${key} (${actualFile})`);
    }

    await fs.writeFile(outFile, newHtml, 'utf8');
    console.log(`\n已成功插入 ${inserted} 张图，输出文件: user_manual_FINAL.html`);
  } catch (err) {
    console.error('处理失败：', err);
    process.exit(1);
  }
}

main();
