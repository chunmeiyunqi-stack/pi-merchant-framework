import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getMerchantId } from '@/lib/utils';
import { requireAdminSession } from '@/lib/admin-auth';

interface AppConfigForm {
  name: string;
  contactPhone: string;
  industrySkin: string;
  homepageLayout: string;
  modulesBooking: boolean;
  modulesMembership: boolean;
  enableCoupon: boolean;
}

function toForm(
  merchant: { name: string; contactPhone: string | null },
  appConfig: {
    industrySkin: string;
    homepageLayout: string;
    modulesEnabled: unknown;
    enableCoupon: boolean;
  } | null
): AppConfigForm {
  const modules = (appConfig?.modulesEnabled ?? {}) as Record<string, boolean>;
  return {
    name: merchant.name,
    contactPhone: merchant.contactPhone ?? '',
    industrySkin: appConfig?.industrySkin ?? 'generic',
    homepageLayout: appConfig?.homepageLayout ?? 'service-first',
    modulesBooking: modules.booking ?? true,
    modulesMembership: modules.membership ?? false,
    enableCoupon: appConfig?.enableCoupon ?? false,
  };
}

export async function GET() {
  if (!requireAdminSession()) {
    return NextResponse.json({ config: null });
  }

  const merchantId = getMerchantId();

  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: { appConfig: true },
    });

    if (!merchant) {
      return NextResponse.json({ config: null });
    }

    return NextResponse.json({ config: toForm(merchant, merchant.appConfig) });
  } catch (error) {
    console.error('[GET /api/admin/settings]', error);
    return NextResponse.json({ config: null });
  }
}

export async function PUT(req: Request) {
  if (!requireAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as AppConfigForm;
    const merchantId = getMerchantId();

    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        name: body.name,
        contactPhone: body.contactPhone || null,
      },
    });

    await prisma.appConfig.upsert({
      where: { merchantId },
      create: {
        merchantId,
        modulesEnabled: {
          booking: body.modulesBooking,
          membership: body.modulesMembership,
          coupon: body.enableCoupon,
        },
        homepageLayout: body.homepageLayout,
        industrySkin: body.industrySkin,
        enableCoupon: body.enableCoupon,
      },
      update: {
        modulesEnabled: {
          booking: body.modulesBooking,
          membership: body.modulesMembership,
          coupon: body.enableCoupon,
        },
        homepageLayout: body.homepageLayout,
        industrySkin: body.industrySkin,
        enableCoupon: body.enableCoupon,
      },
    });

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: { appConfig: true },
    });

    return NextResponse.json({
      config: merchant ? toForm(merchant, merchant.appConfig) : body,
    });
  } catch (error) {
    console.error('[PUT /api/admin/settings]', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
