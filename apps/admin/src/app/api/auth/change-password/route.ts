import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/password';
import { apiError, apiSuccess } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const token = cookies().get('pi_auth_token')?.value;
    if (!token) {
      return apiError('未登录或凭证失效', 401, 401);
    }

    const body = await req.json();
    const { oldPassword, newPassword, username } = body;

    if (!newPassword || newPassword.length < 6) {
      return apiError('新密码必须至少包含 6 位字符', 400, 400);
    }

    const targetUsername = username || 'admin';
    const user = await prisma.merchantUser.findFirst({
      where: { username: targetUsername },
    });

    if (!user) {
      return apiError('找不到要修改密码的用户', 444, 404);
    }

    // 若原有密码存在，需验证旧密码（若 mustChangePassword 为 true，旧密码等于初始密码）
    if (user.passwordHash && oldPassword) {
      const isMatch = verifyPassword(oldPassword, user.passwordHash);
      if (!isMatch) {
        return apiError('旧密码验证错误', 400, 400);
      }
    }

    // 更新 DB 密码并清除 mustChangePassword 标记
    const newHash = hashPassword(newPassword);
    await prisma.merchantUser.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    return apiSuccess({ success: true }, '密码更新成功，请记住您的新密码');
  } catch (err) {
    return apiError('更新密码失败', 500, 500, undefined, err);
  }
}
