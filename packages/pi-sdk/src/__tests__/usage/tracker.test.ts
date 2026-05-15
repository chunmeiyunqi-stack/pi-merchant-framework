// packages/pi-sdk/src/__tests__/usage/tracker.test.ts

import {
  assertQuotaNotExceeded,
  checkQuota,
  flushToWebhook,
  getBufferSize,
  getMonthlyUsage,
  resetUsageTracker,
  startUsageFlush,
  stopUsageFlush,
  summarizeUsage,
  trackUsage,
} from '../../usage';

const TENANT_ID = 'tenant_usage_test';
const MERCHANT_ID = 'merchant_test_001';

beforeEach(() => {
  resetUsageTracker();
  jest.clearAllMocks();
});

afterEach(() => {
  stopUsageFlush();
});

// ──────────────────────────────────────────────
// trackUsage
// ──────────────────────────────────────────────

describe('trackUsage', () => {
  it('returns a usage record with generated ID and timestamp', () => {
    const record = trackUsage({
      tenantId: TENANT_ID,
      merchantId: MERCHANT_ID,
      type: 'ai_request',
      success: true,
      provider: 'openai',
      latencyMs: 350,
      tokensUsed: 128,
    });

    expect(record.id).toMatch(/^usage_/);
    expect(record.tenantId).toBe(TENANT_ID);
    expect(record.type).toBe('ai_request');
    expect(record.timestamp).toBeInstanceOf(Date);
    expect(record.success).toBe(true);
    expect(record.tokensUsed).toBe(128);
  });

  it('increments buffer size', () => {
    expect(getBufferSize()).toBe(0);
    trackUsage({ tenantId: TENANT_ID, merchantId: MERCHANT_ID, type: 'api_call', success: true });
    expect(getBufferSize()).toBe(1);
  });

  it('increments monthly counter', () => {
    expect(getMonthlyUsage(TENANT_ID)).toBe(0);
    trackUsage({ tenantId: TENANT_ID, merchantId: MERCHANT_ID, type: 'ai_request', success: true });
    trackUsage({ tenantId: TENANT_ID, merchantId: MERCHANT_ID, type: 'ai_request', success: true });
    expect(getMonthlyUsage(TENANT_ID)).toBe(2);
  });

  it('tracks different event types correctly', () => {
    trackUsage({ tenantId: TENANT_ID, merchantId: MERCHANT_ID, type: 'auth', success: true });
    trackUsage({ tenantId: TENANT_ID, merchantId: MERCHANT_ID, type: 'payment', success: false });
    expect(getMonthlyUsage(TENANT_ID)).toBe(2);
  });
});

// ──────────────────────────────────────────────
// checkQuota
// ──────────────────────────────────────────────

describe('checkQuota', () => {
  it('returns correct quota status when under limit', () => {
    trackUsage({ tenantId: TENANT_ID, merchantId: MERCHANT_ID, type: 'ai_request', success: true });
    const status = checkQuota(TENANT_ID, MERCHANT_ID, 100);

    expect(status.usedRequestsThisMonth).toBe(1);
    expect(status.maxRequestsPerMonth).toBe(100);
    expect(status.remainingRequests).toBe(99);
    expect(status.isExceeded).toBe(false);
    expect(status.isNearLimit).toBe(false);
    expect(status.usageRatio).toBeCloseTo(0.01);
    expect(status.resetAt).toBeInstanceOf(Date);
  });

  it('flags isNearLimit at 80%+ usage', () => {
    for (let i = 0; i < 85; i++) {
      trackUsage({ tenantId: TENANT_ID, merchantId: MERCHANT_ID, type: 'api_call', success: true });
    }
    const status = checkQuota(TENANT_ID, MERCHANT_ID, 100);
    expect(status.isNearLimit).toBe(true);
    expect(status.isExceeded).toBe(false);
  });

  it('flags isExceeded when usage >= limit', () => {
    for (let i = 0; i < 10; i++) {
      trackUsage({
        tenantId: TENANT_ID,
        merchantId: MERCHANT_ID,
        type: 'ai_request',
        success: true,
      });
    }
    const status = checkQuota(TENANT_ID, MERCHANT_ID, 10);
    expect(status.isExceeded).toBe(true);
    expect(status.remainingRequests).toBe(0);
  });

  it('handles zero maxRequests gracefully', () => {
    const status = checkQuota(TENANT_ID, MERCHANT_ID, 0);
    expect(status.usageRatio).toBe(0);
    expect(status.isExceeded).toBe(false);
  });
});

// ──────────────────────────────────────────────
// assertQuotaNotExceeded
// ──────────────────────────────────────────────

