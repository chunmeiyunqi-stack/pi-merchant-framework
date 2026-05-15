import { AnthropicProvider } from '../../ai-providers/anthropic';
import type { AIProviderRequest } from '../../ai-providers/types';

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('AnthropicProvider', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  const baseRequest: AIProviderRequest = {
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_BASE;
  });

  it('has correct name', () => {
    expect(new AnthropicProvider({ apiKey: 'k' }).name).toBe('anthropic');
  });

  it('is available with API key', () => {
    expect(new AnthropicProvider({ apiKey: 'k' }).isAvailable()).toBe(true);
  });

  it('is not available without API key', () => {
    expect(new AnthropicProvider().isAvailable()).toBe(false);
  });

  it('extracts system message to top-level param', async () => {
    const provider = new AnthropicProvider({ apiKey: 'k' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'msg_1',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'Hello from Claude!' }],
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    } as Response);

    await provider.chat(baseRequest);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.system).toBe('You are a helpful assistant.');
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].role).toBe('user');
  });

  it('sends x-api-key header', async () => {
    const provider = new AnthropicProvider({ apiKey: 'test-key' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'msg_1',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'Response' }],
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    } as Response);

    await provider.chat(baseRequest);

    const headers = mockFetch.mock.calls[0][1].headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('test-key');
    expect(headers['anthropic-version']).toBe('2023-06-01');
  });

  it('returns successful response with usage', async () => {
    const provider = new AnthropicProvider({ apiKey: 'k' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'msg_1',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'Claude response' }],
        usage: { input_tokens: 20, output_tokens: 10 },
      }),
    } as Response);

    const result = await provider.chat(baseRequest);
    expect(result.content).toBe('Claude response');
    expect(result.provider).toBe('anthropic');
    expect(result.usage?.totalTokens).toBe(30);
  });

  it('throws on missing API key', async () => {
    await expect(new AnthropicProvider().chat(baseRequest)).rejects.toThrow('not configured');
  });

  it('throws on non-OK response', async () => {
    const provider = new AnthropicProvider({ apiKey: 'k' });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Invalid API key',
    } as Response);
    await expect(provider.chat(baseRequest)).rejects.toThrow('Invalid API key');
  });

  it('handles request without system message', async () => {
    const provider = new AnthropicProvider({ apiKey: 'k' });
    const noSystemReq: AIProviderRequest = {
      messages: [{ role: 'user', content: 'Just a user message' }],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'msg_1',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'Response' }],
        usage: { input_tokens: 5, output_tokens: 5 },
      }),
    } as Response);

    await provider.chat(noSystemReq);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.system).toBeUndefined();
  });
});
