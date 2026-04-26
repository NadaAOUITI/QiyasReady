import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { EXAM_TIPS } from "../constants/examTips.js";

export function PageTipToasts() {
  const loc = useLocation();
  const [tip, setTip] = useState(null);
  const tRef = useRef(null);
  const path = loc.pathname + loc.search;

  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current);
    const pick = EXAM_TIPS[Math.floor(Math.random() * EXAM_TIPS.length)];
    setTip(pick);
    tRef.current = setTimeout(() => setTip(null), 5500);
    return () => {
      if (tRef.current) clearTimeout(tRef.current);
    };
  }, [path]);

  if (!tip) return null;
  return (
    <div
      className="pointer-events-none fixed bottom-0 inset-x-0 z-[60] flex justify-center p-3 md:p-4"
      role="status"
    >
      <div className="pointer-events-auto max-w-md w-full bg-brand text-white/95 text-sm shadow-xl rounded-2xl px-4 py-3 border border-white/20 page-enter">
        <p className="text-gold text-xs font-bold mb-0.5">نصيحة سريعة</p>
        <p className="leading-relaxed">{tip}</p>
      </div>
    </div>
  );
}
