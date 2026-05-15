// ============================================================
// Pioneer AI Framework — AI 服务入口（向后兼容层）
//
// 重构说明：
//   V1.0 — 直连 OpenAI API（硬编码）
//   V1.2 — 委托给 AIProviderFactory 路由器（Strategy + Factory 模式）
//
// 向后兼容保证：
//   - generateMerchantAiResponse() 方法签名不变
//   - 不传 provider 时行为与 V1.0 一致（默认 OpenAI）
//   - AIRequest / AIResponse 类型仅新增可选字段
// ============================================================

import { logEvent, logError } from './logger';
import { getProviderFactory } from './ai-providers/factory';
import type { AIRequest, AIResponse } from './types';
import type { AIProviderName, AIStreamChunk } from './ai-providers/types';

/**
 * 构建 merchant 上下文的 system prompt
 */
function buildSystemPrompt(merchantId: string) {
  return `You are the Pioneer AI assistant for merchant ${merchantId}. Answer clearly and concisely with an emphasis on merchant operations, payment flow, appointments, and customer service in the context of a SaaS business platform.`;
}

/**
 * 生成商户 AI 响应（核心入口）
 *
 * 方法签名与 V1.0 完全兼容：
 *   - 不传 provider → 使用 AI_PRIMARY_PROVIDER 环境变量（默认 openai）
 *   - 不传 model → 使用对应提供商的默认模型
 *   - 主提供商失败 → 自动 fallback 到备选提供商
 *
 * @param request - AI 请求参数
 * @returns AI 响应（success/result/error + provider/model 元数据）
 */
export async function generateMerchantAiResponse({
  merchantId,
  prompt,
  model,
  temperature,
  provider,
}: AIRequest): Promise<AIResponse> {
  try {
    const factory = getProviderFactory();

    const response = await factory.route(
      {
        messages: [
          { role: 'system', content: buildSystemPrompt(merchantId) },
          { role: 'user', content: prompt },
        ],
        model,
        temperature: temperature ?? 0.6,
        maxTokens: 512,
      },
      provider as AIProviderName | undefined
    );

    logEvent('AI response generated', {
      merchantId,
      provider: response.provider,
      model: response.model,
      fallback: response.routing.fallback,
      promptPreview: prompt.slice(0, 120),
    });

    return {
      success: true,
      result: response.content,
      provider: response.provider,
      model: response.model,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logError('AI service call failed', error, {
      merchantId,
      requestedProvider: provider,
      promptPreview: prompt.slice(0, 120),
    });

    return {
      success: false,
      error: errorMessage || 'AI service unavailable right now. Please try again later.',
    };
  }
}

/**
 * 生成商户 AI 流式响应
 *
 * @param request - AI 请求参数
 * @returns AI 流式块异步迭代器
 */
export async function* streamMerchantAiResponse({
  merchantId,
  prompt,
  model,
  temperature,
  provider,
}: AIRequest): AsyncIterable<AIStreamChunk> {
  const factory = getProviderFactory();

  try {
    const stream = factory.routeStream(
      {
        messages: [
          { role: 'system', content: buildSystemPrompt(merchantId) },
          { role: 'user', content: prompt },
        ],
        model,
        temperature: temperature ?? 0.6,
        maxTokens: 512,
      },
      provider as AIProviderName | undefined
    );

    yield* stream;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('AI stream service call failed', error, {
      merchantId,
      requestedProvider: provider,
      promptPreview: prompt.slice(0, 120),
    });
    throw new Error(errorMessage || 'AI stream service unavailable right now.');
  }
}
