// packages/pi-sdk/src/__tests__/license/validator.test.ts

import {
  buildSignablePayload,
  deserializeLicense,
  getLicenseStatus,
  hasFeature,
  isExpiringsoon,
  validateLicense,
  verifySignature,
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
    timestamp: Date.now(),
    nonce: 'test-nonce-12345',
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

  it('fails validation when nonce is missing or invalid', async () => {
    const rawNoNonce = makeRawLicense({ nonce: '' });
    const licenseNoNonce = deserializeLicense(rawNoNonce);
    const result = await validateLicense(licenseNoNonce, rawNoNonce, { skipSignatureCheck: true });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('missing or invalid nonce');
  });

  it('fails validation when timestamp is missing or negative', async () => {
    const rawNoTS = makeRawLicense({ timestamp: 0 });
    const licenseNoTS = deserializeLicense(rawNoTS);
    const result = await validateLicense(licenseNoTS, rawNoTS, { skipSignatureCheck: true });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('missing or invalid timestamp');
  });

  it('fails validation when timestamp is in the far future', async () => {
    const rawFutureTS = makeRawLicense({ timestamp: Date.now() + 10 * 60 * 1000 }); // +10 minutes
    const licenseFutureTS = deserializeLicense(rawFutureTS);
    const result = await validateLicense(licenseFutureTS, rawFutureTS, {
      skipSignatureCheck: true,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('timestamp is in the future');
  });
});

// ──────────────────────────────────────────────
// Signature Verification (HMAC and RSA)
// ──────────────────────────────────────────────

describe('verifySignature (HMAC and RSA)', () => {
  it('correctly verifies valid HMAC signatures', async () => {
    const crypto = await import('crypto');
    const secret = 'my-test-hmac-secret-key-string-longer';
    const secretBase64 = Buffer.from(secret).toString('base64');
    const payload = 'canonical-data-pipe-separated';

    const sigBase64 = crypto
      .createHmac('sha256', Buffer.from(secretBase64, 'base64'))
      .update(payload)
      .digest('base64');

    const isValid = await verifySignature(payload, sigBase64, secretBase64);
    expect(isValid).toBe(true);

    const isInvalid = await verifySignature(payload + '-altered', sigBase64, secretBase64);
    expect(isInvalid).toBe(false);
  });

  it('correctly verifies valid RSA signatures', async () => {
    const crypto = await import('crypto');
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const payload = 'canonical-data-for-rsa-signature';

    const signer = crypto.createSign('SHA256');
    signer.update(payload);
    signer.end();
    const sigBase64 = signer.sign(privateKey, 'base64');

    const isValid = await verifySignature(payload, sigBase64, publicKey);
    expect(isValid).toBe(true);

    const isInvalidPayload = await verifySignature(payload + '-altered', sigBase64, publicKey);
    expect(isInvalidPayload).toBe(false);

    const isInvalidSignature = await verifySignature(
      payload,
      Buffer.from('fake-signature-string').toString('base64'),
      publicKey
    );
    expect(isInvalidSignature).toBe(false);
  });
});
