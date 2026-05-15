'use client';

import { useState } from 'react';
import { useChatStream } from '@/hooks/useChatStream';

export default function StreamDemoPage() {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<string>(''); // empty means fallback/primary
  const { messages, isLoading, error, appendMessage, stopGeneration } = useChatStream({
    provider: provider || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    appendMessage(prompt);
    setPrompt('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">AI Stream Routing Demo (Phase 2.2)</h1>
        <p className="text-gray-500 mt-2">
          Test real-time token streaming with automatic fallback and AbortController support.
        </p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden h-[500px] flex flex-col">
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">No messages yet. Send a prompt to start streaming.</div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white border text-gray-800 shadow-sm rounded-bl-none'
                  }`}
                >
                  {msg.content || (isLoading && msg.role === 'assistant' ? '...' : '')}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Controls */}
        <div className="p-4 bg-white border-t space-y-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <label className="flex items-center space-x-2">
              <span className="font-medium">Provider Override:</span>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="border rounded p-1"
                disabled={isLoading}
              >
                <option value="">Auto (Use Primary/Fallback)</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="ollama">Ollama</option>
                <option value="invalid_provider">Force Invalid (Test Error)</option>
              </select>
            </label>
            
            {error && (
              <span className="text-red-500 bg-red-50 px-2 py-1 rounded">
                Error occurred
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            {isLoading ? (
              <button
                type="button"
                onClick={stopGeneration}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Send
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
