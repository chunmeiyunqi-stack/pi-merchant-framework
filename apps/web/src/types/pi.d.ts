interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: unknown) => void;
}

interface PiSDK {
  init: (config: { version: string; sandbox?: boolean }) => void;
  authenticate: (
    scopes: string[],
    onIncomplete: (payment: unknown) => void
  ) => Promise<{ user: { uid: string; username: string } }>;
  createPayment: (
    data: { amount: number; memo: string; metadata: object },
    callbacks: PiPaymentCallbacks
  ) => void;
}

interface Window {
  Pi?: PiSDK;
}
