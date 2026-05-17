import type { PiSDK } from '@pi-merchant/pi-sdk/types/pi';

declare global {
  interface Window {
    Pi: PiSDK;
  }
}

export {};
