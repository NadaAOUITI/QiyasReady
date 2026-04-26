import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

export function CohortLeaderboard() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let c = true;
    (async () => {
      try {
        const x = await api("/leaderboard/cohort");
        if (c) setD(x);
      } catch (e) {
        if (c) setErr(e.data?.error || e.message);
      }
    })();
    return () => {
      c = false;
    };
  }, []);

  if (err) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
        <p className="text-red-600 text-sm mb-2">{err}</p>
        <Link to="/leaderboard" className="text-brand text-sm">
          الصدارة العامة
        </Link>
      </div>
    );
  }
  if (!d) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-slate-500" dir="rtl">
        جارٍ التحميل…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter" dir="rtl">
      <h1 className="text-2xl font-bold text-brand mb-1">صدارة المدرسة / الفوج</h1>
      {d.needSchool && (
        <p className="text-amber-800 bg-amber-50 border border-amber-200/60 rounded-xl px-3 py-2 text-sm mb-4">
          أضف اسم مدرستك في{" "}
          <Link to="/profile" className="font-bold underline text-brand">
            الملف الشخصي
          </Link>{" "}
          لعرض المقارنة داخل مدرستك.
        </p>
      )}
      {d.school && !d.fallback && (
        <p className="text-slate-600 text-sm mb-2">
          المدرسة: <strong>{d.school}</strong>
        </p>
      )}
      {d.fallback && d.message && (
        <p className="text-slate-500 text-sm mb-4">{d.message}</p>
      )}
      {d.note && <p className="text-slate-500 text-xs mb-4">{d.note}</p>}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-right py-2 px-3">#</th>
              <th className="text-right py-2 px-3">الطالب</th>
              <th className="text-left py-2 px-3" dir="ltr">
                متوسط
              </th>
              <th className="text-left py-2 px-3" dir="ltr">
                محاكاة
              </th>
            </tr>
          </thead>
          <tbody>
            {d.top?.map((r) => (
              <tr key={r.rank} className="border-t border-slate-100">
                <td className="py-2 px-3 font-mono text-gold">{r.rank}</td>
                <td className="py-2 px-3 font-medium">
                  {r.name}
                  {r.isYou && <span className="text-gold text-xs me-1">(أنت)</span>}
                </td>
                <td className="py-2 px-3 text-left" dir="ltr">
                  {r.score}%
                </td>
                <td className="py-2 px-3 text-left" dir="ltr">
                  {r.examsCount ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-sm text-slate-600">
        <Link className="text-brand font-medium" to="/leaderboard">
          ← الصدارة العامة
        </Link>
      </p>
    </div>
  );
}
