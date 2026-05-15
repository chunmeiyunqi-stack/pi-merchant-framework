// ============================================================
// Pioneer AI Framework — AI 提供商抽象基类
//
// Template Method Pattern: 将通用流程（超时控制、错误包装、
// 结构化日志）固化在基类中，子类仅实现差异化的 API 调用逻辑。
//
// 继承关系：
//   BaseAIProvider (abstract)
//     ├── OpenAIProvider
//     ├── AnthropicProvider
//     └── OllamaProvider
// ============================================================

import type {
  AIProvider,
  AIProviderConfig,
  AIProviderName,
  AIProviderRequest,
  AIProviderResponse,
} from './types';
import { logEvent, logError } from '../logger';

/**
 * AI 提供商抽象基类
 *
 * 封装所有提供商共有的行为：
 *   1. 配置初始化与校验
 *   2. 超时控制（AbortController + setTimeout）
 *   3. HTTP 错误统一处理
 *   4. 结构化日志记录
 *   5. AbortError → 可读超时错误消息转换
 *
 * 子类只需实现以下抽象方法：
 *   - `isAvailable()`：可用性预检查
 *   - `healthCheck()`：服务健康探针
 *   - `executeChat()`：具体 API 调用与响应解析
 */
export abstract class BaseAIProvider implements AIProvider {
  abstract readonly name: AIProviderName;
  protected readonly config: Required<AIProviderConfig>;

  constructor(config: Required<AIProviderConfig>) {
    this.config = config;
  }

  // ── 子类必须实现的抽象方法 ──

  /** 检查提供商是否可用（API Key 存在等） */
  abstract isAvailable(): boolean;

  /** 健康检查：实际探测远程服务 */
  abstract healthCheck(): Promise<boolean>;

  /**
   * 执行具体的 API 调用
   * 由子类实现，包含：
   *   - 请求格式转换（统一格式 → 提供商 API 格式）
   *   - HTTP 请求发送
   *   - 响应解析（提供商 API 格式 → 统一格式）
   *
   * @param request - 统一格式请求
   * @param signal - AbortSignal 用于超时取消
   */
  protected abstract executeChat(
    request: AIProviderRequest,
    signal: AbortSignal
  ): Promise<AIProviderResponse>;

  // ── 基类提供的通用实现 ──

  /**
   * 发送聊天请求（模板方法）
   *
   * 执行流程：
   *   1. 可用性预检查
   *   2. 创建超时控制器
   *   3. 委托子类执行 API 调用 → executeChat()
   *   4. 记录结构化日志
   *   5. 超时 / 网络错误统一处理
   */
  async chat(request: AIProviderRequest): Promise<AIProviderResponse> {
    if (!this.isAvailable()) {
      throw new Error(`${this.getDisplayName()} is not configured or not available`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await this.executeChat(request, controller.signal);

      logEvent(`${this.getDisplayName()} response generated`, {
        provider: this.name,
        model: response.model,
        promptTokens: response.usage?.promptTokens,
        completionTokens: response.usage?.completionTokens,
      });

      return response;
    } catch (error) {
      // 将 AbortError 转换为可读的超时错误
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error(
          `${this.getDisplayName()} request timed out after ${this.config.timeout}ms`
        );
        logError(timeoutError.message, null, { provider: this.name, timeout: this.config.timeout });
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 通用 HTTP 响应错误处理
   * 子类在 executeChat() 中调用
   */
  protected async handleHttpError(
    response: Response,
    model: string
  ): Promise<never> {
    const bodyText = await response.text();
    const errorMsg = `${this.getDisplayName()} API responded with status ${response.status}`;
    logError(errorMsg, bodyText, {
      provider: this.name,
      model,
      status: response.status,
    });
    throw new Error(bodyText || errorMsg);
  }

  /**
   * 通用空内容错误处理
   * 子类在 executeChat() 中调用
   */
  protected handleEmptyContent(data: unknown, model: string): never {
    const errorMsg = `${this.getDisplayName()} API returned no valid response content`;
    logError(errorMsg, data, { provider: this.name, model });
    throw new Error(errorMsg);
  }

  /**
   * 通用健康检查 HTTP 请求
   * 子类可直接使用或覆写
   */
  protected async performHealthCheckRequest(
    url: string,
    options?: RequestInit
  ): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        return response.ok;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch {
      return false;
    }
  }

  /**
   * 获取提供商显示名称（用于日志和错误消息）
   */
  protected getDisplayName(): string {
    const names: Record<AIProviderName, string> = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      ollama: 'Ollama',
    };
    return names[this.name] ?? this.name;
  }
}
