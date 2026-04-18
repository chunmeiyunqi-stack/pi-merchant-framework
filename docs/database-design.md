# 数据库设计文档 (Prisma Schema)

采用 Prisma 作为 ORM 桥梁，连接 PostgreSQL。在 `prisma/schema.prisma` 中包含 10 张核心表的定义。

## 实体说明

1. **Merchant (merchants)**: 系统的主干，每个入驻或者部署的组织就是一个 merchant。单实例也可以部署为自己一个 merchant。
2. **MerchantUser (merchant_users)**: 商户的后台管理员，对应后台登录角色。
3. **Customer (customers)**: 来过该商户消费/登录过的 Pi Network 用户（通过 pi_uid 关联）。
4. **Service (services)**: 该商户提供售卖的商品/服务。
5. **AppConfig (app_configs)**: 该商户的动态配置表（对应 MerchantConfig 开关，保存在数据库中以便于 SaaS 化和后台动态控制）。

### 交易系统相关

1. **Order (orders)**: 本地业务级别的订单表。记录是谁买了什么服务，业务状态（草稿、已取消等）。
2. **Payment (payments)**: **系统核心表**。Pi 的支付记录。
   - `pi_payment_id`: PI 平台创建的支付单号。这很重要。
   - 分散状态检查位：`developerApproved`, `transactionVerified`, `developerCompleted`, `userCancelled`，分别映射到 Pi 的四步验证结构。
3. **Booking (bookings)**: 服务被购买后，如果属于按时间的预约类，落库到此处。支持核销。
4. **Membership (memberships)** & **CustomerMembership (customer_memberships)**: 商户定义的会员策略和用户实际持有的会员。

## Pi Payment 数据落库细节

在 Webhook 处理和 API Route `approve` / `complete` 中，我们采取 **UPSERT** 的方法更新 `payments` 表。
这确保了同一个 `pi_payment_id` 即使重复到达（弱网、用户刷新页面、中断恢复）也不会导致系统记录重复的流水账本。
这也是我们在 Prisma Schema 为 `pi_payment_id` 配置了 `@unique` 的原因。

```prisma
model Payment {
  id                    String        @id @default(cuid())
  orderId               String?       /// 关联订单
  piPaymentId           String        @unique /// 重要：与 Pi 挂钩
  txid                  String?       /// 链上交易 ID
  status                PaymentStatus
  ...
}
```

## 枚举管理

所有状态均通过 DB 端 Enum 进行固化保证。未来扩展新的渠道支付可进一步解耦 Order 和 Payment，但目前专为 Pi Payment 而设计，关系非常清晰。
