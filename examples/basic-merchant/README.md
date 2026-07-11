# Basic Merchant Example

Minimal example showing how to integrate Pi Merchant Framework SDK into a merchant application.

## Quick Start

```bash
pnpm add @pi-merchant/pi-sdk
```

## Pi Sign-In

```tsx
import { authenticateWithPi } from '@pi-merchant/pi-sdk';

// Trigger Pi Sign-In popup
const result = await authenticateWithPi({
  onSuccess: (token) => console.log('Authenticated', token),
  onError: (err) => console.error('Auth failed', err),
});
```

## Verify Payment

```ts
import { verifyPaymentSignature } from '@pi-merchant/pi-sdk';

const isValid = verifyPaymentSignature(receivedPayload, signature, secret);
// → true / false
```

## Full Example

See `src/app.tsx` for a complete merchant integration example.
