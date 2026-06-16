# 测试文件快速参考

## 📋 文件位置和命令快速查询表

### 1. 会话管理测试

| 属性         | 值                                                  |
| ------------ | --------------------------------------------------- |
| **文件**     | `src/lib/__tests__/session.spec.ts`                 |
| **用例数**   | 12                                                  |
| **行数**     | 180+                                                |
| **运行命令** | `npm test -- session.spec.ts`                       |
| **功能覆盖** | ✅ Token 生成 ✅ Token 验证 ✅ 过期检查 ✅ 向后兼容 |

**核心测试内容**：

```typescript
✓ signSessionToken() - 生成有效 token
✓ verifySessionToken() - 验证合法 token
✓ 拒绝篡改 token
✓ 拒绝过期 token
✓ HMAC-SHA256 签名验证
```

---

### 2. 速率限制测试

| 属性         | 值                                               |
| ------------ | ------------------------------------------------ |
| **文件**     | `src/lib/__tests__/rate-limit.spec.ts`           |
| **用例数**   | 15                                               |
| **行数**     | 270+                                             |
| **运行命令** | `npm test -- rate-limit.spec.ts`                 |
| **功能覆盖** | ✅ 限流检查 ✅ IP 提取 ✅ 多维度限流 ✅ 清理机制 |

**核心测试内容**：

```typescript
✓ check() - 基础限流
✓ getClientIp() - IP 提取（支持代理）
✓ checkByIp() - IP 级限流
✓ checkByUserId() - 用户级限流
✓ checkByEndpoint() - API 级限流
✓ cleanup() - 过期条目清理
```

---

### 3. AI 工厂测试

| 属性         | 值                                                  |
| ------------ | --------------------------------------------------- |
| **文件**     | `src/lib/ai/__tests__/factory.spec.ts`              |
| **用例数**   | 18                                                  |
| **行数**     | 330+                                                |
| **运行命令** | `npm test -- factory.spec.ts`                       |
| **功能覆盖** | ✅ 主提供商优先 ✅ Fallback ✅ 流式处理 ✅ 模型选择 |

**核心测试内容**：

```typescript
✓ 主提供商可用时优先使用
✓ 主提供商失败时自动 Fallback
✓ 按顺序尝试所有 Fallback
✓ 所有失败时抛出错误
✓ 流式响应首字节前允许 Fallback
✓ 流式响应首字节后禁止 Fallback
✓ 支持成本优化策略
✓ 支持性能优化策略
```

---

### 4. OpenAI 提供商测试

| 属性         | 值                                                  |
| ------------ | --------------------------------------------------- |
| **文件**     | `src/lib/ai/providers/__tests__/openai.spec.ts`     |
| **用例数**   | 14                                                  |
| **行数**     | 250+                                                |
| **运行命令** | `npm test -- openai.spec.ts`                        |
| **功能覆盖** | ✅ API Key 检查 ✅ 健康探测 ✅ 聊天请求 ✅ 流式响应 |

**核心测试内容**：

```typescript
✓ isAvailable() - API Key 配置检查
✓ healthCheck() - 服务健康状态
✓ chat() - 正常请求
✓ 处理超时错误
✓ 处理 HTTP 4xx 错误
✓ 处理 HTTP 5xx 错误
✓ 正确设置请求头
✓ 流式响应 yield
```

---

### 5. 许可证验证测试

| 属性         | 值                                                                |
| ------------ | ----------------------------------------------------------------- |
| **文件**     | `src/lib/license/__tests__/validator.spec.ts`                     |
| **用例数**   | 16                                                                |
| **行数**     | 300+                                                              |
| **运行命令** | `npm test -- validator.spec.ts`                                   |
| **功能覆盖** | ✅ 签名验证 ✅ 序列化/反序列化 ✅ 有效期 ✅ 功能授权 ✅ Tier 映射 |

**核心测试内容**：

```typescript
✓ verifySignature() - HMAC-SHA256 验证
✓ deserializeLicense() - 反序列化
✓ validateLicense() - 未过期检查
✓ 拒绝过期 License
✓ 拒绝未生效 License
✓ hasFeature() - 功能检查
✓ getTierFeatures() - Tier 映射
  ├─ BASIC 功能
  ├─ PROFESSIONAL 功能
  └─ ENTERPRISE 功能
```

---

### 6. API 路由测试

| 属性         | 值                                                     |
| ------------ | ------------------------------------------------------ |
| **文件**     | `src/pages/api/__tests__/route.spec.ts`                |
| **用例数**   | 22                                                     |
| **行数**     | 380+                                                   |
| **运行命令** | `npm test -- route.spec.ts`                            |
| **功能覆盖** | ✅ 认证 ✅ 模型列表 ✅ 历史查询 ✅ AI 生成 ✅ 支付流程 |

**核心测试内容**：

