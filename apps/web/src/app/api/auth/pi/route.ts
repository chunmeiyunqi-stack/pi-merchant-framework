import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { signSessionToken } from '@/lib/session';
import { logEvent } from '@pi-merchant/pi-sdk';
import { withMetrics } from '@/lib/metrics-middleware';
import { piPlatformBase } from '@/lib/pi-platform';

// Pi Platform API 根地址（规范化：兼容带/不带 /v2 的配置）
const PI_API_BASE = piPlatformBase();

async function __POST(req: Request) {
  try {
    const body = await req.json();
    const { accessToken, piUid, username, merchantId: bodyMerchantId } = body;

    if (!accessToken || !piUid || !username) {
      return NextResponse.json(
        { success: false, error: 'Missing parameters: accessToken, piUid, username' },
        { status: 400 }
      );
    }

    // ── 步骤 1：用 accessToken 调用 Pi Platform API 验证真实身份 ─────────────
    let verifiedUid: string;
    let verifiedUsername: string;

    try {
      const piMeRes = await fetch(`${PI_API_BASE}/v2/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!piMeRes.ok) {
        const errBody = await piMeRes.text();
        console.error('[Auth/Pi] Pi Platform /v2/me 验证失败:', piMeRes.status, errBody);
        return NextResponse.json(
          { success: false, error: `Pi Platform 验证失败 (${piMeRes.status}): token 无效或已过期` },
          { status: 401 }
        );
      }

      const piUser = await piMeRes.json();
      verifiedUid = piUser.uid;
      verifiedUsername = piUser.username;

      // 防止前端伪造 uid
      if (verifiedUid !== piUid) {
        console.error('[Auth/Pi] UID 不匹配 — 前端:', piUid, '/ Pi Platform:', verifiedUid);
        return NextResponse.json(
          { success: false, error: '身份验证失败：uid 不匹配' },
          { status: 403 }
        );
      }
    } catch (fetchErr) {
      console.error('[Auth/Pi] 调用 Pi Platform API 网络异常:', fetchErr);
      return NextResponse.json(
        { success: false, error: 'Pi Platform API 网络不可达，请检查服务器网络配置' },
        { status: 502 }
      );
    }

    // ── 统一租户解析（优先级：x-tenant-id header → cookie merchant_id → body.merchantId → env 默认）
    const headerTenant = req.headers.get('x-tenant-id');
    const cookieTenant = cookies().get('merchant_id')?.value;
    const merchantId =
      headerTenant ??
      cookieTenant ??
      bodyMerchantId ??
      process.env.NEXT_PUBLIC_MERCHANT_ID ??
      'merchant-demo-001';

    // ── 步骤 1.5：确保商户存在（upsert 原子操作，避免 FK 约束违规）──────────
    await prisma.merchant.upsert({
      where: { id: merchantId },
      update: {},
      create: { id: merchantId, name: 'Pioneer AI 商户' },
    });

    // ── 步骤 2：Upsert Customer 记录 ────────────────────────────────────────
    const customer = await prisma.customer.upsert({
      where: {
        merchantId_piUid: {
          merchantId: merchantId,
          piUid: verifiedUid,
        },
      },
      update: {
        username: verifiedUsername,
      },
      create: {
        merchantId: merchantId,
        piUid: verifiedUid,
        username: verifiedUsername,
      },
    });

    // ── 步骤 3：签发 HMAC session token 写入 HttpOnly Cookie ─────────────────
    const secureToken = signSessionToken(verifiedUid);
    const cookieStore = cookies();
    cookieStore.set('pi_auth_token', secureToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 天
    });

    // 写入 tenant cookie，供后续请求使用（HttpOnly）
    cookieStore.set('merchant_id', merchantId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 天
    });

    logEvent('user.authenticated', { user: verifiedUsername, merchantId, customerId: customer.id });

    return NextResponse.json({
      success: true,
      token: secureToken,
      user: { uid: verifiedUid, username: verifiedUsername },
    });
  } catch (error: unknown) {
    console.error('[POST /api/auth/pi] 验证异常:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}

export const POST = withMetrics(__POST);
