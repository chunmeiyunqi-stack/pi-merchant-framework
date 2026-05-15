// packages/pi-sdk/src/__tests__/license/validator.test.ts

import {
  buildSignablePayload,
  deserializeLicense,
  getLicenseStatus,
  hasFeature,
  isExpiringsoon,
  validateLicense,
  type SerializedLicense,
} from '../../license';

// ──────────────────────────────────────────────
// 测试数据工厂
// ──────────────────────────────────────────────

function makeRawLicense(overrides: Partial<SerializedLicense> = {}): SerializedLicense {
  return {
    id: 'lic_test_001',
    issuedTo: 'Acme Corp',
    merchantId: 'merchant_abc',
    issuedAt: '2025-01-01T00:00:00.000Z',
    expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(), // 1 year from now
    tier: 'professional',
    features: ['ai_routing', 'streaming', 'usage_tracking', 'webhook_monitoring'],
    maxRequestsPerMonth: 10000,
    signature: 'test-signature',
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// buildSignablePayload
// ──────────────────────────────────────────────

describe('buildSignablePayload', () => {
  it('produces a deterministic pipe-delimited string', () => {
    const raw = makeRawLicense();
    const payload = buildSignablePayload(raw);

    expect(payload).toContain('lic_test_001');
    expect(payload).toContain('Acme Corp');
    expect(payload).toContain('merchant_abc');
    expect(payload).toContain('professional');
    // features should be sorted
    expect(payload).toContain('ai_routing,streaming,usage_tracking,webhook_monitoring');
  });

  it('sorts features alphabetically for canonical order', () => {
    const raw = makeRawLicense({
      features: ['streaming', 'ai_routing', 'webhook_monitoring', 'usage_tracking'],
    });
    const payload = buildSignablePayload(raw);
    expect(payload).toContain('ai_routing,streaming,usage_tracking,webhook_monitoring');
  });

  it('handles empty maxRequestsPerMonth gracefully', () => {
    const raw = makeRawLicense({ maxRequestsPerMonth: undefined });
    const payload = buildSignablePayload(raw);
    expect(payload).toBeTruthy();
    expect(() => buildSignablePayload(raw)).not.toThrow();
  });
});

// ──────────────────────────────────────────────
// deserializeLicense
// ──────────────────────────────────────────────

describe('deserializeLicense', () => {
  it('converts ISO strings to Date objects', () => {
    const raw = makeRawLicense();
    const license = deserializeLicense(raw);

    expect(license.issuedAt).toBeInstanceOf(Date);
    expect(license.expiresAt).toBeInstanceOf(Date);
  });

  it('preserves all other fields', () => {
    const raw = makeRawLicense();
    const license = deserializeLicense(raw);

    expect(license.id).toBe('lic_test_001');
    expect(license.issuedTo).toBe('Acme Corp');
    expect(license.tier).toBe('professional');
    expect(license.features).toHaveLength(4);
    expect(license.maxRequestsPerMonth).toBe(10000);
  });
});

// ──────────────────────────────────────────────
// validateLicense
// ──────────────────────────────────────────────

describe('validateLicense', () => {
  it('returns valid for a well-formed active license (skip signature)', async () => {
    const raw = makeRawLicense();
    const license = deserializeLicense(raw);
    const result = await validateLicense(license, raw, { skipSignatureCheck: true });

    expect(result.valid).toBe(true);
    expect(result.status).toBe('valid');
    expect(result.daysRemaining).toBeGreaterThan(0);
  });

  it('returns invalid for expired license', async () => {
    const raw = makeRawLicense({
      expiresAt: new Date(Date.now() - 86400000).toISOString(), // yesterday
    });
    const license = deserializeLicense(raw);
    const result = await validateLicense(license, raw, { skipSignatureCheck: true });

    expect(result.valid).toBe(false);
    expect(result.status).toBe('expired');
    expect(result.daysRemaining).toBeLessThan(0);
    expect(result.error).toMatch(/expired/i);
  });

  it('passes when requiredFeatures are present', async () => {
    const raw = makeRawLicense({ features: ['ai_routing', 'streaming'] });
    const license = deserializeLicense(raw);
    const result = await validateLicense(license, raw, {
      skipSignatureCheck: true,
      requiredFeatures: ['ai_routing'],
    });

    expect(result.valid).toBe(true);
  });

  it('fails when requiredFeatures are missing', async () => {
    const raw = makeRawLicense({ features: ['ai_routing'] });
    const license = deserializeLicense(raw);
    const result = await validateLicense(license, raw, {
      skipSignatureCheck: true,
      requiredFeatures: ['multi_tenant'],
    });

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/multi_tenant/);
  });

  it('respects skipExpiryCheck option', async () => {
    const raw = makeRawLicense({
      expiresAt: new Date(Date.now() - 86400000).toISOString(),
    });
    const license = deserializeLicense(raw);
    const result = await validateLicense(license, raw, {
      skipSignatureCheck: true,
      skipExpiryCheck: true,
    });

    expect(result.valid).toBe(true);
  });

  it('fails with missing public key when signature check is enabled', async () => {
    const originalKey = process.env.LICENSE_PUBLIC_KEY;
    delete process.env.LICENSE_PUBLIC_KEY;

    const raw = makeRawLicense();
    const license = deserializeLicense(raw);
    const result = await validateLicense(license, raw, { skipSignatureCheck: false });

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/LICENSE_PUBLIC_KEY/);

    process.env.LICENSE_PUBLIC_KEY = originalKey;
  });
});

// ──────────────────────────────────────────────
// hasFeature
// ──────────────────────────────────────────────

describe('hasFeature', () => {
  it('returns true for included feature', () => {
    const license = deserializeLicense(makeRawLicense({ features: ['ai_routing', 'streaming'] }));
    expect(hasFeature(license, 'ai_routing')).toBe(true);
  });

  it('returns false for excluded feature', () => {
    const license = deserializeLicense(makeRawLicense({ features: ['ai_routing'] }));
    expect(hasFeature(license, 'multi_tenant')).toBe(false);
  });
});

// ──────────────────────────────────────────────
// isExpiringsoon
// ──────────────────────────────────────────────

describe('isExpiringsoon', () => {
  it('returns true when license expires within 30 days', () => {
    const license = deserializeLicense(
      makeRawLicense({
        expiresAt: new Date(Date.now() + 15 * 86400000).toISOString(),
      })
    );
    expect(isExpiringsoon(license, 30)).toBe(true);
  });

  it('returns false when license expires beyond 30 days', () => {
    const license = deserializeLicense(
      makeRawLicense({
        expiresAt: new Date(Date.now() + 60 * 86400000).toISOString(),
      })
    );
    expect(isExpiringsoon(license, 30)).toBe(false);
  });
});

// ──────────────────────────────────────────────
// getLicenseStatus
// ──────────────────────────────────────────────

describe('getLicenseStatus', () => {
  it('returns valid for active license', () => {
    const license = deserializeLicense(makeRawLicense());
    expect(getLicenseStatus(license)).toBe('valid');
  });

  it('returns expired for past expiry', () => {
    const license = deserializeLicense(
      makeRawLicense({
        expiresAt: new Date(Date.now() - 86400000).toISOString(),
      })
    );
    expect(getLicenseStatus(license)).toBe('expired');
  });
});