```typescript
✓ POST /api/auth/pi
  ├─ 完成 Pi 认证
  ├─ 返回有效 token
  ├─ 拒绝无效授权码
  └─ 创建/更新用户

✓ GET /api/v1/models
  ├─ 返回模型列表
  ├─ 包含元数据
  └─ 拒绝未认证

✓ GET /api/v1/history
  ├─ 返回历史记录
  ├─ 支持分页
  ├─ 支持过滤排序
  └─ 拒绝未认证

✓ POST /api/v1/generate
  ├─ 路由 AI 请求
  ├─ 支持流式响应
  ├─ 验证必需参数
  ├─ 检查 License 限制
  └─ 拒绝未认证

✓ POST /api/payments/approve
  ├─ 完成审批
  ├─ 确保幂等性
  └─ 验证金额

✓ POST /api/payments/complete
  ├─ 完成支付
  ├─ 写入区块链
  └─ 验证 approvalId
```

---

## 🚀 快速命令表

### 基础命令

```bash
# 运行所有测试
npm test

# 监视模式
npm test -- --watch

# 生成覆盖率报告
npm run test:coverage

# 运行特定测试
npm test -- session.spec.ts
npm test -- rate-limit.spec.ts
npm test -- factory.spec.ts
npm test -- openai.spec.ts
npm test -- validator.spec.ts
npm test -- route.spec.ts
```

### 高级命令

```bash
# 只运行匹配名称的测试
npm test -- -t "会话管理"

# 显示覆盖率详情
npm test -- --coverage --verbose

# 生成 JSON 覆盖率报告（用于 CI）
npm test -- --coverage --coverage-reporters=json

# 调试模式
npm run test:debug

# CI 模式
npm run test:ci

# 查看可用选项
npm test -- --help
```

---

## 📊 测试统计总览

### 代码量统计

| 模块              | 用例数 | 代码行数  | 覆盖范围   |
| ----------------- | ------ | --------- | ---------- |
| Session           | 12     | 180       | ⭐⭐⭐⭐⭐ |
| Rate Limit        | 15     | 270       | ⭐⭐⭐⭐⭐ |
| AI Factory        | 18     | 330       | ⭐⭐⭐⭐⭐ |
| OpenAI Provider   | 14     | 250       | ⭐⭐⭐⭐⭐ |
| License Validator | 16     | 300       | ⭐⭐⭐⭐⭐ |
| API Routes        | 22     | 380       | ⭐⭐⭐⭐⭐ |
| **总计**          | **97** | **1,710** | ✅         |

### 覆盖率目标

| 指标       | 目标 | 状态          |
| ---------- | ---- | ------------- |
| Branches   | 80%  | 📊 运行后查看 |
| Functions  | 80%  | 📊 运行后查看 |
| Lines      | 80%  | 📊 运行后查看 |
| Statements | 80%  | 📊 运行后查看 |

---

## 🔧 环境配置

### Jest 配置

- **配置文件**：`jest.config.js`
- **设置文件**：`jest.setup.ts`
- **超时时间**：10 秒（可调整）
- **平台**：Node.js（非浏览器）

### 环境变量（测试时设置）

```typescript
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
```

---

## 📖 文档清单

| 文档                    | 用途         | 位置       |
| ----------------------- | ------------ | ---------- |
| TEST_GUIDE.md           | 详细测试指南 | 项目根目录 |
| TEST_SYSTEM_SUMMARY.md  | 体系总结     | 项目根目录 |
| TEST_FILES_REFERENCE.md | 本文档       | 项目根目录 |
| jest.config.js          | Jest 配置    | 项目根目录 |
| jest.setup.ts           | 全局设置     | 项目根目录 |

---

## 🎯 使用场景

### 开发时

```bash
# 启动监视模式，持续运行测试
npm test -- --watch

# 运行特定模块的测试
npm test -- session.spec.ts

# 在编辑器中查看覆盖率
npm run test:coverage
```

### 提交前

```bash
# 确保所有测试通过
npm test

# 检查覆盖率是否达标
npm run test:coverage
```

### CI/CD 流程

```bash
# 生成 CI 格式的报告
npm run test:ci

# 输出 JSON 格式的覆盖率
npm test -- --coverage --coverage-reporters=json
```

---

## ⚠️ 常见问题

**Q: 测试超时？**  
A: 增加超时时间，在 `jest.config.js` 中修改 `testTimeout`

**Q: Mock 不工作？**  
A: 确保在文件顶部使用 `jest.mock()` 或在测试前设置 Mock

**Q: 无法找到模块？**  
A: 检查 `jest.config.js` 中的路径映射是否正确

**Q: 覆盖率报告为空？**  
A: 运行 `npm test -- --coverage --coverage-reporters=lcov,text`

---

## 📞 快速帮助

- 📖 查看完整指南：`TEST_GUIDE.md`
- 📊 查看体系总结：`TEST_SYSTEM_SUMMARY.md`
- 🚀 快速启动脚本：`run-tests.sh`（Linux/Mac）或 `run-tests.bat`（Windows）
- 🐛 调试测试：`npm run test:debug`

---

**最后更新**：2026年5月  
**作者**：秦晓望  
**版本**：2.1.0  
**覆盖率目标**：80%+
