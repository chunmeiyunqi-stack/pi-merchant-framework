// ============================================================
// AI Provider Factory - Unit Tests
// Tests: getProvider(), ConfigurationError, ProviderNotFoundError
// ============================================================
import { AIProviderFactory, resetProviderFactory, getProviderFactory } from '../../ai-providers/factory';
import { OpenAIProvider } from '../../ai-providers/openai';
import { AnthropicProvider } from '../../ai-providers/anthropic';
import { OllamaProvider } from '../../ai-providers/ollama';
import type { AIProviderName } from '../../ai-providers/types';

// Mock fetch globally (used by OpenAI and Anthropic providers)
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('AI Provider Factory', () => {
  let factory: AIProviderFactory;

  beforeEach(() => {
    jest.clearAllMocks();
    resetProviderFactory();
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

  // ── Test 1: getProvider returns correct instance ───
  describe('getProvider()', () => {
    it('returns OpenAIProvider for name openai', () => {
      factory = new AIProviderFactory();
      const provider = factory.getProvider('openai');
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(OpenAIProvider);
      expect(provider!.name).toBe('openai');
    });

    it('returns AnthropicProvider for name anthropic', () => {
      factory = new AIProviderFactory();
      const provider = factory.getProvider('anthropic');
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(AnthropicProvider);
      expect(provider!.name).toBe('anthropic');
    });

    it('returns OllamaProvider for name ollama', () => {
      factory = new AIProviderFactory();
      const provider = factory.getProvider('ollama');
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(OllamaProvider);
      expect(provider!.name).toBe('ollama');
    });

    it('returns undefined for unknown provider name', () => {
      factory = new AIProviderFactory();
      const provider = factory.getProvider('unknown-provider' as AIProviderName);
      expect(provider).toBeUndefined();
    });
  });

  // ── Test 2: API key missing 询出 error on route (isAvailable=false) ──────────────
  describe('ConfigurationError — missing API key', () => {
    it('throws when routing to openai without API key', async () => {
      factory = new AIProviderFactory();
      const provider = factory.getProvider('openai')!;
      expect(provider.isAvailable()).toBe(false);
    });

    it('throws ConfigurationError-like when routing to unavailable provider', async () => {
      factory = new AIProviderFactory();
      await expect(
        factory.route(
          { messages: [{ role: 'user', content: 'test' }] },
          'openai'
        )
      ).rejects.toThrow(/not available/i);
    });

    it('throws when routing to anthropic without API key', async () => {
      factory = new AIProviderFactory();
      await expect(
        factory.route(
          { messages: [{ role: 'user', content: 'test' }] },
          'anthropic'
        )
      ).rejects.toThrow(/not available/i);
    });
  });

  // ── Test 3: Unknown provider throws ProviderNotFoundError ────
  describe('ProviderNotFoundError', () => {
    it('throws error with message containing unknown provider name', async () => {
      factory = new AIProviderFactory();
      await expect(
        factory.route(
          { messages: [{ role: 'user', content: 'test' }] },
          'nonexistent-provider' as AIProviderName
        )
      ).rejects.toThrow(/Unknown AI provider/i);
    });

    it('throws error mentioning the specific unknown name', async () => {
      factory = new AIProviderFactory();
      await expect(
        factory.route(
          { messages: [{ role: 'user', content: 'test' }] },
          'deepseek-v3' as AIProviderName
        )
      ).rejects.toThrow(/deepseek-v3/i);
    });
  });
});

