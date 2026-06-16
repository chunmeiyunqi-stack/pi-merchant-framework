const fs = require('fs');
const file = 'source_code_v2.0.0_copyright_final.md';

if (!fs.existsSync(file)) {
  console.log('❌ 找不到文件: ' + file);
  console.log('请检查文件名是否完全一致（包括大小写）。');
  process.exit(1);
}

const content = fs.readFileSync(file, 'utf8');

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>源代码</title>
    <style>
        @page {
            size: A4;
            margin: 2cm;
            @top-center {
                content: "先锋人工智能服务框架软件 V2.0.0";
                font-family: "SimSun", "Songti SC", serif;
                font-size: 10.5pt;
            }
            @bottom-center {
                content: "- " counter(page) " -";
                font-family: "SimSun", "Songti SC", serif;
                font-size: 10.5pt;
            }
        }
        body {
            font-family: "Consolas", "Monaco", "Courier New", monospace;
            font-size: 10.5pt;   /* 改为 10.5pt (五号字) */
            line-height: 1.4;    /* 改为 1.4 (拉大行距，确保每页约50行) */
            white-space: pre-wrap;
            word-wrap: break-word;
            margin: 0;
            padding: 0;
        }
        pre { margin: 0; font-family: inherit; }
    </style>
</head>
<body>
<pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;

fs.writeFileSync('copyright_print.html', html);
console.log('✅ 成功！请在文件夹中打开 copyright_print.html，然后按 Ctrl+P 打印为 PDF。');
