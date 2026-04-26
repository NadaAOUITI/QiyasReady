import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export function StudyPlan() {
  const { refresh } = useAuth();
  const [days, setDays] = useState(30);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [genBusy, setGenBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let c = true;
    (async () => {
      try {
        const d = await api("/ai/study-plan");
        if (c) setPlan(d.plan);
      } catch {
        if (c) setPlan(null);
      } finally {
        if (c) setLoading(false);
      }
    })();
    return () => {
      c = false;
    };
  }, []);

  async function generate() {
    setErr("");
    setGenBusy(true);
    try {
      const d = await api("/ai/study-plan", { method: "POST", body: { daysUntilExam: days } });
      setPlan(d.plan);
      await refresh();
    } catch (e) {
      setErr(e.data?.error || e.message);
    } finally {
      setGenBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">جارٍ التحميل…</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 page-enter" dir="rtl">
      <h1 className="text-2xl font-bold text-brand mb-1">خطة الدراسة</h1>
      <p className="text-slate-500 text-sm mb-6" dir="ltr" lang="en">
        AI plan (Groq) or demo template — uses your last mock if available.
      </p>
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">أيام حتى الاختبار</label>
          <input
            type="number"
            min={7}
            max={90}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 w-28"
            dir="ltr"
          />
        </div>
        <button
          type="button"
          disabled={genBusy}
          onClick={generate}
          className="px-4 py-2.5 bg-gold text-brand font-bold rounded-xl disabled:opacity-50"
        >
          {genBusy ? "جارٍ التوليد…" : "توليد / تحديث الخطة"}
        </button>
        <Link to="/mock-exam" className="text-sm text-brand underline">
          خذ محاكاة أولاً لدقة أعلى
        </Link>
      </div>
      {err && <p className="text-red-600 text-sm mb-4">{err}</p>}

      {!plan && (
        <p className="text-slate-600">اضغط «توليد» لإنشاء جدول أسبوعي بأهداف يومية.</p>
      )}

      {plan && (
        <div className="space-y-6">
          <p className="text-slate-800 leading-relaxed p-4 bg-amber-50/60 border border-amber-200/50 rounded-xl">
            {plan.summary}
          </p>
          {plan.weeks?.map((w) => (
            <div key={w.week} className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-brand text-white px-4 py-2 text-sm font-bold">الأسبوع {w.week}</div>
              <ul className="divide-y divide-slate-100">
                {w.days?.map((d) => (
                  <li key={d.day} className="px-4 py-3 flex flex-wrap justify-between gap-2 text-sm">
                    <span className="font-semibold text-brand">{d.title}</span>
                    <span className="text-slate-600 flex-1 min-w-[12rem]">{d.target}</span>
                    <span className="text-slate-400" dir="ltr">
                      ~{d.minutes} min
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {plan.source && (
            <p className="text-xs text-slate-400" dir="ltr">
              source: {plan.source}
            </p>
          )}
        </div>
      )}

      <p className="mt-8">
        <Link to="/dashboard" className="text-brand text-sm">
          ← لوحة التحكم
        </Link>
      </p>
    </div>
  );
}
