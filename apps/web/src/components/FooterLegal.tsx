'use client';

import React, { useState } from 'react';
import { PrivacyPolicy, Disclaimer } from '@pi-merchant/ui';

export default function FooterLegal() {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <footer className="bg-white border-t mt-8">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600">
            先锋 AI 商户服务框架 V2.1.0
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPrivacy((s) => !s)}
              className="text-sm text-blue-600 hover:underline"
            >
              隐私政策
            </button>
            <button
              onClick={() => setShowDisclaimer((s) => !s)}
              className="text-sm text-blue-600 hover:underline"
            >
              免责声明
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {showPrivacy && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg">
              <PrivacyPolicy className="p-4" />
            </div>
          )}

          {showDisclaimer && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg">
              <Disclaimer className="p-4" />
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
