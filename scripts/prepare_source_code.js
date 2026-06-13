const fs = require('fs');
const path = require('path');

// Configuration
const FILES_TO_PROCESS = [
    ["apps/web/src/middleware.ts", "安全性与多租户解析中间件"],
    ["apps/web/src/app/api/auth/pi/route.ts", "Pi 网络认证接口"],
    ["apps/web/src/app/api/payments/approve/route.ts", "Pi 支付审批接口"],
    ["apps/web/src/app/api/payments/complete/route.ts", "Pi 支付完成确认接口"],
    ["apps/web/src/app/api/ai/query/route.ts", "AI 助手查询服务接口"],
    ["apps/web/src/lib/pi-client.ts", "客户端 Pi SDK 集成封装"],
    ["apps/web/src/components/PiLoginButton.tsx", "Pi 登录交互组件"],
    ["apps/web/src/app/page.tsx", "商户首页核心逻辑"],
    ["packages/pi-sdk/src/ai-providers/factory.ts", "AI 提供商路由工厂"],
    ["packages/pi-sdk/src/ai-providers/base.ts", "AI 提供商抽象基类"],
    ["packages/pi-sdk/src/ai-providers/openai.ts", "OpenAI 服务驱动实现"],
    ["packages/pi-sdk/src/license/manager.ts", "软件许可证管理逻辑"],
    ["packages/pi-sdk/src/license/validator.ts", "加密许可证验证引擎"],
    ["packages/pi-sdk/src/tenant/manager.ts", "多租户生命周期管理"],
    ["packages/pi-sdk/src/tenant/prisma-middleware.ts", "数据库层多租户自动隔离中间件"],
    ["packages/pi-sdk/src/usage/tracker.ts", "资源使用量实时追踪器"],
    ["packages/pi-sdk/src/payment-service.ts", "核心支付业务服务层"],
    ["packages/pi-sdk/src/ai-service.ts", "AI 服务通用入口封装"]
];

const HEADER_TEMPLATE = (filename, description) => `/**
 * 先锋人工智能服务框架软件
 * 版本号：V2.0.0
 * 文件名称：${filename}
 * 功能描述：${description}
 * 著作权人：秦晓望
 * 开发完成日期：2026年05月
 */

`;

const SENSITIVE_PATTERNS = [
    [/sk-[a-zA-Z0-9]{32,}/g, 'process.env.OPENAI_API_KEY'],
    [/postgresql:\/\/[^\"\']+/g, 'process.env.DATABASE_URL'],
    [/\"[0-9a-f]{64}\"/g, 'process.env.NEXTAUTH_SECRET'],
    [/api_key:\s*\"[^\"]+\"/g, 'api_key: process.env.PI_API_KEY']
];

const OUTPUT_FILE = "source_code_v2.0.0_final_formatted.md";
const LINES_PER_PAGE = 50;
const MAX_PAGES = 60;

function cleanCode(content) {
    let cleaned = content;
    for (const [pattern, replacement] of SENSITIVE_PATTERNS) {
        cleaned = cleaned.replace(pattern, replacement);
    }
    return cleaned;
}

function main() {
    let allLines = [];
    
    for (const [relPath, description] of FILES_TO_PROCESS) {
        const absPath = path.resolve(process.cwd(), relPath);
        if (!fs.existsSync(absPath)) {
            console.warn(`Warning: ${relPath} not found`);
            continue;
        }
            
        const filename = path.basename(relPath);
        const header = HEADER_TEMPLATE(filename, description);
        
        let content = fs.readFileSync(absPath, 'utf8');
        content = cleanCode(content);
        
        const fileContent = header + content;
        const lines = fileContent.split(/\r?\n/);
        allLines.push(...lines);
        allLines.push(""); // Blank line between files
        allLines.push("//" + "=".repeat(50));
        allLines.push("");
    }

    // Limit to ~3000 lines (60 pages * 50 lines)
    const finalLines = allLines.slice(0, LINES_PER_PAGE * MAX_PAGES);
    const finalContent = finalLines.join("\n");

    fs.writeFileSync(OUTPUT_FILE, finalContent, 'utf8');
    console.log(`Successfully generated ${OUTPUT_FILE} with ${finalLines.length} lines.`);
}

main();
