import { NavLink } from "react-router-dom";

export default function Sidebar({ open, onToggle }) {
  const Item = (to, full, short) => (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `block rounded-md px-3 py-2 transition ${
          isActive ? "bg-black/5 dark:bg-white/5 font-medium" : ""
        } hover:bg-black/5 dark:hover:bg-white/5`
      }
    >
      {open ? full : short}
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
        {Item("/", "Dashboard", "D")}
        {Item("/planning", "Calendário", "C")}
        {Item("/objectives", "Mapa de Objetivos", "O")}
        {Item("/projects", "Projetos", "P")}
        {Item("/mood", "Manejo Emocional", "M")}
        {Item("/study", "Sala de Estudos", "S")}
        {Item("/finance", "Finanças", "F")}
        {Item("/library", "Biblioteca", "B")}
        {Item("/tools", "Ferramentas", "T")}
      </nav>

      <button
        onClick={onToggle}
        className="m-3 rounded-lg border border-[var(--pc-border)] px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/5"
      >
        {open ? "Recolher" : "Expandir"}
      </button>
    </aside>
  );
}
