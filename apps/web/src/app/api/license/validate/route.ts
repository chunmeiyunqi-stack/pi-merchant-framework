// apps/web/src/app/api/license/validate/route.ts
// License 验证 API 端点

import { NextResponse } from 'next/server';
import {
  deserializeLicense,
  parseLicense,
  validateLicense,
  type SerializedLicense,
} from '@pi-merchant/pi-sdk';
import { withMetrics } from '@/lib/metrics-middleware';

export const dynamic = 'force-dynamic';

/**
 * POST /api/license/validate
 * 验证提交的 License 是否合法
 *
 * Body: SerializedLicense JSON 字符串 或 base64 编码
 */
async function __POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();

    let rawLicense: SerializedLicense | null = null;

    // 支持两种格式：直接 JSON 对象 或 base64 字符串
    if (typeof body === 'string') {
      rawLicense = parseLicense(body);
    } else if (body && typeof body === 'object' && 'id' in body) {
      rawLicense = body as SerializedLicense;
    } else if (body?.payload && typeof body.payload === 'string') {
      try {
        const decoded = Buffer.from(body.payload, 'base64').toString('utf-8');
        rawLicense = parseLicense(decoded);
      } catch {
        rawLicense = null;
      }
    }

    if (!rawLicense) {
      return NextResponse.json({ valid: false, error: 'Invalid license format' }, { status: 400 });
    }

    const license = deserializeLicense(rawLicense);

    // 生产环境启用签名验证，开发/测试环境跳过
    const skipSignatureCheck =
      process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

    const result = await validateLicense(license, rawLicense, { skipSignatureCheck });

    return NextResponse.json(
      {
        valid: result.valid,
        status: result.status,
        daysRemaining: result.daysRemaining,
        tier: result.license?.tier,
        features: result.license?.features,
        error: result.error,
      },
      { status: result.valid ? 200 : 422 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ valid: false, error: message }, { status: 500 });
  }
}

export const POST = withMetrics(__POST);
