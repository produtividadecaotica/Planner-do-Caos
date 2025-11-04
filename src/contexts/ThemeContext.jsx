import { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Tema: "system" | "light" | "dark"
 * (Espelha o comportamento do ThemeToggle, mas agora centralizado em contexto)
 */

const ThemeContext = createContext(null);
const STORAGE_KEY = "pc-theme";

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    if (typeof window === "undefined") return "system";
    return localStorage.getItem(STORAGE_KEY) || "system";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("force-light", "force-dark");
    if (mode === "light") root.classList.add("force-light");
    if (mode === "dark") root.classList.add("force-dark");
    root.setAttribute("data-theme", mode || "system");
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch { }
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      cycle: () =>
        setMode((m) => (m === "system" ? "light" : m === "light" ? "dark" : "system")),
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeMode deve ser usado dentro de <ThemeProvider>");
  return ctx;
}