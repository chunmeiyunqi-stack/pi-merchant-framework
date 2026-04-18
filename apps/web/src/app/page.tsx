"use client";
import { useState, useEffect } from "react";

}

const services = [
  { id: 1, title: "基础美甲护理", desc: "基础透明美甲，含手部护理，快速便捷且持久闪亮。", price: 0.5, tag: "热门" },
  { id: 2, title: "高级光疗美甲", desc: "采用高级环保光疗胶，色彩饱和度高，持久不脱落，彰显优雅气质。", price: 1.0, tag: "精选" },
  { id: 3, title: "日式美睫嫁接", desc: "专业美睫嫁接，采用自然仿真睫毛，打造清透素颜感。", price: 1.5, tag: "" },
  { id: 4, title: "全套手足尊享", desc: "从手部到足部的全套深层清洁及滋养，赠送精油舒缓按摩。", price: 2.0, tag: "尊享" },
];

type ToastType = "success" | "error" | "info";

export default function HomePage() {
  const [user, setUser] = useState<{ uid: string; username: string } | null>(null);
  const [piReady, setPiReady] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  const [paying, setPaying] = useState<number | null>(null);
  const [bookings, setBookings] = useState<{ title: string; txid: string; time: string }[]>([]);

  const showToast = (msg: string, type: ToastType = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;
    script.onload = () => {
      if (window.Pi) {
        window.Pi.init({ version: "2.0", sandbox: true });
        setPiReady(true);
      }
    };
    document.head.appendChild(script);
  }, []);

  const handleSignIn = async () => {
    if (!piReady || !window.Pi) {
      showToast("Pi SDK 尚未就绪，请稍后重试", "error");
      return;
    }
    try {
      const auth = await window.Pi.authenticate(["username", "payments"], (incomp) => {
        console.log("未完成支付:", incomp);
      });
      setUser(auth.user);
      showToast(`欢迎回来，${auth.user.username} ✓`, "success");
    } catch {
      showToast("登录失败，请在 Pi Browser 中打开", "error");
    }
  };

  const handleBook = (service: typeof services[0]) => {
    if (!user) {
      showToast("请先登录 Pi 账号再预约", "info");
      return;
    }
    if (!piReady || !window.Pi) {
      showToast("Pi SDK 尚未就绪", "error");
      return;
    }
    setPaying(service.id);
    window.Pi.createPayment(
      { amount: service.price, memo: `预约：${service.title}`, metadata: { serviceId: service.id } },
      {
        onReadyForServerApproval: (paymentId) => {
          console.log("待服务端审批:", paymentId);
          showToast("支付审批中...", "info");
        },
        onReadyForServerCompletion: (paymentId, txid) => {
          console.log("支付完成:", paymentId, txid);
          setBookings((prev) => [...prev, {
            title: service.title,
            txid: txid.slice(0, 12) + "...",
            time: new Date().toLocaleTimeString("zh-CN"),
          }]);
          showToast(`✓ 预约成功！${service.title} — π ${service.price.toFixed(1)}`, "success");
          setPaying(null);
        },
        onCancel: () => {
          showToast("已取消支付", "info");
          setPaying(null);
        },
        onError: (err) => {
          showToast("支付出错：" + err.message, "error");
          setPaying(null);
        },
      }
    );
  };

  const toastColors: Record<ToastType, string> = {
    success: "rgba(39,174,96,0.95)",
    error: "rgba(192,57,43,0.95)",
    info: "rgba(42,22,66,0.97)",
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#1E112A 0%,#2A1642 50%,#110B19 100%)",
      fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
      color: "#f0e6ff", margin: 0, padding: 0,
    }}>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, background: toastColors[toast.type],
          color: "#fff", padding: "12px 28px", borderRadius: 32,
          fontWeight: 600, fontSize: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap",
        }}>{toast.msg}</div>
      )}

      {/* NAV */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 32px",
        background: "rgba(30,17,42,0.75)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(243,193,54,0.15)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "linear-gradient(135deg,#F3C136,#9B59B6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 20, color: "#1E112A",
          }}>π</div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>美丽时光工作室</span>
          <span style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 20,
            background: "rgba(243,193,54,0.12)", color: "#F3C136",
            border: "1px solid rgba(243,193,54,0.25)",
          }}>官方认证 Pi 商户</span>
        </div>
        <button onClick={handleSignIn} style={{
          padding: "9px 22px", borderRadius: 24, fontWeight: 700, fontSize: 14,
          background: user ? "rgba(39,174,96,0.15)" : "linear-gradient(90deg,#F3C136,#E67E22)",
          color: user ? "#2ecc71" : "#1E112A",
          border: user ? "1px solid rgba(46,204,113,0.35)" : "none",
          cursor: "pointer",
        }}>
          {user ? `✓ ${user.username}` : "Sign in with Pi"}
        </button>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: "center", padding: "64px 24px 40px" }}>
        <div style={{
          fontSize: 80, fontWeight: 900, lineHeight: 1,
          background: "linear-gradient(90deg,#F3C136,#9B59B6,#F3C136)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: 12,
        }}>π</div>
        <h1 style={{ fontSize: 34, fontWeight: 800, margin: "0 0 12px", color: "#f0e6ff" }}>
          焕发您的独特光彩
        </h1>
        <p style={{ fontSize: 15, color: "rgba(240,230,255,0.6)", marginBottom: 4 }}>
          在美丽时光工作室，我们为您提供最专业的美容及美甲体验。
        </p>
        <p style={{ fontSize: 15, color: "rgba(240,230,255,0.6)", marginBottom: 28 }}>
          全面支持 Pi Network 链上安全支付。
        </p>
        <div style={{
          display: "inline-block", padding: "6px 20px", borderRadius: 20,
          background: "rgba(243,193,54,0.1)", border: "1px solid rgba(243,193,54,0.25)",
          color: "#F3C136", fontSize: 13,
        }}>探索我们的优质服务 · 服务起价 π 0.5</div>
      </section>

      {/* SERVICE CARDS */}
      <section style={{
        maxWidth: 900, margin: "0 auto", padding: "0 24px 48px",
        display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(380px,1fr))", gap: 22,
      }}>
        {services.map((s) => (
          <div key={s.id}
            style={{
              borderRadius: 20, overflow: "hidden",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(243,193,54,0.15)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 28px rgba(243,193,54,0.2)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            }}
          >
            <div style={{ height: 5, background: "linear-gradient(90deg,#F3C136,#9B59B6)" }} />
            <div style={{ padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <h3 style={{ fontSize: 19, fontWeight: 700, color: "#f0e6ff", margin: 0 }}>{s.title}</h3>
                {s.tag && (
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 12,
                    background: "rgba(243,193,54,0.15)", color: "#F3C136",
                    border: "1px solid rgba(243,193,54,0.25)",
                  }}>{s.tag}</span>
                )}
              </div>
              <p style={{ fontSize: 13, color: "rgba(240,230,255,0.55)", marginBottom: 20, lineHeight: 1.7 }}>{s.desc}</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(240,230,255,0.4)", marginBottom: 2 }}>服务价格</div>
                  <span style={{
                    fontSize: 26, fontWeight: 800,
                    background: "linear-gradient(90deg,#F3C136,#E67E22)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>π {s.price.toFixed(1)}</span>
                </div>
                <button
                  onClick={() => handleBook(s)}
                  disabled={paying === s.id}
                  style={{
                    padding: "10px 24px", borderRadius: 24, fontWeight: 700, fontSize: 14,
                    background: paying === s.id
                      ? "rgba(243,193,54,0.3)"
                      : "linear-gradient(90deg,#F3C136,#E67E22)",
                    color: paying === s.id ? "#F3C136" : "#1E112A",
                    border: "none", cursor: paying === s.id ? "not-allowed" : "pointer",
                    boxShadow: paying === s.id ? "none" : "0 0 14px rgba(243,193,54,0.3)",
                    transition: "all 0.2s",
                  }}
                >{paying === s.id ? "支付中..." : "立即预约"}</button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* BOOKINGS */}
      {bookings.length > 0 && (
        <section style={{
          maxWidth: 900, margin: "0 auto 48px", padding: "0 24px",
        }}>
          <h2 style={{
            fontSize: 16, fontWeight: 700, color: "#F3C136",
            marginBottom: 14, paddingBottom: 8,
            borderBottom: "1px solid rgba(243,193,54,0.2)",
          }}>✓ 我的预约记录</h2>
          {bookings.map((b, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", marginBottom: 8, borderRadius: 12,
              background: "rgba(39,174,96,0.08)", border: "1px solid rgba(39,174,96,0.2)",
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f0e6ff" }}>{b.title}</div>
                <div style={{ fontSize: 11, color: "rgba(240,230,255,0.4)", marginTop: 2 }}>TX: {b.txid}</div>
              </div>
              <div style={{ fontSize: 12, color: "rgba(240,230,255,0.4)" }}>{b.time}</div>
            </div>
          ))}
        </section>
      )}

      {/* TRUST BADGES */}
      <section style={{
        maxWidth: 900, margin: "0 auto 48px", padding: "0 24px",
        display: "flex", gap: 16, flexWrap: "wrap",
      }}>
        {[
          { icon: "🔒", label: "区块链安全支付" },
          { icon: "✓", label: "Pi Network 官方认证" },
          { icon: "⚡", label: "即时到账确认" },
          { icon: "🛡️", label: "消费者权益保障" },
        ].map((b) => (
          <div key={b.label} style={{
            flex: "1 1 180px", display: "flex", alignItems: "center", gap: 10,
            padding: "14px 18px", borderRadius: 14,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <span style={{ fontSize: 20 }}>{b.icon}</span>
            <span style={{ fontSize: 13, color: "rgba(240,230,255,0.6)" }}>{b.label}</span>
          </div>
        ))}
      </section>

      {/* FOOTER */}
      <footer style={{
        textAlign: "center", padding: "24px 16px",
        borderTop: "1px solid rgba(243,193,54,0.1)",
        color: "rgba(240,230,255,0.35)", fontSize: 12,
      }}>
        <p>© 2026 美丽时光工作室. All rights reserved.</p>
        <p style={{ marginTop: 6 }}>
          <span style={{ marginRight: 16, cursor: "pointer", color: "rgba(240,230,255,0.4)" }}>服务协议</span>
          <span style={{ marginRight: 16, cursor: "pointer", color: "rgba(240,230,255,0.4)" }}>隐私政策</span>
          <span style={{ color: "#F3C136" }}>✦ Powered by Pi Merchant</span>
        </p>
      </footer>
    </main>
  );
}

