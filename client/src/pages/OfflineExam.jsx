import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";

const STORAGE_PACK = "qiyas_offline_pack";
const STORAGE_PENDING = "qiyas_offline_pending";

function fmtMmSs(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function OfflineExam() {
  const nav = useNavigate();
  const [pack, setPack] = useState(null);
  const [phase, setPhase] = useState("load");
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const t0 = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PACK);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.questions?.length) {
          setPack(p);
        }
      }
    } catch {
      setErr("تعذر قراءة الحزمة المحفوظة.");
    }
  }, []);

  const start = useCallback(() => {
    if (!pack) return;
    setPhase("exam");
    setIdx(0);
    setAnswers({});
    setRemaining(pack.timeLimitSeconds || 1200);
    t0.current = performance.now();
  }, [pack]);

  useEffect(() => {
    if (phase !== "exam" || !pack) return;
    timerRef.current = setInterval(() => {
      const lim = pack.timeLimitSeconds || 1200;
      const elapsed = (performance.now() - t0.current) / 1000;
      setRemaining(Math.max(0, lim - elapsed));
    }, 200);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, pack]);

  useEffect(() => {
    if (phase !== "exam" || !pack || remaining > 0) return;
    const qids = pack.questions.map((q) => q.id);
    const body = {
      questionIds: qids,
      answers: { ...answers },
      durationSeconds: Math.min(pack.timeLimitSeconds || 1200, (performance.now() - t0.current) / 1000),
    };
    try {
      localStorage.setItem(STORAGE_PENDING, JSON.stringify(body));
    } catch {
      /* */
    }
    setPhase("done");
  }, [phase, pack, remaining, answers]);

  function onPick(letter) {
    if (!pack || phase !== "exam") return;
    const q = pack.questions[idx];
    const nextAnswers = { ...answers, [q.id]: letter };
    setAnswers(nextAnswers);
    if (idx + 1 >= pack.questions.length) {
      const body = {
        questionIds: pack.questions.map((x) => x.id),
        answers: nextAnswers,
        durationSeconds: Math.min(
          pack.timeLimitSeconds || 1200,
          (performance.now() - t0.current) / 1000
        ),
      };
      try {
        localStorage.setItem(STORAGE_PENDING, JSON.stringify(body));
      } catch {
        /* */
      }
      setPhase("done");
      return;
    }
    setIdx((i) => i + 1);
  }

  async function uploadSync() {
    const raw = localStorage.getItem(STORAGE_PENDING);
    if (!raw) {
      setErr("لا بيانات للمزامنة.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      const body = JSON.parse(raw);
      const d = await api("/exams/offline-submit", { method: "POST", body });
      localStorage.removeItem(STORAGE_PENDING);
      nav(`/exam-results/${d.exam.id}`, { replace: true });
    } catch (e) {
      setErr(e.data?.error || e.message || "تعذر المزامنة");
    } finally {
      setSaving(false);
    }
  }

  if (phase === "load" && !pack) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4" dir="rtl">
        <p className="text-slate-600 text-center mb-4 max-w-sm">
          لا حزمة محلية. من صفحة المحاكاة اضغط «تحميل للاستخدام دون اتصال»، ثم عد إلى هذه الصفحة.
        </p>
        <Link to="/mock-exam" className="text-brand font-bold">
          ← المحاكاة
        </Link>
      </div>
    );
  }

  if (phase === "load" && pack) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4" dir="rtl">
        <h1 className="text-xl font-bold text-brand mb-2">محاكاة دون اتصال (ديمو)</h1>
        <p className="text-slate-500 text-sm mb-6 text-center max-w-md">
          {pack.totalQuestions} سؤالاً — المؤقّت على الجهاز فقط. النتيجة تُحفظ محلياً ويمكن مزامنتها مع الخادم.
        </p>
        <button
          type="button"
          onClick={start}
          className="px-6 py-2.5 bg-gold text-brand font-bold rounded-xl"
        >
          ابدأ
        </button>
        <p className="mt-6">
          <Link to="/mock-exam" className="text-sm text-slate-500">
            رجوع
          </Link>
        </p>
      </div>
    );
  }

  if (phase === "exam" && pack) {
    const q = pack.questions[idx];
    return (
      <div
        className="min-h-screen bg-slate-900 text-white flex flex-col select-none"
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        dir="rtl"
      >
        <header className="bg-brand/95 border-b border-white/10 px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-gold" dir="ltr" lang="en">
            Offline · {idx + 1} / {pack.questions.length}
          </span>
          <span className="font-mono text-xl text-gold" dir="ltr">
            {fmtMmSs(remaining)}
          </span>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <p className="text-lg font-medium leading-relaxed mb-6">{q.questionText}</p>
            <div className="grid gap-2">
              {["A", "B", "C", "D"].map((L) => (
                <button
                  type="button"
                  key={L}
                  onClick={() => onPick(L)}
                  className="text-right border border-white/20 rounded-xl px-4 py-3 hover:bg-white/10"
                >
                  <span className="text-gold font-mono ltr ml-2">{L}.</span>
                  {q.options?.[L]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "done" && pack) {
    let finalAnswers = answers;
    try {
      const p = JSON.parse(localStorage.getItem(STORAGE_PENDING) || "{}");
      if (p.answers) finalAnswers = p.answers;
    } catch {
      /* */
    }
    let correct = 0;
    for (const q of pack.questions) {
      const a = finalAnswers[q.id];
      if (a && String(a).toUpperCase() === String(q.correctAnswer).toUpperCase()) {
        correct += 1;
      }
    }
    const score = Math.round((correct / pack.questions.length) * 1000) / 10;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4" dir="rtl">
        <h2 className="text-2xl font-bold text-brand mb-2">انتهت المحاكاة (محلياً)</h2>
        <p className="text-slate-700 mb-1">
          تقديري: <strong className="text-gold text-xl">{score}%</strong>
        </p>
        {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
        <button
          type="button"
          onClick={uploadSync}
          disabled={saving}
          className="mt-6 px-6 py-2.5 bg-brand text-white font-bold rounded-xl disabled:opacity-50"
        >
          {saving ? "…" : "مزامنة النتيجة (عند الاتصال)"}
        </button>
        <p className="mt-4 text-xs text-slate-500 text-center max-w-sm">
          تُرسل إجاباتك للخادم لحساب الدرجة رسمياً وإضافتها لملفك.
        </p>
        <Link to="/dashboard" className="mt-6 text-brand text-sm">
          لوحة التحكم
        </Link>
      </div>
    );
  }

  return null;
}
