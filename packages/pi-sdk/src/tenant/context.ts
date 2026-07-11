/**
 * Tenant AsyncLocalStorage 上下文（按需加载 Node 专属模块以避免在浏览器/Edge runtime 打包时出错）
 * 存储当前请求作用域内的 `merchantId`（tenantId）字符串
 */
interface TenantStore {
  getStore: () => string | undefined;
  run: (id: string, fn: () => unknown) => unknown;
}

let tenantStore: TenantStore | undefined;
try {
  if (typeof process !== 'undefined' && (process as unknown as { versions?: unknown }).versions) {
    const { createRequire } = require('module');
    const r = createRequire(typeof __filename !== 'undefined' ? __filename : '/') as unknown as (moduleName: string) => unknown;
    const asyncHooks = r('async_hooks') as {
      AsyncLocalStorage: new <T>() => {
        getStore: () => T | undefined;
        run: (store: T, fn: () => unknown) => unknown;
      };
    };
    // create an AsyncLocalStorage<string> at runtime when available
    tenantStore = new asyncHooks.AsyncLocalStorage<string>() as unknown as TenantStore;
  }
} catch (_e) {
  // 在浏览器或受限运行时，提供一个降级实现
  tenantStore = {
    getStore: () => undefined,
    run: (_id: string, fn: () => unknown) => fn(),
  };
}

export const getTenantId = (): string | undefined => tenantStore?.getStore();

export const runWithTenant = <T>(id: string, fn: () => T): T => {
  // tenantStore.run returns unknown in the fallback case — assert to the expected return type
  return tenantStore!.run(id, fn) as T;
};

export default {
  tenantStore,
  getTenantId,
  runWithTenant,
};