describe('assertQuotaNotExceeded', () => {
  it('does not throw when under quota', () => {
    trackUsage({ tenantId: TENANT_ID, merchantId: MERCHANT_ID, type: 'ai_request', success: true });
    expect(() => assertQuotaNotExceeded(TENANT_ID, MERCHANT_ID, 100)).not.toThrow();
  });

  it('throws when quota is exceeded', () => {
    for (let i = 0; i < 5; i++) {
      trackUsage({
        tenantId: TENANT_ID,
        merchantId: MERCHANT_ID,
        type: 'ai_request',
        success: true,
      });
    }
    expect(() => assertQuotaNotExceeded(TENANT_ID, MERCHANT_ID, 5)).toThrow(/quota exceeded/i);
  });
});

// ──────────────────────────────────────────────
// summarizeUsage
// ──────────────────────────────────────────────

describe('summarizeUsage', () => {
  it('returns correct totals for a time period', () => {
    const start = new Date(Date.now() - 60000);

    trackUsage({
      tenantId: TENANT_ID,
      merchantId: MERCHANT_ID,
      type: 'ai_request',
      success: true,
      provider: 'openai',
      tokensUsed: 100,
      latencyMs: 200,
    });
    trackUsage({
      tenantId: TENANT_ID,
      merchantId: MERCHANT_ID,
      type: 'stream_request',
      success: false,
      provider: 'anthropic',
      latencyMs: 500,
    });

    const summary = summarizeUsage(TENANT_ID, MERCHANT_ID, start, new Date());

    expect(summary.totalRequests).toBe(2);
    expect(summary.successRequests).toBe(1);
    expect(summary.failedRequests).toBe(1);
    expect(summary.totalTokensUsed).toBe(100);
    expect(summary.avgLatencyMs).toBe(350);
    expect(summary.byType['ai_request']).toBe(1);
    expect(summary.byType['stream_request']).toBe(1);
    expect(summary.byProvider['openai']).toBe(1);
    expect(summary.byProvider['anthropic']).toBe(1);
  });

  it('excludes records outside the period', () => {
    // Record in the future (outside range)
    const futureStart = new Date(Date.now() + 10000);
    trackUsage({ tenantId: TENANT_ID, merchantId: MERCHANT_ID, type: 'api_call', success: true });

    const summary = summarizeUsage(
      TENANT_ID,
      MERCHANT_ID,
      futureStart,
      new Date(Date.now() + 20000)
    );
    expect(summary.totalRequests).toBe(0);
  });

  it('excludes records from other tenants', () => {
    const start = new Date(Date.now() - 60000);
    trackUsage({
      tenantId: 'other_tenant',
      merchantId: MERCHANT_ID,
      type: 'ai_request',
      success: true,
    });

    const summary = summarizeUsage(TENANT_ID, MERCHANT_ID, start, new Date());
    expect(summary.totalRequests).toBe(0);
  });
});

// ──────────────────────────────────────────────
// flushToWebhook
// ──────────────────────────────────────────────

describe('flushToWebhook', () => {
  it('returns 0 flushed when buffer is empty', async () => {
    const result = await flushToWebhook();
    expect(result.flushed).toBe(0);
    expect(result.failed).toBe(0);
  });

  it('flushes to console when USAGE_WEBHOOK_URL is not set', async () => {
    delete process.env.USAGE_WEBHOOK_URL;
    trackUsage({ tenantId: TENANT_ID, merchantId: MERCHANT_ID, type: 'ai_request', success: true });

    const result = await flushToWebhook();
    expect(result.flushed).toBe(1);
    expect(result.destination).toBe('console');
    expect(getBufferSize()).toBe(0);
  });

  it('re-queues records on fetch failure', async () => {
    process.env.USAGE_WEBHOOK_URL = 'https://invalid-webhook.test/usage';
    global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));

    trackUsage({ tenantId: TENANT_ID, merchantId: MERCHANT_ID, type: 'ai_request', success: true });
    const result = await flushToWebhook();

    expect(result.failed).toBe(1);
    expect(getBufferSize()).toBe(1); // re-queued

    delete process.env.USAGE_WEBHOOK_URL;
  });
});

// ──────────────────────────────────────────────
// startUsageFlush / stopUsageFlush
// ──────────────────────────────────────────────

describe('flush scheduler', () => {
  it('can start and stop without errors', () => {
    expect(() => startUsageFlush(10000)).not.toThrow();
    expect(() => stopUsageFlush()).not.toThrow();
  });

  it('ignores duplicate start calls', () => {
    startUsageFlush(10000);
    expect(() => startUsageFlush(10000)).not.toThrow();
    stopUsageFlush();
  });
});
