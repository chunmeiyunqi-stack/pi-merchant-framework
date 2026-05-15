// ============================================================
// Pioneer AI Framework — OpenAI 提供商实现
//
// 继承 BaseAIProvider，适配 OpenAI Chat Completions API
// 支持 GPT-4o / GPT-4o-mini / GPT-3.5-turbo 等模型
// ============================================================

import { BaseAIProvider } from './base';
import type { AIProviderRequest, AIProviderResponse, AIStreamChunk } from './types';

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_TIMEOUT = 30000;

/**
 * OpenAI Chat Completions API 响应结构
 */
interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string | null };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenAI 提供商
 *
 * 继承 BaseAIProvider，仅实现 OpenAI 特有的：
 *   - API Key 可用性检查
 *   - /models 端点健康探针
 *   - Chat Completions 请求构建与响应解析
 */
export class OpenAIProvider extends BaseAIProvider {
  readonly name = 'openai' as const;

  constructor(
    config?: Partial<{ apiKey: string; baseUrl: string; defaultModel: string; timeout: number }>
  ) {
    super({
      apiKey: config?.apiKey ?? process.env.OPENAI_API_KEY ?? '',
      baseUrl: config?.baseUrl ?? process.env.OPENAI_API_BASE ?? DEFAULT_BASE_URL,
      defaultModel: config?.defaultModel ?? DEFAULT_MODEL,
      timeout: config?.timeout ?? DEFAULT_TIMEOUT,
    });
  }

  /**
   * 检查 OpenAI API Key 是否已配置
   */
  isAvailable(): boolean {
    return this.config.apiKey.length > 0;
  }

  /**
   * 健康检查：GET /models 验证 API Key 有效性
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    return this.performHealthCheckRequest(`${this.config.baseUrl}/models`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
    });
  }

  /**
   * 执行 OpenAI Chat Completions API 调用
   */
  protected async executeChat(
    request: AIProviderRequest,
    signal: AbortSignal
  ): Promise<AIProviderResponse> {
    const model = request.model ?? this.config.defaultModel;

    const payload = {
      model,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: request.temperature ?? 0.6,
      max_tokens: request.maxTokens ?? 512,
    };

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      await this.handleHttpError(response, model);
    }

    const data = (await response.json()) as OpenAIChatResponse;
    const content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      this.handleEmptyContent(data, model);
    }

    return {
      content,
      model: data.model,
      provider: 'openai',
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  /**
   * 执行 OpenAI 流式调用
   */
  protected async *executeStream(
    request: AIProviderRequest,
    signal: AbortSignal
  ): AsyncIterable<AIStreamChunk> {
    const model = request.model ?? this.config.defaultModel;

    const payload = {
      model,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: request.temperature ?? 0.6,
      max_tokens: request.maxTokens ?? 512,
      stream: true,
    };

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal, // Used to abort connection if user stops
    });

    if (!response.ok) {
      await this.handleHttpError(response, model);
    }

    if (!response.body) {
      throw new Error('No response body returned from OpenAI');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine.startsWith(':')) continue;

          if (trimmedLine === 'data: [DONE]') {
            yield { content: '', done: true };
            return;
          }

          if (trimmedLine.startsWith('data: ')) {
            const dataStr = trimmedLine.slice(6);
            try {
              const data = JSON.parse(dataStr);
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                yield { content, done: false };
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks just in case, though SSE should emit full JSON per line
              console.warn('OpenAI stream JSON parse error', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
