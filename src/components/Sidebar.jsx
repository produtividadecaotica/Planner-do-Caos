import { NavLink } from "react-router-dom";

export default function Sidebar({ open, onToggle }) {
  const item = (to, full, short) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-md px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 ${
          isActive ? "bg-black/5 dark:bg-white/5 font-medium" : ""
        }`
      }
    >
      {open ? full : short}
    </NavLink>
  );

  return (
    <aside className={`hidden md:flex flex-col transition-all duration-200 border-r border-[var(--pc-border)] bg-[var(--pc-surface)] shadow-pc ${open ? "w-[280px]" : "w-[72px]"}`}>
      <div className="h-14 flex items-center px-4 gap-3">
        <div className="w-6 h-6 rounded-md" style={{ background: "conic-gradient(from 220deg, var(--pc-primary), var(--pc-gold), var(--pc-primary))" }} />
        {open && <span className="font-semibold tracking-tight">Planner do Caos</span>}
      </div>

      <nav className="mt-2 flex-1 px-2 space-y-1 text-sm">
        {item("/", "Dashboard", "D")}
        {item("/planning", "Calendário", "C")}
        {item("/objectives", "Mapa de Objetivos", "O")}
        {item("/projects", "Projetos", "P")}
        {item("/mood", "Manejo Emocional", "M")}
        {item("/study", "Sala de Estudos", "S")}
        {item("/finance", "Finanças", "F")}
        {item("/library", "Biblioteca", "B")}
        {item("/inbox", "Ferramentas", "T")}
      </nav>

      <button
        onClick={onToggle}
        className="m-3 rounded-lg border border-[var(--pc-border)] px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg:white/5"
      >
        {open ? "Recolher" : "Expandir"}
      </button>
    </aside>
  );
}
