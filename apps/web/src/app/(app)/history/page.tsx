'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────
type GenerationType = 'TEXT' | 'IMAGE' | 'VIDEO';

interface HistoryItem {
  id: string;
  type: GenerationType;
  provider: string;
  model: string;
  prompt: string;
  response: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  durationMs: number | null;
  status: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

const TYPE_LABELS: Record<GenerationType, { label: string; color: string; icon: string }> = {
  TEXT: { label: '文本', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: '💬' },
  IMAGE: {
    label: '图像',
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    icon: '🎨',
  },
  VIDEO: { label: '视频', color: 'text-pink-400 bg-pink-400/10 border-pink-400/20', icon: '🎬' },
};

const STATUS_STYLES: Record<string, string> = {
  completed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  failed: 'text-red-400 bg-red-400/10 border-red-400/20',
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  processing: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  queued: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

// ──────────────────────────────────────────
// Component
// ──────────────────────────────────────────
export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<GenerationType | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // 用于取消竞态条件：每次新请求开始时 abort 上一个
  const abortRef = useRef<AbortController | null>(null);

  const fetchHistory = useCallback(async (page: number, type: GenerationType | 'ALL') => {
    // 取消上一个仍在进行中的请求，防止旧结果覆盖新数据
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (type !== 'ALL') params.set('type', type);
      const res = await fetch(`/api/v1/history?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error('请先登录后查看历史记录');
        throw new Error('加载历史记录失败，请稍后重试');
      }
      const data = await res.json();
      setItems(data.data?.items || []);
      setPagination(data.data?.pagination || null);
    } catch (e) {
      // AbortError 是正常的竞态取消，不显示错误
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, []);

  // 组件卸载时取消进行中的请求
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    fetchHistory(currentPage, activeType);
  }, [currentPage, activeType, fetchHistory]);

  const handleTypeChange = (type: GenerationType | 'ALL') => {
    setActiveType(type);
    setCurrentPage(1);
    setExpandedId(null);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '--';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Page Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">我的生成记录</h2>
        <p className="text-gray-400 text-sm">
          查看所有 AI 生成历史，包括文字对话、图像生成和视频创建记录。
        </p>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex items-center space-x-2 mb-6 flex-wrap gap-2">
        {(['ALL', 'TEXT', 'IMAGE', 'VIDEO'] as const).map((t) => (
          <button
            key={t}
            id={`filter-${t.toLowerCase()}`}
            onClick={() => handleTypeChange(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              activeType === t
                ? 'bg-[#F3C136] text-[#1E112A] border-[#F3C136] shadow-lg shadow-[#F3C136]/20'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            {t === 'ALL' ? '全部' : `${TYPE_LABELS[t].icon} ${TYPE_LABELS[t].label}`}
            {pagination && t === 'ALL' && (
              <span className="ml-2 text-xs opacity-70">{pagination.total}</span>
            )}
          </button>
        ))}
        <button
          id="btn-refresh"
          onClick={() => fetchHistory(currentPage, activeType)}
          disabled={loading}
          className="ml-auto px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm disabled:opacity-50"
        >
          {loading ? '加载中…' : '↻ 刷新'}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-6 text-center">
          <p className="text-red-400 font-medium">{error}</p>
          {error.includes('登录') && (
            <Link
              href="/login"
              className="mt-3 inline-block text-[#F3C136] text-sm font-semibold hover:underline"
            >
              前往登录 →
            </Link>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-[#150B20] border border-white/5 rounded-2xl p-5 animate-pulse"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-16 h-5 bg-white/10 rounded-full" />
                <div className="w-20 h-5 bg-white/5 rounded-full" />
              </div>
              <div className="w-3/4 h-4 bg-white/5 rounded mb-2" />
              <div className="w-1/2 h-3 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && items.length === 0 && (
        <div className="text-center py-20 bg-[#150B20] border border-white/5 rounded-2xl">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-bold text-white mb-2">还没有生成记录</h3>
          <p className="text-gray-400 text-sm mb-6">
            {activeType !== 'ALL'
              ? `暂无${TYPE_LABELS[activeType].label}类型的记录`
              : '开始使用 AI 功能，记录将自动保存在这里'}
          </p>
          <div className="flex justify-center space-x-3">
            <Link
              href="/ai"
              className="px-4 py-2 bg-[#F3C136] text-[#1E112A] rounded-xl text-sm font-bold hover:bg-[#EEA834] transition-colors"
            >
              开始 AI 对话
            </Link>
            <Link
              href="/image-gen"
              className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              图像生成
            </Link>
          </div>
        </div>
      )}

      {/* History List */}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => {
            const typeInfo = TYPE_LABELS[item.type] || TYPE_LABELS.TEXT;
            const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.pending;
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className={`bg-[#150B20] border rounded-2xl overflow-hidden transition-all ${
                  isExpanded ? 'border-[#F3C136]/30' : 'border-white/5 hover:border-white/10'
                }`}
              >
                {/* Item Header */}
                <button
                  id={`history-item-${item.id}`}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full p-5 text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeInfo.color}`}
                        >
                          <span>{typeInfo.icon}</span>
                          <span>{typeInfo.label}</span>
                        </span>
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle}`}
                        >
                          {item.status === 'completed'
                            ? '已完成'
                            : item.status === 'failed'
                              ? '失败'
                              : item.status === 'pending'
                                ? '等待中'
                                : item.status}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {item.provider}/{item.model}
                        </span>
                      </div>
                      <p className="text-gray-200 text-sm font-medium truncate pr-4">
                        {item.prompt}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500">{formatTime(item.createdAt)}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {formatDuration(item.durationMs)}
                      </p>
                      <span
                        className={`text-gray-500 transition-transform inline-block mt-1 ${isExpanded ? 'rotate-180' : ''}`}
                      >
                        ▾
                      </span>
                    </div>
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-white/5 p-5 space-y-4">
                    {/* Prompt */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">
                        完整提示词
                      </p>
                      <p className="text-sm text-gray-300 bg-white/5 rounded-xl p-3 leading-relaxed">
                        {item.prompt}
                      </p>
                    </div>

                    {/* Response / Image / Video */}
                    {item.type === 'TEXT' && item.response && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">
                          AI 回复
                        </p>
                        <p className="text-sm text-gray-300 bg-white/5 rounded-xl p-3 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {item.response}
                        </p>
                      </div>
                    )}

                    {item.type === 'IMAGE' && item.imageUrl && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">
                          生成图像
                        </p>
                        <img
                          src={item.imageUrl}
                          alt={item.prompt}
                          className="w-full max-w-sm rounded-xl border border-white/10"
                        />
                      </div>
                    )}

                    {/* Token Usage */}
                    {(item.promptTokens || item.completionTokens) && (
                      <div className="flex items-center space-x-4 text-xs text-gray-500 pt-2 border-t border-white/5">
                        <span>
                          输入:{' '}
                          <span className="text-gray-400">{item.promptTokens ?? '--'} tokens</span>
                        </span>
                        <span>
                          输出:{' '}
                          <span className="text-gray-400">
                            {item.completionTokens ?? '--'} tokens
                          </span>
                        </span>
                        <span>
                          总计:{' '}
                          <span className="text-gray-400">{item.totalTokens ?? '--'} tokens</span>
                        </span>
                        <span className="ml-auto">
                          耗时:{' '}
                          <span className="text-gray-400">{formatDuration(item.durationMs)}</span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <button
            id="btn-prev-page"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || loading}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← 上一页
          </button>
          <span className="text-sm text-gray-500 px-4">
            {currentPage} / {pagination.totalPages}
            <span className="text-gray-600 ml-2">({pagination.total} 条记录)</span>
          </span>
          <button
            id="btn-next-page"
            onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={!pagination.hasMore || loading}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            下一页 →
          </button>
        </div>
      )}
    </div>
  );
}
