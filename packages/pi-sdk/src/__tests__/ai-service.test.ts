import { generateMerchantAiResponse } from '../ai-service';
import { resetProviderFactory } from '../ai-providers/factory';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('AI Service (Backward Compatibility)', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    resetProviderFactory();
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_BASE;
    delete process.env.AI_PRIMARY_PROVIDER;
    delete process.env.AI_FALLBACK_PROVIDERS;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OLLAMA_ENABLED;
  });

  afterEach(() => {
    resetProviderFactory();
  });

  // ================================================================
  // 向后兼容性：方法签名与基本行为
  // ================================================================

  describe('Backward Compatibility', () => {
    it('returns successful response with valid OpenAI API', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OLLAMA_ENABLED = 'false';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'AI generated response' } }],
          model: 'gpt-4o-mini',
        }),
      } as Response);

      const result = await generateMerchantAiResponse({
        merchantId: 'merchant-123',
        prompt: 'How can I improve my sales?',
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('AI generated response');
      expect(result.error).toBeUndefined();
    });

    it('returns error when no providers are available', async () => {
      // No API keys set, Ollama disabled
      process.env.OLLAMA_ENABLED = 'false';

      const result = await generateMerchantAiResponse({
        merchantId: 'test-merchant',
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('uses default model (gpt-4o-mini) when not specified', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OLLAMA_ENABLED = 'false';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Default model response' } }],
          model: 'gpt-4o-mini',
        }),
      } as Response);

      await generateMerchantAiResponse({
        merchantId: 'merchant-123',
        prompt: 'Test prompt',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.model).toBe('gpt-4o-mini');
    });

    it('uses custom model when specified', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OLLAMA_ENABLED = 'false';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'GPT-4o response' } }],
          model: 'gpt-4o',
        }),
      } as Response);

      await generateMerchantAiResponse({
        merchantId: 'merchant-123',
        prompt: 'Test prompt',
        model: 'gpt-4o',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.model).toBe('gpt-4o');
    });

    it('uses default temperature (0.6) when not specified', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OLLAMA_ENABLED = 'false';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          model: 'gpt-4o-mini',
        }),
      } as Response);

      await generateMerchantAiResponse({
        merchantId: 'merchant-123',
        prompt: 'Test prompt',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.temperature).toBe(0.6);
    });

    it('uses custom temperature when specified', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OLLAMA_ENABLED = 'false';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Creative response' } }],
          model: 'gpt-4o-mini',
        }),
      } as Response);

      await generateMerchantAiResponse({
        merchantId: 'merchant-123',
        prompt: 'Test prompt',
        temperature: 0.8,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.temperature).toBe(0.8);
    });

    it('injects merchant ID into system prompt', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OLLAMA_ENABLED = 'false';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          model: 'gpt-4o-mini',
        }),
      } as Response);

      await generateMerchantAiResponse({
        merchantId: 'acme-corp',
        prompt: 'How to optimize inventory?',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.messages[0].content).toContain('merchant acme-corp');
    });
  });

  // ================================================================
  // 错误处理
  // ================================================================

  describe('Error Handling', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OLLAMA_ENABLED = 'false';
      process.env.AI_FALLBACK_PROVIDERS = '';  // Disable fallback for cleaner error tests
    });

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await generateMerchantAiResponse({
        merchantId: 'merchant-123',
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('handles API rate limiting (429)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded',
      } as Response);

      const result = await generateMerchantAiResponse({
        merchantId: 'merchant-123',
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('handles empty response gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [],
          model: 'gpt-4o-mini',
        }),
      } as Response);

      const result = await generateMerchantAiResponse({
        merchantId: 'merchant-123',
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ================================================================
  // 多提供商路由
  // ================================================================

  describe('Multi-Provider Routing', () => {
    it('routes to specified provider', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.OLLAMA_ENABLED = 'false';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_1', type: 'message', role: 'assistant',
          model: 'claude-sonnet-4-20250514',
          content: [{ type: 'text', text: 'Anthropic response' }],
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      } as Response);

      const result = await generateMerchantAiResponse({
        merchantId: 'merchant-123',
        prompt: 'Test prompt',
        provider: 'anthropic',
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('Anthropic response');
      expect(result.provider).toBe('anthropic');
    });

    it('falls back when primary provider fails', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.OLLAMA_ENABLED = 'false';

      // OpenAI fails
      mockFetch.mockRejectedValueOnce(new Error('OpenAI down'));

      // Anthropic succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_1', type: 'message', role: 'assistant',
          model: 'claude-sonnet-4-20250514',
          content: [{ type: 'text', text: 'Fallback to Anthropic' }],
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      } as Response);

      const result = await generateMerchantAiResponse({
        merchantId: 'merchant-123',
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('Fallback to Anthropic');
      expect(result.provider).toBe('anthropic');
    });

    it('returns provider and model metadata in response', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OLLAMA_ENABLED = 'false';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          model: 'gpt-4o-mini',
        }),
      } as Response);

      const result = await generateMerchantAiResponse({
        merchantId: 'merchant-123',
        prompt: 'Test prompt',
      });

      expect(result.provider).toBe('openai');
      expect(result.model).toBe('gpt-4o-mini');
    });
  });

  // ================================================================
  // 并发
  // ================================================================

  describe('Concurrency', () => {
    it('handles concurrent requests without interference', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OLLAMA_ENABLED = 'false';

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Response 1' } }],
            model: 'gpt-4o-mini',
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Response 2' } }],
            model: 'gpt-4o-mini',
          }),
        } as Response);

      const [result1, result2] = await Promise.all([
        generateMerchantAiResponse({ merchantId: 'merchant-1', prompt: 'Prompt 1' }),
        generateMerchantAiResponse({ merchantId: 'merchant-2', prompt: 'Prompt 2' }),
      ]);

      expect(result1.success).toBe(true);
      expect(result1.result).toBe('Response 1');
      expect(result2.success).toBe(true);
      expect(result2.result).toBe('Response 2');
    });
  });
});