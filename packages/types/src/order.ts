// packages/types/src/order.ts
export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Order {
  id: string;
  merchantId: string;
  customerId: string;
  serviceId?: string;
  orderNo: string;
  amount: number;
  currency: 'PI';
  status: OrderStatus;
  paymentId?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}
