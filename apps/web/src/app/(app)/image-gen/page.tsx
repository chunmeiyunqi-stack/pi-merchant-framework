'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────
interface GeneratedImage {
  url: string;
  revisedPrompt: string;
}

interface ModelOption {
  id: string;
  name: string;
  description: string;
}

// DALL-E 3: 全部三种尺寸；DALL-E 2: 仅 1024x1024（实用范围内）
const DALLE3_SIZES = [
  { value: '1024x1024', label: '1:1  正方形', desc: '1024×1024' },
  { value: '1792x1024', label: '16:9  横向', desc: '1792×1024' },
  { value: '1024x1792', label: '9:16  竖向', desc: '1024×1792' },
];
const DALLE2_SIZES = [
  { value: '256x256', label: '小图', desc: '256×256' },
  { value: '512x512', label: '中图', desc: '512×512' },
  { value: '1024x1024', label: '大图', desc: '1024×1024' },
];

const QUALITY_OPTIONS = [
  { value: 'standard', label: '标准质量', desc: '速度更快，成本更低' },
  { value: 'hd', label: '高清质量', desc: '细节更丰富，耗时更长' },
];

const IMAGE_MODELS: ModelOption[] = [
  { id: 'dall-e-3', name: 'DALL-E 3', description: '最新一代，提示词理解更精准' },
  { id: 'dall-e-2', name: 'DALL-E 2', description: '速度较快，支持更多尺寸选择' },
];

const EXAMPLE_PROMPTS = [
  '一座漂浮在云端的东方神殿，金色阳光照射，超写实风格',
  '赛博朋克城市夜景，霓虹灯倒映在雨后的街道，8K超清',
  '简洁的商业 Logo，以圆形为主体，融合科技与自然元素',
  '水墨画风格的山水江南，烟雨朦胧，诗意盎然',
  '未来感十足的 AI 机器人管家，端着茶盘，温暖友善',
];

