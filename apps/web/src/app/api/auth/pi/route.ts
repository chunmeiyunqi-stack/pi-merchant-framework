import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { signSessionToken } from '@/lib/session';
import { logEvent } from '@pi-merchant/pi-sdk';

const prisma = new PrismaClient();

// Pi Platform API 基础地址
const PI_API_BASE = process.env.PI_PLATFORM_API_BASE ?? 'https://api.minepi.com';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accessToken, piUid, username, merchantId } = body;

    if (!accessToken || !piUid || !username || !merchantId) {
      return NextResponse.json(
        { success: false, error: 'Missing parameters: accessToken, piUid, username, merchantId' },
        { status: 400 }
      );
    }

    // ── 步骤 1：用 accessToken 调用 Pi Platform API 验证真实身份 ─────────────
    // GET /v2/me 使用 Authorization: Bearer <accessToken>
    // 这是 Pi 官方推荐的 token 验证方式，无需 PI_API_KEY
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

    logEvent('user.authenticated', { user: verifiedUsername, merchantId, customerId: customer.id });

    return NextResponse.json({
      success: true,
      user: { uid: verifiedUid, username: verifiedUsername },
      token: secureToken, // 发送给前端，作为 localStorage 备用
    });
  } catch (error: any) {
    logEvent('auth.pi.error', { error: error?.message ?? String(error) });
    console.error('[Auth/Pi] 内部错误:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

