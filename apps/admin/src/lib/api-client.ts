export class ApiClientError extends Error {
  code: number;
  traceId?: string;

  constructor(message: string, code = 500, traceId?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.traceId = traceId;
  }
}

export async function fetchApi<T = any>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
    });

    const json = await res.json().catch(() => null);

    // 1. 401 身份鉴权失效 -> 强行重定向至 /login
    if (res.status === 401 || json?.code === 401) {
      if (typeof window !== 'undefined') {
        document.cookie = 'pi_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        window.location.href = '/login';
      }
      throw new ApiClientError(json?.msg || '未登录或会话凭证已过期', 401, json?.traceId);
    }

    // 2. HTTP Status 非 200 或 code 非 0 异常 -> 抛出错误触发 TanStack Error Boundary
    if (!res.ok || (json && typeof json.code === 'number' && json.code !== 0)) {
      const errorMsg = json?.msg || json?.error || `请求失败 (${res.status})`;
      throw new ApiClientError(errorMsg, json?.code || res.status, json?.traceId);
    }

    // 3. 返回解析后的真实 data 数据
    if (json && 'data' in json) {
      return json.data as T;
    }

    return json as T;
  } catch (err) {
    if (err instanceof ApiClientError) {
      throw err;
    }
    throw new ApiClientError(err instanceof Error ? err.message : '网络连接异常', 500);
  }
}
