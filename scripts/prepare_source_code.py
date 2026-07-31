import os
import re

# Configuration
FILES_TO_PROCESS = [
    ("apps/web/src/middleware.ts", "安全性与多租户解析中间件"),
    ("apps/web/src/app/api/auth/pi/route.ts", "Pi 网络认证接口"),
    ("apps/web/src/app/api/payments/approve/route.ts", "Pi 支付审批接口"),
    ("apps/web/src/app/api/payments/complete/route.ts", "Pi 支付完成确认接口"),
    ("apps/web/src/app/api/ai/query/route.ts", "AI 助手查询服务接口"),
    ("apps/web/src/lib/pi-client.ts", "客户端 Pi SDK 集成封装"),
    ("apps/web/src/components/PiLoginButton.tsx", "Pi 登录交互组件"),
    ("apps/web/src/app/page.tsx", "商户首页核心逻辑"),
    ("packages/pi-sdk/src/ai-providers/factory.ts", "AI 提供商路由工厂"),
    ("packages/pi-sdk/src/ai-providers/base.ts", "AI 提供商抽象基类"),
    ("packages/pi-sdk/src/ai-providers/openai.ts", "OpenAI 服务驱动实现"),
    ("packages/pi-sdk/src/license/manager.ts", "软件许可证管理逻辑"),
    ("packages/pi-sdk/src/license/validator.ts", "加密许可证验证引擎"),
    ("packages/pi-sdk/src/tenant/manager.ts", "多租户生命周期管理"),
    ("packages/pi-sdk/src/tenant/prisma-middleware.ts", "数据库层多租户自动隔离中间件"),
    ("packages/pi-sdk/src/usage/tracker.ts", "资源使用量实时追踪器"),
    ("packages/pi-sdk/src/payment-service.ts", "核心支付业务服务层"),
    ("packages/pi-sdk/src/ai-service.ts", "AI 服务通用入口封装")
]

HEADER_TEMPLATE = """/**
 * 先锋人工智能服务框架软件
 * 版本号：V2.0.0
 * 文件名称：{filename}
 * 功能描述：{description}
 * 著作权人：秦晓望
 * 开发完成日期：2026年05月
 */

"""

SENSITIVE_PATTERNS = [
    (r'sk-[a-zA-Z0-9]{32,}', 'process.env.OPENAI_API_KEY'),
    (r'postgresql://[^"]+', 'process.env.DATABASE_URL'),
    (r'"[0-9a-f]{64}"', 'process.env.NEXTAUTH_SECRET'),
    (r'api_key: "[^"]+"', 'api_key: process.env.PI_API_KEY')
]

OUTPUT_FILE = "source_code_v2.0.0_final_formatted.md"
LINES_PER_PAGE = 50
MAX_PAGES = 60

def clean_code(content):
    for pattern, replacement in SENSITIVE_PATTERNS:
        content = re.sub(pattern, replacement, content)
    return content

def main():
    all_lines = []
    
    for rel_path, description in FILES_TO_PROCESS:
        abs_path = os.path.join(os.getcwd(), rel_path.replace("/", os.sep))
        if not os.path.exists(abs_path):
            print(f"Warning: {rel_path} not found")
            continue
            
        filename = os.path.basename(rel_path)
        header = HEADER_TEMPLATE.format(filename=filename, description=description)
        
        with open(abs_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        content = clean_code(content)
        
        # Split into lines and add header
        file_content = header + content
        lines = file_content.splitlines()
        all_lines.extend(lines)
        all_lines.append("") # Blank line between files
        all_lines.append("//" + "="*50)
        all_lines.append("")

    # Limit to ~3000 lines (60 pages * 50 lines)
    final_content = "\n".join(all_lines[:LINES_PER_PAGE * MAX_PAGES])

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(final_content)
        
    print(f"Successfully generated {OUTPUT_FILE} with {len(final_content.splitlines())} lines.")

if __name__ == "__main__":
    main()
