# Pioneer AI 用户手册 V2.0.0 — 补充材料

> 以下内容建议插入到用户手册 V2.0.0 第 5 章"商业化核心能力"中，作为架构图补充。

---

## 5.1.1 License 授权验证流程图

```mermaid
flowchart TD
    Start([服务启动 / API 请求]) --> LoadEnv

    subgraph Load["① 加载阶段"]
        LoadEnv{"读取 LICENSE_PAYLOAD\n环境变量"}
        LoadEnv -->|"存在"| Decode["Base64 解码\nJSON.parse\n→ SerializedLicense"]
        LoadEnv -->|"不存在"| DevCheck{"NODE_ENV ?"}
        DevCheck -->|"development / test"| DevLicense["颁发开发模式 License\ntier: enterprise\n全功能开放\n有效期: 365 天"]
        DevCheck -->|"production"| Reject1["❌ 拒绝\n提示配置 LICENSE_PAYLOAD"]
    end

    Decode --> CacheCheck

    subgraph Cache["② 缓存阶段"]
        CacheCheck{"命中缓存?\nTTL: 5 分钟"}
        CacheCheck -->|"命中"| ReturnCached["直接返回缓存结果\n跳过验证"]
        CacheCheck -->|"未命中"| Validate["进入验证流程"]
    end

    subgraph Verify["③ 三步验证"]
        Validate --> Step1
        Step1["步骤 1: 过期检查\nexpiresAt vs Date.now()"]
        Step1 -->|"已过期"| Expired["❌ status: expired\n返回逾期天数"]
        Step1 -->|"未过期"| Step2

        Step2["步骤 2: 签名验证\nHMAC-SHA256\nWeb Crypto API"]
        Step2 --> Payload["构建签名数据:\nid | issuedTo | merchantId |\nissuedAt | expiresAt | tier |\nfeatures | maxRequests | maxTenants"]
        Payload --> CryptoVerify["crypto.subtle.verify(\n  'HMAC', cryptoKey,\n  sigBuffer, payloadBuffer\n)"]
        CryptoVerify -->|"签名无效"| Invalid["❌ status: invalid\n签名验证失败"]
        CryptoVerify -->|"签名有效"| Step3

        Step3["步骤 3: Feature Gate\n检查所需功能是否已授权"]
        Step3 -->|"功能缺失"| Missing["❌ status: invalid\n缺少所需功能"]
        Step3 -->|"全部满足"| Pass["✅ 验证通过"]
    end

    Pass --> CalcDays["计算剩余天数"]
    CalcDays --> ExpiryWarn{"剩余 ≤ 30 天?"}
    ExpiryWarn -->|"是"| Warn["⚠️ 预警日志\nlogWarn"]
    ExpiryWarn -->|"否"| WriteCache
    Warn --> WriteCache["写入缓存\nTTL: 5 min"]
    WriteCache --> Return["返回验证结果"]

    subgraph Tiers["套餐 → 功能映射"]
        direction LR
        T1["Starter\n• ai_routing"]
        T2["Professional\n• ai_routing\n• streaming\n• usage_tracking\n• webhook_monitoring"]
        T3["Enterprise\n• ai_routing\n• streaming\n• multi_tenant\n• usage_tracking\n• webhook_monitoring\n• advanced_analytics"]
    end

    style Load fill:#EFF6FF,stroke:#3B82F6
    style Cache fill:#FFFBEB,stroke:#F59E0B
    style Verify fill:#F0FDF4,stroke:#22C55E
    style Tiers fill:#FAF5FF,stroke:#A855F7
    style Expired fill:#FEE2E2,stroke:#EF4444
    style Invalid fill:#FEE2E2,stroke:#EF4444
    style Missing fill:#FEE2E2,stroke:#EF4444
    style Reject1 fill:#FEE2E2,stroke:#EF4444
    style Pass fill:#DCFCE7,stroke:#22C55E
    style DevLicense fill:#DBEAFE,stroke:#3B82F6
```

---

## 5.2.1 多租户数据隔离流程图

