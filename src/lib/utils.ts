export function getMerchantId(): string {
  return process.env.NEXT_PUBLIC_MERCHANT_ID || 'merchant-demo-001';
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export default {};
