"use client";
import { useState } from "react";

const mockOrders = [
  { id: "TXN001", user: "pi_user_88", service: "基础美甲护理", amount: 0.5, status: "completed", time: "14:05:32" },
  { id: "TXN002", user: "pi_user_42", service: "高级光疗美甲", amount: 1.0, status: "completed", time: "13:48:17" },
  { id: "TXN003", user: "pi_user_77", service: "日式美睫嫁接", amount: 1.5, status: "pending",   time: "13:21:09" },
  { id: "TXN004", user: "pi_user_13", service: "全套手足尊享", amount: 2.0, status: "completed", time: "12:55:44" },
  { id: "TXN005", user: "pi_user_56", service: "基础美甲护理", amount: 0.5, status: "cancelled", time: "12:30:00" },
];

const tabs = ["概览", "订单管理", "服务设置", "用户管理"];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("概览");
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState(false);

  const totalPi = mockOrders.filter(o => o.status === "completed").reduce((s, o) => s + o.amount, 0);
  const completed = mockOrders.filter(o => o.status === "completed").length;
  const pending   = mockOrders.filter(o => o.status === "pending").length;

  if (!authed) return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg,#1E112A,#2A1642,#110B19)",
      fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(243,193,54,0.2)",
        borderRadius: 20, padding: "40px 48px", width: 360, textAlign: "center",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", margin: "0 auto 16px",
          background: "linear-gradient(135deg,#F3C136,#9B59B6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 900, color: "#1E112A",
        }}>π</div>
        <h2 style={{ color: "#f0e6ff", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>商户管理后台</h2>
        <p style={{ color: "rgba(240,230,255,0.45)", fontSize: 13, marginBottom: 28 }}>美丽时光工作室 · Admin</p>
        <input
          type="password" placeholder="请输入管理员密码"
          value={pwd} onChange={e => { setPwd(e.target.value); setErr(false); }}
          onKeyDown={e => e.key === "Enter" && (pwd === "admin888" ? setAuthed(true) : setErr(true))}
          style={{
            width: "100%", padding: "11px 16px", borderRadius: 12, marginBottom: 12,
            background: "rgba(255,255,255,0.07)", border: err ? "1px solid rgba(192,57,43,0.6)" : "1px solid rgba(243,193,54,0.2)",
            color: "#f0e6ff", fontSize: 14, outline: "none", boxSizing: "border-box",
          }}
        />
        {err && <p style={{ color: "#e74c3c", fontSize: 12, marginBottom: 10 }}>密码错误，请重试</p>}
        <button onClick={() => pwd === "admin888" ? setAuthed(true) : setErr(true)} style={{
          width: "100%", padding: "12px", borderRadius: 12, fontWeight: 700, fontSize: 15,
          background: "linear-gradient(90deg,#F3C136,#E67E22)", color: "#1E112A", border: "none", cursor: "pointer",
        }}>登录</button>
        <p style={{ color: "rgba(240,230,255,0.25)", fontSize: 11, marginTop: 16 }}>提示：密码 admin888</p>
      </div>
    </div>
  );

  const s = { padding: "0 0 2px", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "color 0.2s" } as React.CSSProperties;

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg,#1E112A,#2A1642,#110B19)",
      fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif", color: "#f0e6ff",
    }}>
      {/* TOP BAR */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 32px", background: "rgba(30,17,42,0.8)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(243,193,54,0.15)", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg,#F3C136,#9B59B6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 18, color: "#1E112A",
          }}>π</div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>美丽时光工作室</span>
          <span style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 10,
            background: "rgba(155,89,182,0.2)", color: "#c39bd3", border: "1px solid rgba(155,89,182,0.3)",
          }}>管理后台</span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {tabs.map(t => (
            <button key={t} style={{
              ...s, color: activeTab === t ? "#F3C136" : "rgba(240,230,255,0.5)",
              borderBottom: activeTab === t ? "2px solid #F3C136" : "2px solid transparent",
            }} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>
        <button onClick={() => setAuthed(false)} style={{
          padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
          background: "rgba(192,57,43,0.15)", color: "#e74c3c",
          border: "1px solid rgba(192,57,43,0.3)", cursor: "pointer",
        }}>退出登录</button>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* 概览 */}
        {activeTab === "概览" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: "#f0e6ff" }}>📊 今日概览</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 18, marginBottom: 32 }}>
              {[
                { label: "今日总收入", value: `π ${totalPi.toFixed(1)}`, color: "#F3C136", icon: "💰" },
                { label: "完成订单", value: `${completed} 笔`, color: "#2ecc71", icon: "✓" },
                { label: "待处理", value: `${pending} 笔`, color: "#F3C136", icon: "⏳" },
                { label: "注册用户", value: "128 人", color: "#9B59B6", icon: "👤" },
              ].map(k => (
                <div key={k.label} style={{
                  padding: "22px 24px", borderRadius: 16,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{k.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: k.color, marginBottom: 4 }}>{k.value}</div>
                  <div style={{ fontSize: 13, color: "rgba(240,230,255,0.45)" }}>{k.label}</div>
                </div>
              ))}
            </div>
            {/* Recent */}
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: "rgba(240,230,255,0.7)" }}>最近交易</h3>
            <OrderTable orders={mockOrders.slice(0, 3)} />
          </div>
        )}

        {/* 订单管理 */}
        {activeTab === "订单管理" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>📋 订单管理</h2>
            <OrderTable orders={mockOrders} />
          </div>
        )}

        {/* 服务设置 */}
        {activeTab === "服务设置" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>⚙️ 服务设置</h2>
            {[
              { name: "基础美甲护理", price: 0.5, active: true },
              { name: "高级光疗美甲", price: 1.0, active: true },
              { name: "日式美睫嫁接", price: 1.5, active: true },
              { name: "全套手足尊享", price: 2.0, active: true },
            ].map(sv => (
              <div key={sv.name} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", marginBottom: 12, borderRadius: 14,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{sv.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ color: "#F3C136", fontWeight: 700 }}>π {sv.price.toFixed(1)}</span>
                  <span style={{
                    fontSize: 12, padding: "3px 10px", borderRadius: 12,
                    background: "rgba(39,174,96,0.15)", color: "#2ecc71",
                    border: "1px solid rgba(39,174,96,0.25)",
                  }}>● 上架中</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 用户管理 */}
        {activeTab === "用户管理" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>👥 用户管理</h2>
            {["pi_user_88","pi_user_42","pi_user_77","pi_user_13","pi_user_56"].map((u, i) => (
              <div key={u} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px", marginBottom: 10, borderRadius: 14,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "linear-gradient(135deg,#9B59B6,#F3C136)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700, color: "#1E112A",
                  }}>{u[8].toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{u}</div>
                    <div style={{ fontSize: 11, color: "rgba(240,230,255,0.4)" }}>Pi Network 用户</div>
                  </div>
                </div>
                <span style={{ color: "rgba(240,230,255,0.45)", fontSize: 13 }}>{i + 1} 笔订单</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

function OrderTable({ orders }: { orders: typeof mockOrders }) {
  const statusStyle = (s: string) => ({
    fontSize: 12, padding: "3px 10px", borderRadius: 12, fontWeight: 600,
    background: s === "completed" ? "rgba(39,174,96,0.15)" : s === "pending" ? "rgba(243,193,54,0.12)" : "rgba(192,57,43,0.12)",
    color: s === "completed" ? "#2ecc71" : s === "pending" ? "#F3C136" : "#e74c3c",
    border: `1px solid ${s === "completed" ? "rgba(39,174,96,0.25)" : s === "pending" ? "rgba(243,193,54,0.2)" : "rgba(192,57,43,0.2)"}`,
  });
  const label = (s: string) => s === "completed" ? "已完成" : s === "pending" ? "待处理" : "已取消";
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1.2fr 1.5fr 0.8fr 0.9fr 0.7fr",
        padding: "12px 20px", background: "rgba(255,255,255,0.04)",
        fontSize: 12, color: "rgba(240,230,255,0.4)", fontWeight: 600, letterSpacing: 0.5,
      }}>
        {["订单号","用户","服务","金额","状态","时间"].map(h => <span key={h}>{h}</span>)}
      </div>
      {orders.map((o, i) => (
        <div key={o.id} style={{
          display: "grid", gridTemplateColumns: "1fr 1.2fr 1.5fr 0.8fr 0.9fr 0.7fr",
          padding: "14px 20px", fontSize: 13,
          background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          alignItems: "center",
        }}>
          <span style={{ color: "rgba(240,230,255,0.5)", fontFamily: "monospace" }}>{o.id}</span>
          <span style={{ color: "#c39bd3" }}>{o.user}</span>
          <span>{o.service}</span>
          <span style={{ color: "#F3C136", fontWeight: 700 }}>π {o.amount.toFixed(1)}</span>
          <span style={statusStyle(o.status)}>{label(o.status)}</span>
          <span style={{ color: "rgba(240,230,255,0.4)" }}>{o.time}</span>
        </div>
      ))}
    </div>
  );
}
