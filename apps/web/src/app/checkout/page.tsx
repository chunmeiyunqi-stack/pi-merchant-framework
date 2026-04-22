import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-[#110B19] text-gray-200 flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div className="text-[#F3C136] font-bold">载入收银台中...</div>}>
        <CheckoutClient />
      </Suspense>
    </main>
  );
}

