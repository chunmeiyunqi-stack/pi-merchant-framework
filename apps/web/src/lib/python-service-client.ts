// Stub: Python service client placeholder for Vercel build
// The actual Python quality service runs separately and is optional.
// When the service is available, this module provides typed access to it.

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
  score_distribution: Array<{ score_range: string; count: number }>;
  top_snippets: Array<{
    id: string;
    file_path?: string;
    language: string;
    lines_of_code: number;
    overall_score: string;
  }>;
  by_language: Array<{ language: string; count: number; avg_score: string }>;
}

class PythonServiceClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? process.env.NEXT_PUBLIC_PYTHON_SERVICE_URL ?? 'http://localhost:8000';
  }

  async healthCheck(): Promise<{ longcat_connected: boolean }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`);
      if (!res.ok) throw new Error('Health check failed');
      return res.json();
    } catch {
      return { longcat_connected: false };
    }
  }

  async getStatistics(): Promise<StatisticsData> {
    const res = await fetch(`${this.baseUrl}/api/statistics`);
    if (!res.ok) throw new Error(`Failed to fetch statistics: ${res.status}`);
    return res.json();
  }
}

export const pythonClient = new PythonServiceClient();