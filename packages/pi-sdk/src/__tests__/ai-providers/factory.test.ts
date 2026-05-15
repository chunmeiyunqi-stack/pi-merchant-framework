import { AIProviderFactory, resetProviderFactory } from '../../ai-providers/factory';
import { OpenAIProvider } from '../../ai-providers/openai';
import { AnthropicProvider } from '../../ai-providers/anthropic';
import { OllamaProvider } from '../../ai-providers/ollama';
import type { AIProviderRequest } from '../../ai-providers/types';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('AIProviderFactory', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  let factory: AIProviderFactory;

  const baseRequest: AIProviderRequest = {
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello' },
    ],
    temperature: 0.6,
    maxTokens: 512,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resetProviderFactory();

    // 清理环境变量
    delete process.env.AI_PRIMARY_PROVIDER;
    delete process.env.AI_FALLBACK_PROVIDERS;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OLLAMA_ENABLED;
    delete process.env.OLLAMA_API_BASE;
  });

  afterEach(() => {
    resetProviderFactory();
  });

  // ================================================================
  // 初始化与配置
  // ================================================================

  describe('Initialization', () => {
    it('creates factory with default configuration', () => {
      factory = new AIProviderFactory();

      expect(factory.getPrimaryProviderName()).toBe('openai');
      expect(factory.getRegisteredProviders()).toContain('openai');
      expect(factory.getRegisteredProviders()).toContain('anthropic');
      expect(factory.getRegisteredProviders()).toContain('ollama');
    });

    it('respects AI_PRIMARY_PROVIDER environment variable', () => {
      process.env.AI_PRIMARY_PROVIDER = 'anthropic';
      factory = new AIProviderFactory();

      expect(factory.getPrimaryProviderName()).toBe('anthropic');
    });

    it('falls back to openai for invalid AI_PRIMARY_PROVIDER', () => {
      process.env.AI_PRIMARY_PROVIDER = 'invalid-provider';
      factory = new AIProviderFactory();

      expect(factory.getPrimaryProviderName()).toBe('openai');
    });

    it('handles case-insensitive AI_PRIMARY_PROVIDER', () => {
      process.env.AI_PRIMARY_PROVIDER = 'ANTHROPIC';
      factory = new AIProviderFactory();

      expect(factory.getPrimaryProviderName()).toBe('anthropic');
    });

    it('registers all three providers', () => {
      factory = new AIProviderFactory();

      const registered = factory.getRegisteredProviders();
      expect(registered).toHaveLength(3);
      expect(registered).toEqual(expect.arrayContaining(['openai', 'anthropic', 'ollama']));
    });
  });

  // ================================================================
  // 提供商可用性
  // ================================================================

  describe('Provider Availability', () => {
    it('lists only providers with configured API keys as available', () => {
      process.env.OPENAI_API_KEY = 'test-openai-key';
      // Anthropic key not set
      process.env.OLLAMA_ENABLED = 'false';

      factory = new AIProviderFactory();
      const available = factory.getAvailableProviders();

      expect(available.map((p) => p.name)).toContain('openai');
      expect(available.map((p) => p.name)).not.toContain('anthropic');
      expect(available.map((p) => p.name)).not.toContain('ollama');
    });

    it('returns provider by name', () => {
      factory = new AIProviderFactory();

      const openai = factory.getProvider('openai');
      expect(openai).toBeDefined();
      expect(openai?.name).toBe('openai');

      const anthropic = factory.getProvider('anthropic');
      expect(anthropic).toBeDefined();
      expect(anthropic?.name).toBe('anthropic');
    });
  });

  // ================================================================
  // 路由决策 — 直连模式
  // ================================================================

  describe('Direct Routing (requested provider)', () => {
    it('routes to specific provider when requested', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      factory = new AIProviderFactory();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'OpenAI response' } }],
          model: 'gpt-4o-mini',
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        }),
      } as Response);

      const result = await factory.route(baseRequest, 'openai');

      expect(result.content).toBe('OpenAI response');
      expect(result.provider).toBe('openai');
      expect(result.routing.requested).toBe('openai');
      expect(result.routing.fallback).toBe(false);
    });

    it('throws for unknown provider', async () => {
      factory = new AIProviderFactory();

      await expect(
        factory.route(baseRequest, 'unknown-provider' as any)
      ).rejects.toThrow('Unknown AI provider: unknown-provider');
    });

    it('throws when requested provider is unavailable', async () => {
      // Don't set ANTHROPIC_API_KEY
      factory = new AIProviderFactory();

      await expect(
        factory.route(baseRequest, 'anthropic')
      ).rejects.toThrow("AI provider 'anthropic' is not available");
    });

    it('does NOT fallback when provider is directly requested', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      factory = new AIProviderFactory();

      // OpenAI fails
      mockFetch.mockRejectedValueOnce(new Error('OpenAI down'));

      // Should NOT try Anthropic when OpenAI was directly requested
      await expect(
        factory.route(baseRequest, 'openai')
      ).rejects.toThrow('OpenAI down');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  // ================================================================
  // 路由决策 — 主提供商 + Fallback
  // ================================================================

  describe('Primary + Fallback Routing', () => {
    it('uses primary provider when available and working', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      factory = new AIProviderFactory();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Primary response' } }],
          model: 'gpt-4o-mini',
        }),
      } as Response);

      const result = await factory.route(baseRequest);

      expect(result.content).toBe('Primary response');
      expect(result.provider).toBe('openai');
      expect(result.routing.fallback).toBe(false);
    });

    it('falls back to anthropic when openai fails', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      factory = new AIProviderFactory();

      // OpenAI fails
      mockFetch.mockRejectedValueOnce(new Error('OpenAI service error'));

      // Anthropic succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_1',
          type: 'message',
          role: 'assistant',
          model: 'claude-sonnet-4-20250514',
          content: [{ type: 'text', text: 'Fallback response from Anthropic' }],
          usage: { input_tokens: 10, output_tokens: 20 },
        }),
      } as Response);

      const result = await factory.route(baseRequest);

      expect(result.content).toBe('Fallback response from Anthropic');
      expect(result.provider).toBe('anthropic');
      expect(result.routing.fallback).toBe(true);
      expect(result.routing.skipped).toBeDefined();
      expect(result.routing.skipped!.some((s) => s.provider === 'openai')).toBe(true);
    });

    it('skips unavailable providers during fallback', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      // No Anthropic key — will be skipped
      process.env.OLLAMA_ENABLED = 'true';
      factory = new AIProviderFactory();

      // OpenAI fails
      mockFetch.mockRejectedValueOnce(new Error('OpenAI down'));

      // Ollama succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.1',
          message: { role: 'assistant', content: 'Ollama fallback response' },
          done: true,
        }),
      } as Response);

      const result = await factory.route(baseRequest);

      expect(result.provider).toBe('ollama');
      expect(result.routing.fallback).toBe(true);
      // Anthropic should be in skipped list as "not available"
      const anthropicSkip = result.routing.skipped?.find((s) => s.provider === 'anthropic');
      expect(anthropicSkip).toBeDefined();
      expect(anthropicSkip!.reason).toBe('not available');
    });

    it('throws when all providers fail', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.OLLAMA_ENABLED = 'false';
      factory = new AIProviderFactory();

      // OpenAI fails
      mockFetch.mockRejectedValueOnce(new Error('OpenAI error'));
      // Anthropic fails
      mockFetch.mockRejectedValueOnce(new Error('Anthropic error'));

      await expect(factory.route(baseRequest)).rejects.toThrow('All AI providers failed');
    });

    it('includes routing time in decision metadata', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      factory = new AIProviderFactory();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          model: 'gpt-4o-mini',
        }),
      } as Response);

      const result = await factory.route(baseRequest);

      expect(result.routing.routingTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ================================================================
  // 自定义 Fallback 顺序
  // ================================================================

  describe('Custom Fallback Order', () => {
    it('respects AI_FALLBACK_PROVIDERS environment variable', async () => {
      process.env.AI_PRIMARY_PROVIDER = 'openai';
      process.env.AI_FALLBACK_PROVIDERS = 'ollama,anthropic';
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.OLLAMA_ENABLED = 'true';
      factory = new AIProviderFactory();

      // OpenAI fails
      mockFetch.mockRejectedValueOnce(new Error('OpenAI down'));

      // Ollama succeeds (should be tried before Anthropic)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.1',
          message: { role: 'assistant', content: 'Ollama response' },
          done: true,
        }),
      } as Response);

      const result = await factory.route(baseRequest);

      expect(result.provider).toBe('ollama');
      expect(mockFetch).toHaveBeenCalledTimes(2); // OpenAI + Ollama
    });
  });
});
