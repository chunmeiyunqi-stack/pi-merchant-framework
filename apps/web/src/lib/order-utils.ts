// ============================================================
// 订单号生成工具
// 格式：ORD-{YYYYMMDD}-{6位随机}
// ============================================================

export function generateOrderNo(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${dateStr}-${random}`;
}
