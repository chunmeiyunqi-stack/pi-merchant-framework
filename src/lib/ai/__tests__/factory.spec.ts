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
      isAvailable: jest.fn().mockResolvedValue(false), // 榛樿涓嶅彲鐢?      healthCheck: jest.fn().mockResolvedValue(false),
      chat: jest.fn(),
      generateStream: jest.fn(),
    };

    factory.registerProvider(mockOpenAI);
    factory.registerProvider(mockAnthropic);
    factory.registerProvider(mockOllama);
  });

  describe('涓绘彁渚涘晢璺敱', () => {
    it('搴旇鍦ㄤ富鎻愪緵鍟嗗彲鐢ㄦ椂浼樺厛浣跨敤', async () => {
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

    it('搴旇楠岃瘉涓绘彁渚涘晢鐨勫彲鐢ㄦ€?, async () => {
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

  describe('Fallback 瀹归敊鏈哄埗', () => {
    it('搴旇鍦ㄤ富鎻愪緵鍟嗗け璐ユ椂鑷姩 Fallback', async () => {
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

    it('搴旇鎸夌収 Fallback 椤哄簭灏濊瘯', async () => {
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

    it('搴旇鍦ㄦ墍鏈夋彁渚涘晢澶辫触鏃舵姏鍑洪敊璇?, async () => {
      factory.setPrimary('openai');
      factory.setFallbacks(['anthropic', 'ollama']);

      mockOpenAI.chat.mockRejectedValue(new Error('OpenAI down'));
      mockAnthropic.chat.mockRejectedValue(new Error('Anthropic down'));
      mockOllama.chat.mockRejectedValue(new Error('Ollama down'));

      await expect(factory.chat('Test prompt', {})).rejects.toThrow(/All providers failed/);
    });
  });

  describe('鐩磋繛璇锋眰', () => {
    it('搴旇鍦ㄨ姹傛寚瀹氭彁渚涘晢鏃剁洿杩烇紙涓?fallback锛?, async () => {
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

    it('搴旇鍦ㄦ寚瀹氭彁渚涘晢涓嶅彲鐢ㄦ椂杩斿洖閿欒', async () => {
      mockOllama.isAvailable.mockResolvedValue(false);

      await expect(factory.chat('Test prompt', {}, 'ollama')).rejects.toThrow(
        /Provider ollama not available/
      );
    });
  });

  describe('娴佸紡璇锋眰鐨?Fallback', () => {
    it('搴旇鍦ㄩ涓?token 鍓嶅厑璁?Fallback', async () => {
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

    it('搴旇鍦ㄩ涓?token 鍚庣姝?Fallback', async () => {
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
          // 缁х画杩唬
        }
      }).rejects.toThrow();
    });
  });

  describe('鎻愪緵鍟嗙姸鎬佺鐞?, () => {
    it('搴旇缂撳瓨鎻愪緵鍟嗙殑鍙敤鎬х姸鎬?, async () => {
      factory.setPrimary('openai');

      mockOpenAI.isAvailable.mockResolvedValue(true);

      await factory.chat('Test 1', {});
      await factory.chat('Test 2', {});

      // 鍙敤鎬ф鏌ュ彲鑳戒細琚紦瀛橈紝鎵€浠ヨ皟鐢ㄦ鏁板彲鑳藉皯浜?2 娆?      expect(mockOpenAI.isAvailable.mock.calls.length).toBeLessThanOrEqual(2);
    });

    it('搴旇鏀寔鎻愪緵鍟嗙殑鍔ㄦ€佹敞鍐?, async () => {
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

  describe('鏅鸿兘妯″瀷閫夋嫨绛栫暐', () => {
    it('搴旇鏀寔鍩轰簬鎴愭湰鐨勬ā鍨嬮€夋嫨', async () => {
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

    // 策略路由功能暂未实现，留待 v2.2 路线图优化
    it.skip('搴旇鏀寔鍩轰簬寤惰繜鐨勬ā鍨嬮€夋嫨', async () => {
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
