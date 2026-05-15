// ============================================================
// Pioneer AI Framework — AI 提供商工厂路由器
//
// Factory Pattern: 动态创建和选择 AI 提供商
// 核心功能：
//   1. 根据 AI_PRIMARY_PROVIDER 环境变量选择默认提供商
//   2. 支持请求级别指定提供商
//   3. 主提供商失败时自动 Fallback 到备选提供商
//   4. 全链路日志追踪路由决策
// ============================================================

import type {
  AIProvider,
  AIProviderName,
  AIProviderRequest,
  AIProviderResponse,
  AIStreamChunk,
  RoutingDecision,
} from './types';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { OllamaProvider } from './ollama';
import { logEvent, logError, logWarn } from '../logger';

/**
 * AI 提供商工厂路由器
 *
 * 职责：
 * - 管理所有已注册的 AI 提供商实例
 * - 根据配置和请求参数选择合适的提供商
 * - 在主提供商失败时自动切换到备选提供商
 * - 记录所有路由决策和容错事件
 */
export class AIProviderFactory {
  private providers: Map<AIProviderName, AIProvider> = new Map();
  private primaryProvider: AIProviderName;
  private fallbackOrder: AIProviderName[];

  constructor() {
    // 读取环境变量配置
    this.primaryProvider = this.parsePrimaryProvider();
    this.fallbackOrder = this.parseFallbackOrder();

    // 注册所有提供商
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new AnthropicProvider());
    this.registerProvider(new OllamaProvider());

