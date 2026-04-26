import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

export function Dashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState(null);
  const [perf, setPerf] = useState(null);
  const [err, setErr] = useState("");
  const [goalNudge, setGoalNudge] = useState(null);

  useEffect(() => {
    let c = true;
    (async () => {
      try {
        const [e, p, g] = await Promise.all([
          api("/exams"),
          api("/exams/performance"),
          api("/goals/daily-nudge").catch(() => ({ nudge: null })),
        ]);
        if (c) {
          setExams(e.exams || []);
          setPerf(p);
          if (g?.nudge?.message) setGoalNudge(g.nudge.message);
        }
      } catch (e) {
        if (c) setErr(e.data?.error || e.message);
      }
    })();
    return () => {
      c = false;
    };
  }, []);

  const last = exams
    ?.filter((x) => x.status === "submitted" && x.submitted_at)
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0];
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 page-enter">
      {goalNudge && (
        <div
          className="fixed bottom-4 left-4 right-4 z-[55] max-w-md mx-auto bg-amber-100 border-2 border-amber-400/80 text-amber-950 text-sm rounded-2xl px-4 py-3 shadow-lg flex justify-between items-center gap-2"
          role="status"
        >
          <span>{goalNudge}</span>
          <button
            type="button"
            onClick={() => setGoalNudge(null)}
            className="shrink-0 text-amber-900/70 hover:text-amber-900"
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>
      )}
      {err && (
        <p className="text-amber-700 text-sm mb-2 bg-amber-50 border border-amber-200/60 rounded-lg px-3 py-1">
          {err}
        </p>
      )}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-brand">مرحباً، {user?.name} 👋</h1>
        <p className="text-slate-600 mt-2">
          محاكاة كاملة 20/20 دقيقة، تمرين بوقت دقيقة، ولوحة أداء مع مخطط.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            k: "آخر نتيجة",
            v:
              last?.score != null
                ? `${Math.round((last.score || 0) * 10) / 10}%`
                : "—",
            c: "من آخر محاكاة مُسلَّمة",
          },
          {
            k: "عدد المحاولات",
            v: String(perf?.examCount ?? "—"),
            c: "mock مكتمل",
          },
          {
            k: "الاسم",
            v: (user?.name || "").split(" ")[0] + "…",
            c: "طالب",
          },
        ].map((s) => (
          <div key={s.k} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-slate-500 text-sm mb-1">{s.k}</p>
            <p className="text-2xl font-bold text-brand">{s.v}</p>
            <p className="text-xs text-slate-400 mt-1">{s.c}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-l from-brand to-brand-900 text-white rounded-2xl p-6 md:p-8 shadow-lg mb-8">
        <h2 className="text-lg font-bold text-gold mb-2">ابدأ المحاكاة</h2>
        <p className="text-white/90 text-sm mb-4 max-w-xl">
          20 سؤالاً، 20 دقيقة، لا رجوع. ترك الصفحة يُسجّل الورقة.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/mock-exam"
            className="inline-block bg-gold text-brand font-bold rounded-xl px-6 py-2.5 text-sm"
          >
            ابدأ محاكاة
          </Link>
          <Link
            to="/practice"
            className="inline-block border border-white/40 rounded-xl px-5 py-2.5 text-sm text-white/95 hover:bg-white/10"
          >
            وضع التمرين
          </Link>
        </div>
        {last && (
          <p className="text-white/80 text-xs mt-4" dir="ltr" lang="en">
            View last:{" "}
            <Link className="underline text-gold" to={`/exam-results/${last.id}`}>
              exam #{last.id}
            </Link>
          </p>
        )}
      </div>

      <h3 className="text-sm font-semibold text-slate-500 mb-2">وصول سريع</h3>
      <div className="flex flex-wrap gap-2">
        {[
          ["/goals", "أهدافي"],
          ["/performance", "الأداء"],
          ["/study-plan", "خطة الدراسة"],
          ["/materials", "المادة الدراسية"],
          ["/leaderboard", "الصدارة"],
          ["/profile", "الملف"],
        ].map(([to, label]) => (
          <Link
            key={to}
            to={to}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-brand hover:border-gold"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
