# 先锋人工智能服务框架软件 V2.1.0 - 完整测试体系

## 概述

本文档描述了为"先锋人工智能服务框架软件 V2.1.0"建立的完整测试体系，旨在达到 **80%+ 的代码覆盖率**。

## 测试框架

- **Jest**：主要测试框架
- **@testing-library/react**：React 组件测试
- **ts-jest**：TypeScript 支持
- **jest-mock-extended**：Mock 对象创建
- **@testing-library/jest-dom**：DOM 断言
- **node-mocks-http**：HTTP 请求/响应 Mock

## 快速开始

### 1. 安装依赖

```bash
npm install --save-dev \
  jest \
  ts-jest \
  @types/jest \
  @testing-library/react \
  @testing-library/jest-dom \
  jest-mock-extended \
  node-mocks-http
```

### 2. 运行所有测试

```bash
npm test
```

### 3. 运行测试并生成覆盖率报告

```bash
npm run test:coverage
```

### 4. 监视模式（开发时持续运行）

```bash
npm test -- --watch
```

## 测试文件结构

```
src/
├── lib/
│   ├── __tests__/
│   │   ├── session.spec.ts           # 会话管理测试
│   │   └── rate-limit.spec.ts        # 速率限制测试
│   ├── ai/
│   │   ├── __tests__/
│   │   │   └── factory.spec.ts       # AI 工厂测试
│   │   └── providers/
│   │       └── __tests__/
│   │           └── openai.spec.ts    # OpenAI 提供商测试
│   └── license/
│       └── __tests__/
│           └── validator.spec.ts     # 许可证验证测试
└── pages/
    └── api/
        └── __tests__/
            └── route.spec.ts         # API 路由测试
```

## 核心测试模块

### 2.1 会话管理测试 (session.spec.ts)

**覆盖内容**：

- ✅ `signSessionToken()`：验证生成的 token 格式
- ✅ `verifySessionToken()`：验证合法、篡改、过期的 token
- ✅ 向后兼容性：支持旧格式 token
- ✅ 安全性：HMAC-SHA256 签名验证

**运行方式**：

```bash
npm test -- session.spec.ts
```

### 2.2 速率限制测试 (rate-limit.spec.ts)

**覆盖内容**：

- ✅ 基础限流功能：窗口期内正常工作、超出限制
- ✅ 窗口期重置：计数清零、独立计数
- ✅ 过期条目清理：定期清理机制
- ✅ IP 提取：支持 X-Forwarded-For、X-Real-IP 等
- ✅ 多维度限流：IP 级、用户级、API 级

**运行方式**：

```bash
npm test -- rate-limit.spec.ts
```

### 2.3 AI 提供商工厂测试 (factory.spec.ts)

**覆盖内容**：

- ✅ 主提供商优先使用
- ✅ Fallback 容错机制
- ✅ 直连请求（跳过 fallback）
- ✅ 流式请求的 Fallback 边界
- ✅ 智能模型选择策略

**运行方式**：

```bash
npm test -- factory.spec.ts
```

### 2.4 AI 提供商实现测试 (openai.spec.ts)

**覆盖内容**：

- ✅ `isAvailable()`：API Key 配置检查
- ✅ `healthCheck()`：健康探测
- ✅ `chat()`：正常请求、超时、HTTP 错误
- ✅ `generateStream()`：流式响应 yield
- ✅ 模型支持：多种模型支持

**运行方式**：

```bash
npm test -- openai.spec.ts
```

### 2.5 许可证验证测试 (validator.spec.ts)

**覆盖内容**：

- ✅ `verifySignature()`：签名验证
- ✅ `deserializeLicense()`：序列化数据解析
- ✅ `validateLicense()`：未过期/过期验证
- ✅ `hasFeature()`：功能授权检查
- ✅ Tier 功能映射：BASIC/PROFESSIONAL/ENTERPRISE

**运行方式**：

```bash
npm test -- validator.spec.ts
```

### 2.6 API 路由测试 (route.spec.ts)

**覆盖内容**：

- ✅ `POST /api/auth/pi`：Pi Network 认证流程
- ✅ `GET /api/v1/models`：获取可用模型列表
- ✅ `GET /api/v1/history`：分页查询历史
- ✅ `POST /api/v1/generate`：AI 生成请求
- ✅ `POST /api/payments/approve`：支付审批幂等性
- ✅ `POST /api/payments/complete`：支付完成流程

**运行方式**：

```bash
npm test -- route.spec.ts
```

## package.json 脚本配置

在你的 `package.json` 中添加以下脚本：

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:coverage:report": "jest --coverage && open coverage/lcov-report/index.html",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "test:ci": "jest --coverage --ci --maxWorkers=2"
  }
}
```

## 覆盖率目标

根据配置，所有指标应达到 **80%** 以上：

| 指标       | 目标 | 检查方式                |
| ---------- | ---- | ----------------------- |
| Branches   | 80%  | `npm run test:coverage` |
| Functions  | 80%  | `npm run test:coverage` |
| Lines      | 80%  | `npm run test:coverage` |
| Statements | 80%  | `npm run test:coverage` |

## 查看覆盖率报告

运行以下命令生成并打开 HTML 覆盖率报告：

```bash
npm run test:coverage:report
```

报告位置：`coverage/lcov-report/index.html`

## Mock 和测试工具

### 环境变量

所有测试环境变量在 `jest.setup.ts` 中配置：

```typescript
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
```

### HTTP Mock

使用 `node-mocks-http` 进行 HTTP 请求/响应 Mock：

```typescript
import { createMocks } from 'node-mocks-http';

const { req, res } = createMocks({
  method: 'GET',
  query: { page: '1' },
  headers: { authorization: 'Bearer token' },
});
```

### Fetch Mock

全局 fetch Mock 在 `jest.setup.ts` 中配置：

```typescript
global.fetch = jest.fn();
```

在测试中使用：

```typescript
const mockFetch = fetch as jest.Mocked<typeof fetch>;
mockFetch.mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({ data: 'test' }),
});
```

## 常见问题

### Q: 测试超时？

A: 在 `jest.config.js` 中增加超时时间：

```javascript
testTimeout: 10000, // 10 秒
```

### Q: Mock 不工作？

A: 确保在测试文件顶部使用 `jest.mock()`：

```typescript
jest.mock('@/lib/ai/providers/openai');
```

### Q: 如何调试测试？

A: 运行调试模式：

```bash
npm run test:debug
```

然后在 Chrome 中打开 `chrome://inspect`。

### Q: 如何只运行特定的测试？

A: 使用 `-t` 选项：

```bash
npm test -- -t "会话管理"
```

## 持续集成

在 CI/CD 流程中运行：

```bash
npm run test:ci
```

此命令会：

1. 运行所有测试
2. 生成覆盖率报告
3. 检查是否达到 80% 覆盖率阈值
4. 输出 JSON 报告用于集成

## 下一步

1. **增加集成测试**：对完整的业务流程进行测试
2. **端到端测试**：使用 Cypress 或 Playwright 进行 E2E 测试
3. **性能测试**：添加基准测试验证性能指标
4. **可视化回归测试**：使用 Percy 或 Chromatic

## 参考资源

- [Jest 官方文档](https://jestjs.io/)
- [Testing Library 文档](https://testing-library.com/)
- [TypeScript Jest 配置](https://kulshekhar.github.io/ts-jest/)
- [HTTP Mock 库](https://www.npmjs.com/package/node-mocks-http)

## 联系方式

有任何问题或建议，请联系开发团队或提交 Issue。

---

**最后更新**：2026年5月
**作者**：秦晓望
**版本**：2.1.0
