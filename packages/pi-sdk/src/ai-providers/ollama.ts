// ============================================================
// Pioneer AI Framework — Ollama 提供商实现
//
// 继承 BaseAIProvider，适配 Ollama 本地推理 API
// 支持 Llama 3.1 / Mistral / Qwen 等开源模型
//
// 关键特点：
//   - 无需 API Key（本地部署）
//   - 默认连接 localhost:11434
//   - 使用 /api/chat 端点（非流式模式）
// ============================================================

import { BaseAIProvider } from './base';
import type { AIProviderRequest, AIProviderResponse, AIStreamChunk } from './types';

const DEFAULT_MODEL = 'llama3.1';
const DEFAULT_BASE_URL = 'http://localhost:11434';
const DEFAULT_TIMEOUT = 60000; // 本地推理可能较慢，给予更长超时

/**
 * Ollama Chat API 响应结构
 */
interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * Ollama 提供商
 *
 * 继承 BaseAIProvider，仅实现 Ollama 特有的：
 *   - 无 API Key 的可用性检查（通过 OLLAMA_ENABLED 控制）
 *   - /api/tags 端点健康探针
 *   - /api/chat 请求构建（stream: false）与响应解析
 */
export class OllamaProvider extends BaseAIProvider {
  readonly name = 'ollama' as const;

  constructor(config?: Partial<{ baseUrl: string; defaultModel: string; timeout: number }>) {
    super({
      apiKey: '', // Ollama 无需 API Key
      baseUrl:
        config?.baseUrl ??
        process.env.OLLAMA_API_BASE ??
        process.env.OLLAMA_BASE_URL ??
        DEFAULT_BASE_URL,
      defaultModel: config?.defaultModel ?? process.env.OLLAMA_MODEL ?? DEFAULT_MODEL,
      timeout: config?.timeout ?? DEFAULT_TIMEOUT,
    });
  }

  /**
   * Ollama 可用性检查
   * 由于无需 API Key，通过 OLLAMA_ENABLED 环境变量控制
   */
  isAvailable(): boolean {
    const enabled = process.env.OLLAMA_ENABLED;
    // 明确禁用时返回 false，否则默认可用（让 healthCheck 做实际验证）
    if (enabled === 'false' || enabled === '0') return false;
    return true;
  }

  /**
   * 健康检查：GET /api/tags 验证 Ollama 服务是否在线
   */
  async healthCheck(): Promise<boolean> {
    return this.performHealthCheckRequest(`${this.config.baseUrl}/api/tags`, {
      method: 'GET',
    });
  }

  /**
   * 执行 Ollama Chat API 调用
   *
   * 与 OpenAI 的 messages 格式类似，但：
   *   - 响应是单个 message 对象（非 choices 数组）
   *   - 使用 stream: false 获取完整响应
   *   - 参数通过 options 对象传递（temperature, num_predict）
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
      stream: false, // 使用非流式模式获取完整响应
      options: {
        temperature: request.temperature ?? 0.6,
        num_predict: request.maxTokens ?? 512,
      },
    };

    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      await this.handleHttpError(response, model);
    }

    const data = (await response.json()) as OllamaChatResponse;
    const content = data?.message?.content?.trim();

    if (!content) {
      this.handleEmptyContent(data, model);
    }

    return {
      content,
      model: data.model,
      provider: 'ollama',
      usage:
        data.prompt_eval_count !== undefined && data.eval_count !== undefined
          ? {
              promptTokens: data.prompt_eval_count,
              completionTokens: data.eval_count,
              totalTokens: data.prompt_eval_count + data.eval_count,
            }
          : undefined,
    };
  }

  /**
   * 执行 Ollama 流式调用
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
      stream: true,
      options: {
        temperature: request.temperature ?? 0.6,
        num_predict: request.maxTokens ?? 512,
      },
    };

    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      await this.handleHttpError(response, model);
    }

    if (!response.body) {
      throw new Error('No response body returned from Ollama');
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
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          try {
            const data = JSON.parse(trimmedLine) as OllamaChatResponse;
            if (data.done) {
              yield { content: '', done: true };
              return;
            }
            if (data.message?.content) {
              yield { content: data.message.content, done: false };
            }
          } catch (e) {
            console.warn('Ollama stream JSON parse error', e);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
