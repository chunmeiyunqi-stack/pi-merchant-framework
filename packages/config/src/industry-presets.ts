// ============================================================
// Pi Merchant Framework — 行业预设配置
// 为快速交付提供开箱即用的行业配置模板
// 商户只需选择预设，再微调 20% 差异即可
// ============================================================

import type { MerchantConfig } from './merchant-config';

/** 行业预设基础类型（不包含 merchantId 和 info） */
type IndustryPreset = Omit<MerchantConfig, 'merchantId' | 'info'>;

// ============================================================
// 美容/美甲行业预设
// ============================================================
export const beautyPreset: IndustryPreset = {
  modules: {
    booking: true,       // 必须：预约制服务
    membership: true,    // 常用：次卡/月卡
    subscription: false,
    coupon: false,
    a2uReward: false,
  },
  homepage: {
    layout: 'booking-first',
    primaryCta: 'book',
    announcement: '在线预约，享受专属服务',
  },
  industry: {
    skin: 'beauty',
    serviceMode: 'appointment',
    serviceUnit: '次',
    requireTimeSlot: true,
  },
  payment: {
    checkoutMode: 'single',
    currency: 'Pi',
    refundEnabled: false,
    refundWindowHours: 24,
  },
  theme: {
    primaryColor: '#C48FBE',   // 玫瑰紫
    secondaryColor: '#F7D6E0', // 粉霜白
    borderRadius: 'lg',
  },
};

// ============================================================
// 健身/会员制行业预设
// ============================================================
export const fitnessPreset: IndustryPreset = {
  modules: {
    booking: true,       // 课程预约
    membership: true,    // 月卡/年卡核心
    subscription: false,
    coupon: false,
    a2uReward: false,
  },
  homepage: {
    layout: 'membership-first',
    primaryCta: 'join',
    announcement: '加入会员，开始健康生活',
  },
  industry: {
    skin: 'fitness',
    serviceMode: 'appointment',
    serviceUnit: '节',
    requireTimeSlot: true,
  },
  payment: {
    checkoutMode: 'single',
    currency: 'Pi',
    refundEnabled: false,
  },
  theme: {
    primaryColor: '#2563EB',   // 活力蓝
    secondaryColor: '#DBEAFE', // 浅蓝
    borderRadius: 'md',
  },
};

// ============================================================
// 培训/课程行业预设
// ============================================================
export const educationPreset: IndustryPreset = {
  modules: {
    booking: true,       // 课程预约
    membership: true,    // 课时包
    subscription: false,
    coupon: false,
    a2uReward: false,
  },
  homepage: {
    layout: 'service-first',
    primaryCta: 'book',
    announcement: '专业培训，Pi 支付更便捷',
  },
  industry: {
    skin: 'education',
    serviceMode: 'online',
    serviceUnit: '课时',
    requireTimeSlot: true,
  },
  payment: {
    checkoutMode: 'single',
    currency: 'Pi',
    refundEnabled: true,
    refundWindowHours: 48,
  },
  theme: {
    primaryColor: '#059669',   // 知性绿
    secondaryColor: '#D1FAE5', // 浅绿
    borderRadius: 'md',
  },
};

// ============================================================
// 咨询/维修行业预设
// ============================================================
export const consultingPreset: IndustryPreset = {
  modules: {
    booking: true,
    membership: false,
    subscription: false,
    coupon: false,
    a2uReward: false,
  },
  homepage: {
    layout: 'service-first',
    primaryCta: 'book',
    announcement: '专业咨询，随时预约',
  },
  industry: {
    skin: 'consulting',
    serviceMode: 'appointment',
    serviceUnit: '次',
    requireTimeSlot: true,
  },
  payment: {
    checkoutMode: 'single',
    currency: 'Pi',
    refundEnabled: true,
    refundWindowHours: 12,
  },
  theme: {
    primaryColor: '#7C3AED',   // 专业紫
    secondaryColor: '#EDE9FE',
    borderRadius: 'sm',
  },
};

/** 所有预设注册表，按 skin key 索引 */
export const industryPresets: Record<string, IndustryPreset> = {
  beauty: beautyPreset,
  fitness: fitnessPreset,
  education: educationPreset,
  consulting: consultingPreset,
};

/**
 * 获取行业预设
 * @param skin - 行业皮肤标识
 * @returns 对应的行业预设配置
 */
export function getIndustryPreset(skin: string): IndustryPreset {
  return industryPresets[skin] ?? {
    modules: {
      booking: true,
      membership: false,
      subscription: false,
      coupon: false,
      a2uReward: false,
    },
    homepage: { layout: 'service-first', primaryCta: 'order' },
    industry: { skin: 'generic', serviceMode: 'walk-in', requireTimeSlot: false },
    payment: { checkoutMode: 'single', currency: 'Pi', refundEnabled: false },
  };
}
