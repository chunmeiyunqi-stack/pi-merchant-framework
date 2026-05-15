// ============================================================
// Pioneer AI Framework — Anthropic 提供商实现
//
// 继承 BaseAIProvider，适配 Anthropic Messages API
// 支持 Claude 3.5 Sonnet / Claude 3 Opus / Claude 3 Haiku
//
// 关键差异点（由本类处理）：
//   - system 消息作为顶层参数，而非 messages 数组的一部分
//   - 响应格式为 content[].text，非 choices[].message.content
//   - 认证头使用 x-api-key，非 Bearer token
// ============================================================

import type {
  AIProviderRequest,
  AIProviderResponse,
} from './types';
import { BaseAIProvider } from './base';

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_BASE_URL = 'https://api.anthropic.com';
const DEFAULT_TIMEOUT = 30000;
const ANTHROPIC_VERSION = '2023-06-01';

/**
 * Anthropic Messages API 响应结构
 */
interface AnthropicMessagesResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  model: string;
  content: Array<{
    type: 'text';
    text: string;
  }>;
  stop_reason: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Anthropic 提供商
 *
 * 继承 BaseAIProvider，仅实现 Anthropic 特有的：
 *   - API Key 可用性检查
 *   - system 消息提取到顶层参数
 *   - x-api-key 认证头
 *   - content[0].text 响应解析
 */
export class AnthropicProvider extends BaseAIProvider {
  readonly name = 'anthropic' as const;

  constructor(config?: Partial<{ apiKey: string; baseUrl: string; defaultModel: string; timeout: number }>) {
    super({
      apiKey: config?.apiKey ?? process.env.ANTHROPIC_API_KEY ?? '',
      baseUrl: config?.baseUrl ?? process.env.ANTHROPIC_API_BASE ?? DEFAULT_BASE_URL,
      defaultModel: config?.defaultModel ?? DEFAULT_MODEL,
      timeout: config?.timeout ?? DEFAULT_TIMEOUT,
    });
  }

  /**
   * 检查 Anthropic API Key 是否已配置
   */
  isAvailable(): boolean {
    return this.config.apiKey.length > 0;
  }

  /**
   * 健康检查：发送最小化 Messages 请求验证 API Key
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    return this.performHealthCheckRequest(`${this.config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: this.config.defaultModel,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      }),
    });
  }

  /**
   * 执行 Anthropic Messages API 调用
   *
   * 格式转换要点：
   *   1. 从 messages 中提取 system 消息 → 顶层 system 参数
   *   2. 过滤 messages，仅保留 user / assistant 角色
   *   3. 响应从 content[0].text 提取
   */
  protected async executeChat(
    request: AIProviderRequest,
    signal: AbortSignal
  ): Promise<AIProviderResponse> {
    const model = request.model ?? this.config.defaultModel;

    // 提取 system 消息（Anthropic 要求 system 在顶层，不在 messages 中）
    const systemMessage = request.messages.find((m) => m.role === 'system');
    const chatMessages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const payload: Record<string, unknown> = {
      model,
      max_tokens: request.maxTokens ?? 512,
      messages: chatMessages,
    };

    // 仅在存在 system 消息时添加顶层 system 参数
    if (systemMessage) {
      payload.system = systemMessage.content;
    }

    if (request.temperature !== undefined) {
      payload.temperature = request.temperature;
    }

    const response = await fetch(`${this.config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      await this.handleHttpError(response, model);
    }

    const data = (await response.json()) as AnthropicMessagesResponse;
    const content = data?.content?.[0]?.text?.trim();

    if (!content) {
      this.handleEmptyContent(data, model);
    }

    return {
      content,
      model: data.model,
      provider: 'anthropic',
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
    };
  }
}
