import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [mode, setMode] = useState(() => localStorage.getItem("pc-theme") || "system");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("force-light", "force-dark");
    if (mode === "light") root.classList.add("force-light");
    if (mode === "dark") root.classList.add("force-dark");
    root.setAttribute("data-theme", mode || "system");
    localStorage.setItem("pc-theme", mode);
  }, [mode]);

  const next = () =>
    setMode((m) => (m === "system" ? "light" : m === "light" ? "dark" : "system"));

  const label = mode === "system" ? "Sistema" : mode === "light" ? "Claro" : "Escuro";

  return (
    <button
      onClick={next}
      className="rounded-md border border-[var(--pc-border)] px-3 py-1.5 text-xs hover:bg-black/5 dark:hover:bg-white/5"
      title="Alternar tema"
    >
      Tema: {label}
    </button>
  );
}