    logEvent('AIProviderFactory initialized', {
      primary: this.primaryProvider,
      fallbackOrder: this.fallbackOrder,
      available: this.getAvailableProviders().map((p) => p.name),
    });
  }

  /**
   * 注册一个 AI 提供商
   */
  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * 获取所有已注册的提供商
   */
  getRegisteredProviders(): AIProviderName[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 获取所有可用的提供商（isAvailable() === true）
   */
  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.isAvailable());
  }

  /**
   * 获取指定名称的提供商
   */
  getProvider(name: AIProviderName): AIProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * 获取当前主提供商名称
   */
  getPrimaryProviderName(): AIProviderName {
    return this.primaryProvider;
  }

  /**
   * 路由请求到合适的提供商（含自动容错）
   *
   * 路由策略：
   *   1. 如果 request 指定了 provider → 优先使用（不 fallback）
   *   2. 否则使用 AI_PRIMARY_PROVIDER 指定的提供商
   *   3. 主提供商失败 → 按 AI_FALLBACK_PROVIDERS 顺序尝试备选
   *   4. 所有提供商都失败 → 抛出最后一个错误
   *
   * @param request - 统一格式的 AI 请求
   * @param requestedProvider - 请求级别指定的提供商（可选）
   * @returns 统一格式的 AI 响应
   */
  async route(
    request: AIProviderRequest,
    requestedProvider?: AIProviderName
  ): Promise<AIProviderResponse & { routing: RoutingDecision }> {
    const routeStart = Date.now();
    const skipped: Array<{ provider: AIProviderName; reason: string }> = [];

    // ── 场景 1: 请求指定了提供商 → 直连，不 fallback ──
    if (requestedProvider) {
      const provider = this.providers.get(requestedProvider);
      if (!provider) {
        throw new Error(`Unknown AI provider: ${requestedProvider}`);
      }
      if (!provider.isAvailable()) {
        throw new Error(
          `AI provider '${requestedProvider}' is not available (missing API key or disabled)`
        );
      }

      const response = await provider.chat(request);
      const routing: RoutingDecision = {
        requested: requestedProvider,
        actual: requestedProvider,
        fallback: false,
        routingTimeMs: Date.now() - routeStart,
      };

      logEvent('AI request routed (direct)', {
        provider: requestedProvider,
        model: response.model,
        routingTimeMs: routing.routingTimeMs,
      });

      return { ...response, routing };
    }

    // ── 场景 2: 使用主提供商 + fallback 链 ──
    const providersToTry: AIProviderName[] = [
      this.primaryProvider,
      ...this.fallbackOrder.filter((name) => name !== this.primaryProvider),
    ];

    let lastError: Error | null = null;

    for (const providerName of providersToTry) {
      const provider = this.providers.get(providerName);

      // 跳过未注册的提供商
      if (!provider) {
        skipped.push({ provider: providerName, reason: 'not registered' });
        continue;
      }

      // 跳过不可用的提供商
      if (!provider.isAvailable()) {
        skipped.push({ provider: providerName, reason: 'not available' });
        continue;
      }

      try {
        const response = await provider.chat(request);
        const isFallback = providerName !== this.primaryProvider;

        const routing: RoutingDecision = {
          actual: providerName,
          fallback: isFallback,
          skipped: skipped.length > 0 ? skipped : undefined,
          routingTimeMs: Date.now() - routeStart,
        };

        if (isFallback) {
          logWarn('AI request routed via fallback', {
            primary: this.primaryProvider,
            actual: providerName,
            skipped,
            routingTimeMs: routing.routingTimeMs,
          });
        } else {
          logEvent('AI request routed (primary)', {
            provider: providerName,
            model: response.model,
            routingTimeMs: routing.routingTimeMs,
          });
        }

        return { ...response, routing };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        skipped.push({ provider: providerName, reason: errorMessage });
        lastError = error instanceof Error ? error : new Error(errorMessage);

        logWarn(`AI provider '${providerName}' failed, trying next...`, {
          provider: providerName,
          error: errorMessage,
          remainingProviders: providersToTry.slice(providersToTry.indexOf(providerName) + 1),
        });
      }
    }

    // 所有提供商都失败
    const routingTimeMs = Date.now() - routeStart;
    logError('All AI providers failed', lastError, {
      attemptedProviders: providersToTry,
      skipped,
      routingTimeMs,
    });

    throw new Error(
      `All AI providers failed. Last error: ${lastError?.message ?? 'Unknown'}. ` +
        `Attempted: ${providersToTry.join(', ')}. ` +
        `Skipped: ${skipped.map((s) => `${s.provider}(${s.reason})`).join(', ')}`
    );
  }

  /**
   * 路由流式请求到合适的提供商（含首次连接自动容错）
   *
   * 容错边界（关键限制）：
   *   - Fallback 仅在建立连接、首个 Token 接收前触发。
   *   - 一旦开始推送数据（首个 chunk 成功 yield），将锁定提供商，中断时直接抛出错误，不再降级。
   *
   * @param request - 统一格式的 AI 请求
   * @param requestedProvider - 请求级别指定的提供商（可选）
   * @returns 异步流式数据块迭代器，附带 routing 决策信息（在首个 chunk 前无法获取，故仅记录日志）
   */
  async *routeStream(
    request: AIProviderRequest,
    requestedProvider?: AIProviderName
  ): AsyncIterable<AIStreamChunk> {
    const routeStart = Date.now();
    const skipped: Array<{ provider: AIProviderName; reason: string }> = [];

    // ── 场景 1: 请求指定了提供商 → 直连，不 fallback ──
    if (requestedProvider) {
      const provider = this.providers.get(requestedProvider);
      if (!provider) {
        throw new Error(`Unknown AI provider: ${requestedProvider}`);
      }
      if (!provider.isAvailable()) {
        throw new Error(`AI provider '${requestedProvider}' is not available`);
      }
      logEvent('AI stream routed (direct)', { provider: requestedProvider });
      yield* provider.generateStream(request);
      return;
    }

    // ── 场景 2: 使用主提供商 + fallback 链 ──
    const providersToTry: AIProviderName[] = [
      this.primaryProvider,
      ...this.fallbackOrder.filter((name) => name !== this.primaryProvider),
    ];

    let lastError: Error | null = null;

    for (const providerName of providersToTry) {
      const provider = this.providers.get(providerName);
      if (!provider || !provider.isAvailable()) {
        skipped.push({
          provider: providerName,
          reason: !provider ? 'not registered' : 'not available',
        });
        continue;
      }

      const isFallback = providerName !== this.primaryProvider;
      let streamStarted = false;
      let iterator: AsyncIterator<AIStreamChunk> | null = null;

      try {
        const stream = provider.generateStream(request);
        iterator = stream[Symbol.asyncIterator]();

        // 尝试获取首个 chunk
        const firstResult = await iterator.next();

        // 如果成功获取首个 chunk，说明连接已建立，锁定当前提供商
        streamStarted = true;

        if (isFallback) {
          logWarn('AI stream routed via fallback', {
            primary: this.primaryProvider,
            actual: providerName,
            skipped,
            routingTimeMs: Date.now() - routeStart,
          });
        } else {
          logEvent('AI stream routed (primary)', {
            provider: providerName,
            routingTimeMs: Date.now() - routeStart,
          });
        }

        if (!firstResult.done) {
          yield firstResult.value;
        } else {
          // Stream immediately finished?
          return;
        }

        // 继续 yield 剩余的 chunks
        while (true) {
          const result = await iterator.next();
          if (result.done) break;
          yield result.value;
        }

        // 成功完成，直接退出
        return;
      } catch (error) {
        if (streamStarted) {
          // 如果流已经开始，禁止 fallback，直接抛出错误
          logError(`AI stream interrupted for ${providerName}`, error, { provider: providerName });
          throw error;
        }

        // 流尚未开始（连接失败或超时），允许 fallback
        const errorMessage = error instanceof Error ? error.message : String(error);
        skipped.push({ provider: providerName, reason: errorMessage });
        lastError = error instanceof Error ? error : new Error(errorMessage);

        logWarn(`AI provider '${providerName}' stream failed, trying next...`, {
          provider: providerName,
          error: errorMessage,
        });
      } finally {
        if (iterator && typeof iterator.return === 'function' && !streamStarted) {
          // If we failed before starting or we are falling back, close the iterator to release resources
          iterator.return().catch(() => {});
        }
      }
    }

    // 所有提供商的首个请求都失败
    logError('All AI stream providers failed', lastError, {
      attemptedProviders: providersToTry,
      skipped,
      routingTimeMs: Date.now() - routeStart,
    });

    throw new Error(
      `All AI stream providers failed. Last error: ${lastError?.message ?? 'Unknown'}. ` +
        `Attempted: ${providersToTry.join(', ')}. ` +
        `Skipped: ${skipped.map((s) => `${s.provider}(${s.reason})`).join(', ')}`
    );
  }

  /**
   * 解析 AI_PRIMARY_PROVIDER 环境变量
   * 默认值: 'openai'
   */
  private parsePrimaryProvider(): AIProviderName {
    const env = process.env.AI_PRIMARY_PROVIDER?.toLowerCase().trim();
    const validProviders: AIProviderName[] = ['openai', 'anthropic', 'ollama'];

    if (env && validProviders.includes(env as AIProviderName)) {
      return env as AIProviderName;
    }

    return 'openai';
  }

  /**
   * 解析 AI_FALLBACK_PROVIDERS 环境变量
   * 格式: "anthropic,ollama"（逗号分隔）
   * 默认值: ['anthropic', 'ollama']
   */
  private parseFallbackOrder(): AIProviderName[] {
    const env = process.env.AI_FALLBACK_PROVIDERS?.toLowerCase().trim();
    const validProviders: AIProviderName[] = ['openai', 'anthropic', 'ollama'];

    if (env) {
      return env
        .split(',')
        .map((s) => s.trim() as AIProviderName)
        .filter((name) => validProviders.includes(name));
    }

    // 默认 fallback 顺序：排除主提供商后的所有提供商
    return validProviders.filter((name) => name !== this.primaryProvider);
  }
}

// ── 单例工厂实例 ──
// 使用懒加载避免模块导入时的副作用

let _factoryInstance: AIProviderFactory | null = null;

/**
 * 获取全局 AIProviderFactory 单例
 *
 * 懒加载模式：首次调用时初始化，后续复用同一实例。
 * 这确保了：
 *   1. 提供商实例在进程生命周期内复用（连接池友好）
 *   2. 环境变量在实际使用时读取（而非模块加载时）
 */
export function getProviderFactory(): AIProviderFactory {
  if (!_factoryInstance) {
    _factoryInstance = new AIProviderFactory();
  }
  return _factoryInstance;
}

/**
 * 重置工厂实例（仅用于测试）
 */
export function resetProviderFactory(): void {
  _factoryInstance = null;
}
