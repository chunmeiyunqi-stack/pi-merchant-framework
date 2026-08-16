import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyPassword, hashPassword } from '@/lib/password';
import { apiError, apiSuccess } from '@/lib/api-response';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password, username, piAuth } = body;
    const isProduction = process.env.NODE_ENV === 'production';
    const targetUsername = username || 'admin';

    // 1. Pi Network SDK 快捷授权认证分支
    if (piAuth && piAuth.accessToken && piAuth.user) {
      const sessionToken = `pi_session_${piAuth.user.uid || 'user'}_${Date.now()}`;

      cookies().set('pi_auth_token', sessionToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return apiSuccess(
        {
          user: {
            uid: piAuth.user.uid,
            username: piAuth.user.username,
            role: 'ADMIN',
          },
        },
        'Pi授权登录成功'
      );
    }

    if (!password) {
      return apiError('请输入登录密码', 400, 400);
    }

    // 2. 数据库用户认证分支 (优先查找 DB 用户)
    let user = await prisma.merchantUser.findFirst({
      where: { username: targetUsername },
    });

    // 生产/开发环境下 Bootstrapping: 如果数据库暂无账号且配置了 ADMIN_INITIAL_PASSWORD
    const initialPwd = process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASSWORD;
    if (!user && initialPwd && password === initialPwd) {
      const defaultMerchant =
        (await prisma.merchant.findFirst()) ||
        (await prisma.merchant.create({
          data: {
            id: 'merchant-demo-001',
            name: '默认旗舰商户',
          },
        }));

      user = await prisma.merchantUser.create({
        data: {
          merchantId: defaultMerchant.id,
          piUid: `admin_uid_${Date.now()}`,
          username: targetUsername,
          passwordHash: hashPassword(initialPwd),
          mustChangePassword: true,
          role: 'OWNER',
        },
      });
    }

    // 3. 校验 DB 用户密码
    if (user && user.passwordHash) {
      const isMatch = verifyPassword(password, user.passwordHash);
      if (isMatch) {
        const sessionToken = `admin_session_${user.id}_${Date.now()}`;
        cookies().set('pi_auth_token', sessionToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60,
        });

        return apiSuccess(
          {
            mustChangePassword: user.mustChangePassword,
            user: {
              id: user.id,
              username: user.username,
              role: user.role,
              merchantId: user.merchantId,
            },
          },
          '登录成功'
        );
      }
    }

    // 4. 开发环境 Fallback Passcode 允许 (生产环境严禁生效)
    if (!isProduction && (password === 'admin888' || password === 'admin')) {
      const sessionToken = `admin_dev_session_${Date.now()}`;
      cookies().set('pi_auth_token', sessionToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return apiSuccess(
        {
          mustChangePassword: false,
          user: {
            username: targetUsername,
            role: 'OWNER',
          },
        },
        '开发环境降级登录成功'
      );
    }

    // 5. 生产环境或密码不匹配拒绝登录
    return apiError('用户名或密码错误，请重试', 401, 401);
  } catch (err) {
    return apiError('认证服务异常', 500, 500, undefined, err);
  }
}