// ──────────────────────────────────────────
// Component
// ──────────────────────────────────────────
export default function ImageGenPage() {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState('standard');
  const [model, setModel] = useState('dall-e-3');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [charCount, setCharCount] = useState(0);
  // AbortController ref — 取消上一次仍在进行中的请求，防止竞态
  const abortRef = useRef<AbortController | null>(null);

  // 按当前模型选择可用的尺寸列表，切换模型时自动将 size 重置为合法值
  const sizeOptions = model === 'dall-e-3' ? DALLE3_SIZES : DALLE2_SIZES;
  const validSizes = sizeOptions.map((s) => s.value);

  useEffect(() => {
    if (!validSizes.includes(size)) setSize(sizeOptions[0].value);
  }, [model]);

  useEffect(() => {
    setCharCount(prompt.length);
  }, [prompt]);

  // 组件卸载时取消进行中的请求
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    // 取消上一次未完成的请求
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setImages([]);
    setSelectedImage(null);
    setDurationMs(null);

    try {
      const res = await fetch('/api/v1/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), size, quality, model }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 401) throw new Error('请先登录后使用图像生成功能');
        if (res.status === 503)
          throw new Error('图像生成服务暂未配置，请联系管理员设置 OpenAI API Key');
        if (res.status === 429) {
          const isQuota = data.quota != null;
          throw new Error(
            isQuota
              ? `月度 AI 配额已用尽（${data.quota?.used ?? '--'}/${data.quota?.limit ?? '--'} 次），下次重置时间：${data.quota?.resetAt ? new Date(data.quota.resetAt).toLocaleDateString('zh-CN') : '--'}`
              : '请求过于频繁，请稍后再试（速率限制：每分钟 20 次）'
          );
        }
        throw new Error(data.error || '图像生成失败，请重试');
      }

      setImages(data.data?.images || []);
      setDurationMs(data.data?.durationMs || null);
      if (data.data?.images?.[0]) {
        setSelectedImage(data.data.images[0].url);
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, [prompt, size, quality, model]);

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  // 跨域下载：先 fetch 成 blob，再创建临时 URL
  const handleDownload = useCallback(async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // 释放 blob URL，防止内存泄漏
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
    } catch {
      // 跨域 fetch 失败时降级为新窗口打开
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Left Panel — Controls */}
        <div className="lg:col-span-2 space-y-5">
          {/* Prompt Input */}
          <div className="bg-[#150B20] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="prompt-input" className="text-sm font-semibold text-white">
                🖼️ 图像描述
              </label>
              <span
                className={`text-xs font-mono ${charCount > 3500 ? 'text-red-400' : 'text-gray-500'}`}
              >
                {charCount}/4000
              </span>
            </div>
            <textarea
              id="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想要生成的图像，越详细越好…"
              rows={5}
              maxLength={4000}
              className="w-full bg-[#0A0510] border border-white/10 rounded-xl p-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#F3C136]/50 focus:ring-1 focus:ring-[#F3C136]/20 resize-none leading-relaxed"
            />

            {/* Example Prompts */}
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2 font-medium">灵感示例 — 点击填充：</p>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_PROMPTS.map((ex, i) => (
                  <button
                    key={i}
                    id={`example-${i}`}
                    onClick={() => handleExampleClick(ex)}
                    className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 hover:border-[#F3C136]/20 transition-all text-left"
                  >
                    {ex.slice(0, 16)}…
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div className="bg-[#150B20] border border-white/10 rounded-2xl p-5">
            <p className="text-sm font-semibold text-white mb-3">🤖 模型选择</p>
            <div className="space-y-2">
              {IMAGE_MODELS.map((m) => (
                <label
                  key={m.id}
                  htmlFor={`model-${m.id}`}
                  className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    model === m.id
                      ? 'border-[#F3C136]/40 bg-[#F3C136]/5'
                      : 'border-white/5 hover:border-white/15 bg-white/2'
                  }`}
                >
                  <input
                    type="radio"
                    id={`model-${m.id}`}
                    name="model"
                    value={m.id}
                    checked={model === m.id}
                    onChange={() => setModel(m.id)}
                    className="accent-[#F3C136]"
                  />
                  <div>
                    <p
                      className={`text-sm font-semibold ${model === m.id ? 'text-white' : 'text-gray-300'}`}
                    >
                      {m.name}
                    </p>
                    <p className="text-xs text-gray-500">{m.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div className="bg-[#150B20] border border-white/10 rounded-2xl p-5">
            <p className="text-sm font-semibold text-white mb-3">📐 图像尺寸</p>
            <div className="space-y-2">
              {sizeOptions.map((opt) => (
                <label
                  key={opt.value}
                  htmlFor={`size-${opt.value}`}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    size === opt.value
                      ? 'border-[#F3C136]/40 bg-[#F3C136]/5'
                      : 'border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id={`size-${opt.value}`}
                      name="size"
                      value={opt.value}
                      checked={size === opt.value}
                      onChange={() => setSize(opt.value)}
                      className="accent-[#F3C136]"
                    />
                    <span
                      className={`text-sm font-medium ${size === opt.value ? 'text-white' : 'text-gray-300'}`}
                    >
                      {opt.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Quality Selection */}
          <div className="bg-[#150B20] border border-white/10 rounded-2xl p-5">
            <p className="text-sm font-semibold text-white mb-3">✨ 生成质量</p>
            <div className="space-y-2">
              {QUALITY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  htmlFor={`quality-${opt.value}`}
                  className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    quality === opt.value
                      ? 'border-[#F3C136]/40 bg-[#F3C136]/5'
                      : 'border-white/5 hover:border-white/15'
                  }`}
                >
                  <input
                    type="radio"
                    id={`quality-${opt.value}`}
                    name="quality"
                    value={opt.value}
                    checked={quality === opt.value}
                    onChange={() => setQuality(opt.value)}
                    className="accent-[#F3C136]"
                  />
                  <div>
                    <p
                      className={`text-sm font-semibold ${quality === opt.value ? 'text-white' : 'text-gray-300'}`}
                    >
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            id="btn-generate"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full py-4 rounded-2xl font-bold text-[#1E112A] bg-[#F3C136] hover:bg-[#EEA834] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#F3C136]/20 text-base flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>生成中… (最长 30s)</span>
              </>
            ) : (
              <>
                <span>🎨</span>
                <span>立即生成图像</span>
              </>
            )}
          </button>
        </div>

        {/* Right Panel — Preview */}
        <div className="lg:col-span-3">
          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-5">
              <p className="text-red-400 text-sm font-medium flex items-start space-x-2">
                <span>⚠️</span>
                <span>{error}</span>
              </p>
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
          {loading && (
            <div className="bg-[#150B20] border border-white/10 rounded-2xl overflow-hidden">
              <div className="aspect-square flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-[#F3C136]/20 animate-ping" />
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#F3C136]/30 to-[#7C3AED]/30 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center text-3xl">
                      🎨
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-semibold">AI 正在创作中…</p>
                    <p className="text-gray-500 text-sm mt-1">通常需要 5-20 秒</p>
                  </div>
                  <div className="flex justify-center space-x-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-[#F3C136]/50 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty Preview State */}
          {!loading && images.length === 0 && !error && (
            <div className="bg-[#150B20] border border-white/5 rounded-2xl overflow-hidden">
              <div className="aspect-square flex items-center justify-center">
                <div className="text-center p-8 space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center text-4xl">
                    🖼️
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">生成图像预览区</p>
                    <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
                      在左侧输入描述，点击「立即生成图像」，AI 将为你创造独一无二的作品
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-6 opacity-20">
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-xl bg-gradient-to-br from-[#7C3AED]/30 to-[#F3C136]/20"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generated Images */}
          {!loading && images.length > 0 && (
            <div className="space-y-4">
              {/* Main Preview */}
              {selectedImage && (
                <div className="bg-[#150B20] border border-[#F3C136]/20 rounded-2xl overflow-hidden">
                  <img
                    src={selectedImage}
                    alt="Generated"
                    className="w-full object-contain max-h-[500px]"
                  />
                  <div className="p-4 border-t border-white/5 flex items-center justify-between">
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <p className="text-gray-400 font-medium">
                        {model} · {size} · {quality}
                      </p>
                      {durationMs && <p>生成耗时 {(durationMs / 1000).toFixed(1)}s</p>}
                    </div>
                    <div className="flex space-x-2">
                      <a
                        href={selectedImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-semibold bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
                      >
                        新窗口打开
                      </a>
                      <button
                        id="btn-download"
                        onClick={() => handleDownload(selectedImage)}
                        className="px-3 py-1.5 text-xs font-semibold bg-[#F3C136] text-[#1E112A] rounded-lg hover:bg-[#EEA834] transition-colors"
                      >
                        下载图像
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Multiple images thumbnails */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      id={`img-thumb-${i}`}
                      onClick={() => setSelectedImage(img.url)}
                      className={`aspect-square rounded-xl overflow-hidden border transition-all ${
                        selectedImage === img.url
                          ? 'border-[#F3C136] shadow-lg shadow-[#F3C136]/20'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`Generated ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Revised prompt */}
              {images[0]?.revisedPrompt && images[0].revisedPrompt !== prompt.trim() && (
                <div className="bg-[#0F0A1A] border border-white/5 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">
                    AI 优化后的提示词
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed italic">
                    {images[0].revisedPrompt}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex space-x-3">
                <button
                  id="btn-regenerate"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  🔄 重新生成
                </button>
                <Link
                  href="/history"
                  className="flex-1 py-3 rounded-xl font-semibold text-sm bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-[#A78BFA] hover:bg-[#7C3AED]/20 transition-all text-center"
                >
                  📋 查看历史
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
