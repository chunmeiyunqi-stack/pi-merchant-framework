'use client';

import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-brand-dark text-white flex items-center justify-center p-6">
      <Suspense
        fallback={
          <div className="w-8 h-8 border-4 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin" />
        }
      >
        <CheckoutClient />
      </Suspense>
    </main>
  );
}
