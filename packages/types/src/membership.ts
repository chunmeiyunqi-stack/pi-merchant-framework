// packages/types/src/membership.ts
export type MembershipMode = 'TIME_BASED' | 'COUNT_BASED' | 'SUBSCRIPTION';
export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'USED_UP' | 'CANCELLED';

export interface Membership {
  id: string;
  merchantId: string;
  name: string;
  mode: MembershipMode;
  price: number;
  validDays?: number;
  totalUses?: number;
  benefitsJson?: Record<string, unknown>;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  createdAt: Date;
}

export interface CustomerMembership {
  id: string;
  customerId: string;
  membershipId: string;
  startAt: Date;
  endAt?: Date;
  remainingUses?: number;
  status: MembershipStatus;
  createdAt: Date;
}
