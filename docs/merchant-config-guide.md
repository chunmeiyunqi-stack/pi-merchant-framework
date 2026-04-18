# 商户配置指南

Pi Merchant Framework 的核心设计理念之一就是**通过配置文件控制商户形态**。

框架中的所有商户差异功能都定义在 `MerchantConfig` 中。每个行业也有预设的配置文件。

## 配置结构

配置结构存放在 `packages/config/src/merchant-config.ts` 中。

```typescript
export interface MerchantConfig {
  merchantId: string;
  info: { ... };
  modules: { ... };
  homepage: { ... };
  industry: { ... };
  payment: { ... };
  theme?: { ... };
}
```

## 功能开关 (modules)

控制系统中哪些功能应该呈现给用户。

- `booking`: 预约模块（用于服务类行业，如理发、咨询等）
- `membership`: 会员模块（售卖月卡、次卡等）
- `subscription`: （P2）对接 Pi 网络订阅级别的服务
- `coupon`: （P2）优惠券模块
- `a2uReward`: （P2）向用户发放退款或奖励的机制

## 行业皮肤引擎

```typescript
industry: {
  skin: 'beauty' | 'fitness' | 'education' | 'consulting' | 'repair' | 'generic';
  serviceMode: 'appointment' | 'walk-in' | 'online';
  serviceUnit?: string;
  requireTimeSlot: boolean;
}
```

针对选择的行业，系统的前端页面可以进行条件化渲染（例如图标、预约步骤设计）。
配合 `theme`，可以极大改变 UI 感官。

### 开发新的行业皮肤

1. 在 `packages/config/src/industry-presets.ts` 添加新的导出预设配置。
2. 确保在后台配置页面和前台模板中加入对应枚举处理。
3. （可选）为针对的组件（如卡片）添加该行业的风格覆盖。
