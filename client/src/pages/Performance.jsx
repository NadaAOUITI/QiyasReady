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
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = true;
    (async () => {
      try {
        const res = await api("/exams/performance");
        if (c) setD(res);
      } catch (e) {
        if (c) setErr(e.data?.error || e.message);
      } finally {
        if (c) setLoading(false);
      }
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
  if (err || !d) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-red-600 mb-2">{err || "خطأ"}</p>
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
        Accuracy over mock exams (submitted) · recharts
      </p>
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
