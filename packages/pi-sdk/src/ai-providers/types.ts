// ============================================================
// Pioneer AI Framework — AI 提供商统一接口定义
//
// Strategy Pattern: 定义统一行为契约
// 所有 AI 提供商（OpenAI / Anthropic / Ollama）均实现此接口
// ============================================================

/**
 * 支持的 AI 提供商标识
 */
export type AIProviderName = 'openai' | 'anthropic' | 'ollama';

/**
 * 提供商配置
 */
export interface AIProviderConfig {
  /** API 密钥（Ollama 无需设置） */
  apiKey?: string;
  /** API 基础地址 */
  baseUrl?: string;
  /** 默认模型名称 */
  defaultModel: string;
  /** 请求超时时间（毫秒），默认 30000 */
  timeout?: number;
}

/**
 * 统一消息格式
 */
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * 提供商级别请求（内部使用）
 */
export interface AIProviderRequest {
  /** 消息列表 */
  messages: AIMessage[];
  /** 模型名称（不传则使用提供商默认模型） */
  model?: string;
  /** 温度参数 (0-2) */
  temperature?: number;
  /** 最大生成 token 数 */
  maxTokens?: number;
}

/**
 * 提供商级别响应（内部使用）
 */
export interface AIProviderResponse {
  /** 生成的文本内容 */
  content: string;
  /** 实际使用的模型 */
  model: string;
  /** 提供商标识 */
  provider: AIProviderName;
  /** Token 用量统计 */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * 流式响应块
 */
export interface AIStreamChunk {
  /** 增量文本内容 */
  content: string;
  /** 是否为最后一个块 */
  done: boolean;
}

/**
 * Strategy Pattern: 统一 AI 提供商接口
 *
 * 所有提供商必须实现此接口，保证调用方无需感知具体实现差异。
 * 各提供商负责：
 *   1. 将统一请求格式转换为自身 API 格式
 *   2. 将自身 API 响应转换为统一响应格式
 *   3. 处理认证、错误映射等差异化逻辑
 */
export interface AIProvider {
  /** 提供商标识名称 */
  readonly name: AIProviderName;

  /**
   * 发送聊天请求并返回完整响应
   * @param request - 统一格式的请求
   * @returns 统一格式的响应
   * @throws Error 当 API 调用失败时
   */
  chat(request: AIProviderRequest): Promise<AIProviderResponse>;

  /**
   * 检查提供商是否可用（API Key 存在、服务可达等）
   * 用于 Factory 路由时的预检查
   */
  isAvailable(): boolean;

  /**
   * 健康检查：验证提供商服务是否正常响应
   * 比 isAvailable() 更严格，会实际发送测试请求
   */
  healthCheck(): Promise<boolean>;
}

/**
 * 路由决策日志
 */
export interface RoutingDecision {
  /** 请求的提供商 */
  requested?: AIProviderName;
  /** 实际使用的提供商 */
  actual: AIProviderName;
  /** 是否经过 fallback */
  fallback: boolean;
  /** fallback 过程中跳过的提供商及原因 */
  skipped?: Array<{ provider: AIProviderName; reason: string }>;
  /** 路由耗时（毫秒） */
  routingTimeMs: number;
}
