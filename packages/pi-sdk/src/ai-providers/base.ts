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
  AIStreamChunk,
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

  /**
   * 执行具体的流式 API 调用
   * 由子类实现，生成流式事件
   *
   * @param request - 统一格式请求
   * @param signal - AbortSignal 用于超时和用户取消
   */
  protected abstract executeStream(
    request: AIProviderRequest,
    signal: AbortSignal
  ): AsyncIterable<AIStreamChunk>;

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
   * 发送流式请求（模板方法）
   *
   * 与 chat 不同，流式请求只对"初始连接"进行超时控制，
   * 建立连接后由底层控制，如果客户端中断则通过 signal 传递。
   */
  async *generateStream(request: AIProviderRequest): AsyncIterable<AIStreamChunk> {
    if (!this.isAvailable()) {
      throw new Error(`${this.getDisplayName()} is not configured or not available`);
    }

    const controller = new AbortController();
    // 首次连接超时，假设设为固定的 10s 或配置的超时，这里我们不清除timeout，
    // 因为 stream 生命周期较长，但如果是整个请求的超时就会强行断开。
    // 为了支持更长的 stream 生成，建议不设置硬性的整体超时，只依赖前端 abort，
    // 但为了防止死连接，可以设置一个较长的兜底超时或者取消超时。
    // 在这里我们仅将 signal 传给底层，由底层在 fetch 建立时抛出错误，
    // 且一旦 stream 开始 yielding，底层不会抛出 fallback，而是按错误结束 stream。

    // 为了安全起见，我们不在基类为整个流式周期加固定定时器，而是依赖客户端 AbortSignal（路由层会传入）
    // 或者仅处理底层的 initial connection timeout.
    // 简单起见，我们仅传递 controller.signal 给 executeStream。
    // 注意：这里的 catch 可以捕获建立流之前的错误（即 fallback 所需的错误）。

    try {
      // 记录流开始
      logEvent(`${this.getDisplayName()} stream started`, {
        provider: this.name,
        model: request.model ?? this.config.defaultModel,
      });

      yield* this.executeStream(request, controller.signal);

      // 记录流结束
      logEvent(`${this.getDisplayName()} stream completed`, {
        provider: this.name,
        model: request.model ?? this.config.defaultModel,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error(
          `${this.getDisplayName()} stream request timed out or was aborted`
        );
        logError(timeoutError.message, null, { provider: this.name });
        throw timeoutError;
      }
      throw error;
    }
  }

  /**
   * 通用 HTTP 响应错误处理
   * 子类在 executeChat() 中调用
   */
  protected async handleHttpError(response: Response, model: string): Promise<never> {
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
  protected async performHealthCheckRequest(url: string, options?: RequestInit): Promise<boolean> {
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
