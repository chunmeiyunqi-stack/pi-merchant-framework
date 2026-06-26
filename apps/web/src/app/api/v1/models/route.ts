// ============================================================
// Pioneer AI Framework — GET /api/v1/models
// 返回所有可用的 AI 模型列表
// ============================================================

import { NextResponse } from 'next/server';
// Require Node.js runtime for server-side APIs that use Node built-ins (crypto, process, etc.)
export const runtime = 'nodejs';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';
import { withMetrics } from '@/lib/metrics-middleware';
// Use dynamic import to avoid edge-runtime issues with the factory singleton
let _factory: import('@pi-merchant/pi-sdk').AIProviderFactory | null = null;
async function getFactory() {
  if (!_factory) {
    const { getProviderFactory } = await import('@pi-merchant/pi-sdk');
    _factory = getProviderFactory();
  }
  return _factory;
}

export const dynamic = 'force-dynamic';

interface ModelInfo {
  id: string;
  provider: string;
  name: string;
  description: string;
  capabilities: string[];
  maxTokens: number;
  available: boolean;
}

const MODEL_CATALOG: ModelInfo[] = [
  {
    id: 'gpt-4o',
    provider: 'openai',
    name: 'GPT-4o',
    description: 'OpenAI 最强大的多模态模型，支持文本和图像分析',
    capabilities: ['text', 'vision', 'stream'],
    maxTokens: 128000,
    available: !!process.env.OPENAI_API_KEY,
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    name: 'GPT-4o Mini',
    description: '高速、低成本的 GPT-4o 精简版，适合日常对话',
    capabilities: ['text', 'stream'],
    maxTokens: 128000,
    available: !!process.env.OPENAI_API_KEY,
  },
  {
    id: 'dall-e-3',
    provider: 'openai',
    name: 'DALL-E 3',
    description: 'OpenAI 图像生成模型，支持高质量文字转图像',
    capabilities: ['image-generation'],
    maxTokens: 4000,
    available: !!process.env.OPENAI_API_KEY,
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
    name: 'Claude 3.5 Sonnet',
    description: 'Anthropic 旗舰模型，擅长复杂推理和代码任务',
    capabilities: ['text', 'vision', 'stream'],
    maxTokens: 200000,
    available: !!process.env.ANTHROPIC_API_KEY,
  },
  {
    id: 'claude-3-haiku-20240307',
    provider: 'anthropic',
    name: 'Claude 3 Haiku',
    description: '快速轻量版 Claude，适合实时交互场景',
    capabilities: ['text', 'stream'],
    maxTokens: 200000,
    available: !!process.env.ANTHROPIC_API_KEY,
  },
  {
    id: 'llama3.1',
    provider: 'ollama',
    name: 'Llama 3.1 (Local)',
    description: '本地部署的开源模型，数据完全不出境，适合隐私敏感场景',
    capabilities: ['text', 'stream'],
    maxTokens: 8192,
    available: !!process.env.OLLAMA_BASE_URL,
  },
  {
    id: 'mistral',
    provider: 'ollama',
    name: 'Mistral (Local)',
    description: '本地轻量级开源模型，推理速度快',
    capabilities: ['text', 'stream'],
    maxTokens: 8192,
    available: !!process.env.OLLAMA_BASE_URL,
  },
];

async function __GET() {
  // Verify authentication
  const token = cookies().get('pi_auth_token')?.value;
  if (!token || !verifySessionToken(token)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get factory to check which providers are actually available
    const factory = await getFactory();
    const availableProviders = factory.getAvailableProviders().map((p: any) => p.name);
    const primaryProvider = factory.getPrimaryProviderName();

    // Mark models as available based on provider availability
    const models = MODEL_CATALOG.map((model) => ({
      ...model,
      available:
        model.available &&
        availableProviders.includes(model.provider as 'openai' | 'anthropic' | 'ollama'),
    }));

    return NextResponse.json({
      success: true,
      data: {
        models,
        primaryProvider,
        availableProviders,
        total: models.length,
        availableCount: models.filter((m) => m.available).length,
      },
    });
  } catch (error) {
    console.error('[API Error Stack]:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch models';
    return NextResponse.json(
      {
        success: false,
        error: message,
        stack:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.stack
              : undefined
            : undefined,
      },
      { status: 500 }
    );
  }
}

export const GET = withMetrics(__GET);


