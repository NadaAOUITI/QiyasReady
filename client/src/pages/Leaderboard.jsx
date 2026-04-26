import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

export function Leaderboard() {
  const [d, setD] = useState(null);
  useEffect(() => {
    let c = true;
    (async () => {
      try {
        const x = await api("/leaderboard");
        if (c) setD(x);
      } catch {
        if (c) setD(null);
      }
    })();
    return () => {
      c = false;
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter" dir="rtl">
      <h1 className="text-2xl font-bold text-brand mb-1">الصدارة</h1>
      <p className="text-slate-500 text-sm mb-6" dir="ltr" lang="en">
        Demo top 5 — not a real global ranking
      </p>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-right py-2 px-3">#</th>
              <th className="text-right py-2 px-3">الطالب</th>
              <th className="text-left py-2 px-3" dir="ltr">
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {d?.top?.map((r) => (
              <tr key={r.rank} className="border-t border-slate-100">
                <td className="py-2 px-3 font-mono text-gold">{r.rank}</td>
                <td className="py-2 px-3 font-medium">
                  {r.name}
                  {r.isYou && <span className="text-gold text-xs me-1">(أنت)</span>}
                </td>
                <td className="py-2 px-3 text-left" dir="ltr">
                  {r.score}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {d?.note && <p className="text-slate-500 text-xs mt-4">{d.note}</p>}
      <p className="mt-4 text-sm">
        <Link className="text-brand font-medium" to="/leaderboard/cohort">
          → صدارة مدرستي
        </Link>
      </p>
      <p className="mt-3 text-sm text-slate-600">
        قارن نفسك بمحاولاتك في <Link className="text-brand font-medium" to="/performance">الأداء</Link>{" "}
        — الرقم «الحقيقي» في لوحتك.
      </p>
    </div>
  );
}
