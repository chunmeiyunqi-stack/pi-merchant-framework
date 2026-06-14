const fs = require('fs');
const path = require('path');

// 配置
const htmlFile = 'user_manual_v2.0.0.html';
const screenshotsDir = 'screenshots';

console.log('🔍 正在读取 HTML 文件...');
let html = fs.readFileSync(htmlFile, 'utf8');

// 图片映射表
const images = {
  3.1: 'fig_3_1_login.png',
  3.2: 'fig_3_2_dashboard.png',
  3.3: 'fig_3_3_ai_chat.png',
  3.4: 'fig_3_4_model_select.png',
  3.5: 'fig_3_5_streaming.png',
  3.6: 'fig_3_6_history_list.png',
  3.7: 'fig_3_7_history_filter.png',
  3.8: 'fig_3_8_payment.png',
  3.9: 'fig_3_9_payment_confirm.png',
  '3.10': 'fig_3_10_payment_success.png',
  3.11: 'fig_3_11_account.png',
  3.12: 'fig_3_12_tenant.png',
  3.13: 'fig_3_13_rate_limit.png',
  3.14: 'fig_3_14_api_docs.png',
  3.15: 'fig_3_15_error_500.png',
};

let count = 0;

// 遍历所有图片
for (const [num, filename] of Object.entries(images)) {
  const filePath = path.join(screenshotsDir, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  未找到：${filename}`);
    continue;
  }

  // 读取图片并转为 Base64
  const imageBuffer = fs.readFileSync(filePath);
  const base64 = imageBuffer.toString('base64');

  // 创建图片 HTML（带边框、居中、标题）
  const imgHtml = `
<div style="text-align: center; margin: 30px 0; page-break-inside: avoid;">
    <img src="data:image/png;base64,${base64}" 
         style="max-width: 100%; max-height: 500px; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <p style="margin-top: 10px; font-size: 12px; color: #666; font-style: italic;">图${num}：软件界面截图</p>
</div>`;

  // 替换占位符（支持多种格式）
  const patterns = [
    new RegExp(`【图${num}：[^】]*】`, 'g'), // 【图3.1：xxx】
    new RegExp(`\\[图${num}[^\\]]*\\]`, 'g'), // [图3.1：xxx]
    new RegExp(`图${num}[^<]*截图`, 'g'), // 图3.1：xxx截图
  ];

  let replaced = false;
  for (const pattern of patterns) {
    if (pattern.test(html)) {
      html = html.replace(pattern, imgHtml);
      replaced = true;
      break;
    }
  }

  if (replaced) {
    count++;
    console.log(`✅ 已插入：图${num}`);
  } else {
    console.log(`ℹ️  未找到占位符：图${num}`);
  }
}

// 保存新文件
const outputFile = 'user_manual_final.html';
fs.writeFileSync(outputFile, html, 'utf8');

console.log('\n' + '='.repeat(50));
console.log(`🎉 完成！共插入 ${count} 张截图`);
console.log(`📄 输出文件：${outputFile}`);
console.log('\n下一步：');
console.log('1. 打开 user_manual_final.html');
console.log('2. 按 Ctrl+P 打印为 PDF');
console.log('3. 边距选"默认"，取消勾选"页眉和页脚"');
console.log('='.repeat(50));
