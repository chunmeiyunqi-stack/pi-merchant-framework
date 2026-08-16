export function cn(...inputs: (string | false | null | undefined)[]) {
  return inputs.filter(Boolean).join(' ');
}

export function getMerchantId() {
  return (
    process.env.NEXT_PUBLIC_MERCHANT_ID ||
    process.env.NEXT_PUBLIC_DEFAULT_MERCHANT_ID ||
    'merchant-demo-001'
  );
}
