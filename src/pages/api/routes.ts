import { signSessionToken, verifySessionToken } from '@/lib/session';

const approvals = new Map<string, any>();

export async function handlePiAuth(req: any, res: any) {
  const body = req.body || {};
  const code = body.code;
  if (!code || code === 'invalid-code') {
    res.statusCode = 401;
    res.end(JSON.stringify({ success: false, error: 'Invalid code' }));
    return;
  }
  const uid = `user-${Math.floor(Math.random() * 100000)}`;
  const token = signSessionToken(uid);
  res.statusCode = 200;
  res.end(
    JSON.stringify({
      token,
      user: { id: uid, walletAddress: 'wallet-' + uid, createdAt: new Date().toISOString() },
      expiresIn: 86400,
    })
  );
}

export async function handleGetModels(req: any, res: any) {
  const cookie = req.headers?.cookie || '';
  if (!cookie.includes('pi_auth_token')) {
    res.statusCode = 401;
    res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
    return;
  }
  res.statusCode = 200;
  res.end(
    JSON.stringify({
      models: [
        { id: 'gpt-4', name: 'GPT-4', provider: 'openai', available: true, costPerToken: 0.0001 },
      ],
    })
  );
}

export async function handleHistory(req: any, res: any) {
  const cookie = req.headers?.cookie || '';
  if (!cookie.includes('pi_auth_token')) {
    res.statusCode = 401;
    res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
    return;
  }
  res.statusCode = 200;
  res.end(JSON.stringify({ records: [], pagination: { total: 0, page: 1, limit: 20 } }));
}

export async function handleGenerate(req: any, res: any) {
  const cookie = req.headers?.cookie || '';
  if (!cookie.includes('pi_auth_token')) {
    res.statusCode = 401;
    res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
    return;
  }
  const body = req.body || {};
  if (!body.prompt) {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, error: 'Missing prompt' }));
    return;
  }
  // Basic license check mock
  const cookieToken = cookie.match(/pi_auth_token=([^;\s]+)/)?.[1] || '';
  if (body.model && body.model.includes('turbo') && cookieToken === 'basic-tier-token') {
    res.statusCode = 403;
    res.end(JSON.stringify({ success: false, error: 'Forbidden: license' }));
    return;
  }
  if (body.stream) {
    res.setHeader('Content-Type', 'text/event-stream');
  }
  res.statusCode = 200;
  res.end(
    JSON.stringify({ output: 'Generated output for: ' + body.prompt, model: body.model || 'gpt-4' })
  );
}

export async function handlePaymentApprove(req: any, res: any) {
  const cookie = req.headers?.cookie || '';
  if (!cookie.includes('pi_auth_token')) {
    res.statusCode = 401;
    res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
    return;
  }
  const body = req.body || {};
  const amount = parseFloat(body.amount || '0');
  if (isNaN(amount) || amount <= 0) {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, error: 'Invalid amount' }));
    return;
  }
  const key = JSON.stringify(body);
  if (!approvals.has(key)) {
    approvals.set(key, {
      approvalId: 'approval-' + Math.random().toString(36).slice(2),
      status: 'approved',
    });
  }
  res.statusCode = 200;
  res.end(
    JSON.stringify({ approvalId: approvals.get(key).approvalId, status: approvals.get(key).status })
  );
}

export async function handlePaymentComplete(req: any, res: any) {
  const cookie = req.headers?.cookie || '';
  if (!cookie.includes('pi_auth_token')) {
    res.statusCode = 401;
    res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
    return;
  }
  const body = req.body || {};
  const approvalId = body.approvalId;
  if (!approvalId) {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, error: 'Missing approvalId' }));
    return;
  }
  // Verify approvalId exists
  const found = Array.from(approvals.values()).find((v: any) => v.approvalId === approvalId);
  if (!found) {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, error: 'Invalid approvalId' }));
    return;
  }

  // Simulate blockchain confirmation
  res.statusCode = 200;
  res.end(
    JSON.stringify({
      transactionId: 'tx-' + Math.random().toString(36).slice(2),
      status: 'completed',
      blockchainConfirmation: { hash: '0x' + Math.random().toString(16).slice(2) },
    })
  );
}

export default {};
