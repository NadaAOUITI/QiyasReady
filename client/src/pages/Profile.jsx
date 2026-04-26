import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const tierLabel = (t) => {
  const m = {
    none: "تجريبي",
    beginner: "Beginner (29 ر.س)",
    basic: "Basic (59 ر.س)",
    expert: "Expert (99 ر.س)",
    super: "Super (129 ر.س)",
  };
  return m[t] || t;
};

export function Profile() {
  const { user, refresh } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 page-enter" dir="rtl">
      <h1 className="text-2xl font-bold text-brand mb-6">الملف الشخصي</h1>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md mb-8 shadow-sm">
        <p className="text-sm text-slate-500">الاسم</p>
        <p className="font-semibold text-brand">{user?.name}</p>
        <p className="text-sm text-slate-500 mt-3">البريد</p>
        <p className="font-mono text-sm" dir="ltr">
          {user?.email}
        </p>
        <p className="text-sm text-slate-500 mt-3">الباقة</p>
        <p>{tierLabel(user?.subscriptionTier)}</p>
        {user?.freePractice && !user.freePractice.unlimited && user.freePractice.remaining != null && (
          <p className="text-xs text-slate-700 mt-2">
            تمرين مجاني: {user.freePractice.used} / {user.freePractice.limit} — متبقٍ:{" "}
            <strong>{user.freePractice.remaining}</strong>
          </p>
        )}
        {user?.freeTrialExhausted && (
          <p className="text-xs text-amber-800 mt-2 bg-amber-50 rounded-lg px-2 py-1">
            تم استخدام المحاكاة المجانية. يمكن الاشتراك من الأسعار.
          </p>
        )}
        <p className="text-sm text-slate-500 mt-3">سلسلة الأيام (دخول)</p>
        <p className="font-mono" dir="ltr">
          {user?.streakDays ?? 0} days
        </p>
        <p className="text-xs text-slate-400 mt-2" dir="ltr">
          Streak updates on each login.
        </p>
      </div>
      <div className="mb-8">
        <h2 className="text-sm font-bold text-slate-500 mb-2">الشارات</h2>
        <div className="flex flex-wrap gap-2">
          {(user?.badges || []).map((b) => (
            <span
              key={b.id}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                b.earned
                  ? "bg-gold/20 text-brand border-gold/50"
                  : "bg-slate-100 text-slate-400 border-slate-200"
              }`}
              title={b.label}
            >
              {b.earned ? "✓ " : "○ "}
              {b.labelAr}
            </span>
          ))}
        </div>
        {!(user?.badges?.length) && <p className="text-slate-500 text-sm">—</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/pricing" className="px-4 py-2 bg-brand text-white rounded-xl text-sm">
          ترقية الباقة
        </Link>
        <button
          type="button"
          onClick={() => refresh()}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600"
        >
          تحديث البيانات
        </button>
      </div>
    </div>
  );
}