```mermaid
sequenceDiagram
    participant C as 客户端请求<br/>(Pi Browser)
    participant MW as Next.js Middleware<br/>(路由拦截层)
    participant API as API Route Handler<br/>(业务逻辑层)
    participant CTX as TenantContext<br/>(AsyncLocalStorage)
    participant PM as Prisma Middleware<br/>(数据隔离层)
    participant DB as PostgreSQL<br/>(数据库)

    Note over C,DB: ━━━ 请求进入 ━━━

    C->>MW: HTTP 请求<br/>+ Cookie: pi_auth_token, merchant_id<br/>+ Header: x-tenant-id

    Note over MW: 🔒 认证检查
    MW->>MW: 检查 pi_auth_token Cookie
    
    alt 未认证 + 受保护路由
        MW-->>C: 302 Redirect → /login
    end

    Note over MW: 🏢 租户解析（三级 Fallback）
    MW->>MW: 1. x-tenant-id Header<br/>2. merchant_id Cookie<br/>3. NEXT_PUBLIC_MERCHANT_ID Env

    MW->>API: NextResponse.next()<br/>tenantId 已解析

    Note over API,CTX: ━━━ 业务处理 ━━━

    API->>CTX: runWithTenant(tenantId, async () => {...})
    Note over CTX: AsyncLocalStorage.run()<br/>将 tenantId 注入当前异步上下文

    API->>PM: prisma.order.findMany({<br/>  where: { status: 'COMPLETED' }<br/>})

    Note over PM: 🛡️ 自动注入隔离条件
    PM->>PM: getTenantId() → 读取上下文
    PM->>PM: 白名单模型匹配:<br/>Customer ✓ | Order ✓ | Payment ✓<br/>Booking ✓ | Membership ✓ | Service ✓

    PM->>PM: 自动合并条件:<br/>where: {<br/>  status: 'COMPLETED',<br/>  merchantId: tenantId  ← 注入<br/>}

    PM->>DB: SELECT * FROM orders<br/>WHERE status = 'COMPLETED'<br/>AND merchant_id = 'tenant_xxx'

    DB-->>PM: 仅返回该租户数据
    PM-->>API: 隔离后的查询结果
    API-->>C: JSON Response
```

---

## 5.4 系统架构全景图

```mermaid
graph TB
    subgraph ClientLayer["客户端层"]
        PiB["Pi Browser\n(商户前台用户)"]
        AdminB["管理端浏览器\n(商户管理员)"]
    end

    subgraph GatewayLayer["网关层 — Next.js Edge Middleware"]
        WebMW["Web Middleware\n• 路由保护\n• 租户解析\n• Cookie 认证"]
        AdminMW["Admin Middleware\n• 路由保护\n• Cookie 认证"]
    end

    subgraph AppLayer["应用层 — API Routes"]
        AuthAPI["认证 API\n/api/auth/*"]
        PayAPI["支付 API\n/api/payments/*"]
        OrderAPI["订单 API\n/api/orders/*"]
        AIAPI["AI API\n/api/ai/*"]
        LicAPI["License API\n/api/license/*"]
    end

    subgraph SDKLayer["核心 SDK 层 — packages/pi-sdk"]
        AuthSvc["认证服务"]
        PaySvc["支付服务"]
        AISvc["AI 入口服务"]

        subgraph V2["V2.0.0 商业化核心"]
            LicMgr["License 管理器"]
            TenMgr["Tenant 管理器"]
            UsaTrk["Usage 追踪器"]
        end

        subgraph AIE["AI 多提供商路由"]
            Factory["Provider Factory"]
            OAI["OpenAI"]
            ANT["Anthropic"]
            OLL["Ollama"]
        end
    end

    subgraph DataLayer["数据层"]
        PrismaMW["Prisma Middleware\n自动隔离"]
        PG[("PostgreSQL\n13 Models")]
    end

    subgraph External["外部服务"]
        PiAPI["Pi Platform API"]
        OAIAPI["OpenAI API"]
        ANTAPI["Anthropic API"]
        OLLAPI["Ollama Server"]
    end

    PiB --> WebMW
    AdminB --> AdminMW
    WebMW --> AuthAPI & PayAPI & OrderAPI & AIAPI & LicAPI
    AdminMW --> AuthAPI & OrderAPI

    AuthAPI --> AuthSvc
    PayAPI --> PaySvc
    AIAPI --> AISvc
    LicAPI --> LicMgr

    AISvc --> Factory
    Factory --> OAI --> OAIAPI
    Factory --> ANT --> ANTAPI
    Factory --> OLL --> OLLAPI

    AuthSvc --> PiAPI
    PaySvc --> PiAPI

    LicMgr -.-> TenMgr
    TenMgr -.-> UsaTrk

    AuthAPI --> PrismaMW --> PG

    style V2 fill:#EEF2FF,stroke:#4F46E5,stroke-width:2px
    style AIE fill:#F0FDF4,stroke:#059669
    style SDKLayer fill:#FFFBEB,stroke:#D97706
    style External fill:#FFF1F2,stroke:#E11D48
```

---

*以上内容为 V2.0.0 用户手册补充材料，包含授权流程图、多租户架构图和系统全景图。*
