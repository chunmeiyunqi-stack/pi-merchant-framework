import { jest } from '@jest/globals';
import * as svc from '../payment-service';

describe('payment-service', () => {
  const originalWindow = (global as any).window;

  beforeEach(() => {
    jest.resetAllMocks();
    // minimal window.Pi mock container
    (global as any).window = (global as any).window || { location: { origin: 'http://localhost' } };
    (global as any).window.location = (global as any).window.location || {
      origin: 'http://localhost',
    };
    (global as any).window.Pi = {};
  });

  afterEach(() => {
    (global as any).window = originalWindow;
  });

  it('createPayment: 成功初始化回调流程并调用 approve/complete', async () => {
    const paymentData = { amount: 1, memo: 't' } as any;
    const orderId = 'order-1';

    // mock fetch to capture approve/complete/cancel calls
    const fetchCalls: any[] = [];
    (global as any).fetch = jest.fn().mockImplementation((url: string, opts: any) => {
      fetchCalls.push({ url, opts });
      if (url.endsWith('/api/payments/approve')) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (url.endsWith('/api/payments/complete')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    // prepare onSuccess resolver so test waits until called
    const resolved: { paymentId?: string; txid?: string } = {};
    const onSuccess = jest.fn((paymentId: string, txid: string) => {
      resolved.paymentId = paymentId;
      resolved.txid = txid;
    });
    const onFailed = jest.fn();

    // implement window.Pi.createPayment to immediately invoke callbacks
    (global as any).window.Pi.createPayment = (pd: any, callbacks: any) => {
      // simulate U2A lifecycle
      callbacks.onReadyForServerApproval('pay-123');
      callbacks.onReadyForServerCompletion('pay-123', 'tx-789');
    };

    svc.createPayment(paymentData, orderId, onSuccess, onFailed);

    // wait for microtasks and any async callbacks to complete
    await new Promise((r) => setTimeout(r, 0));

    // assert fetch approve and complete were called with expected payloads
    const approveCall = fetchCalls.find((c) => c.url.endsWith('/api/payments/approve'));
    const completeCall = fetchCalls.find((c) => c.url.endsWith('/api/payments/complete'));
    expect(approveCall).toBeDefined();
    expect(JSON.parse(approveCall.opts.body)).toEqual({ paymentId: 'pay-123', orderId });
    expect(completeCall).toBeDefined();
    expect(JSON.parse(completeCall.opts.body)).toEqual({
      paymentId: 'pay-123',
      txid: 'tx-789',
      orderId,
    });
    expect(onSuccess).toHaveBeenCalledWith('pay-123', 'tx-789');
    expect(onFailed).not.toHaveBeenCalled();
  });

  it('handleIncompletePayment: 重新审批未审批支付', async () => {
    const fetchCalls: any[] = [];
    (global as any).fetch = jest.fn().mockImplementation((url: string, opts: any) => {
      fetchCalls.push({ url, opts });
      if (url.endsWith('/api/payments/approve'))
        return Promise.resolve({ ok: true, json: async () => ({}) });
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    const payment = {
      identifier: 'p-a',
      status: {
        developer_approved: false,
        developer_completed: false,
        user_cancelled: false,
        cancelled: false,
      },
    } as any;

    await svc.handleIncompletePayment(payment);

    const approveCall = fetchCalls.find((c) => c.url.endsWith('/api/payments/approve'));
    expect(approveCall).toBeDefined();
    expect(JSON.parse(approveCall.opts.body)).toEqual({ paymentId: 'p-a' });
  });

  it('handleIncompletePayment: 重新完成已审批但未完成且有 txid', async () => {
    const fetchCalls: any[] = [];
    (global as any).fetch = jest.fn().mockImplementation((url: string, opts: any) => {
      fetchCalls.push({ url, opts });
      if (url.endsWith('/api/payments/complete'))
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    const payment = {
      identifier: 'p-b',
      status: {
        developer_approved: true,
        developer_completed: false,
        user_cancelled: false,
        cancelled: false,
      },
      transaction: { txid: 'tx-42' },
    } as any;

    await svc.handleIncompletePayment(payment);

    const completeCall = fetchCalls.find((c) => c.url.endsWith('/api/payments/complete'));
    expect(completeCall).toBeDefined();
    expect(JSON.parse(completeCall.opts.body)).toEqual({ paymentId: 'p-b', txid: 'tx-42' });
  });

  it('handleIncompletePayment: 处理已取消支付', async () => {
    const fetchCalls: any[] = [];
    (global as any).fetch = jest.fn().mockImplementation((url: string, opts: any) => {
      fetchCalls.push({ url, opts });
      if (url.endsWith('/api/payments/cancel'))
        return Promise.resolve({ ok: true, json: async () => ({}) });
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    const payment = {
      identifier: 'p-c',
      // set developer_approved true so earlier branches are skipped and cancelled branch runs
      status: {
        developer_approved: true,
        developer_completed: true,
        user_cancelled: true,
        cancelled: false,
      },
    } as any;

    await svc.handleIncompletePayment(payment);

    const cancelCall = fetchCalls.find((c) => c.url.endsWith('/api/payments/cancel'));
    expect(cancelCall).toBeDefined();
    expect(JSON.parse(cancelCall.opts.body)).toEqual({ paymentId: 'p-c' });
  });

  it('deriveOrderStatusFromPayment: maps statuses correctly', () => {
    const completed = { status: { developer_completed: true, transaction_verified: true } } as any;
    const approved = { status: { developer_completed: false, developer_approved: true } } as any;
    const cancelled = { status: { user_cancelled: true } } as any;
    const pending = { status: { developer_approved: false } } as any;

    expect(svc.deriveOrderStatusFromPayment(completed)).toBe('COMPLETED');
    expect(svc.deriveOrderStatusFromPayment(approved)).toBe('APPROVED');
    expect(svc.deriveOrderStatusFromPayment(cancelled)).toBe('CANCELLED');
    expect(svc.deriveOrderStatusFromPayment(pending)).toBe('PENDING_APPROVAL');
  });
});
