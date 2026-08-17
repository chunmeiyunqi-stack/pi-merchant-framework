import DashboardShell from '@/components/DashboardShell';

// 服务端布局：渲染客户端壳组件，避免客户端布局在 Linux/Vercel 触发
// page_client-reference-manifest.js ENOENT 已知构建 bug。
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
