import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const from = useLocation().state?.from || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(email, password);
      nav(from, { replace: true });
    } catch (e) {
      setErr(e.data?.error || e.message || "تعذر تسجيل الدخول");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50 px-4 page-enter">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-brand">تسجيل الدخول</h1>
          <p className="text-slate-500 text-sm mt-1" dir="ltr" lang="en">
            Welcome back
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          {err && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2" role="alert">
              {err}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">البريد</label>
            <input
              type="email"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold/60 focus:border-brand outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور</label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold/60 focus:border-brand outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
              dir="ltr"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-brand text-white font-semibold hover:opacity-95 disabled:opacity-60"
          >
            {busy ? "جارٍ الدخول…" : "دخول"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          ليس لديك حساب؟{" "}
          <Link to="/register" className="text-brand font-medium hover:underline">
            تسجيل
          </Link>
        </p>
        <p className="text-center mt-2">
          <Link to="/" className="text-slate-400 text-sm hover:underline">
            ← الرئيسية
          </Link>
        </p>
      </div>
    </div>
  );
}
