import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api.js";

const OFFLINE_KEY = "qiyas_offline_pack";

export function MockExam() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [dlBusy, setDlBusy] = useState(false);
  const [err, setErr] = useState("");
  const [paywall, setPaywall] = useState(false);

  async function downloadOffline() {
    setErr("");
    setDlBusy(true);
    try {
      const d = await api("/exams/offline-pack");
      const str = JSON.stringify(d, null, 2);
      try {
        localStorage.setItem(OFFLINE_KEY, str);
      } catch {
        /* quota */
      }
      const blob = new Blob([str], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `qiyas-offline-exam-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      if (e.status === 403 && e.data?.code === "PAYWALL") {
        setPaywall(true);
      } else {
        setErr(e.data?.error || e.message);
      }
    } finally {
      setDlBusy(false);
    }
  }

  async function start() {
    setErr("");
    setPaywall(false);
    setBusy(true);
    try {
      const d = await api("/exams/start", { method: "POST" });
      const id = d.exam?.id;
      if (!id) throw new Error("No exam id");
      nav(`/mock-exam/run/${id}`, { replace: true });
    } catch (e) {
      if (e.status === 403 && e.data?.code === "PAYWALL") {
        setPaywall(true);
      } else {
        setErr(e.data?.error || e.message || "تعذر البدء");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 page-enter">
      <h1 className="text-2xl font-bold text-brand mb-1">محاكاة كاملة</h1>
      <p className="text-slate-500 text-sm mb-6" dir="ltr" lang="en">
        20 questions · 20 min · one question at a time · no back
      </p>
      <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200/60 rounded-xl px-3 py-2 mb-4">
        المحاولة <strong>المجانية</strong> الأولى: محاكاة كاملة واحدة. بعد تسليمها، ترقية من صفحة{" "}
        <Link to="/pricing" className="text-brand font-semibold underline">
          الأسعار
        </Link>{" "}
        (واجهة فقط).
      </p>
      <ul className="list-disc pr-5 space-y-2 text-slate-700 text-sm mb-8">
        <li>20 سؤالاً: 10 لفظي و 10 كمي (يُسحَب عشوائياً من البنك).</li>
        <li>يُسجّل الوقت 20:00. انتهاء الوقت يرسل الورقة تلقائياً.</li>
        <li>لا عودة لسؤال سابق. عند إخفاء التبويب تُسجّل الإجابات.</li>
      </ul>
      {paywall && (
        <div
          className="mb-6 p-4 rounded-2xl border-2 border-gold/60 bg-gradient-to-b from-amber-50 to-white"
          role="alert"
        >
          <p className="font-bold text-brand mb-1">وصلتَ لحد التجربة المجانية</p>
          <p className="text-slate-600 text-sm mb-3">
            لإلغاء القفل في العرض: اختر باقة من الأسعار (لا دفع فعلي في الديمو).
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/pricing"
              className="inline-block bg-gold text-brand font-bold rounded-xl px-5 py-2 text-sm"
            >
              الاشتراكات
            </Link>
            <Link to="/practice" className="inline-block border border-slate-200 rounded-xl px-4 py-2 text-sm text-brand">
              وضع تمرين مجاني
            </Link>
          </div>
        </div>
      )}
      {err && !paywall && (
        <div
          className="mb-4 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2"
          role="alert"
        >
          {err}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={start}
          className="inline-block bg-gold text-brand font-bold rounded-xl px-8 py-3 shadow-lg disabled:opacity-50"
        >
          {busy ? "جارٍ التجهيز…" : "ابدأ المحاكاة الآن"}
        </button>
        <button
          type="button"
          disabled={dlBusy}
          onClick={downloadOffline}
          className="inline-block border-2 border-brand text-brand font-semibold rounded-xl px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {dlBusy ? "…" : "تحميل للاستخدام دون اتصال"}
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        بعد التحميل يمكن فتح <Link to="/offline-exam" className="text-brand font-medium">محاكاة دون اتصال</Link> من
        نفس الجهاز.
      </p>
      <p className="mt-6">
        <Link to="/dashboard" className="text-brand font-medium hover:underline">
          ← العودة للوحة التحكم
        </Link>
      </p>
    </div>
  );
}
