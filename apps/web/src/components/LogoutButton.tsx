'use client';

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (e) {
      console.error(e);
      window.location.href = '/';
    }
  };

  return (
    <button 
      onClick={handleLogout} 
      className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer mr-2"
    >
      断开连接
    </button>
  );
}
