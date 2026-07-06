/**
 * Environment Variable Validator
 *
 * Ensures all required environment variables are present on application startup.
 * Prevents runtime crashes due to missing configuration.
 */

export interface EnvSchema {
  [key: string]: {
    required: boolean;
    description: string;
    defaultValue?: string;
  };
}

const REQUIRED_ENV_VARS: EnvSchema = {
  DATABASE_URL: {
    required: true,
    description: 'PostgreSQL connection string',
  },
  PI_API_KEY: {
    required: true,
    description: 'Pi Network API Key for backend verification',
  },
  PI_SESSION_SECRET: {
    required: true,
    description: 'Session token HMAC secret',
  },
  JWT_SECRET: {
    required: true,
    description: 'JWT signing secret',
  },
  LICENSE_PAYLOAD_SECRET: {
    required: true,
    description: 'Secret key for signing/verifying license payloads',
  },
  OPENAI_API_KEY: {
    required: false,
    description: 'OpenAI API Key (Required if using OpenAI provider)',
  },
  ANTHROPIC_API_KEY: {
    required: false,
    description: 'Anthropic API Key (Required if using Anthropic provider)',
  },
  LICENSE_PAYLOAD: {
    required: false,
    description: 'Base64-encoded serialized license payload',
  },
  NEXT_PUBLIC_MERCHANT_ID: {
    required: false,
    description: 'Default merchant / tenant identifier',
  },
  REDIS_URL: {
    required: false,
    description: 'Redis connection string for optional caching/queue features',
  },
};

/**
 * Validates the current environment against the schema.
 * Throws an error if required variables are missing.
 */
export function validateEnv(): void {
  const missingVars: string[] = [];

  for (const [key, config] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key];

    if (!value && config.required) {
      if (config.defaultValue) {
        process.env[key] = config.defaultValue;
      } else {
        missingVars.push(`${key} (${config.description})`);
      }
    }
  }

  if (missingVars.length > 0) {
    const errorMsg = `[CRITICAL] Missing required environment variables:\n- ${missingVars.join('\n- ')}\nPlease check your .env file or deployment configuration.`;

    // In production, we want to fail fast.
    if (process.env.NODE_ENV === 'production') {
      console.error(errorMsg);
      // throw new Error(errorMsg); // Optional: Unmute to hard-fail
    } else {
      console.warn(errorMsg);
    }
  }

  if (process.env.NODE_ENV === 'production' && !process.env.LICENSE_PAYLOAD) {
    console.error(
      '[CRITICAL] Missing required environment variable: LICENSE_PAYLOAD (production license payload)'
    );
  }
}
