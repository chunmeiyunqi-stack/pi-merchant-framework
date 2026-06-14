import { createMocks } from 'node-mocks-http';
import {
  handlePiAuth,
  handleGetModels,
  handleHistory,
  handleGenerate,
  handlePaymentApprove,
  handlePaymentComplete,
} from '@/pages/api/routes';

describe('API Routes (route.ts)', () => {
  describe('POST /api/auth/pi - Pi Network 认证', () => {
    it('应该完成 Pi Network 认证流程', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          code: 'pi-auth-code-123',
        },
      });

      await handlePiAuth(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.id).toBeDefined();
    });

    it('应该返回有效的会话令牌', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          code: 'valid-code',
        },
      });

      await handlePiAuth(req as any, res as any);

      const data = JSON.parse(res._getData());
      expect(data.token).toMatch(/^[\w-]*\.[\w-]*\.[\w-]*$/); // JWT 格式
      expect(data.expiresIn).toBe(86400); // 24 小时
    });

    it('应该拒绝无效的授权码', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          code: 'invalid-code',
        },
      });

      await handlePiAuth(req as any, res as any);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.error).toBeDefined();
    });

    it('应该创建或更新用户', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          code: 'new-user-code',
        },
      });

      await handlePiAuth(req as any, res as any);

      const data = JSON.parse(res._getData());
      expect(data.user.walletAddress).toBeDefined();
      expect(data.user.createdAt).toBeDefined();
    });
  });

  describe('GET /api/v1/models - 获取可用模型列表', () => {
    it('应该返回可用的 AI 模型列表', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          cookie: 'pi_auth_token=valid-token',
        },
      });

      await handleGetModels(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(Array.isArray(data.models)).toBe(true);
      expect(data.models.length).toBeGreaterThan(0);
    });

    it('应该包含模型的元数据', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          cookie: 'pi_auth_token=valid-token',
        },
      });

      await handleGetModels(req as any, res as any);

      const data = JSON.parse(res._getData());
      const model = data.models[0];

      expect(model.id).toBeDefined();
      expect(model.name).toBeDefined();
      expect(model.provider).toBeDefined();
      expect(model.available).toBeDefined();
      expect(typeof model.costPerToken).toBe('number');
    });

    it('应该拒绝未认证的请求', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });

      await handleGetModels(req as any, res as any);

      expect(res._getStatusCode()).toBe(401);
    });
  });

  describe('GET /api/v1/history - 分页查询生成历史', () => {
    it('应该返回用户的生成历史', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '1', limit: '20' },
        headers: {
          cookie: 'pi_auth_token=valid-token',
        },
      });

      await handleHistory(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(Array.isArray(data.records)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.total).toBeGreaterThanOrEqual(0);
    });

    it('应该支持分页', async () => {
      const { req: req1, res: res1 } = createMocks({
        method: 'GET',
        query: { page: '1', limit: '10' },
        headers: { cookie: 'pi_auth_token=valid-token' },
      });

      await handleHistory(req1 as any, res1 as any);
      const data1 = JSON.parse(res1._getData());

      const { req: req2, res: res2 } = createMocks({
        method: 'GET',
        query: { page: '2', limit: '10' },
        headers: { cookie: 'pi_auth_token=valid-token' },
      });

      await handleHistory(req2 as any, res2 as any);
      const data2 = JSON.parse(res2._getData());

      // 如果有足够的数据，两页应该不同
      if (data1.pagination.total > 10) {
        expect(data1.records).not.toEqual(data2.records);
      }
    });

    it('应该支持过滤和排序', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          page: '1',
          limit: '20',
          sortBy: 'createdAt',
          order: 'desc',
        },
        headers: { cookie: 'pi_auth_token=valid-token' },
      });

      await handleHistory(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.records).toBeDefined();
    });

    it('应该拒绝未认证的请求', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '1', limit: '20' },
      });

      await handleHistory(req as any, res as any);

      expect(res._getStatusCode()).toBe(401);
    });
  });

  describe('POST /api/v1/generate - AI 生成请求', () => {
    it('应该成功路由 AI 生成请求', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          prompt: 'What is machine learning?',
          model: 'gpt-4',
          maxTokens: 500,
        },
        headers: {
          cookie: 'pi_auth_token=valid-token',
        },
      });

      await handleGenerate(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.output).toBeDefined();
      expect(data.model).toBe('gpt-4');
    });

    it('应该支持流式响应', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          prompt: 'Tell a story',
          model: 'gpt-4',
          stream: true,
        },
        headers: {
          cookie: 'pi_auth_token=valid-token',
        },
      });

      await handleGenerate(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      // 检查是否设置了流式响应头
      expect(res._getHeaders()['content-type']).toMatch(/text\/event-stream/i);
    });

    it('应该在缺少必需参数时返回 400', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          // 缺少 prompt
          model: 'gpt-4',
        },
        headers: {
          cookie: 'pi_auth_token=valid-token',
        },
      });

      await handleGenerate(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
    });

    it('应该拒绝未认证的请求', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          prompt: 'Test',
          model: 'gpt-4',
        },
      });

      await handleGenerate(req as any, res as any);

      expect(res._getStatusCode()).toBe(401);
    });

    it('应该尊重用户的 License 功能限制', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          prompt: 'Test',
          model: 'gpt-4-turbo', // Premium 模型
        },
        headers: {
          cookie: 'pi_auth_token=basic-tier-token', // 仅 Basic Tier
        },
      });

      await handleGenerate(req as any, res as any);

      expect(res._getStatusCode()).toBe(403);
    });
  });

  describe('POST /api/payments/approve - 支付审批', () => {
    it('应该完成支付审批流程', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          piTransactionId: 'pi-txn-123',
          amount: '10.5',
        },
        headers: {
          cookie: 'pi_auth_token=valid-token',
        },
      });

      await handlePaymentApprove(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.approvalId).toBeDefined();
      expect(data.status).toBe('approved');
    });

    it('应该确保幂等性', async () => {
      const approvalData = {
        piTransactionId: 'pi-txn-456',
        amount: '25.0',
      };

      // 第一次请求
      const { req: req1, res: res1 } = createMocks({
        method: 'POST',
        body: approvalData,
        headers: { cookie: 'pi_auth_token=valid-token' },
      });

      await handlePaymentApprove(req1 as any, res1 as any);
      const data1 = JSON.parse(res1._getData());

      // 第二次请求（相同数据）
      const { req: req2, res: res2 } = createMocks({
        method: 'POST',
        body: approvalData,
        headers: { cookie: 'pi_auth_token=valid-token' },
      });

      await handlePaymentApprove(req2 as any, res2 as any);
      const data2 = JSON.parse(res2._getData());

      // 两次请求应该返回相同的 approvalId
      expect(data1.approvalId).toBe(data2.approvalId);
    });

    it('应该验证支付金额', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          piTransactionId: 'pi-txn-999',
          amount: '-10.0', // 无效金额
        },
        headers: {
          cookie: 'pi_auth_token=valid-token',
        },
      });

      await handlePaymentApprove(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
    });
  });

  describe('POST /api/payments/complete - 支付完成', () => {
    it('应该完成支付流程', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          approvalId: 'approval-123',
          piTransactionId: 'pi-txn-123',
        },
        headers: {
          cookie: 'pi_auth_token=valid-token',
        },
      });

      await handlePaymentComplete(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.transactionId).toBeDefined();
      expect(data.status).toBe('completed');
    });

    it('应该写入区块链分布式账本', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          approvalId: 'approval-456',
          piTransactionId: 'pi-txn-456',
        },
        headers: {
          cookie: 'pi_auth_token=valid-token',
        },
      });

      await handlePaymentComplete(req as any, res as any);

      const data = JSON.parse(res._getData());
      expect(data.blockchainConfirmation).toBeDefined();
      expect(data.blockchainConfirmation.hash).toBeDefined();
    });

    it('应该拒绝无效的 approvalId', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          approvalId: 'invalid-approval',
          piTransactionId: 'pi-txn-999',
        },
        headers: {
          cookie: 'pi_auth_token=valid-token',
        },
      });

      await handlePaymentComplete(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
    });
  });
});
