// ── 数据模型 ──────────────────────────────────────

export interface AnalysisFile {
  path: string;
  content: string;
  language?: string;
}

export interface AnalysisScores {
  readability: number;
  performance: number;
  standard: number;
}

export interface AnalysisResult {
  snippet_id: string;
  analysis_id: string | null;
  scores: AnalysisScores;
  overall: number;
  summary?: string;
  suggestions: string[];
  analyzed_at: string | null;
}

export interface StatisticsData {
  totals: {
    snippets: number;
    analyses: number;
    tasks: number;
  };
  avg_scores: {
    avg_readability: string;
    avg_performance: string;
    avg_standard: string;
    avg_overall: string;
  };
  score_distribution: Array<{
    score_range: string;
    count: number;
  }>;
  top_snippets: Array<{
    id: string;
    file_path: string | null;
    language: string;
    lines_of_code: number;
    overall_score: string;
    analyzed_at: string;
  }>;
  by_language: Array<{
    language: string;
    count: number;
    avg_score: string;
  }>;
}

export interface BatchAnalysisResult {
  stats: {
    total: number;
    success: number;
    failed: number;
    elapsed_seconds: number;
    avg_time_per_item: number;
    avg_scores?: Record<string, number>;
  };
  results: AnalysisResult[];
  failures: Array<{ error: string; file_path: string }>;
}

export interface TaskInfo {
  id: string;
  task_name: string;
  total_count: number;
  completed_count: number;
  failed_count: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
}

export interface ExportFormat {
  format: 'json' | 'csv' | 'training';
  language?: string;
  min_score?: number;
  limit?: number;
}

// ── 客户端 ─────────────────────────────────────────

export class PythonServiceClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
  }

  // ── 健康检查 ──

  async healthCheck(): Promise<{ status: string; longcat_connected: boolean }> {
    const res = await this.fetch('/health');
    return res.json();
  }

  // ── 单文件分析 ──

  async analyzeCode(file: AnalysisFile): Promise<AnalysisResult> {
    const res = await this.fetch('/analyze', {
      method: 'POST',
      body: JSON.stringify({
        file: {
          path: file.path,
          content: file.content,
          language: file.language || 'typescript',
        },
      }),
    });
    const data = await res.json();
    return data.data || data;
  }

  // ── 批量分析 ──

  async analyzeBatch(files: AnalysisFile[]): Promise<BatchAnalysisResult> {
    const res = await this.fetch('/batch-analyze', {
      method: 'POST',
      body: JSON.stringify({
        files: files.map((f) => ({
          path: f.path,
          content: f.content,
          language: f.language || 'typescript',
        })),
      }),
    });
    return res.json();
  }

  // ── 数据集分析 ──

  async analyzeDataset(params: {
    language?: string;
    min_lines?: number;
    max_lines?: number;
    limit?: number;
    task_name?: string;
  } = {}): Promise<{ success: boolean; task_id: string }> {
    const query = new URLSearchParams();
    if (params.language) query.set('language', params.language);
    if (params.min_lines !== undefined) query.set('min_lines', String(params.min_lines));
    if (params.max_lines !== undefined) query.set('max_lines', String(params.max_lines));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.task_name) query.set('task_name', params.task_name);

    const res = await this.fetch(`/analyze-dataset?${query.toString()}`, {
      method: 'POST',
    });
    return res.json();
  }

  // ── 统计数据 ──

  async getStatistics(): Promise<StatisticsData> {
    const res = await this.fetch('/statistics');
    const data = await res.json();
    return data;
  }

  // ── 任务查询 ──

  async getTask(taskId: string): Promise<TaskInfo> {
    const res = await this.fetch(`/tasks/${taskId}`);
    return res.json();
  }

  // ── 分析结果查询 ──

  async getAnalysis(snippetId: string): Promise<Record<string, unknown>> {
    const res = await this.fetch(`/analyses/${snippetId}`);
    return res.json();
  }

  // ── 导出 URL 生成 ──

  getExportUrl(format: 'json' | 'csv' | 'training', params?: {
    language?: string;
    min_score?: number;
    limit?: number;
  }): string {
    const url = new URL(`${this.baseUrl}/export/${format}`);
    if (params?.language) url.searchParams.set('language', params.language);
    if (params?.min_score !== undefined) url.searchParams.set('min_score', String(params.min_score));
    if (params?.limit !== undefined) url.searchParams.set('limit', String(params.limit));
    return url.toString();
  }

  getReportUrl(): string {
    return `${this.baseUrl}/export/report`;
  }

  // ── 内部方法 ──

  private async fetch(path: string, options?: RequestInit): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      let detail = `Python service error: ${res.status}`;
      try {
        const err = await res.json();
        detail = err.detail || detail;
      } catch {
        // ignore parse error, use fallback
      }
      throw new Error(detail);
    }

    return res;
  }
}

// ── 单例 ──

export const pythonClient = new PythonServiceClient();

// ── Next.js API 路由辅助函数（用于 Server Side） ──

export async function createPythonServiceClient(config?: {
  serviceUrl?: string;
  fetchImpl?: typeof fetch;
}): Promise<PythonServiceClient> {
  const client = new PythonServiceClient(config?.serviceUrl);
  return client;
}
