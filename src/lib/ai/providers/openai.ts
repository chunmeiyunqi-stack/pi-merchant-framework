export type ChatResult = {
  id?: string;
  content: string;
  model?: string;
  estimatedCost?: number;
};

export class OpenAIProvider {
  name = 'openai';
  constructor(private apiKey?: string) {
    this.apiKey = process.env.OPENAI_API_KEY || apiKey;
  }

  async isAvailable() {
    return Boolean(this.apiKey);
  }

  async healthCheck() {
    try {
      if (!this.apiKey) return false;
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      } as any);
      return res.ok;
    } catch (_) {
      return false;
    }
  }

  async chat(prompt: string, opts: any = {}): Promise<ChatResult> {
    if (!this.apiKey) throw new Error('OpenAI API key not configured');
    const controller = new AbortController();
    const timeout = opts.timeout || 5000;
    const id = opts.model || 'gpt-4';
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: opts.model || 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal as any,
      } as any);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || res.statusText || 'OpenAI error');
      }
      const json = await res.json();
      // Normalize response
      const content = json.choices?.[0]?.message?.content || json.choices?.[0]?.text || '';
      return { id: json.id || undefined, content, model: opts.model || id };
    } finally {
      clearTimeout(timer);
    }
  }

  async *generateStream(prompt: string, opts: any = {}) {
    // Simple implementation using fetch body reader
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: opts.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      }),
    } as any);
    if (!res.ok) throw new Error('stream failed');
    const reader = (res.body as any).getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      // naive parse of data: lines like 'data: {...}\n\n'
      const lines = chunk
        .split(/\n/)
        .map((l) => l.replace(/^data:\s*/, '').trim())
        .filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const delta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || '';
          yield { delta, index: 0 };
        } catch (_) {}
      }
    }
  }
}

export default OpenAIProvider;
