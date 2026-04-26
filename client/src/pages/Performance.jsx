import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { api } from "../lib/api.js";

export default function Performance() {
  const [d, setD] = useState(null);
  const [pr, setPr] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = true;
    (async () => {
      const [a, b] = await Promise.allSettled([api("/exams/performance"), api("/practice/performance")]);
      if (!c) return;
      setErr("");
      if (a.status === "fulfilled") setD(a.value);
      else setErr("تعذر تحميل أداء المحاكاة.");
      if (b.status === "fulfilled") setPr(b.value);
      setLoading(false);
    })();
    return () => {
      c = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="h-9 w-9 border-2 border-gold border-t-brand rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm mt-2">جارٍ التحميل…</p>
      </div>
    );
  }
  if (!d && err) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-red-600 mb-2">{err}</p>
        <Link to="/dashboard" className="text-brand">← رجوع</Link>
      </div>
    );
  }
  if (!d) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-slate-600">لا بيانات محاكاة.</p>
        <Link to="/dashboard" className="text-brand">← رجوع</Link>
      </div>
    );
  }

  const chart = d.chart || [];
  const s = d.sectionAccuracy || {};
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 page-enter" dir="rtl">
      <h1 className="text-2xl font-bold text-brand mb-1">الأداء والتحليلات</h1>
      <p className="text-slate-500 text-sm mb-6" dir="ltr" lang="en">
        Mock test vs practice (per spec) · charts
      </p>
      {pr && pr.total > 0 && (
        <div className="mb-10 p-4 bg-emerald-50/80 border border-emerald-200/60 rounded-2xl">
          <h2 className="text-sm font-bold text-emerald-900 mb-2">تمرين — Practice</h2>
          <p className="text-sm text-slate-700 mb-2">
            إجمالي التمارين: {pr.total} — دقة تقريبية:{" "}
            {pr.accuracy != null ? `${Math.round(pr.accuracy * 10) / 10}%` : "—"}
          </p>
          <ul className="text-sm text-slate-600 space-y-1">
            {(pr.bySection || []).map((b) => (
              <li key={b.section} dir="ltr" lang="en">
                {b.section}: {b.attempts} attempts,{" "}
                {b.accuracy != null ? `${Math.round(b.accuracy * 10) / 10}%` : "—"} accuracy
              </li>
            ))}
          </ul>
        </div>
      )}
      {pr && pr.total === 0 && (
        <p className="text-slate-500 text-sm mb-6">
          لا بيانات تمرين بعد — <Link to="/practice" className="text-brand font-medium">ابدأ التمرين</Link>
        </p>
      )}

      <h2 className="text-sm font-bold text-slate-500 mb-2">محاكاة — Mock tests</h2>
      {d.examCount === 0 ? (
        <div className="p-6 bg-amber-50 border border-amber-200/60 rounded-2xl text-amber-900 text-sm mb-6">
          {d.insight}
          <p className="mt-2">
            <Link to="/mock-exam" className="text-brand font-semibold underline">
              ابدأ محاكاة
            </Link>
          </p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-sm text-slate-500">دقة اللفظي (تجميعي)</p>
              <p className="text-2xl font-bold text-brand">{s.verbal != null ? `${s.verbal}%` : "—"}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-sm text-slate-500">دقة الكمي (تجميعي)</p>
              <p className="text-2xl font-bold text-brand">
                {s.quantitative != null ? `${s.quantitative}%` : "—"}
              </p>
            </div>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed p-3 bg-slate-50 border border-slate-200/80 rounded-xl mb-6">
            {d.insight}
          </p>
          <div className="h-64 w-full bg-white border border-slate-200 rounded-2xl p-2" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="n" fontSize={12} label={{ value: "Exam #", position: "insideBottom", offset: -2 }} />
                <YAxis
                  domain={[0, 100]}
                  fontSize={12}
                  label={{ value: "Score", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  contentStyle={{ textAlign: "left" }}
                  formatter={(v) => [`${v}%`, ""]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#1E3A8A"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#F59E0B" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {d.recentExams?.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-bold text-slate-500 mb-2">آخر محاولات</h2>
              <ul className="text-sm text-slate-600 space-y-1">
                {d.recentExams.map((e) => (
                  <li key={e.id} className="flex flex-wrap justify-between border-b border-slate-100 py-1">
                    <span dir="ltr" className="font-mono text-xs text-slate-500">
                      #{e.id}
                    </span>
                    <span>
                      {e.score == null
                        ? "—"
                        : `${Math.round((e.score || 0) * 10) / 10}`}
                      % ·
                      {e.durationSeconds != null
                        ? ` ${e.durationSeconds}s`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <p className="mt-6">
        <Link to="/dashboard" className="text-brand text-sm">
          ← لوحة التحكم
        </Link>
      </p>
    </div>
  );
}
