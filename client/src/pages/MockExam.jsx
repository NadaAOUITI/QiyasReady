import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api.js";

export function MockExam() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [paywall, setPaywall] = useState(false);

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
      <button
        type="button"
        disabled={busy}
        onClick={start}
        className="inline-block bg-gold text-brand font-bold rounded-xl px-8 py-3 shadow-lg disabled:opacity-50"
      >
        {busy ? "جارٍ التجهيز…" : "ابدأ المحاكاة الآن"}
      </button>
      <p className="mt-6">
        <Link to="/dashboard" className="text-brand font-medium hover:underline">
          ← العودة للوحة التحكم
        </Link>
      </p>
    </div>
  );
}
