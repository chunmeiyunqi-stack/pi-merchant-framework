import { ReadableStream } from 'stream/web';

if (typeof global.Request === 'undefined') {
  global.Request = class Request {} as any;
}
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    body: unknown;
    init: any;
    constructor(body: unknown, init?: any) {
      this.body = body;
      this.init = init;
    }
    get status() {
      return this.init?.status || 200;
    }
    get headers() {
      const h = this.init?.headers || {};
      return { get: (k: string) => h[k] || h[k.toLowerCase()] };
    }
    static json(data: unknown, init?: any) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
      });
    }
  } as any;
} else if (!(global.Response as any).json) {
  (global.Response as any).json = function (data: unknown, init?: any) {
    return new global.Response(JSON.stringify(data), {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  };
}

if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = ReadableStream as any;
}
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

import { POST } from '../route';
import { streamMerchantAiResponse } from '@pi-merchant/pi-sdk';
import { verifySessionToken } from '@/lib/session';
import { cookies } from 'next/headers';

jest.mock('@pi-merchant/pi-sdk', () => ({
  streamMerchantAiResponse: jest.fn(),
  logError: jest.fn(),
  runWithTenant: jest.fn((_id: string, fn: () => any) => fn()),
  checkQuota: jest.fn().mockReturnValue({ isExceeded: false }),
  trackUsage: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  verifySessionToken: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('POST /api/ai/stream', () => {
  let mockRequest: { json: jest.Mock; signal: any };
  let mockSignal: { aborted: boolean; addEventListener: jest.Mock; removeEventListener: jest.Mock };
  let mockCookies: { get: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSignal = {
      aborted: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    mockRequest = {
      json: jest.fn().mockResolvedValue({ prompt: 'test prompt' }),
      signal: mockSignal,
    };

    mockCookies = {
      get: jest.fn().mockReturnValue({ value: 'valid-token' }),
    };

    (cookies as jest.Mock).mockReturnValue(mockCookies);
    (verifySessionToken as jest.Mock).mockReturnValue(true);
  });

  const readStream = async (stream: ReadableStream) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let isDone = false;
    while (!isDone) {
      const { done, value } = await reader.read();
      if (done) {
        isDone = true;
        break;
      }
      result += decoder.decode(value);
    }
    return result;
  };

  it('returns 401 if unauthorized', async () => {
    mockCookies.get.mockReturnValue(undefined);
    const response = await POST(mockRequest as any);
    expect(response.status).toBe(401);
  });

  it('returns 400 if JSON is invalid', async () => {
    mockRequest.json.mockRejectedValue(new Error('Invalid JSON'));
    const response = await POST(mockRequest as any);
    expect(response.status).toBe(400);
  });

  it('returns 400 if prompt is missing', async () => {
    mockRequest.json.mockResolvedValue({});
    const response = await POST(mockRequest as any);
    expect(response.status).toBe(400);
  });

  it('streams response successfully', async () => {
    async function* mockStream() {
      yield { content: 'chunk1', done: false };
      yield { content: 'chunk2', done: true };
    }
    (streamMerchantAiResponse as jest.Mock).mockReturnValue(mockStream());

    const response = await POST(mockRequest as any);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    const result = await readStream(response.body as ReadableStream);
    expect(result).toContain('data: {"content":"chunk1"}\n\n');
    expect(result).toContain('data: {"content":"chunk2"}\n\n');
    expect(result).toContain('data: [DONE]\n\n');
  });

  it('sends error event if stream fails', async () => {
    async function* mockStream() {
      yield { content: 'chunk1', done: false };
      throw new Error('Stream failed');
    }
    (streamMerchantAiResponse as jest.Mock).mockReturnValue(mockStream());

    const response = await POST(mockRequest as any);
    expect(response.status).toBe(200);

    const result = await readStream(response.body as ReadableStream);
    expect(result).toContain('data: {"content":"chunk1"}\n\n');
    expect(result).toContain('event: error\ndata: {"message":"Stream failed"}\n\n');
  });

  it('stops streaming when request is aborted', async () => {
    async function* mockStream() {
      yield { content: 'chunk1', done: false };
      mockSignal.aborted = true; // Simulate abort
      yield { content: 'chunk2', done: false };
    }
    (streamMerchantAiResponse as jest.Mock).mockReturnValue(mockStream());

    const response = await POST(mockRequest as any);
    const result = await readStream(response.body as ReadableStream);

    expect(result).toContain('data: {"content":"chunk1"}\n\n');
    expect(result).not.toContain('chunk2');
  });
});
