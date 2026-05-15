// packages/pi-sdk/src/__tests__/tenant/manager.test.ts

import {
  assertTenantActive,
  assertTenantFeature,
  clearAllTenants,
  deleteTenant,
  getTenantById,
  getTenantCount,
  getTenantsByMerchant,
  registerTenant,
  suspendTenant,
  updateTenant,
  checkTenantLimit,
} from '../../tenant';

const MERCHANT_ID = 'merchant_test_001';

beforeEach(() => {
  clearAllTenants();
});

// ──────────────────────────────────────────────
// registerTenant
// ──────────────────────────────────────────────

describe('registerTenant', () => {
  it('creates a tenant with required fields', () => {
    const tenant = registerTenant({ name: 'Shop A', merchantId: MERCHANT_ID });

    expect(tenant.id).toMatch(/^tenant_/);
    expect(tenant.name).toBe('Shop A');
    expect(tenant.merchantId).toBe(MERCHANT_ID);
    expect(tenant.status).toBe('active');
    expect(tenant.createdAt).toBeInstanceOf(Date);
  });

  it('defaults to starter tier and ai_routing feature', () => {
    const tenant = registerTenant({ name: 'Basic', merchantId: MERCHANT_ID });
    expect(tenant.tier).toBe('starter');
    expect(tenant.features).toContain('ai_routing');
  });

  it('accepts custom tier and features', () => {
    const tenant = registerTenant({
      name: 'Enterprise',
      merchantId: MERCHANT_ID,
      tier: 'enterprise',
      features: ['ai_routing', 'multi_tenant', 'streaming'],
    });
    expect(tenant.tier).toBe('enterprise');
    expect(tenant.features).toContain('multi_tenant');
  });

  it('sets default quota', () => {
    const tenant = registerTenant({ name: 'Default Quota', merchantId: MERCHANT_ID });
    expect(tenant.quota?.maxRequestsPerMonth).toBe(1000);
  });
});

// ──────────────────────────────────────────────
// getTenantById
// ──────────────────────────────────────────────

describe('getTenantById', () => {
  it('returns the tenant if it exists', () => {
    const tenant = registerTenant({ name: 'Find Me', merchantId: MERCHANT_ID });
    expect(getTenantById(tenant.id)).toMatchObject({ name: 'Find Me' });
  });

  it('returns null for unknown ID', () => {
    expect(getTenantById('nonexistent')).toBeNull();
  });
});

// ──────────────────────────────────────────────
// getTenantsByMerchant
// ──────────────────────────────────────────────

describe('getTenantsByMerchant', () => {
  it('returns all tenants for a merchant', () => {
    registerTenant({ name: 'A', merchantId: MERCHANT_ID });
    registerTenant({ name: 'B', merchantId: MERCHANT_ID });
    registerTenant({ name: 'C', merchantId: 'other_merchant' });

    const result = getTenantsByMerchant(MERCHANT_ID);
    expect(result.total).toBe(2);
    expect(result.tenants.map((t) => t.name)).toEqual(expect.arrayContaining(['A', 'B']));
  });

  it('returns empty list for unknown merchant', () => {
    const result = getTenantsByMerchant('nobody');
    expect(result.total).toBe(0);
    expect(result.tenants).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────
// updateTenant
// ──────────────────────────────────────────────

describe('updateTenant', () => {
  it('updates specified fields', () => {
    const tenant = registerTenant({ name: 'Old Name', merchantId: MERCHANT_ID });
    const updated = updateTenant(tenant.id, { name: 'New Name' });

    expect(updated?.name).toBe('New Name');
    expect(updated?.merchantId).toBe(MERCHANT_ID); // unchanged
    expect(updated?.lastActiveAt).toBeInstanceOf(Date);
  });

  it('returns null for unknown tenant', () => {
    expect(updateTenant('bad_id', { name: 'X' })).toBeNull();
  });
});

// ──────────────────────────────────────────────
// suspendTenant / deleteTenant
// ──────────────────────────────────────────────

describe('suspendTenant', () => {
  it('sets status to suspended', () => {
    const tenant = registerTenant({ name: 'Suspend Me', merchantId: MERCHANT_ID });
    const ok = suspendTenant(tenant.id);
    expect(ok).toBe(true);
    expect(getTenantById(tenant.id)?.status).toBe('suspended');
  });

  it('returns false for unknown tenant', () => {
    expect(suspendTenant('ghost')).toBe(false);
  });
});

describe('deleteTenant', () => {
  it('sets status to cancelled (soft delete)', () => {
    const tenant = registerTenant({ name: 'Delete Me', merchantId: MERCHANT_ID });
    deleteTenant(tenant.id);
    expect(getTenantById(tenant.id)?.status).toBe('cancelled');
  });
});

// ──────────────────────────────────────────────
// assertTenantActive
// ──────────────────────────────────────────────

describe('assertTenantActive', () => {
  it('returns tenant for active status', () => {
    const tenant = registerTenant({ name: 'Active', merchantId: MERCHANT_ID });
    expect(() => assertTenantActive(tenant.id)).not.toThrow();
  });

  it('throws for suspended tenant', () => {
    const tenant = registerTenant({ name: 'Suspended', merchantId: MERCHANT_ID });
    suspendTenant(tenant.id);
    expect(() => assertTenantActive(tenant.id)).toThrow(/suspended/i);
  });

  it('throws for cancelled tenant', () => {
    const tenant = registerTenant({ name: 'Cancelled', merchantId: MERCHANT_ID });
    deleteTenant(tenant.id);
    expect(() => assertTenantActive(tenant.id)).toThrow(/cancelled/i);
  });

  it('throws for nonexistent tenant', () => {
    expect(() => assertTenantActive('ghost')).toThrow(/not found/i);
  });
});

// ──────────────────────────────────────────────
// assertTenantFeature
// ──────────────────────────────────────────────

describe('assertTenantFeature', () => {
  it('does not throw if feature is present', () => {
    const tenant = registerTenant({
      name: 'Feature Test',
      merchantId: MERCHANT_ID,
      features: ['ai_routing', 'streaming'],
    });
    expect(() => assertTenantFeature(tenant, 'streaming')).not.toThrow();
  });

  it('throws if feature is missing', () => {
    const tenant = registerTenant({
      name: 'Limited',
      merchantId: MERCHANT_ID,
      features: ['ai_routing'],
    });
    expect(() => assertTenantFeature(tenant, 'multi_tenant')).toThrow(/multi_tenant/);
  });
});

// ──────────────────────────────────────────────
// checkTenantLimit
// ──────────────────────────────────────────────

describe('checkTenantLimit', () => {
  it('returns true when under limit', () => {
    registerTenant({ name: 'T1', merchantId: MERCHANT_ID });
    expect(checkTenantLimit(MERCHANT_ID, 5)).toBe(true);
  });

  it('returns false when at limit', () => {
    registerTenant({ name: 'T1', merchantId: MERCHANT_ID });
    registerTenant({ name: 'T2', merchantId: MERCHANT_ID });
    expect(checkTenantLimit(MERCHANT_ID, 2)).toBe(false);
  });
});

// ──────────────────────────────────────────────
// getTenantCount
// ──────────────────────────────────────────────

describe('getTenantCount', () => {
  it('returns correct count', () => {
    expect(getTenantCount()).toBe(0);
    registerTenant({ name: 'A', merchantId: MERCHANT_ID });
    registerTenant({ name: 'B', merchantId: MERCHANT_ID });
    expect(getTenantCount()).toBe(2);
  });
});
