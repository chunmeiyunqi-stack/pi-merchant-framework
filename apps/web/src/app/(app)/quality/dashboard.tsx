'use client';

import { useEffect, useState } from 'react';
import { pythonClient, StatisticsData } from '@/lib/python-service-client';

export function CodeQualityDashboard() {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await pythonClient.getStatistics();
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load statistics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading)
    return <div className="p-8 text-center text-gray-500">Loading quality statistics...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!stats) return null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Code Quality Dashboard</h1>

      {/* 健康检查 */}
      <PythonServiceStatus />

      {/* 统计概览 */}
      <OverviewCards stats={stats} />

      {/* 平均分对比 */}
      <ScoreComparison stats={stats} />

      {/* 分数分布 */}
      <ScoreDistribution distribution={stats.score_distribution} total={stats.totals.analyses} />

      {/* Top 代码片段 */}
      <TopSnippets snippets={stats.top_snippets} />

      {/* 按语言统计 */}
      <ByLanguageStats data={stats.by_language} />

      {/* 导出按钮 */}
      <ExportSection />
    </div>
  );
}

function PythonServiceStatus() {
  const [status, setStatus] = useState<string>('checking...');

  useEffect(() => {
    pythonClient
      .healthCheck()
      .then((r) =>
        setStatus(r.longcat_connected ? 'Connected (LongCat ready)' : 'Connected (no API key)')
      )
      .catch(() => setStatus('Unreachable'));
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2">
      <span
        className={`inline-block w-2 h-2 rounded-full ${status.startsWith('Connected') ? 'bg-green-500' : 'bg-red-500'}`}
      />
      Python Service: {status}
    </div>
  );
}

function OverviewCards({ stats }: { stats: StatisticsData }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card label="Snippets" value={stats.totals.snippets} />
      <Card label="Analyses" value={stats.totals.analyses} />
      <Card label="Tasks" value={stats.totals.tasks} />
      <Card label="Overall Avg" value={parseFloat(stats.avg_scores.avg_overall).toFixed(2)} />
    </div>
  );
}

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function ScoreComparison({ stats }: { stats: StatisticsData }) {
  const scores = [
    { label: 'Readability', value: parseFloat(stats.avg_scores.avg_readability) },
    { label: 'Performance', value: parseFloat(stats.avg_scores.avg_performance) },
    { label: 'Standard', value: parseFloat(stats.avg_scores.avg_standard) },
    { label: 'Overall', value: parseFloat(stats.avg_scores.avg_overall) },
  ];

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Average Scores</h2>
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        {scores.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-24 text-sm text-gray-600">{s.label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(s.value / 10) * 100}%`,
                  backgroundColor: s.value >= 7 ? '#22c55e' : s.value >= 5 ? '#eab308' : '#ef4444',
                }}
              />
            </div>
            <span className="text-sm font-mono w-10 text-right">{s.value.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScoreDistribution({
  distribution,
  total,
}: {
  distribution: StatisticsData['score_distribution'];
  total: number;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Score Distribution</h2>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Range</th>
              <th className="pb-2">Count</th>
              <th className="pb-2">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {distribution.map((d) => (
              <tr key={d.score_range} className="border-b border-gray-100 last:border-0">
                <td className="py-2 font-medium">{d.score_range}</td>
                <td className="py-2">{d.count}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[200px]">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${(d.count / Math.max(total, 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">
                      {total > 0 ? ((d.count / total) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TopSnippets({ snippets }: { snippets: StatisticsData['top_snippets'] }) {
  if (!snippets.length) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Top Snippets</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 bg-gray-50 border-b">
              <th className="p-3">File</th>
              <th className="p-3">Language</th>
              <th className="p-3">Lines</th>
              <th className="p-3">Score</th>
            </tr>
          </thead>
          <tbody>
            {snippets.map((s) => (
              <tr key={s.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="p-3 font-mono text-xs">{s.file_path || s.id.slice(0, 8)}</td>
                <td className="p-3">{s.language}</td>
                <td className="p-3">{s.lines_of_code}</td>
                <td className="p-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      parseFloat(s.overall_score) >= 7
                        ? 'bg-green-100 text-green-800'
                        : parseFloat(s.overall_score) >= 5
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {s.overall_score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ByLanguageStats({ data }: { data: StatisticsData['by_language'] }) {
  if (!data.length) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">By Language</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map((d) => (
          <div
            key={d.language}
            className="bg-white rounded-xl border border-gray-200 p-4 flex justify-between items-center"
          >
            <div>
              <div className="font-medium">{d.language}</div>
              <div className="text-xs text-gray-500">{d.count} analyses</div>
            </div>
            <div className="text-lg font-bold">{d.avg_score}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExportSection() {
  const baseUrl = process.env.NEXT_PUBLIC_PYTHON_SERVICE_URL || 'http://localhost:8000';

  const formats: Array<{ label: string; format: 'json' | 'csv' | 'training' }> = [
    { label: 'Export JSON', format: 'json' },
    { label: 'Export CSV', format: 'csv' },
    { label: 'Export Training Data', format: 'training' },
  ];

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Export</h2>
      <div className="flex flex-wrap gap-3">
        {formats.map((f) => (
          <a
            key={f.format}
            href={`/api/quality/export/${f.format}?limit=100`}
            className="inline-block px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
          >
            {f.label}
          </a>
        ))}
        <a
          href={`/api/quality/export/report`}
          className="inline-block px-4 py-2 bg-white text-gray-900 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          View Report
        </a>
      </div>
    </section>
  );
}
