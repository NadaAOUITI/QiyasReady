import { createContext, useContext, useEffect, useMemo, useState } from "react";

const KEY = "qiyas_font_size";
const LayoutContext = createContext({ fontSize: "md", setFontSize: () => {} });

export function AccessibilityProvider({ children }) {
  const [fontSize, setFontSizeState] = useState(() => {
    if (typeof localStorage === "undefined") return "md";
    return localStorage.getItem(KEY) || "md";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-font-size", fontSize);
    localStorage.setItem(KEY, fontSize);
  }, [fontSize]);

  const setFontSize = (s) => {
    if (["sm", "md", "lg", "xl"].includes(s)) setFontSizeState(s);
  };

  const v = useMemo(() => ({ fontSize, setFontSize }), [fontSize]);
  return <LayoutContext.Provider value={v}>{children}</LayoutContext.Provider>;
}

export function useAccessibility() {
  return useContext(LayoutContext);
}
