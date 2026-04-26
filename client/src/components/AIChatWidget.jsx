import { useState, useRef, useEffect } from "react";
import { api } from "../lib/api.js";

const SYSTEM = "Qiyas tutor";

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => [
    { role: "assistant", text: "مرحباً! اطرح سؤالاً عن قياس، الرياضيات، العربية، أو الاستراتيجية. Ask in English or Arabic." },
  ]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    const t = input.trim();
    if (!t || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: t }]);
    setLoading(true);
    try {
      const d = await api("/ai/chat", { method: "POST", body: { message: t } });
      setMessages((m) => [...m, { role: "assistant", text: d.reply || "…" }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: e.data?.error || e.message || "تعذر الاتصال." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-0 start-0 z-[70] p-3 md:p-4" dir="rtl">
      {open && (
        <div className="mb-2 w-[min(100vw-1.5rem,22rem)] h-[22rem] bg-white border border-slate-200 shadow-2xl rounded-2xl flex flex-col overflow-hidden">
          <div className="bg-brand text-white text-sm font-semibold px-3 py-2 flex justify-between items-center">
            <span>مساعد {SYSTEM}</span>
            <button type="button" onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-lg leading-none">
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "bg-slate-100 rounded-xl px-3 py-2 ms-4"
                    : "bg-amber-50/90 border border-amber-100/80 rounded-xl px-3 py-2 me-2"
                }
                dir="auto"
              >
                {m.text}
              </div>
            ))}
            {loading && <p className="text-slate-400 text-xs">جارٍ الكتابة…</p>}
            <div ref={endRef} />
          </div>
          <form
            className="p-2 border-t border-slate-100 flex gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="سؤالك…"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 bg-gold text-brand text-sm font-bold rounded-lg disabled:opacity-50"
            >
              إرسال
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-gold text-brand text-xl font-bold shadow-lg border-2 border-white hover:scale-105 transition"
        aria-label="فتح المساعد"
      >
        {open ? "↓" : "?"}
      </button>
    </div>
  );
}
