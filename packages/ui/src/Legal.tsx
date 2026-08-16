import React from 'react';

export interface LegalProps {
  className?: string;
}

export function PrivacyPolicy({ className = '' }: LegalProps) {
  return (
    <div className={`text-xs text-gray-600 space-y-3 leading-relaxed ${className}`}>
      <h3 className="font-bold text-gray-800 text-sm">隐私政策 (Privacy Policy)</h3>
      <p>
        本应用程序基于 Pi Network 生态系统构建，我们重视用户的隐私权。
        我们收集的信息仅限于提供服务所必需的最少数据，包括您的 Pi 用户名和 UID， 这些信息均来自 Pi
        SDK 授权流程，不会用于任何第三方营销目的。
      </p>
      <p>
        您的交易记录（订单、支付流水）将安全存储于我们的加密数据库中，
        仅用于服务履约和争议解决。我们不会出售或共享您的个人数据。
      </p>
      <p>
        如有隐私相关的问题，请通过本应用内的联系方式与我们取得联系。 政策自 2025 年 1
        月起生效，我们保留随时更新的权利，更新内容将在此页面公告。
      </p>
    </div>
  );
}

export function Disclaimer({ className = '' }: LegalProps) {
  return (
    <div className={`text-xs text-gray-600 space-y-3 leading-relaxed ${className}`}>
      <h3 className="font-bold text-gray-800 text-sm">免责声明 (Disclaimer)</h3>
      <p>
        本框架由社区开发者独立编写，仅作为技术参考和集成示例。 本框架与 Pi Network
        官方团队不存在任何隶属、背书或合作关系， 亦非基金会的官方产品。
      </p>
      <p>
        所有基于本框架开展的商业活动及衍生服务，由商户自行承担法律与运营风险。
        使用本框架即表示您已阅读并同意上述免责条款。
      </p>
    </div>
  );
}
