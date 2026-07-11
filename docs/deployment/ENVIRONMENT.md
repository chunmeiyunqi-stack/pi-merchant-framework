# Production Environment Variables

| Variable               | Required  | Source       | Description                                              |
| ---------------------- | --------- | ------------ | -------------------------------------------------------- |
| DATABASE_URL           | ✅        | Vercel/VPS   | PostgreSQL connection string                             |
| REDIS_URL              | ✅ Worker | VPS          | Redis for BullMQ                                         |
| JWT_SECRET             | ✅        | Generated    | 32-byte hex via `crypto.randomBytes(32).toString("hex")` |
| PI_SESSION_SECRET      | ✅        | Generated    | 32-byte hex                                              |
| LICENSE_PAYLOAD_SECRET | ✅        | Generated    | 32-byte hex                                              |
| LICENSE_PAYLOAD        | ✅        | Generated    | Base64 of `SerializedLicense` JSON                       |
| PI_API_KEY             | ✅        | Pi Dashboard | From developers.pi.com App Settings                      |
| OPENAI_API_KEY         | ✅        | OpenAI       | For AI image generation                                  |
| NEXT_PUBLIC_APP_URL    | ✅        | Your domain  | Frontend URL for Pi Sign-In redirect                     |

## Generate Secrets

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
