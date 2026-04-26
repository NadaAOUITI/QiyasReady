import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAccessibility } from "../../context/AccessibilityContext.jsx";
import { AIChatWidget } from "../AIChatWidget.jsx";
import { PageTipToasts } from "../PageTipToasts.jsx";

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition ${
    isActive ? "bg-white/20 text-white" : "text-white/80 hover:text-white"
  }`;

const nav = [
  { to: "/dashboard", label: "الرئيسية" },
  { to: "/mock-exam", label: "محاكاة" },
  { to: "/practice", label: "تمرين" },
  { to: "/performance", label: "الأداء" },
  { to: "/study-plan", label: "خطة" },
  { to: "/materials", label: "مادة" },
  { to: "/common-mistakes", label: "أخطاء" },
  { to: "/leaderboard", label: "لوحة" },
  { to: "/profile", label: "الملف" },
  { to: "/pricing", label: "الأسعار" },
];

const fontSteps = [
  { id: "sm", label: "ص" },
  { id: "md", label: "ط" },
  { id: "lg", label: "ك" },
  { id: "xl", label: "ك+" },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const { fontSize, setFontSize } = useAccessibility();
  const navGo = useNavigate();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand text-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/dashboard" className="text-lg font-bold whitespace-nowrap">
              <span className="text-gold">●</span> QiyasReady
            </Link>
            <span className="text-white/60 text-xs hidden sm:inline" dir="ltr" lang="en">
              GMAT-style prep · Demo
            </span>
          </div>
          <div className="flex flex-1 min-w-0 justify-end">
            <nav className="flex flex-wrap items-center justify-end gap-0.5 sm:gap-1">
              {nav.map((n) => (
                <NavLink key={n.to} to={n.to} className={linkClass} end={n.to === "/dashboard"}>
                  {n.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center flex-wrap gap-1 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-0.5" title="حجم النص" aria-label="حجم النص">
              {fontSteps.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFontSize(f.id)}
                  className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    fontSize === f.id
                      ? "border-gold bg-white/20 text-white"
                      : "border-white/30 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span className="text-sm text-white/90 truncate max-w-[10rem]">{user?.name}</span>
            <button
              type="button"
              onClick={() => {
                logout();
                navGo("/");
              }}
              className="text-xs border border-white/30 rounded-lg px-2 py-1 hover:bg-white/10"
            >
              خروج
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 relative">
        <PageTipToasts />
        <Outlet />
        <AIChatWidget />
      </main>
      <footer className="bg-slate-100 border-t border-slate-200 py-4 text-center text-slate-500 text-xs">
        QiyasReady · عرض توضيحي · لا دفع فعلي
      </footer>
    </div>
  );
}
