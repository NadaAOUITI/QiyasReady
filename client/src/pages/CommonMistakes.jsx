import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

const sectionAr = (s) => (s === "verbal" ? "لفظي" : s === "quantitative" ? "كمي" : s);

export default function CommonMistakes() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = true;
    (async () => {
      try {
        const d = await api("/practice/mistakes");
        if (c) setData(d);
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
      <div className="max-w-3xl mx-auto px-4 py-16 text-center" dir="rtl">
        <div className="h-8 w-8 border-2 border-gold border-t-brand rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm mt-2">جارٍ التحميل…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10" dir="rtl">
        <p className="text-red-600 mb-2">{err}</p>
        <Link to="/dashboard" className="text-brand text-sm">← رجوع</Link>
      </div>
    );
  }

  const top = data?.topMissed || [];
  const personal = data?.personal || [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 page-enter" dir="rtl">
      <h1 className="text-2xl font-bold text-brand mb-1">تقرير الأخطاء الشائعة</h1>
      <p className="text-slate-500 text-sm mb-2" dir="ltr" lang="en">
        Spec: purchasable deep report in production — this demo shows aggregate + your practice misses.
      </p>
      <p className="text-xs text-slate-500 mb-6">
        {data?.demo ? "وضع عرض: بيانات مجمّعة من جلسات التمرين في قاعدة التجربة." : ""}
      </p>

      <section className="mb-10">
        <h2 className="text-sm font-bold text-slate-800 mb-3">الأسئلة الأكثر خطأ (عينة المجتمع)</h2>
        {top.length === 0 ? (
          <p className="text-sm text-slate-600">لا بيانات كافية بعد — جرّب التمرين مع مستخدمين آخرين في التجربة.</p>
        ) : (
          <ul className="space-y-3">
            {top.map((r) => (
              <li
                key={r.id}
                className="p-3 rounded-xl border border-slate-200 bg-white/90 text-sm"
              >
                <div className="flex justify-between gap-2 text-xs text-slate-500 mb-1">
                  <span>{sectionAr(r.section)}</span>
                  <span dir="ltr" lang="en">
                    {r.miss_count} misses
                  </span>
                </div>
                <p className="text-slate-800 leading-relaxed">{r.preview}…</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-bold text-slate-800 mb-3">أخطاؤك الأخيرة في التمرين</h2>
        {personal.length === 0 ? (
          <p className="text-sm text-slate-600">لا أخطاء مسجّلة — أحسنت!</p>
        ) : (
          <ul className="space-y-2 text-sm text-slate-700">
            {personal.map((r, i) => (
              <li key={`${r.id}-${i}`} className="border-b border-slate-100 pb-2">
                <span className="text-gold text-xs ltr">[{r.section}]</span> {r.preview}
                {r.chapter ? ` — ${r.chapter}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8">
        <Link to="/practice" className="text-brand font-medium text-sm">
          → العودة للتمرين
        </Link>
      </p>
    </div>
  );
}
