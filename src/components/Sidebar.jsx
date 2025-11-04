import { NavLink } from "react-router-dom";

export default function Sidebar({ open = true, onToggle }) {
  const Item = (to, label) => (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `block rounded-md px-3 py-2 transition ${
          isActive ? "bg-black/5 dark:bg-white/5 font-medium" : ""
        } hover:bg-black/5 dark:hover:bg-white/5`
      }
    >
      {label}
    </NavLink>
  );

  return (
    <aside className="w-[280px] shrink-0 border-r border-[var(--pc-border)] bg-[var(--pc-surface)] shadow-pc p-3">
      <nav className="flex flex-col gap-1 text-sm">
        {Item("/", "Dashboard")}
        {Item("/planning", "Calendário")}
        {Item("/objectives", "Mapa de Objetivos")}
        {Item("/projects", "Projetos")}
        {Item("/mood", "Manejo Emocional")}
        {Item("/study", "Sala de Estudos")}
        {Item("/finance", "Finanças")}
        {Item("/library", "Biblioteca")}
        {Item("/tools", "Ferramentas")}
      </nav>

      {onToggle && (
        <button
          onClick={onToggle}
          className="mt-3 w-full rounded-lg border border-[var(--pc-border)] px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/5"
        >
          {open ? "Recolher" : "Expandir"}
        </button>
      )}
    </aside>
  );
}
