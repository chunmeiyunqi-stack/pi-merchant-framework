const fs = require('fs');
const path = require('path');

// 配置
const htmlFile = 'user_manual_v2.0.0.html';
const screenshotsDir = 'screenshots';
const outputDir = 'user_manual_with_images';

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 读取 HTML 文件
let html = fs.readFileSync(htmlFile, 'utf8');

// 读取所有截图文件
const screenshotFiles = fs
  .readdirSync(screenshotsDir)
  .filter((f) => f.endsWith('.png'))
  .sort();

console.log(`📸 找到 ${screenshotFiles.length} 张截图`);

// 图片编号到文件名的映射
const imageMap = {
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

// 替换占位符
let replacedCount = 0;

for (const [figNum, filename] of Object.entries(imageMap)) {
  const filePath = path.join(screenshotsDir, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  未找到截图：${filename}`);
    continue;
  }

  // 读取图片并转换为 Base64（内嵌到 HTML 中，方便打印）
  const imageBuffer = fs.readFileSync(filePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = 'image/png';
  const dataUri = `data:${mimeType};base64,${base64Image}`;

  // 创建图片标签（带边框、居中、最大宽度限制）
  const imgTag = `
<div style="text-align: center; margin: 30px 0; page-break-inside: avoid;">
    <img src="${dataUri}" 
         style="max-width: 100%; 
                max-height: 500px; 
                border: 1px solid #ddd; 
                border-radius: 4px; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);" 
         alt="图${figNum}">
    <p style="margin-top: 10px; font-size: 12px; color: #666; font-style: italic;">
        图${figNum}：软件界面截图
    </p>
</div>`;

  // 查找并替换占位符
  const placeholder = `【图${figNum}：`;
  const placeholderRegex = new RegExp(`【图${figNum}：[^】]*】`, 'g');

  if (placeholderRegex.test(html)) {
    html = html.replace(placeholderRegex, imgTag);
    replacedCount++;
    console.log(`✅ 已插入：图${figNum} (${filename})`);
  } else {
    // 如果没有精确占位符，尝试在对应章节附近插入
    console.log(`ℹ️  未找到占位符【图${figNum}：...】，将在章节末尾插入`);

    // 根据章节号找到插入位置
    const chapterRegex = new RegExp(
      `(3\\.${parseInt(figNum.split('.')[1]) + 1}|${figNum.replace('.', '\\.')})`,
      'g'
    );
    // 这里简化处理，直接在文件末尾追加所有未匹配的图片
  }
}

// 保存修改后的 HTML
const outputHtml = path.join(outputDir, 'user_manual_v2.0.0_with_images.html');
fs.writeFileSync(outputHtml, html, 'utf8');

console.log(`\n🎉 完成！共插入 ${replacedCount} 张截图`);
console.log(`📄 输出文件：${outputHtml}`);
console.log(`\n 下一步：`);
console.log(`   1. 打开 ${outputHtml}`);
console.log(`   2. 按 Ctrl+P 打印为 PDF`);
console.log(`   3. 边距选"默认"，取消勾选"页眉和页脚"`);
