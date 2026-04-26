import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

function bar(pct) {
  const p = Math.min(100, Math.max(0, pct));
  return (
    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-gold transition-all duration-500"
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

export function Goals() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ daily: "", weekly: "", monthly: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    const d = await api("/goals");
    setData(d);
    setForm({
      daily: d.targets.daily || "",
      weekly: d.targets.weekly || "",
      monthly: d.targets.monthly || "",
    });
  };

  useEffect(() => {
    let c = true;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (c) setErr(e.data?.error || e.message);
      }
    })();
    return () => {
      c = false;
    };
  }, []);

  async function save() {
    setSaving(true);
    setErr("");
    try {
      await api("/goals", {
        method: "PUT",
        body: {
          daily: form.daily === "" ? 0 : Number(form.daily),
          weekly: form.weekly === "" ? 0 : Number(form.weekly),
          monthly: form.monthly === "" ? 0 : Number(form.monthly),
        },
      });
      await load();
    } catch (e) {
      setErr(e.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-slate-500" dir="rtl">
        جارٍ التحميل…
      </div>
    );
  }

  const { targets, progress } = data;
  const pct = (a, t) => (t > 0 ? Math.min(100, Math.round((a / t) * 100)) : 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter" dir="rtl">
      <h1 className="text-2xl font-bold text-brand mb-1">أهدافي</h1>
      <p className="text-slate-500 text-sm mb-6" dir="ltr" lang="en">
        Daily (practice questions) · Weekly (practice attempts) · Monthly (submitted mock exams)
      </p>
      {err && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4" role="alert">
          {err}
        </p>
      )}

      <div className="space-y-6 mb-8">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-sm text-slate-500 mb-1">الهدف اليومي (أسئلة تمرين / يوم)</p>
          <p className="text-xs text-slate-400 mb-2">التقدم: {progress.daily} / {targets.daily || "—"}</p>
          {bar(pct(progress.daily, targets.daily))}
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-sm text-slate-500 mb-1">الهدف الأسبوعي (جلسات تمرين / أسبوع)</p>
          <p className="text-xs text-slate-400 mb-2">التقدم: {progress.weekly} / {targets.weekly || "—"}</p>
          {bar(pct(progress.weekly, targets.weekly))}
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-sm text-slate-500 mb-1">الهدف الشهري (محاكاة مُسلَّمة / شهر)</p>
          <p className="text-xs text-slate-400 mb-2">التقدم: {progress.monthly} / {targets.monthly || "—"}</p>
          {bar(pct(progress.monthly, targets.monthly))}
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
        <h2 className="text-sm font-bold text-brand">تعديل الأهداف</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block text-xs">
            <span className="text-slate-500">يومي</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
              value={form.daily}
              onChange={(e) => setForm((f) => ({ ...f, daily: e.target.value }))}
            />
          </label>
          <label className="block text-xs">
            <span className="text-slate-500">أسبوعي</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
              value={form.weekly}
              onChange={(e) => setForm((f) => ({ ...f, weekly: e.target.value }))}
            />
          </label>
          <label className="block text-xs">
            <span className="text-slate-500">شهري</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
              value={form.monthly}
              onChange={(e) => setForm((f) => ({ ...f, monthly: e.target.value }))}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-gold text-brand font-bold rounded-xl text-sm disabled:opacity-50"
        >
          {saving ? "…" : "حفظ"}
        </button>
      </div>

      <p className="mt-6">
        <Link to="/dashboard" className="text-brand text-sm">
          ← لوحة التحكم
        </Link>
      </p>
    </div>
  );
}
