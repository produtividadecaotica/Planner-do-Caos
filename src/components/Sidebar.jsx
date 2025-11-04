import { NavLink } from "react-router-dom";

export default function Sidebar({ open, onToggle }) {
  const link = (to, label, short) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-md px-3 py-2 transition ${
          isActive ? "bg-black/5 dark:bg-white/5 font-medium" : ""
        } hover:bg-black/5 dark:hover:bg-white/5`
      }
    >
      {open ? label : short}
    </NavLink>
  );

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-[var(--pc-border)] bg-[var(--pc-surface)] shadow-pc transition-all ${
        open ? "w-[280px]" : "w-[72px]"
      }`}
    >
      <div className="h-14 flex items-center px-4 gap-3">
        <div
          className="w-6 h-6 rounded-md"
          style={{
            background:
              "conic-gradient(from 220deg, var(--pc-primary), var(--pc-gold), var(--pc-primary))",
          }}
        />
        {open && <span className="font-semibold">Planner do Caos</span>}
      </div>

      <nav className="mt-2 flex-1 px-2 space-y-1 text-sm">
        {link("/", "Dashboard", "D")}
        {link("/planning", "Calendário", "C")}
        {link("/objectives", "Mapa de Objetivos", "O")}
        {link("/projects", "Projetos", "P")}
        {link("/mood", "Manejo Emocional", "M")}
        {link("/study", "Sala de Estudos", "S")}
        {link("/finance", "Finanças", "F")}
        {link("/library", "Biblioteca", "B")}
        {link("/tools", "Ferramentas", "T")}
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

