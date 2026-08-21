export interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: unknown) => void;
}

export interface PiSDK {
  // Pi.init 返回 Promise：SDK 内部 initialized 标志在 Promise resolve 后才置位，
  // createPayment 依赖该状态，未初始化会同步抛错。
  init: (config: { version: string; sandbox?: boolean }) => Promise<void>;
  authenticate: (
    scopes: string[],
    onIncomplete?: (payment: unknown) => void
  ) => Promise<{ user: { uid: string; username: string }; accessToken: string }>;
  createPayment: (
    data: { amount: number; memo: string; metadata: object },
    callbacks: PiPaymentCallbacks
  ) => void;
}

declare global {
  interface Window {
    Pi: PiSDK;
    // 由 apps/web 根布局内联脚本写入：Pi.init() 返回的 Promise，供客户端 await
    __piInitPromise?: Promise<void>;
  }
}

export {};
