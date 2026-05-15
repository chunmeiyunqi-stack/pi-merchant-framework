import { OllamaProvider } from '../../ai-providers/ollama';
import type { AIProviderRequest } from '../../ai-providers/types';

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('OllamaProvider', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  const baseRequest: AIProviderRequest = {
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.OLLAMA_API_BASE;
    delete process.env.OLLAMA_MODEL;
    delete process.env.OLLAMA_ENABLED;
  });

  it('has correct name', () => {
    expect(new OllamaProvider().name).toBe('ollama');
  });

  it('is available by default', () => {
    expect(new OllamaProvider().isAvailable()).toBe(true);
  });

  it('is not available when explicitly disabled', () => {
    process.env.OLLAMA_ENABLED = 'false';
    expect(new OllamaProvider().isAvailable()).toBe(false);
  });

  it('sends stream:false for non-streaming mode', async () => {
    const provider = new OllamaProvider();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        model: 'llama3.1',
        message: { role: 'assistant', content: 'Ollama response' },
        done: true,
        prompt_eval_count: 15,
        eval_count: 10,
      }),
    } as Response);

    await provider.chat(baseRequest);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.stream).toBe(false);
    expect(body.model).toBe('llama3.1');
  });

  it('returns successful response with usage', async () => {
    const provider = new OllamaProvider();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        model: 'llama3.1',
        message: { role: 'assistant', content: 'Local AI response' },
        done: true,
        prompt_eval_count: 20,
        eval_count: 15,
      }),
    } as Response);

    const result = await provider.chat(baseRequest);
    expect(result.content).toBe('Local AI response');
    expect(result.provider).toBe('ollama');
    expect(result.usage?.totalTokens).toBe(35);
  });

  it('uses default localhost URL', async () => {
    const provider = new OllamaProvider();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        model: 'llama3.1',
        message: { role: 'assistant', content: 'ok' },
        done: true,
      }),
    } as Response);

    await provider.chat(baseRequest);
    expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:11434/api/chat');
  });

  it('uses custom base URL from env', async () => {
    process.env.OLLAMA_API_BASE = 'http://gpu-server:11434';
    const provider = new OllamaProvider();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        model: 'llama3.1',
        message: { role: 'assistant', content: 'ok' },
        done: true,
      }),
    } as Response);

    await provider.chat(baseRequest);
    expect(mockFetch.mock.calls[0][0]).toBe('http://gpu-server:11434/api/chat');
  });

  it('throws on non-OK response', async () => {
    const provider = new OllamaProvider();
    mockFetch.mockResolvedValueOnce({
      ok: false, status: 404, text: async () => 'Model not found',
    } as Response);
    await expect(provider.chat(baseRequest)).rejects.toThrow('Model not found');
  });

  it('healthCheck returns true when Ollama is running', async () => {
    const provider = new OllamaProvider();
    mockFetch.mockResolvedValueOnce({ ok: true } as Response);
    expect(await provider.healthCheck()).toBe(true);
  });

  it('healthCheck returns false on network error', async () => {
    const provider = new OllamaProvider();
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));
    expect(await provider.healthCheck()).toBe(false);
  });

  it('does not require API key (no auth headers)', async () => {
    const provider = new OllamaProvider();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        model: 'llama3.1',
        message: { role: 'assistant', content: 'ok' },
        done: true,
      }),
    } as Response);

    await provider.chat(baseRequest);

    const headers = mockFetch.mock.calls[0][1].headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
    expect(headers['x-api-key']).toBeUndefined();
  });
});
