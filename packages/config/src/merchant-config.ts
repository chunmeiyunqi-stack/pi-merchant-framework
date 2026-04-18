// ============================================================
// Pi Merchant Framework — 商户配置类型定义
// 这是整个框架"可配置化"的核心，所有行业差异必须通过此配置控制
// ============================================================

/**
 * 商户完整配置结构
 * 决定一个商户实例的所有功能开关、界面布局和行业特性
 */
export interface MerchantConfig {
  /** 商户唯一标识（对应数据库 merchants.id） */
  merchantId: string;

  /** 商户基础信息 */
  info: {
    name: string;
    type: string;
    logo?: string;
    contactName?: string;
    contactPhone?: string;
  };

  /** 功能模块开关（P1 功能按需启用） */
  modules: {
    /** 预约管理（P0，服务型商户必启用） */
    booking: boolean;
    /** 会员方案（P1） */
    membership: boolean;
    /** Pi 订阅（P2，需 Pi Subscription 合约） */
    subscription: boolean;
    /** 优惠券（P2） */
    coupon: boolean;
    /** A2U 奖励/退款（P2） */
    a2uReward: boolean;
  };

  /** 首页布局配置 */
  homepage: {
    /** 首页主布局模式 */
    layout: 'service-first' | 'booking-first' | 'membership-first';
    /** 首页核心 CTA 按钮行为 */
    primaryCta: 'book' | 'order' | 'join';
    /** 首页轮播图 URL 列表 */
    banners?: string[];
    /** 首页公告文本 */
    announcement?: string;
  };

  /** 行业皮肤配置 */
  industry: {
    /** 行业皮肤标识（决定 UI 风格、色调、icon 风格） */
    skin: 'beauty' | 'fitness' | 'education' | 'consulting' | 'repair' | 'generic';
    /** 服务消费模式 */
    serviceMode: 'appointment' | 'walk-in' | 'online';
    /** 服务单位名称（如"节课"、"次"、"小时"） */
    serviceUnit?: string;
    /** 是否需要选择时间槽 */
    requireTimeSlot: boolean;
  };

  /** 支付配置 */
  payment: {
    /** 结账模式：单次支付 or 订阅制 */
    checkoutMode: 'single' | 'subscription';
    /** 支付货币（当前只支持 Pi） */
    currency: 'Pi';
    /** 是否允许退款（A2U）*/
    refundEnabled: boolean;
    /** 退款时限（小时） */
    refundWindowHours?: number;
  };

  /** 主题配置（颜色、字体等） */
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily?: string;
    borderRadius?: 'sm' | 'md' | 'lg';
  };
}
