import '@testing-library/jest-dom';
import * as nodeCrypto from 'crypto';

// 全局测试配置
beforeAll(() => {
  // 设置环境变量
  (process.env as { NODE_ENV?: string }).NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
  process.env.OLLAMA_BASE_URL = 'http://localhost:11434';

  // 配置全局 fetch mock
  // Only set up a global fetch mock if tests haven't provided one.
  if (typeof (global as any).fetch === 'undefined') {
    setupFetchMock();
  }

  // 配置 crypto mock
  setupCryptoMock();
});

afterEach(() => {
  // 清理所有 mock
  jest.clearAllMocks();
  // 重置 fetch mock
  (global.fetch as jest.Mock).mockReset();
});

/**
 * 配置完整的 fetch mock
 * 支持 JSON 响应、流式响应、错误处理
 */
function setupFetchMock() {
  (global as any).fetch = jest.fn((url: any, options?: any) => {
    // 模拟不同的 API 端点

    // OpenAI API
    if (url.includes('openai.com')) {
      if (options?.headers?.authorization === 'Bearer test-openai-key') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 'chatcmpl-test',
              object: 'chat.completion',
              created: Date.now(),
              model: 'gpt-4',
              choices: [
                {
                  index: 0,
                  message: {
                    role: 'assistant',
                    content: 'Test response from OpenAI',
                  },
                  finish_reason: 'stop',
                },
              ],
              usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }
          )
        );
      } else {
        return Promise.resolve(
          new Response(JSON.stringify({ error: { message: 'Unauthorized' } }), {
            status: 401,
            headers: { 'content-type': 'application/json' },
          })
        );
      }
    }

    // Anthropic API
    if (url.includes('anthropic.com')) {
      if (options?.headers?.['x-api-key'] === 'test-anthropic-key') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 'msg_test',
              type: 'message',
              role: 'assistant',
              content: [
                {
                  type: 'text',
                  text: 'Test response from Anthropic',
                },
              ],
              model: 'claude-3-opus',
              stop_reason: 'end_turn',
              usage: { input_tokens: 10, output_tokens: 10 },
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }
          )
        );
      } else {
        return Promise.resolve(
          new Response(JSON.stringify({ error: { message: 'Unauthorized' } }), {
            status: 401,
            headers: { 'content-type': 'application/json' },
          })
        );
      }
    }

    // Ollama API（本地）
    if (url.includes('localhost:11434')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            model: 'llama2',
            created_at: new Date().toISOString(),
            response: 'Test response from Ollama',
            done: true,
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }
        )
      );
    }

    // Pi Network API
    if (url.includes('api.pi')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            accessToken: 'test-access-token',
            user: { uid: 'test-uid', username: 'testuser' },
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }
        )
      );
    }

    // 默认错误响应
    return Promise.resolve(
      new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      })
    );
  });
}

/**
 * 配置 crypto mock（Node.js 兼容性）
 */
function setupCryptoMock() {
  if (typeof global.crypto === 'undefined') {
    (global as any).crypto = {
      getRandomValues: (arr: any) => nodeCrypto.randomFillSync(arr),
      subtle: {
        sign: async (algorithm: string, key: any, data: any) => {
          return nodeCrypto.sign(algorithm as any, data, key) as any;
        },
        verify: async (algorithm: string, key: any, signature: any, data: any) => {
          return nodeCrypto.verify(algorithm as any, data, key, signature) as any;
        },
      },
    };
  }
}
