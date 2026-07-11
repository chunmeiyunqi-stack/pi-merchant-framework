/**
 * Tenant AsyncLocalStorage context (lazy loaded for Node.js only)
 * Stores `merchantId` (tenantId) for the current request scope.
 *
 * Browser safety:
 * - No static import of 'module' or 'async_hooks' — avoids webpack warnings
 * - Falls back to no-op in browser/edge runtimes
 */

interface TenantStore {
  getStore: () => string | undefined;
  run: (id: string, fn: () => unknown) => unknown;
}

let tenantStore: TenantStore | undefined;
let _alsLoaded = false;

function initAsyncLocalStorage(): void {
  if (_alsLoaded) return;
  _alsLoaded = true;

  // Guard: only load in Node.js environment
  if (typeof process === 'undefined' || !process.versions?.node) {
    tenantStore = {
      getStore: () => undefined,
      run: (_id: string, fn: () => unknown) => fn(),
    };
    return;
  }

  try {
    // Dynamic require — only called in Node; avoids 'module' static import in browser bundles
    const asyncHooks = require('async_hooks') as {
      AsyncLocalStorage: new <T>() => {
        getStore: () => T | undefined;
        run: (store: T, fn: () => unknown) => unknown;
      };
    };
    tenantStore = new asyncHooks.AsyncLocalStorage<string>() as unknown as TenantStore;
  } catch {
    tenantStore = {
      getStore: () => undefined,
      run: (_id: string, fn: () => unknown) => fn(),
    };
  }
}

// Lazy initialization
initAsyncLocalStorage();

export const getTenantId = (): string | undefined => tenantStore?.getStore();

export const runWithTenant = <T>(id: string, fn: () => T): T => {
  return tenantStore!.run(id, fn) as T;
};

export default {
  getTenantId,
  runWithTenant,
};