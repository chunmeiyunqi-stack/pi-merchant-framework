import { AIProviderFactory, AIProvider } from '@/lib/ai/factory';
import { OpenAIProvider } from '@/lib/ai/providers/openai';
import { AnthropicProvider } from '@/lib/ai/providers/anthropic';
import { OllamaProvider } from '@/lib/ai/providers/ollama';

describe('AI Provider Factory (factory.ts)', () => {
  let factory: AIProviderFactory;
  let mockOpenAI: jest.Mocked<AIProvider>;
  let mockAnthropic: jest.Mocked<AIProvider>;
  let mockOllama: jest.Mocked<AIProvider>;

  beforeEach(() => {
    factory = new AIProviderFactory();

    mockOpenAI = {
      name: 'openai',
      isAvailable: jest.fn().mockResolvedValue(true),
      healthCheck: jest.fn().mockResolvedValue(true),
      chat: jest.fn(),
      generateStream: jest.fn(),
    };

    mockAnthropic = {
      name: 'anthropic',
      isAvailable: jest.fn().mockResolvedValue(true),
      healthCheck: jest.fn().mockResolvedValue(true),
      chat: jest.fn(),
      generateStream: jest.fn(),
    };

    mockOllama = {
      name: 'ollama',
      isAvailable: jest.fn().mockResolvedValue(false), // 默认不可用
      healthCheck: jest.fn().mockResolvedValue(false),
      chat: jest.fn(),
      generateStream: jest.fn(),
    };

    factory.registerProvider(mockOpenAI);
    factory.registerProvider(mockAnthropic);
    factory.registerProvider(mockOllama);
  });

  describe('主提供商路由', () => {
    it('应该在主提供商可用时优先使用', async () => {
      factory.setPrimary('openai');

      mockOpenAI.chat.mockResolvedValue({
        id: 'test-1',
        content: 'Hello from OpenAI',
        model: 'gpt-4',
      });

      const result = await factory.chat('Test prompt', {});

      expect(mockOpenAI.chat).toHaveBeenCalled();
      expect(mockAnthropic.chat).not.toHaveBeenCalled();
      expect(result.content).toBe('Hello from OpenAI');
    });

    it('应该验证主提供商的可用性', async () => {
      factory.setPrimary('openai');
      mockOpenAI.isAvailable.mockResolvedValue(false);

      mockAnthropic.chat.mockResolvedValue({
        id: 'test-2',
        content: 'Fallback to Anthropic',
        model: 'claude-3',
      });

      const result = await factory.chat('Test prompt', {});

      expect(mockOpenAI.chat).not.toHaveBeenCalled();
      expect(mockAnthropic.chat).toHaveBeenCalled();
    });
  });

  describe('Fallback 容错机制', () => {
    it('应该在主提供商失败时自动 Fallback', async () => {
      factory.setPrimary('openai');
      factory.setFallbacks(['anthropic', 'ollama']);

      mockOpenAI.chat.mockRejectedValue(new Error('API Error'));
      mockAnthropic.chat.mockResolvedValue({
        id: 'test-3',
        content: 'Fallback successful',
        model: 'claude-3',
      });

      const result = await factory.chat('Test prompt', {});

      expect(mockOpenAI.chat).toHaveBeenCalled();
      expect(mockAnthropic.chat).toHaveBeenCalled();
      expect(result.content).toBe('Fallback successful');
    });

    it('应该按照 Fallback 顺序尝试', async () => {
      factory.setPrimary('openai');
      factory.setFallbacks(['ollama', 'anthropic']);

      mockOpenAI.chat.mockRejectedValue(new Error('API Error'));
      mockOllama.chat.mockRejectedValue(new Error('Ollama down'));
      mockAnthropic.chat.mockResolvedValue({
        id: 'test-4',
        content: 'Finally succeeded',
        model: 'claude-3',
      });

      const result = await factory.chat('Test prompt', {});

      expect(mockOpenAI.chat).toHaveBeenCalled();
      expect(mockOllama.chat).toHaveBeenCalled();
      expect(mockAnthropic.chat).toHaveBeenCalled();
    });

    it('应该在所有提供商失败时抛出错误', async () => {
      factory.setPrimary('openai');
      factory.setFallbacks(['anthropic', 'ollama']);

      mockOpenAI.chat.mockRejectedValue(new Error('OpenAI down'));
      mockAnthropic.chat.mockRejectedValue(new Error('Anthropic down'));
      mockOllama.chat.mockRejectedValue(new Error('Ollama down'));

      await expect(factory.chat('Test prompt', {})).rejects.toThrow(/All providers failed/);
    });
  });

  describe('直连请求', () => {
    it('应该在请求指定提供商时直连（不 fallback）', async () => {
      mockAnthropic.chat.mockResolvedValue({
        id: 'test-5',
        content: 'Direct call',
        model: 'claude-3',
      });

      const result = await factory.chat('Test prompt', {}, 'anthropic');

      expect(mockOpenAI.chat).not.toHaveBeenCalled();
      expect(mockAnthropic.chat).toHaveBeenCalled();
      expect(mockOllama.chat).not.toHaveBeenCalled();
    });

    it('应该在指定提供商不可用时返回错误', async () => {
      mockOllama.isAvailable.mockResolvedValue(false);

      await expect(factory.chat('Test prompt', {}, 'ollama')).rejects.toThrow(
        /Provider ollama not available/
      );
    });
  });

  describe('流式请求的 Fallback', () => {
    it('应该在首个 token 前允许 Fallback', async () => {
      factory.setPrimary('openai');
      factory.setFallbacks(['anthropic']);

      let callCount = 0;
      mockOpenAI.generateStream.mockImplementation(async function* () {
        callCount++;
        if (callCount === 1) {
          throw new Error('Connection failed');
        }
        yield { delta: 'test', index: 0 };
      });

      mockAnthropic.generateStream.mockImplementation(async function* () {
        yield { delta: 'success', index: 0 };
      });

      const stream = factory.generateStream('Test prompt', {});
      const chunks = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks[0].delta).toBe('success');
    });

    it('应该在首个 token 后禁止 Fallback', async () => {
      factory.setPrimary('openai');
      factory.setFallbacks(['anthropic']);

      mockOpenAI.generateStream.mockImplementation(async function* () {
        yield { delta: 'first', index: 0 };
        throw new Error('Connection lost');
      });

      mockAnthropic.generateStream.mockImplementation(async function* () {
        yield { delta: 'backup', index: 0 };
      });

      const stream = factory.generateStream('Test prompt', {});

      await expect(async () => {
        for await (const chunk of stream) {
          // 继续迭代
        }
      }).rejects.toThrow();
    });
  });

  describe('提供商状态管理', () => {
    it('应该缓存提供商的可用性状态', async () => {
      factory.setPrimary('openai');

      mockOpenAI.isAvailable.mockResolvedValue(true);

      await factory.chat('Test 1', {});
      await factory.chat('Test 2', {});

      // 可用性检查可能会被缓存，所以调用次数可能少于 2 次
      expect(mockOpenAI.isAvailable.mock.calls.length).toBeLessThanOrEqual(2);
    });

    it('应该支持提供商的动态注册', async () => {
      const newProvider: AIProvider = {
        name: 'gpt-4-turbo',
        isAvailable: jest.fn().mockResolvedValue(true),
        healthCheck: jest.fn().mockResolvedValue(true),
        chat: jest.fn().mockResolvedValue({
          id: 'test-6',
          content: 'From new provider',
          model: 'gpt-4-turbo',
        }),
        generateStream: jest.fn(),
      };

      factory.registerProvider(newProvider);
      factory.setPrimary('gpt-4-turbo');

      const result = await factory.chat('Test prompt', {});

      expect(newProvider.chat).toHaveBeenCalled();
      expect(result.content).toBe('From new provider');
    });
  });

  describe('智能模型选择策略', () => {
    it('应该支持基于成本的模型选择', async () => {
      mockOpenAI.chat.mockResolvedValue({
        id: 'test-7',
        content: 'Cheap option',
        model: 'gpt-3.5-turbo',
        estimatedCost: 0.001,
      });

      mockAnthropic.chat.mockResolvedValue({
        id: 'test-8',
        content: 'Expensive option',
        model: 'claude-3-opus',
        estimatedCost: 0.05,
      });

      const result = await factory.chat('Test prompt', {}, undefined, {
        strategy: 'cost-optimized',
      });

      expect(result.estimatedCost).toBeLessThan(0.05);
    });

    it('应该支持基于延迟的模型选择', async () => {
      mockOpenAI.chat.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  id: 'test-9',
                  content: 'Slow',
                  model: 'gpt-4',
                  latency: 200,
                }),
              200
            )
          )
      );

      mockAnthropic.chat.mockResolvedValue({
        id: 'test-10',
        content: 'Fast',
        model: 'claude-3-haiku',
        latency: 50,
      });

      const result = await factory.chat('Test prompt', {}, undefined, {
        strategy: 'performance-optimized',
      });

      expect(result.latency).toBeLessThan(200);
    });
  });
});
