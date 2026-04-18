'use client';

import { useEffect, useState } from 'react';

export default function EnvBanner() {
  const [isOutsidePi, setIsOutsidePi] = useState(false);

  useEffect(() => {
    // 基础探测，给予合理延迟容错
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && !(window as any).Pi) {
        setIsOutsidePi(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!isOutsidePi) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="bg-[#110B19] text-[#F3C136] px-4 py-3 text-sm flex flex-col sm:flex-row items-center justify-center sm:space-x-4 border-b border-[#F3C136]/20 transition-all z-[999] relative">
      <div className="flex items-center text-center sm:text-left mb-2 sm:mb-0 max-w-3xl">
        <span className="mr-2 text-lg">💡</span>
        <span>
          侦测到您当前可能未在 Pi Browser 访问。为体验无缝的生态身份互通及完整的应用功能，欢迎复制链接，
          <strong className="text-white mx-1">在 Pi Browser 中重新开启</strong>本站。
        </span>
      </div>
      <button 
        onClick={() => {
          navigator.clipboard.writeText(currentUrl);
          alert('网址已复制！请前往 Pi Browser 地址栏粘贴访问。');
        }}
        className="shrink-0 bg-[#F3C136]/10 hover:bg-[#F3C136]/20 text-[#F3C136] font-bold py-1.5 px-4 rounded transition-colors whitespace-nowrap"
      >
        复制网址
      </button>
    </div>
  );
}
