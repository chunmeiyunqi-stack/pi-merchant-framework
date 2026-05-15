import os
import re
from pathlib import Path

def redact_content(content):
    # PI_API_KEY / JWT_SECRET / DATABASE_URL → [REDACTED_环境配置]
    content = re.sub(r'(PI_API_KEY|JWT_SECRET|DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ANON_KEY)\s*[:=]\s*["\'].*?["\']', r'\1 = "[REDACTED_环境配置]"', content)
    content = re.sub(r'process\.env\.(PI_API_KEY|JWT_SECRET|DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY)', r'process.env.\1 /* [REDACTED_环境配置] */', content)
    
    # URL redaction (domains/IPs)
    # Be careful not to replace localhost unless requested, but "真实域名/内网IP → [YOUR_DOMAIN]" implies replacing domains.
    # Let's replace common url patterns that look like real domains or IPs.
    content = re.sub(r'https?://(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::\d+)?', 'http://[YOUR_DOMAIN]', content)
    content = re.sub(r'https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?::\d+)?', 'https://[YOUR_DOMAIN]', content)
    
    # console.log/debugger → // [DEBUG_REMOVED]
    content = re.sub(r'console\.(log|debug|info|warn|error)\(.*?\);?', '// [DEBUG_REMOVED]', content)
    content = re.sub(r'\bdebugger;?', '// [DEBUG_REMOVED]', content)
    
    return content

def main():
    root = Path("d:/PiMerchantFramework")
    
    # directories to search
    search_dirs = [
        root / "apps" / "web" / "src" / "app",
        root / "apps" / "web" / "src" / "lib",
        root / "apps" / "admin" / "src" / "app",
        root / "apps" / "admin" / "src" / "lib",
        root / "prisma"
    ]
    
    # also add middleware
    extra_files = [
        root / "apps" / "web" / "src" / "middleware.ts",
        root / "apps" / "admin" / "src" / "middleware.ts"
    ]
    
    all_files = []
    
    for d in search_dirs:
        if d.exists():
            for p in d.rglob("*"):
                if p.is_file() and p.suffix in [".ts", ".tsx", ".prisma"]:
                    all_files.append(p)
                    
    for f in extra_files:
        if f.exists():
            all_files.append(f)
            
    # remove duplicates and normalize paths
    all_files = list(set([p.resolve() for p in all_files]))
    
    # exclude rules
    filtered_files = []
    for p in all_files:
        parts = p.parts
        if "node_modules" in parts or ".next" in parts or ".git" in parts or "test" in parts:
            continue
        if p.name.endswith(".test.ts") or p.name.endswith(".spec.ts"):
            continue
        # ignore build outputs if any (e.g. dist, build)
        if "dist" in parts or "build" in parts:
            continue
        filtered_files.append(p)
        
    # priority matching
    def get_priority(p):
        path_str = str(p).replace("\\", "/")
        if "middleware.ts" in path_str: return 1
        if "api/auth/pi/route.ts" in path_str: return 2
        if "api/payments/approve/route.ts" in path_str: return 3
        if "api/payments/complete/route.ts" in path_str: return 4
        if "schema.prisma" in path_str: return 5
        if "orders/page.tsx" in path_str: return 6
        if "memberships/page.tsx" in path_str: return 7
        return 99

    filtered_files.sort(key=lambda p: (get_priority(p), str(p)))
    
    out_lines = []
    for p in filtered_files:
        rel_path = p.relative_to(root)
        out_lines.append(f"// === 模块：{rel_path.as_posix()} ===")
        try:
            with open(p, "r", encoding="utf-8") as f:
                content = f.read()
            out_lines.append(redact_content(content))
            out_lines.append("")
        except Exception as e:
            out_lines.append(f"// Error reading file: {e}\n")
            
    with open(root / "output_combined.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(out_lines))
        
    print(f"Total files: {len(filtered_files)}")
    print(f"Total lines: {len(out_lines)}")
    print("Done")

if __name__ == "__main__":
    main()
