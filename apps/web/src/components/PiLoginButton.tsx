'use client';

import { useState } from 'react';

export default function PiLoginButton() {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Only execute inside Pi Browser where window.Pi is injected
    if (typeof window === 'undefined' || !(window as any).Pi) {
      alert("Please open this DApp inside the Pi Browser!");
      return;
    }

    setLoading(true);
    try {
      const Pi = (window as any).Pi;
      const scopes = ['payments', 'username'];
      
      const onIncompletePaymentFound = (payment: any) => {
        console.warn("⚠️ Incomplete payment found, need to sync with server:", payment);
        // Implement incomplete payment resolution to server flow here
      };

      // 1. Authenticate locally with Pi Platform
      const authResult = await Pi.authenticate(scopes, onIncompletePaymentFound);
      
      // 2. Perform backend login & upsert mapping
      const res = await fetch('/api/auth/pi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken: authResult.accessToken,
          piUid: authResult.user.uid,
          username: authResult.user.username,
          merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID || 'merchant-demo-001'
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setUsername(authResult.user.username);
      } else {
        alert('Server authentication failed: ' + data.error);
      }
    } catch (error: any) {
      console.error('Authentication Error', error);
      alert('Pi authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (username) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[#7C3AED] font-bold shadow-sm">
          {username.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-semibold text-gray-700">{username}</span>
      </div>
    );
  }

  return (
    <button 
      onClick={handleLogin} 
      disabled={loading}
      className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 rounded-xl shadow-sm text-sm font-bold transition-colors disabled:opacity-50"
    >
      {loading ? 'Logging in...' : 'Sign in with Pi'}
    </button>
  );
}
