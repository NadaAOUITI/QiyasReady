import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const sections = [
  { id: "verbal", label: "لفظي" },
  { id: "quantitative", label: "كمي" },
];

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const SEC = 60;

export function PracticeMode() {
  const { refresh } = useAuth();
  const [section, setSection] = useState("verbal");
  const [q, setQ] = useState(null);
  const [freeMeta, setFreeMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState(null);
  const [hintBusy, setHintBusy] = useState(false);
  const [err, setErr] = useState("");
  const [paywall, setPaywall] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [left, setLeft] = useState(SEC);
  const [phase, setPhase] = useState("pick");
  const [reportText, setReportText] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMsg, setReportMsg] = useState("");
  const t0 = useRef(0);
  const timeoutHandled = useRef(false);

  const loadQuestion = useCallback(async (sec) => {
    setErr("");
    setPaywall(false);
    setFeedback(null);
    setReportText("");
    setReportOpen(false);
    setReportMsg("");
    setHint(null);
    setLoading(true);
    setPhase("question");
    timeoutHandled.current = false;
    try {
      const d = await api(`/practice/question?section=${encodeURIComponent(sec)}`);
      setQ(d.question);
      setFreeMeta(d.freePractice || null);
      setLeft(SEC);
      t0.current = performance.now();
    } catch (e) {
      if (e.status === 403 && e.data?.code === "PAYWALL_PRACTICE") {
        setPaywall(true);
      } else {
        setErr(e.data?.error || e.message);
      }
      setQ(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (phase !== "question" || !q) return;
    const id = setInterval(() => {
      const leftMs = t0.current + SEC * 1000 - performance.now();
      const secL = Math.max(0, Math.ceil(leftMs / 1000));
      setLeft(secL);
      if (secL <= 0 && !timeoutHandled.current) {
        timeoutHandled.current = true;
        (async () => {
          setPhase("result");
          try {
            const d = await api("/practice/timeout", {
              method: "POST",
              body: { questionId: q.id },
            });
            setFeedback({
              timedOut: true,
              correct: false,
              correctAnswer: d.correctAnswer,
              explanation: d.explanation,
            });
            if (d.freePractice) setFreeMeta(d.freePractice);
          } catch (e) {
            if (e.status === 403 && e.data?.code === "PAYWALL_PRACTICE") {
              setPaywall(true);
            } else {
              setErr(e.data?.error || e.message);
            }
          }
        })();
      }
    }, 200);
    return () => clearInterval(id);
  }, [phase, q]);

  async function loadHint() {
    if (!q) return;
    setHintBusy(true);
    setHint(null);
    try {
      const d = await api(`/practice/hint?questionId=${q.id}`);
      setHint(d.hint);
    } catch (e) {
      setErr(e.data?.error || e.message);
    } finally {
      setHintBusy(false);
    }
  }

  async function submitAnswer(letter) {
    if (!q || saving || timeoutHandled.current) return;
    timeoutHandled.current = true;
    setSaving(true);
    setPhase("result");
    const dt = Math.max(0, (performance.now() - t0.current) / 1000);
    try {
      const d = await api("/practice/attempt", {
        method: "POST",
        body: {
          questionId: q.id,
          selectedAnswer: letter,
          timeTakenSeconds: Math.min(SEC, Math.round(dt)),
        },
      });
      setFeedback(d);
      if (d.freePractice) setFreeMeta(d.freePractice);
    } catch (e) {
      if (e.status === 403 && e.data?.code === "PAYWALL_PRACTICE") {
        setPaywall(true);
      } else {
        setErr(e.data?.error || e.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter" dir="rtl">
      <h1 className="text-2xl font-bold text-brand mb-1">وضع التمرين</h1>
      <p className="text-slate-500 text-sm mb-2" dir="ltr" lang="en">
        1 min per question (spec) · 5 free questions without subscription, then paywall
      </p>
      {freeMeta && !freeMeta.unlimited && freeMeta.remaining != null && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200/60 rounded-lg px-3 py-2 mb-3">
          متبقٍ في التجربة المجانية: <strong>{freeMeta.remaining}</strong> / {freeMeta.limit}
        </p>
      )}
      {paywall && (
        <div className="mb-4 p-4 border-2 border-gold/50 rounded-2xl bg-amber-50/90">
          <p className="font-bold text-brand mb-1">انتهت أسئلة التمرين المجانية (5)</p>
          <Link to="/pricing" className="text-brand underline font-medium">
            فعّل اشتراكاً
          </Link>{" "}
          (واجهة ديمو).
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-6">
        {sections.map((s) => (
          <button
            type="button"
            key={s.id}
            onClick={() => {
              setSection(s.id);
              setQ(null);
              setFeedback(null);
              setErr("");
              setPaywall(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              section === s.id
                ? "bg-brand text-white"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {err && !loading && !paywall && (
        <div
          className="mb-4 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2"
          role="alert"
        >
          {err}
        </div>
      )}

      {!q && !loading && !paywall && (
        <button
          type="button"
          onClick={() => loadQuestion(section)}
          className="px-4 py-2.5 bg-gold text-brand font-bold rounded-xl"
        >
          ابدأ سؤالاً
        </button>
      )}

      {loading && <p className="text-slate-500 text-sm">جارٍ التحميل…</p>}

      {q && !feedback && phase === "question" && (
        <div className="mt-2">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <span className="text-xs text-slate-500">الوقت</span>
            <span className="font-mono text-lg text-brand" dir="ltr">
              {fmt(left)}
            </span>
            <button
              type="button"
              onClick={loadHint}
              disabled={hintBusy}
              className="text-xs px-2 py-1 border border-gold/60 rounded-lg text-brand hover:bg-amber-50"
            >
              {hintBusy ? "…" : "تلميح (AI)"}
            </button>
          </div>
          {hint && (
            <p className="text-sm text-slate-700 bg-slate-100 rounded-lg p-2 mb-3 border border-slate-200">
              {hint}
            </p>
          )}
          <p className="text-slate-800 font-medium leading-relaxed mb-6">{q.questionText}</p>
          {["A", "B", "C", "D"].map((L) => (
            <button
              type="button"
              key={L}
              disabled={saving}
              onClick={() => submitAnswer(L)}
              className="w-full text-right border border-slate-200 rounded-xl px-4 py-2.5 mb-2 hover:border-gold disabled:opacity-50"
            >
              <span className="text-gold font-mono ltr ml-2">{L}.</span>
              {q.options?.[L]}
            </button>
          ))}
        </div>
      )}

      {feedback && (
        <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/80">
          {feedback.timedOut && (
            <p className="text-amber-800 text-sm font-semibold mb-2">انتهى الوقت (يُسجّل لحد التجربة)</p>
          )}
          <p className="font-bold text-brand mb-1">
            {!feedback.timedOut && (feedback.correct ? "صحيح ✓" : "خطأ ✗")}
            {" الإجابة: "}
            <span dir="ltr" className="font-mono">
              {feedback.correctAnswer}
            </span>
          </p>
          <p className="text-sm text-slate-700 leading-relaxed mb-3">{feedback.explanation}</p>
          {q && (
            <div className="mb-3 border-t border-slate-200/80 pt-3">
              {!reportOpen && !reportMsg && (
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="text-sm text-amber-900 underline"
                >
                  هل هذا السؤال خاطئ؟
                </button>
              )}
              {reportOpen && !reportMsg && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">وصف المشكلة (يمنح 5 نقاط عند أول بلاغ):</p>
                  <textarea
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm min-h-[72px]"
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    dir="auto"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setReportMsg("");
                        try {
                          const d = await api("/practice/report", {
                            method: "POST",
                            body: { questionId: q.id, reportText },
                          });
                          setReportMsg(`شكراً! حصلت على +${d.creditsAdded} نقاط.`);
                          setReportOpen(false);
                          await refresh();
                        } catch (e) {
                          setReportMsg(
                            "خطأ: " + (e.data?.error || e.message || "تعذر الإرسال")
                          );
                        }
                      }}
                      className="px-3 py-1.5 bg-gold text-brand text-xs font-bold rounded-lg"
                    >
                      إرسال
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReportOpen(false);
                        setReportText("");
                      }}
                      className="px-2 py-1 text-xs text-slate-500"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
              {reportMsg && <p className="text-sm text-emerald-800 bg-emerald-50 rounded-lg px-2 py-1">{reportMsg}</p>}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setQ(null);
                setFeedback(null);
                setErr("");
                setHint(null);
                setPaywall(false);
                loadQuestion(section);
              }}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm"
            >
              سؤال تالي
            </button>
            <Link to="/dashboard" className="px-3 py-2 text-sm text-slate-500">
              لوحة التحكم
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
