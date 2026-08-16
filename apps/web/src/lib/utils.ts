export function getMerchantId(req?: Request): string {
  if (req) {
    const headerMerchantId = req.headers.get('x-merchant-id');
    if (headerMerchantId) {
      return headerMerchantId;
    }
  }

  return (
    process.env.NEXT_PUBLIC_MERCHANT_ID ||
    process.env.NEXT_PUBLIC_DEFAULT_MERCHANT_ID ||
    'merchant-demo-001'
  );
}
