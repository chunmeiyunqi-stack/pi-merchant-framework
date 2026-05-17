import React from 'react';

export interface PrivacyPolicyProps {
  className?: string;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ className = '' }) => {
  return (
    <section className={`prose max-w-none p-4 ${className}`}>
      <h3 className="text-lg font-semibold">隐私政策摘要</h3>
      <p>
        本应用仅收集为服务功能必要的最小信息：<strong>商户 ID（merchantId）</strong>与用于会话验证的
        <strong>会话令牌（session token）</strong>
        。不收集或存储用户私钥、支付密码或任何可用于直接访问用户区块链资产的秘密信息。
      </p>

      <h4 className="mt-2 font-medium">数据用途与保存</h4>
      <p>
        收集的数据仅用于会话鉴权、多租户隔离与服务计费统计。会话令牌采用 HMAC
        签名（服务器端验证），仅以 HttpOnly Cookie
        的形式在客户端保留，不以明文形式在第三方云端存储。
      </p>

      <h4 className="mt-2 font-medium">多租户隔离</h4>
      <p>
        平台在服务层与数据库层实现多租户硬隔离： 请求处理链使用 <code>AsyncLocalStorage</code>{' '}
        注入租户上下文（merchantId），并在 Prisma 层通过中间件自动注入 <code>merchantId</code>{' '}
        过滤，保证不同商户数据不可跨越访问。
      </p>

      <h4 className="mt-2 font-medium">第三方服务</h4>
      <p>
        为提供 AI 能力或链上服务，应用可能调用第三方 API（如 OpenAI、Anthropic、Pi
        Platform）。我们仅传递必要的请求参数，不会发送用户私钥或敏感凭证。
      </p>

      <h4 className="mt-2 font-medium">用户权利</h4>
      <p>
        用户可联系商户管理员或通过商户提供的界面请求访问、更正或删除围绕其账户的个人数据。若需行使权利，请通过商户支持渠道提交请求。
      </p>
    </section>
  );
};

export default PrivacyPolicy;
