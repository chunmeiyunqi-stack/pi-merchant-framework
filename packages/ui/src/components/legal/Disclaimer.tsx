import React from 'react';

export interface DisclaimerProps {
  className?: string;
}

export const Disclaimer: React.FC<DisclaimerProps> = ({ className = '' }) => {
  return (
    <section className={`prose max-w-none p-4 ${className}`}>
      <h3 className="text-lg font-semibold">免责声明</h3>
      <p>
        本平台所提供的 AI 生成内容仅作为参考或辅助决策之用，不构成专业建议。请用户在依赖 AI
        建议前自行核实信息的准确性与适用性。
      </p>

      <h4 className="mt-2 font-medium">链上交易与确认</h4>
      <p>
        我们通过 Pi Platform
        集成链上支付，链上交易存在网络确认延迟与不可控因素。平台对链上交易因网络拥堵、节点问题或第三方服务中断导致的延迟或丢失不承担法律责任。
      </p>

      <h4 className="mt-2 font-medium">第三方服务可用性</h4>
      <p>
        平台可能依赖外部 AI 提供商及第三方
        API，任何第三方服务的中断、性能下降或政策变更均可能影响本平台功能。对于第三方服务导致的损失，平台在法律允许范围内不承担额外责任。
      </p>

      <h4 className="mt-2 font-medium">法律适用</h4>
      <p>本声明受适用法律约束。针对不同司法辖区的用户，依据当地法律法规执行相应合规义务。</p>
    </section>
  );
};

export default Disclaimer;
