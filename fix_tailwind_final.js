const fs = require('fs');
const path = require('path');

const projectRoot = 'D:\\PiMerchantFramework\\apps\\web';

console.log('--- 开始一键修复 Tailwind CSS ---');

// 1. Check package.json dependencies
const pkgPath = path.join(projectRoot, 'package.json');
let needsInstall = false;
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const devDeps = pkg.devDependencies || {};
  const deps = pkg.dependencies || {};
  
  const hasTw = devDeps['tailwindcss'] || deps['tailwindcss'];
  const hasPostcss = devDeps['postcss'] || deps['postcss'];
  const hasAuto = devDeps['autoprefixer'] || deps['autoprefixer'];
  
  if (hasTw && hasPostcss && hasAuto) {
    console.log('✅ [1/5] package.json 检查：tailwindcss, postcss, autoprefixer 均已存在，无需额外安装。');
  } else {
    console.log('❌ [1/5] package.json 检查：缺失 Tailwind 核心依赖。');
    console.log('   请随后手动运行命令：pnpm add -D tailwindcss postcss autoprefixer');
  }
} else {
  console.log('⚠️ [1/5] 找不到 package.json，跳过依赖检查。');
}

// 2. postcss.config.js
const postcssPath = path.join(projectRoot, 'postcss.config.js');
const postcssContent = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
fs.writeFileSync(postcssPath, postcssContent, 'utf8');
console.log('✅ [2/5] 修复：postcss.config.js 已生成并写入正确内容。');

// 3. tailwind.config.ts
const tailwindPath = path.join(projectRoot, 'tailwind.config.ts');
const tailwindContent = `import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
`;
fs.writeFileSync(tailwindPath, tailwindContent, 'utf8');
console.log('✅ [3/5] 修复：tailwind.config.ts 已重写，正确配置了 src/ 下的所有 content 扫描路径。');

// 4. globals.css
const globalsDir = path.join(projectRoot, 'src', 'app');
if (!fs.existsSync(globalsDir)) {
  fs.mkdirSync(globalsDir, { recursive: true });
}
const globalsPath = path.join(globalsDir, 'globals.css');
const globalsContent = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
`;
fs.writeFileSync(globalsPath, globalsContent, 'utf8');
console.log('✅ [4/5] 修复：src/app/globals.css 注入了 Tailwind 的核心三行指令。');

// 5. layout.tsx check
const layoutPath = path.join(projectRoot, 'src', 'app', 'layout.tsx');
if (fs.existsSync(layoutPath)) {
  let layoutContent = fs.readFileSync(layoutPath, 'utf8');
  if (!layoutContent.includes("import './globals.css'") && !layoutContent.includes('import "./globals.css"')) {
    layoutContent = "import './globals.css';\n" + layoutContent;
    fs.writeFileSync(layoutPath, layoutContent, 'utf8');
    console.log("✅ [5/5] 修复：layout.tsx 头部补充了 import './globals.css'。");
  } else {
    console.log("✅ [5/5] 检查：layout.tsx 已经包含对 globals.css 的引用。");
  }
} else {
  console.log('⚠️ [5/5] 找不到 layout.tsx，无法修改。');
}

console.log('--- Tailwind CSS 修复脚本运行完毕 ---');
