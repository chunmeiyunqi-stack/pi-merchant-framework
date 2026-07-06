-- Pioneer Code Quality Analyzer - 数据库建表脚本
-- PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 表1：代码片段 ──────────────────────────────

CREATE TABLE IF NOT EXISTS code_snippets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code            TEXT NOT NULL,
    language        VARCHAR(50) NOT NULL,
    source_type     VARCHAR(20) NOT NULL CHECK (source_type IN ('github', 'upload', 'manual')),
    repo_name       VARCHAR(255),
    file_path       VARCHAR(500),
    github_stars    INTEGER,
    lines_of_code   INTEGER NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  code_snippets            IS '代码片段';
COMMENT ON COLUMN code_snippets.id         IS '主键 UUID';
COMMENT ON COLUMN code_snippets.code       IS '代码内容';
COMMENT ON COLUMN code_snippets.language   IS '编程语言';
COMMENT ON COLUMN code_snippets.source_type IS '来源类型：github/upload/manual';
COMMENT ON COLUMN code_snippets.repo_name  IS 'GitHub仓库名（可选）';
COMMENT ON COLUMN code_snippets.file_path  IS '文件路径（可选）';
COMMENT ON COLUMN code_snippets.github_stars IS '仓库星标数（可选）';
COMMENT ON COLUMN code_snippets.lines_of_code IS '代码行数';
COMMENT ON COLUMN code_snippets.created_at IS '创建时间';

-- ── 表2：质量分析结果 ──────────────────────────

CREATE TABLE IF NOT EXISTS quality_analyses (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snippet_id          UUID NOT NULL REFERENCES code_snippets(id) ON DELETE CASCADE,
    readability_score   DECIMAL(3,2) NOT NULL CHECK (readability_score BETWEEN 0 AND 10),
    performance_score   DECIMAL(3,2) NOT NULL CHECK (performance_score BETWEEN 0 AND 10),
    standard_score      DECIMAL(3,2) NOT NULL CHECK (standard_score BETWEEN 0 AND 10),
    overall_score       DECIMAL(3,2) NOT NULL CHECK (overall_score BETWEEN 0 AND 10),
    suggestions         JSONB NOT NULL DEFAULT '[]',
    strengths           JSONB NOT NULL DEFAULT '[]',
    model_used          VARCHAR(50) NOT NULL,
    analyzed_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  quality_analyses                  IS '质量分析结果';
COMMENT ON COLUMN quality_analyses.id                IS '主键 UUID';
COMMENT ON COLUMN quality_analyses.snippet_id        IS '外键 -> code_snippets.id';
COMMENT ON COLUMN quality_analyses.readability_score IS '可读性评分 0-10';
COMMENT ON COLUMN quality_analyses.performance_score IS '性能评分 0-10';
COMMENT ON COLUMN quality_analyses.standard_score    IS '规范性评分 0-10';
COMMENT ON COLUMN quality_analyses.overall_score     IS '综合评分 0-10';
COMMENT ON COLUMN quality_analyses.suggestions       IS '改进建议数组';
COMMENT ON COLUMN quality_analyses.strengths         IS '优点数组';
COMMENT ON COLUMN quality_analyses.model_used        IS '使用的模型名称';
COMMENT ON COLUMN quality_analyses.analyzed_at       IS '分析时间';

-- ── 表3：批量分析任务 ──────────────────────────

CREATE TABLE IF NOT EXISTS analysis_tasks (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_name         VARCHAR(255) NOT NULL,
    total_count       INTEGER NOT NULL DEFAULT 0,
    completed_count   INTEGER NOT NULL DEFAULT 0,
    failed_count      INTEGER NOT NULL DEFAULT 0,
    status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at      TIMESTAMP
);

COMMENT ON TABLE  analysis_tasks             IS '批量分析任务';
COMMENT ON COLUMN analysis_tasks.id          IS '主键 UUID';
COMMENT ON COLUMN analysis_tasks.task_name   IS '任务名称';
COMMENT ON COLUMN analysis_tasks.total_count IS '总代码数';
COMMENT ON COLUMN analysis_tasks.completed_count IS '已完成数';
COMMENT ON COLUMN analysis_tasks.failed_count IS '失败数';
COMMENT ON COLUMN analysis_tasks.status      IS '状态：pending/running/completed/failed';
COMMENT ON COLUMN analysis_tasks.created_at  IS '创建时间';
COMMENT ON COLUMN analysis_tasks.completed_at IS '完成时间';

-- ── 索引 ─────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_snippets_language      ON code_snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_source_type   ON code_snippets(source_type);
CREATE INDEX IF NOT EXISTS idx_snippets_created_at    ON code_snippets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analyses_snippet_id    ON quality_analyses(snippet_id);
CREATE INDEX IF NOT EXISTS idx_analyses_overall_score ON quality_analyses(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_analyzed_at   ON quality_analyses(analyzed_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_status           ON analysis_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at       ON analysis_tasks(created_at DESC);
