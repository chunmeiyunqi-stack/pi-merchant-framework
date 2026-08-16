import type { PiSDK } from '@pi-merchant/pi-sdk/src/types/pi';

declare global {
  interface Window {
    Pi: PiSDK;
  }
}

export {};
