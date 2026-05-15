// packages/pi-sdk/src/tenant/manager.ts
// 多租户管理器：租户 CRUD + 配置隔离 + 内存缓存

import { logError, logEvent, logWarn } from '../logger';
import type { CreateTenantParams, Tenant, TenantListResult } from './types';

// ──────────────────────────────────────────────
// 内存存储（生产环境中替换为数据库层）
// ──────────────────────────────────────────────

const tenantStore = new Map<string, Tenant>();
let tenantIdCounter = 1;

function generateTenantId(): string {
  return `tenant_${Date.now()}_${tenantIdCounter++}`;
}

// ──────────────────────────────────────────────
// CRUD
// ──────────────────────────────────────────────

/**
 * 注册新租户
 */
export function registerTenant(params: CreateTenantParams): Tenant {
  const id = generateTenantId();

  const tenant: Tenant = {
    id,
    name: params.name,
    merchantId: params.merchantId,
    status: 'active',
    tier: params.tier ?? 'starter',
    features: params.features ?? ['ai_routing'],
    aiConfig: params.aiConfig,
    quota: params.quota ?? { maxRequestsPerMonth: 1000 },
    createdAt: new Date(),
    metadata: params.metadata,
  };

  tenantStore.set(id, tenant);

  logEvent('Tenant registered', {
    tenantId: id,
    name: params.name,
    merchantId: params.merchantId,
    tier: tenant.tier,
  });

  return tenant;
}

/**
 * 获取租户（按 ID）
 */
export function getTenantById(id: string): Tenant | null {
  return tenantStore.get(id) ?? null;
}

/**
 * 获取商户下所有租户
 */
export function getTenantsByMerchant(merchantId: string): TenantListResult {
  const tenants = Array.from(tenantStore.values()).filter((t) => t.merchantId === merchantId);
  return { tenants, total: tenants.length };
}

/**
 * 更新租户信息
 */
export function updateTenant(
  id: string,
  updates: Partial<Omit<Tenant, 'id' | 'merchantId' | 'createdAt'>>
): Tenant | null {
  const existing = tenantStore.get(id);
  if (!existing) {
    logWarn('Tenant not found for update', { tenantId: id });
    return null;
  }

  const updated: Tenant = {
    ...existing,
    ...updates,
    id: existing.id,
    merchantId: existing.merchantId,
    createdAt: existing.createdAt,
    lastActiveAt: new Date(),
  };

  tenantStore.set(id, updated);
  logEvent('Tenant updated', { tenantId: id });
  return updated;
}

/**
 * 暂停租户
 */
export function suspendTenant(id: string): boolean {
  const tenant = tenantStore.get(id);
  if (!tenant) return false;
  tenantStore.set(id, { ...tenant, status: 'suspended' });
  logWarn('Tenant suspended', { tenantId: id, name: tenant.name });
  return true;
}

/**
 * 删除租户（软删除：状态设为 cancelled）
 */
export function deleteTenant(id: string): boolean {
  const tenant = tenantStore.get(id);
  if (!tenant) return false;
  tenantStore.set(id, { ...tenant, status: 'cancelled' });
  logEvent('Tenant deleted', { tenantId: id });
  return true;
}

// ──────────────────────────────────────────────
// 请求级校验
// ──────────────────────────────────────────────

/**
 * 校验租户是否可以发起请求
 * 检查状态 + Feature Gate
 */
export function assertTenantActive(tenantId: string): Tenant {
  const tenant = getTenantById(tenantId);

  if (!tenant) {
    throw new Error(`Tenant '${tenantId}' not found`);
  }

  if (tenant.status === 'suspended') {
    throw new Error(`Tenant '${tenantId}' is suspended`);
  }

  if (tenant.status === 'cancelled') {
    throw new Error(`Tenant '${tenantId}' has been cancelled`);
  }

  // 更新最后活跃时间
  tenantStore.set(tenantId, { ...tenant, lastActiveAt: new Date() });

  return tenant;
}

/**
 * 校验租户是否拥有指定功能
 */
export function assertTenantFeature(
  tenant: Tenant,
  feature: import('../license/types').LicenseFeature
): void {
  if (!tenant.features.includes(feature)) {
    throw new Error(
      `Tenant '${tenant.id}' does not have access to feature '${feature}' (tier: ${tenant.tier})`
    );
  }
}

// ──────────────────────────────────────────────
// 工具
// ──────────────────────────────────────────────

/** 获取当前已注册租户总数 */
export function getTenantCount(): number {
  return tenantStore.size;
}

/** 清空所有租户（仅用于测试） */
export function clearAllTenants(): void {
  tenantStore.clear();
  tenantIdCounter = 1;
  logEvent('All tenants cleared (test reset)');
}

/** 检查 License 的租户数量是否超限 */
export function checkTenantLimit(merchantId: string, maxTenants: number): boolean {
  const { total } = getTenantsByMerchant(merchantId);
  if (total >= maxTenants) {
    logError('Tenant limit reached', undefined, {
      merchantId,
      current: total,
      max: maxTenants,
    });
    return false;
  }
  return true;
}
