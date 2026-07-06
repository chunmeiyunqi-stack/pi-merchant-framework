<div align="center">
  <h1>Python AI Code Evaluator</h1>
  <p><em>基于 LongCat-2.0 大模型的 TypeScript 代码质量智能评测系统</em></p>
  <p>
    <img src="https://img.shields.io/badge/python-3.10%2B-blue" alt="Python 3.10+" />
    <img src="https://img.shields.io/badge/FastAPI-0.111-009688" alt="FastAPI" />
    <img src="https://img.shields.io/badge/tests-56%20passing-brightgreen" alt="Tests" />
    <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  </p>
</div>

# Python AI Code Evaluator

基于 LongCat-2.0 大模型的 TypeScript 代码质量智能评测系统。自动评估代码的**可读性**、**性能**和**规范性**，支持 GitHub 数据集爬取与多格式训练数据导出，为 AI Coding 模型微调提供高质量数据闭环。

---

## 核心特性

| Icon | 特性 | 说明 |
|------|------|------|
| 🤖 | **AI 驱动评测** | 集成 LongCat-2.0，三维度（可读性/性能/规范性）自动评分，0-10 分量化输出 |
| 🕷️ | **代码爬取** | GitHub API 异步爬取引擎，支持速率限制与断点续传，自动提取代码片段 |
| ⚡ | **高并发批量分析** | 基于 asyncio + Semaphore 的 10 路并发分析引擎，支持后台异步任务管理 |
| 📊 | **多格式导出** | JSON / CSV / JSONL（模型微调）/ Markdown 报告，一键下载 |
| ✅ | **生产级质量** | 56 个自动化测试用例全部通过，Docker 容器化部署，完善的错误处理与重试机制 |
| 📈 | **实时统计面板** | Next.js 前端实时展示平均分、分数分布、Top 代码、语言聚合统计 |

---

## 系统架构

```mermaid
graph TD
    A[Next.js 前端] -->|API 代理 /api/quality/*| B[FastAPI 微服务]
    B -->|调用 LongCat-2.0| C[LongCat-2.0 API]
    B -->|读写 PostgreSQL| D[(PostgreSQL)]
    B -->|爬取 GitHub| E[GitHub API]

    subgraph "Python 服务 (python-service/)"
        B
    end

    subgraph "数据层 (PostgreSQL 15+)"
        D
    end

    subgraph "AI 引擎"
        C
    end

    style A fill:#e2e8f0,stroke:#475569
    style B fill:#dbeafe,stroke:#2563eb
    style C fill:#fef3c7,stroke:#d97706
    style D fill:#dcfce7,stroke:#16a34a
    style E fill:#f3e8ff,stroke:#9333ea
```

### 数据流

```
GitHub 爬取 / 手动上传 / 粘贴代码
        │
        ▼
┌─────────────────┐
│  insert_snippet  │──▶ code_snippets 表
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LongCat API     │──▶ 三维评分（readability / performance / standard）
│  temperature=0.1 │──▶ suggestions + strengths
│  3 次重试+退避   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌────────────────────┐
│  insert_analysis │────▶│  quality_analyses 表│
└────────┬────────┘     └─────────┬──────────┘
         │                        │
         ▼                        ▼
┌──────────────┐        ┌──────────────────┐
│  Calculate    │        │  Export Engine    │
│  Statistics   │        │  JSON/CSV/JSONL   │
│               │        │  Markdown Report  │
└──────────────┘        └──────────────────┘
```

---

## 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| **后端框架** | Python 3.10+ / FastAPI / Uvicorn | RESTful API 微服务 |
| **数据库** | PostgreSQL 15+ / psycopg2 | 代码片段、分析结果、任务持久化 |
| **AI 引擎** | LongCat-2.0 (OpenAI Compatible API) | 代码质量多维评分 |
| **HTTP 客户端** | httpx (async) / tenacity | API 调用 + 指数退避重试 |
| **数据验证** | Pydantic v2 / pydantic-settings | 请求/响应模型 + 环境配置 |
| **前端集成** | Next.js 14 API Routes | 代理转发到 Python 服务 |
| **测试** | pytest / pytest-asyncio | 56 项测试全部通过 |
| **部署** | Docker / Docker Compose | 容器化单命令启动 |

---

## 快速开始

### 前置条件

