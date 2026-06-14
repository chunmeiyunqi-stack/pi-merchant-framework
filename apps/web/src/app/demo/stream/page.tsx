'use client';

import { useState } from 'react';
import { useChatStream } from '@/hooks/useChatStream';

export default function StreamDemoPage() {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<string>('');
  const {
    messages,
    isLoading,
    error: _error,
    appendMessage,
    stopGeneration,
  } = useChatStream({
    provider: provider || undefined,
  });

  const suggestions = [
    '帮我分析一下商铺上个月的营收数据',
    '如何集成 Pi 支付 SDK 到我的应用？',
    '设置多租户隔离的最佳实践是什么？',
    '解释一下先锋 AI 的容错路由算法',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    appendMessage(prompt);
    setPrompt('');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
        {/* Branded Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-600 flex items-center justify-center text-black font-black">
                PA
              </div>
              <h1 className="text-3xl font-black tracking-tighter">先锋人工智能服务框架</h1>
            </div>
            <p className="text-neutral-500 font-medium">V2.0.0 智能感知对话终端 · 实时流式响应</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest border border-green-500/20 flex items-center gap-1.5">
              <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
              SDK 核心集群在线
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar / Config */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-2xl bg-neutral-900/50 border border-white/5">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
                路由引擎配置
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-neutral-500 font-bold">优先服务商</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-neutral-800 border-none rounded-lg text-xs py-2 px-3 focus:ring-1 focus:ring-amber-500"
                    disabled={isLoading}
                  >
                    <option value="">自动 (智能降级)</option>
                    <option value="openai">OpenAI (GPT-4o)</option>
                    <option value="anthropic">Anthropic (Claude 3.5)</option>
                    <option value="ollama">Ollama (本地私有化)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">
                架构状态
              </h3>
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                当前运行在多租户安全沙箱中。所有数据经由 Pi Network OAuth2.0 强鉴权保护。
              </p>
            </div>
          </div>

          {/* Chat Main Area */}
          <div className="lg:col-span-3">
            <div className="bg-neutral-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden flex flex-col h-[650px] shadow-2xl relative">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-12">
                    <div className="w-20 h-20 rounded-3xl bg-neutral-800 flex items-center justify-center text-4xl animate-bounce">
                      ✨
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold">你好，我是先锋 AI 助手</h2>
                      <p className="text-neutral-500 text-sm max-w-sm">
                        我可以帮你搭建生态应用、处理订单数据或解答任何关于 V2.0 框架的技术疑问。
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => appendMessage(s)}
                          className="text-left p-4 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/30 hover:bg-white/10 transition-all text-xs text-neutral-400 hover:text-white"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}
                      >
                        <div
                          className={`max-w-[85%] rounded-[1.5rem] px-5 py-3.5 text-sm leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white font-medium rounded-tr-none'
                              : 'bg-white/5 border border-white/10 text-neutral-200 rounded-tl-none'
                          }`}
                        >
                          {msg.content}
                          {isLoading &&
                            msg.role === 'assistant' &&
                            msg === messages[messages.length - 1] && (
                              <span className="inline-block w-1 h-4 bg-amber-500 ml-1 animate-pulse align-middle" />
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-6 bg-neutral-900/80 border-t border-white/5">
                <form onSubmit={handleSubmit} className="relative">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="输入指令以启动神经网络..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-6 pr-32 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-neutral-700"
                    disabled={isLoading}
                  />
                  <div className="absolute right-2 top-2 bottom-2 flex gap-2">
                    {isLoading ? (
                      <button
                        type="button"
                        onClick={stopGeneration}
                        className="bg-red-500/10 text-red-500 hover:bg-red-500 px-4 rounded-xl text-xs font-bold transition-all border border-red-500/20"
                      >
                        停止
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!prompt.trim()}
                        className="bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-800 text-black px-6 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
                      >
                        发送
                      </button>
                    )}
                  </div>
                </form>
                <div className="mt-4 flex justify-between items-center text-[10px] text-neutral-600 font-medium px-2">
                  <span>多模态内核: GPT-4o-mini / Claude-3.5-Sonnet</span>
                  <span>先锋 AI 端到端加密处理已开启</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
