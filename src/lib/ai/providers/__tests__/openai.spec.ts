import { OpenAIProvider } from '@/lib/ai/providers/openai';

describe('OpenAI Provider (openai.ts)', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    process.env.OPENAI_API_KEY = 'sk-test-123456';
    provider = new OpenAIProvider();
  });

  describe('isAvailable()', () => {
    it('应该在 API Key 已配置时返回 true', async () => {
      process.env.OPENAI_API_KEY = 'sk-valid-key';
      provider = new OpenAIProvider();

      const available = await provider.isAvailable();
      expect(available).toBe(true);
    });

    it('应该在 API Key 未配置时返回 false', async () => {
      delete process.env.OPENAI_API_KEY;
      provider = new OpenAIProvider();

      const available = await provider.isAvailable();
      expect(available).toBe(false);
    });

    it('应该在 API Key 为空字符串时返回 false', async () => {
      process.env.OPENAI_API_KEY = '';
      provider = new OpenAIProvider();

      const available = await provider.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe('healthCheck()', () => {
    it('应该通过健康检查返回 true', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ object: 'list', data: [] }),
      } as any);

      const healthy = await provider.healthCheck();
      expect(healthy).toBe(true);
    });

    it('应该在 API 不可用时返回 false', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      } as any);

      const healthy = await provider.healthCheck();
      expect(healthy).toBe(false);
    });

    it('应该处理网络错误', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const healthy = await provider.healthCheck();
      expect(healthy).toBe(false);
    });
  });

  describe('chat()', () => {
    it('应该返回预期的响应格式', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          id: 'chatcmpl-123',
          object: 'text_completion',
          created: 1234567890,
          model: 'gpt-4',
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Hello, this is a test response.',
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 15,
            total_tokens: 25,
          },
        }),
      } as any);

      const result = await provider.chat('Test prompt', {
        model: 'gpt-4',
      });

      expect(result.content).toBe('Hello, this is a test response.');
      expect(result.model).toBe('gpt-4');
      expect(result.id).toBeDefined();
    });

    it('应该处理超时错误', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 100))
      );

      await expect(provider.chat('Test prompt', { model: 'gpt-4', timeout: 50 })).rejects.toThrow(
        /timeout|Timeout/i
      );
    });

    it('应该处理 HTTP 4xx 错误', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValue({
          error: { message: 'Invalid API Key' },
        }),
      } as any);

      await expect(provider.chat('Test prompt', { model: 'gpt-4' })).rejects.toThrow(
        /Invalid API Key|Unauthorized/
      );
    });

    it('应该处理 HTTP 5xx 错误', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({
          error: { message: 'Server error' },
        }),
      } as any);

      await expect(provider.chat('Test prompt', { model: 'gpt-4' })).rejects.toThrow(
        /Server error|Internal Server Error/
      );
    });

    it('应该正确设置请求头', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'OK' } }],
        }),
      } as any);

      await provider.chat('Test', { model: 'gpt-4' });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[1].headers).toHaveProperty('Authorization', 'Bearer sk-test-123456');
      expect(callArgs[1].headers).toHaveProperty('Content-Type', 'application/json');
    });
  });

  describe('generateStream()', () => {
    it('应该正确 yield 流式响应', async () => {
      const streamData = [
        { choices: [{ delta: { content: 'Hello' } }] },
        { choices: [{ delta: { content: ' ' } }] },
        { choices: [{ delta: { content: 'world' } }] },
        { choices: [{ delta: { finish_reason: 'stop' } }] },
      ];

      let callCount = 0;
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => ({
            read: jest.fn(async () => {
              if (callCount < streamData.length) {
                const data = streamData[callCount];
                callCount++;
                return {
                  done: false,
                  value: new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`),
                };
              }
              return { done: true };
            }),
          }),
        },
      } as any);

      const chunks: string[] = [];
      for await (const chunk of provider.generateStream('Test', {
        model: 'gpt-4',
      })) {
        chunks.push(chunk.delta);
      }

      expect(chunks).toContain('Hello');
      expect(chunks).toContain(' ');
      expect(chunks).toContain('world');
    });

    it('应该处理流式响应中的错误', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => ({
            read: jest.fn(async () => {
              throw new Error('Stream error');
            }),
          }),
        },
      } as any);

      const stream = provider.generateStream('Test', { model: 'gpt-4' });

      await expect(async () => {
        for await (const chunk of stream) {
          // 继续迭代
        }
      }).rejects.toThrow();
    });
  });

  describe('模型支持', () => {
    it('应该支持主流 GPT 模型', async () => {
      const supportedModels = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];

      for (const model of supportedModels) {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'OK' } }],
          }),
        } as any);

        await expect(provider.chat('Test', { model })).resolves.toBeDefined();
      }
    });
  });
});
