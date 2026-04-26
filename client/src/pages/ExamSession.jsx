import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";

function fmtMmSs(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const sectionLabel = (s) =>
  s === "verbal" ? "لفظي" : s === "quantitative" ? "كمي" : s;

export function ExamSession() {
  const { examId: examIdParam } = useParams();
  const examId = Number(examIdParam);
  const nav = useNavigate();
  const finishedRef = useRef(false);
  const [endsAt, setEndsAt] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [payload, setPayload] = useState(null);
  const questionT0 = useRef(0);

  const toResults = useCallback(() => {
    nav(`/exam-results/${examId}`, { replace: true });
  }, [examId, nav]);

  const finishFlow = useCallback(async () => {
    if (finishedRef.current) {
      toResults();
      return;
    }
    finishedRef.current = true;
    try {
      await api(`/exams/${examId}/submit`, { method: "POST" });
    } catch {
      /* may already be submitted */
    }
    toResults();
  }, [examId, toResults]);

  const loadQ = useCallback(
    async (position) => {
      setErr("");
      setLoading(true);
      try {
        const d = await api(`/exams/${examId}/question/${position}`);
        setPayload(d);
        if (d.exam?.endsAt) setEndsAt(d.exam.endsAt);
        questionT0.current = performance.now();
        setLoading(false);
      } catch (e) {
        if (e.data?.code === "EXPIRED" || e.status === 410) {
          setLoading(false);
          await finishFlow();
          return;
        }
        if (e.data?.code === "DONE") {
          setLoading(false);
          toResults();
          return;
        }
        setErr(e.data?.error || e.message);
        setLoading(false);
      }
    },
    [examId, finishFlow, toResults]
  );

  useEffect(() => {
    if (!examId) return;
    loadQ(0);
  }, [examId, loadQ]);

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const sec = (new Date(endsAt).getTime() - Date.now()) / 1000;
      setRemaining(sec);
      if (sec <= 0 && !finishedRef.current) {
        finishFlow();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt, finishFlow]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden" && !finishedRef.current) {
        finishFlow();
      }
    };
    const onHide = () => {
      if (!finishedRef.current) finishFlow();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onHide);
    };
  }, [finishFlow]);

  async function onPick(letter) {
    if (saving || !payload) return;
    setSaving(true);
    setErr("");
    const dt = Math.max(0, (performance.now() - questionT0.current) / 1000);
    try {
      const d = await api(`/exams/${examId}/answer`, {
        method: "POST",
        body: {
          position: payload.question.position,
          selectedAnswer: letter,
          timeTakenSeconds: Math.min(600, Math.round(dt)),
        },
      });
      if (d.finished) {
        finishedRef.current = true;
        toResults();
        return;
      }
      if (d.nextPosition != null) {
        await loadQ(d.nextPosition);
      }
    } catch (e) {
      if (e.data?.code === "EXPIRED" || e.status === 410) {
        await finishFlow();
        return;
      }
      setErr(e.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!examId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-300 bg-slate-900">
        معرّف غير صالح
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col" dir="rtl">
      <header className="bg-brand/95 border-b border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="text-sm text-white/80" dir="ltr" lang="en">
          QiyasReady · <span className="text-gold font-mono">Mock</span>
        </div>
        <div className="flex items-center gap-4">
          {payload?.progress && (
            <span className="text-sm">
              {payload.progress.current} / {payload.progress.total}
            </span>
          )}
          <div
            className={`font-mono text-xl font-bold tabular-nums ${
              remaining != null && remaining < 60 ? "text-red-300" : "text-gold"
            }`}
            dir="ltr"
          >
            {remaining == null ? "—" : fmtMmSs(remaining)}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!finishedRef.current) finishFlow();
            else toResults();
          }}
          className="text-xs border border-white/30 rounded-lg px-2 py-1 hover:bg-white/10"
        >
          إنهاء وتسليم
        </button>
      </header>

      <p className="text-center text-amber-200/80 text-xs py-1 bg-amber-900/20">
        لا رجوع لسؤال سابق. إذا غادرت الصفحة، تُسجّل إجاباتك وتُحسب النتيجة.
      </p>

      <div className="flex-1 flex items-center justify-center p-4">
        {loading && (
          <div className="text-center">
            <div className="h-10 w-10 border-2 border-gold border-t-white rounded-full animate-spin mx-auto mb-2" />
            <p className="text-white/80 text-sm">جارٍ تحميل السؤال…</p>
          </div>
        )}
        {err && !loading && (
          <div className="text-center text-red-300 max-w-md">
            <p>{err}</p>
            <button
              type="button"
              onClick={toResults}
              className="mt-4 px-4 py-2 bg-white/10 rounded-lg"
            >
              عرض النتيجة
            </button>
          </div>
        )}
        {!loading && !err && payload?.question && (
          <div className="w-full max-w-2xl page-enter">
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-xs px-2 py-1 bg-white/10 rounded text-gold">
                {sectionLabel(payload.question.section)}
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-semibold leading-relaxed mb-8 text-white">
              {payload.question.questionText}
            </h2>
            <div className="grid gap-2">
              {["A", "B", "C", "D"].map((L) => (
                <button
                  type="button"
                  key={L}
                  disabled={saving}
                  onClick={() => onPick(L)}
                  className="text-right border border-white/20 rounded-xl px-4 py-3 hover:bg-white/10 disabled:opacity-50 transition"
                >
                  <span className="text-gold font-mono ltr ml-2">{L}.</span>
                  {payload.question.options?.[L]}
                </button>
              ))}
            </div>
            {saving && <p className="text-sm text-white/60 mt-4">جارٍ الحفظ…</p>}
          </div>
        )}
      </div>
    </div>
  );
}
