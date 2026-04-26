import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

const tiers = [
  { id: "beginner", name: "Beginner", sar: 29, items: ["محاكاة واحدة أسبوعياً", "تمارين أساسية", "دعم بريد"] },
  { id: "basic", name: "Basic", sar: 59, items: ["محاكاة غير محدودة", "تحليلات الأداء", "شارة تقدم"], highlight: true },
  { id: "expert", name: "Expert", sar: 99, items: ["كل ميزات Basic", "جلسات استراتيجية", "أولوية الدعم"] },
];

export function Pricing() {
  const { user, refresh } = useAuth();
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState("");

  async function pick(tier) {
    if (!user) {
      return;
    }
    setMsg("");
    setBusy(tier);
    try {
      await api("/users/plan", { method: "POST", body: { tier } });
      setMsg("تم تفعيل الباقة في وضع العرض. يمكنك الآن بدء محاكاة جديدة.");
      await refresh();
    } catch (e) {
      setMsg(e.data?.error || e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 page-enter">
      <h1 className="text-2xl font-bold text-brand text-center mb-2">الأسعار</h1>
      <p className="text-center text-slate-500 text-sm mb-2" dir="ltr" lang="en">
        Demo only — no real payment processing.
      </p>
      <p className="text-center text-slate-600 text-sm mb-10">
        اضغط «اختر» لتفعيل الباقة في قاعدة البيانات وإلغاء قفل المحاكاة الإضافية.
      </p>
      {msg && (
        <p className="text-center text-emerald-800 bg-emerald-50 border border-emerald-200/60 rounded-xl px-4 py-2 mb-6 text-sm max-w-lg mx-auto">
          {msg}
        </p>
      )}
      <div className="grid md:grid-cols-3 gap-4">
        {tiers.map((t) => (
          <div
            key={t.id}
            className={`rounded-2xl border p-6 flex flex-col ${
              t.highlight
                ? "border-gold bg-gradient-to-b from-amber-50 to-white shadow-lg scale-[1.02]"
                : "border-slate-200 bg-white shadow-sm"
            }`}
          >
            <h2 className="text-lg font-bold text-brand">{t.name}</h2>
            <p className="text-3xl font-extrabold text-brand mt-2">
              {t.sar}{" "}
              <span className="text-base font-normal text-slate-500">ر.س / شهر</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 flex-1">
              {t.items.map((i) => (
                <li key={i}>✓ {i}</li>
              ))}
            </ul>
            {user ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => pick(t.id)}
                className={`mt-6 w-full text-center py-2.5 rounded-xl font-semibold ${
                  t.highlight ? "bg-gold text-brand" : "bg-brand text-white"
                } disabled:opacity-50`}
              >
                {busy === t.id ? "…" : "اختر (ديمو)"}
              </button>
            ) : (
              <Link
                to="/register"
                className={`mt-6 block text-center py-2.5 rounded-xl font-semibold ${
                  t.highlight ? "bg-gold text-brand" : "bg-brand text-white"
                }`}
              >
                سجّل أولاً
              </Link>
            )}
          </div>
        ))}
      </div>
      <p className="text-center mt-8">
        <Link to={user ? "/mock-exam" : "/register"} className="text-brand font-medium text-sm">
          {user ? "↩ العودة للمحاكاة" : "إنشاء حساب"}
        </Link>
      </p>
    </div>
  );
}
