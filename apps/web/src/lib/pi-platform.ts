/**
 * Pi Platform API 根地址（不含 /v2 后缀）。
 *
 * PI_PLATFORM_API_BASE 允许配成两种形式：
 *   - https://api.minepi.com          （推荐）
 *   - https://api.minepi.com/v2       （旧配置，可能带 /v2）
 *
 * 统一去掉结尾的 /v2 和斜杠，避免上层再拼 /v2/me 或 /v2/payments 时
 * 出现 https://api.minepi.com/v2/v2/me → 404 的问题。
 */
export function piPlatformBase(): string {
  const raw = (process.env.PI_PLATFORM_API_BASE ?? 'https://api.minepi.com').trim();
  // 去掉结尾斜杠，再去掉结尾的 /v<数字>（兼容 /v2、/v1 等任何版本号写法）
  return raw.replace(/\/+$/, '').replace(/\/v\d+$/i, '');
}
