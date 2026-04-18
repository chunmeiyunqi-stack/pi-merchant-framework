// packages/types/src/merchant.ts
export type MerchantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type MerchantUserRole = 'OWNER' | 'ADMIN' | 'STAFF';

export interface Merchant {
  id: string;
  name: string;
  type: string;
  status: MerchantStatus;
  logo?: string;
  contactName?: string;
  contactPhone?: string;
  themeConfig?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
