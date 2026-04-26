import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";

export function ExamResults() {
  const { examId: examIdParam } = useParams();
  const examId = Number(examIdParam);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!examId) {
      setErr("Invalid id");
      setLoading(false);
      return;
    }
    let c = true;
    (async () => {
      try {
        const d = await api(`/exams/${examId}/result`);
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
  }, [examId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center page-enter">
        <div className="h-10 w-10 border-2 border-gold border-t-brand rounded-full animate-spin mx-auto mb-2" />
        <p className="text-slate-500 text-sm">جارٍ تحميل النتيجة…</p>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 page-enter">
        <p className="text-red-600 mb-4">{err || "تعذر عرض النتيجة."}</p>
        <Link to="/dashboard" className="text-brand font-medium">
          ← الرئيسية
        </Link>
      </div>
    );
  }

  const e = data.exam;
  const s = data.sections;
  const vPct = s.verbal ? Math.round((s.verbal.correct / s.verbal.total) * 100) : 0;
  const qPct = s.quantitative
    ? Math.round((s.quantitative.correct / s.quantitative.total) * 100)
    : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 page-enter" dir="rtl">
      <p className="text-xs text-gold font-bold uppercase tracking-wide mb-1">نتيجة المحاكاة</p>
      <h1 className="text-2xl font-bold text-brand mb-2">أحسنت إنهاء الاختبار</h1>
      <p className="text-slate-500 text-sm mb-6" dir="ltr" lang="en">
        Score: {e.score == null ? "—" : Math.round((e.score || 0) * 10) / 10}% · {e.correctCount ?? "—"}/20
        correct ·
        {e.durationSeconds != null
          ? ` time ${Math.floor(e.durationSeconds / 60)}m ${e.durationSeconds % 60}s`
          : ""}
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm text-slate-500 mb-1">لفظي</h3>
          <p className="text-2xl font-bold text-brand">
            {s.verbal.correct}/{s.verbal.total}{" "}
            <span className="text-sm font-normal text-slate-500">({vPct}%)</span>
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm text-slate-500 mb-1">كمي</h3>
          <p className="text-2xl font-bold text-brand">
            {s.quantitative.correct}/{s.quantitative.total}{" "}
            <span className="text-sm font-normal text-slate-500">({qPct}%)</span>
          </p>
        </div>
      </div>

      <p className="text-slate-700 text-sm leading-relaxed mb-8 p-4 bg-amber-50/80 border border-amber-200/50 rounded-xl">
        {vPct >= qPct
          ? "في هذه الجولة: أداءك أعلى نسبياً في اللفظي. وازن ذلك بمضاعفة تمرين الكمي."
          : "في هذه الجولة: أداءك أعلى نسبياً في الكمي. لخصّ الاستراتيجية ومرّن اللفظي يومياً."}
      </p>

      <h2 className="text-sm font-bold text-slate-500 mb-2">مراجعة سريعة</h2>
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {data.questions?.map((q) => (
          <div
            key={q.position}
            className={`text-sm p-3 rounded-lg border ${
              q.isCorrect
                ? "bg-emerald-50 border-emerald-200"
                : "bg-red-50/80 border-red-200"
            }`}
          >
            <div className="font-medium text-slate-800 mb-1">#{q.position + 1}</div>
            <p className="text-slate-600 mb-1">{q.questionText}</p>
            <p className="text-xs text-slate-500" dir="ltr" lang="en">
              your {q.selected}, correct {q.correctAnswer} · {q.isCorrect ? "✓" : "✗"}
            </p>
            {q.explanation && (
              <p className="text-xs text-slate-500 mt-2 border-t border-white/20 pt-2">{q.explanation}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/mock-exam"
          className="inline-block bg-brand text-white font-semibold rounded-xl px-5 py-2.5 text-sm"
        >
          محاكاة جديدة
        </Link>
        <Link
          to="/performance"
          className="inline-block border border-slate-200 rounded-xl px-5 py-2.5 text-sm text-brand"
        >
          صفحة الأداء
        </Link>
        <Link
          to="/study-plan"
          className="inline-block border border-slate-200 rounded-xl px-5 py-2.5 text-sm text-brand"
        >
          خطة دراسة بالذكاء
        </Link>
        <Link to="/dashboard" className="inline-block text-slate-500 text-sm">
          ← لوحة التحكم
        </Link>
      </div>
    </div>
  );
}
