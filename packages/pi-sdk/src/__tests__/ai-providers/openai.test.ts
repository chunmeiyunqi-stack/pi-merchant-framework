import { OpenAIProvider } from '../../ai-providers/openai';
import type { AIProviderRequest } from '../../ai-providers/types';

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('OpenAIProvider', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  const baseRequest: AIProviderRequest = {
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_BASE;
  });

  it('has correct name', () => {
    expect(new OpenAIProvider({ apiKey: 'k' }).name).toBe('openai');
  });

  it('is available with API key', () => {
    expect(new OpenAIProvider({ apiKey: 'k' }).isAvailable()).toBe(true);
  });

  it('is not available without API key', () => {
    expect(new OpenAIProvider().isAvailable()).toBe(false);
  });

  it('reads API key from env', () => {
    process.env.OPENAI_API_KEY = 'env-key';
    expect(new OpenAIProvider().isAvailable()).toBe(true);
  });

  it('returns successful chat response', async () => {
    const provider = new OpenAIProvider({ apiKey: 'k' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        model: 'gpt-4o-mini',
        choices: [{ message: { content: 'Hello!' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
    } as Response);

    const result = await provider.chat(baseRequest);
    expect(result.content).toBe('Hello!');
    expect(result.provider).toBe('openai');
    expect(result.usage?.totalTokens).toBe(15);
  });

  it('throws on missing API key', async () => {
    await expect(new OpenAIProvider().chat(baseRequest)).rejects.toThrow('not configured');
  });

  it('throws on non-OK response', async () => {
    const provider = new OpenAIProvider({ apiKey: 'k' });
    mockFetch.mockResolvedValueOnce({
      ok: false, status: 429, text: async () => 'Rate limit',
    } as Response);
    await expect(provider.chat(baseRequest)).rejects.toThrow('Rate limit');
  });

  it('throws on empty choices', async () => {
    const provider = new OpenAIProvider({ apiKey: 'k' });
    mockFetch.mockResolvedValueOnce({
      ok: true, json: async () => ({ choices: [], model: 'gpt-4o-mini' }),
    } as Response);
    await expect(provider.chat(baseRequest)).rejects.toThrow('no valid response');
  });

  it('uses custom base URL', async () => {
    const provider = new OpenAIProvider({ apiKey: 'k', baseUrl: 'https://custom.api/v1' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'ok' } }], model: 'gpt-4o-mini' }),
    } as Response);
    await provider.chat(baseRequest);
    expect(mockFetch.mock.calls[0][0]).toBe('https://custom.api/v1/chat/completions');
  });

  it('healthCheck returns false without key', async () => {
    expect(await new OpenAIProvider().healthCheck()).toBe(false);
  });

  it('healthCheck returns true when reachable', async () => {
    const provider = new OpenAIProvider({ apiKey: 'k' });
    mockFetch.mockResolvedValueOnce({ ok: true } as Response);
    expect(await provider.healthCheck()).toBe(true);
  });
});
