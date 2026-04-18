// packages/types/src/payment.ts
export type PaymentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Payment {
  id: string;
  orderId?: string;
  piPaymentId: string;
  txid?: string;
  amount: number;
  memo: string;
  status: PaymentStatus;
  developerApproved: boolean;
  transactionVerified: boolean;
  developerCompleted: boolean;
  userCancelled: boolean;
  createdAt: Date;
  approvedAt?: Date;
  completedAt?: Date;
}
