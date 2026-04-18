// apps/web/src/lib/pi-client.ts

export const initPiSDK = () => {
  if (typeof window !== 'undefined' && (window as any).Pi) {
    const Pi = (window as any).Pi;
    // Set sandbox mode dynamically (usually true in development)
    const isSandbox = process.env.NEXT_PUBLIC_PI_SANDBOX === 'true';
    Pi.init({ version: '2.0', sandbox: isSandbox });
    return Pi;
  }
  return null;
};

interface CreatePaymentOptions {
  amount: number;
  memo: string;
  metadata: Record<string, any>;
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: any, payment?: any) => void;
}

export const createPiPayment = async (options: CreatePaymentOptions) => {
  const Pi = initPiSDK();
  if (!Pi) {
    throw new Error('Pi SDK is not loaded. Please access this app via Pi Browser.');
  }

  return Pi.createPayment(
    {
      amount: options.amount,
      memo: options.memo,
      metadata: options.metadata,
    },
    {
      onReadyForServerApproval: options.onReadyForServerApproval,
      onReadyForServerCompletion: options.onReadyForServerCompletion,
      onCancel: options.onCancel,
      onError: options.onError,
    }
  );
};