- Python 3.10+
- PostgreSQL 15+（运行中）
- LongCat API Key（[申请地址](https://longcat.chat)）

### 1. 配置环境变量

```bash
cd python-service
cp .env.example .env
```

编辑 `.env`，填入以下关键配置：

```ini
LONGCAT_API_KEY=sk-your-key-here
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/code_quality
```

> **注意：** 如果本地 PostgreSQL 运行在非默认端口（如 5433），请修改 `DATABASE_URL` 中的端口号。

### 2. 初始化数据库

```bash
# 创建数据库（如果不存在）
psql -U postgres -c "CREATE DATABASE code_quality;"

# 执行建表脚本
psql -U postgres -d code_quality -f schema.sql

# 插入示例数据（可选）
python seed.py
```

### 3. 启动服务

**方式 A — Docker Compose（推荐）：**

```bash
docker compose up -d
# 服务启动在 http://localhost:8000
```

**方式 B — 本地开发模式：**

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 4. 验证服务

```bash
# 健康检查
curl http://localhost:8000/health
# 输出: {"status":"ok","version":"1.0.0","service":"pioneer-quality-analyzer","longcat_connected":false}

# 查看 API 文档
open http://localhost:8000/docs
```

---

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET`    | `/health`            | 健康检查 + LongCat 连通状态 |
| `POST`   | `/analyze`           | 单文件代码质量分析 |
| `POST`   | `/batch-analyze`     | 批量分析（最多 50 个文件，10 路并发） |
| `POST`   | `/analyze-dataset`   | 从数据库读取未分析数据，后台批量跑 |
| `GET`    | `/statistics`        | 全量统计（平均分、分布、Top、语言聚合） |
| `GET`    | `/tasks/{id}`        | 查询批量分析任务状态 |
| `GET`    | `/analyses/{id}`     | 查询指定代码片段的分析详情 |
| `GET`    | `/export/json`       | 导出 JSON 格式结果 |
| `GET`    | `/export/csv`        | 导出 CSV 格式结果（UTF-8-BOM，Excel 兼容） |
| `GET`    | `/export/training`   | 导出 JSONL 训练数据（模型微调格式） |
| `GET`    | `/export/report`     | 导出 Markdown 格式分析报告 |

所有 API 均支持 `language`、`min_score`、`limit` 过滤参数。

---

## 项目结构

```
python-service/
├── app/
│   ├── main.py              # FastAPI 入口，CORS 中间件，路由注册
│   ├── config.py            # pydantic-settings 环境变量管理
│   ├── models.py            # Pydantic 数据模型（请求/响应）
│   ├── routers/
│   │   ├── health.py        # GET  /health
│   │   ├── analyze.py       # POST /analyze, /batch-analyze, /analyze-dataset
│   │   └── export.py        # GET  /export/json, /csv, /training, /report
│   ├── services/
│   │   ├── longcat.py       # LongCat API 集成（httpx + tenacity 重试）
│   │   ├── analyzer.py      # CodeAnalyzer 批量和后台分析引擎
│   │   └── exporter.py      # DataExporter 多格式导出引擎
│   └── utils/
│       └── db.py            # PostgreSQL CRUD（3 表 + 索引 + 9 个函数）
├── tests/
│   ├── conftest.py          # pytest fixtures（数据库/样本数据/服务器）
│   ├── test_db.py           # 19 个数据库 CRUD 测试
│   ├── test_exporter.py     # 17 个导出格式测试
│   └── test_api.py          # 20 个 API 端点测试
├── schema.sql               # 独立 DDL 建表脚本（含注释）
├── seed.py                  # 示例数据插入脚本
├── Dockerfile               # 多阶段构建（~130MB）
├── docker-compose.yml       # 服务编排（含可选 PostgreSQL）
├── pyproject.toml           # pytest 配置
├── requirements.txt         # Python 依赖
├── .env.example             # 环境变量模板
├── .gitignore               # 安全过滤规则
└── README.md
```

---

## 训练数据导出

JSONL 格式与主流 LLM fine-tuning 框架兼容：

```jsonl
{"input": "const greet = (name: string): string => `Hello, ${name}!`;",
 "output": "代码质量评分：\n- 可读性：8.5/10\n- 性能：7.0/10\n- 规范性：9.0/10\n- 综合：8.17/10\n\n优点：Clear function signature\n改进建议：Add type annotations"}
```

可直接用于 OpenAI / Llama / Qwen 等模型的 Supervised Fine-Tuning。

---

## 测试

```bash
cd python-service
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/code_quality python -m pytest -v
```

预期输出：

```
collected 56 items
tests/test_api.py ....................   [ 35%]
tests/test_db.py ...................    [ 69%]
tests/test_exporter.py ................. [100%]
============================= 56 passed in 8.22s ==============================
```

---

## 外部集成（Next.js 前端）

```typescript
import { pythonClient } from '@/lib/python-service-client';

// 获取统计
const stats = await pythonClient.getStatistics();
console.log(stats.avg_scores.avg_overall);

// 分析代码
const result = await pythonClient.analyzeCode({
  path: 'src/example.ts',
  content: codeString,
  language: 'typescript',
});
console.log(result.scores);

// 导出 URL
const url = pythonClient.getExportUrl('training', { limit: 1000 });
```

---

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `LONGCAT_API_KEY` | 是 | — | LongCat API 密钥 |
| `LONGCAT_BASE_URL` | 否 | `https://api.longcat.chat/v1` | API 基础地址 |
| `LONGCAT_MODEL` | 否 | `LongCat-2.0` | 模型名称 |
| `DATABASE_URL` | 是 | — | PostgreSQL 连接串 |
| `SERVICE_HOST` | 否 | `0.0.0.0` | 监听地址 |
| `SERVICE_PORT` | 否 | `8000` | 监听端口 |

---

## 许可证

MIT License © 2024 Yunqi Tech
