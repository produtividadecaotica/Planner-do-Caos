export default function Sidebar({ open, onToggle }) {
  return (
    <aside
      className={`hidden md:flex flex-col transition-all duration-200 border-r border-[var(--pc-border)] bg-[var(--pc-surface)] shadow-pc ${open ? "w-[280px]" : "w-[72px]"
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
        {open && <span className="font-semibold tracking-tight">Planner do Caos</span>}
      </div>

      <nav className="mt-2 flex-1 px-2 space-y-1 text-sm">
        <a href="/" className="block rounded-md px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5">
          {open ? "Dashboard" : "D"}
        </a>
        <a href="/planning" className="block rounded-md px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5">
          {open ? "Calendário" : "C"}
        </a>
        <a href="/objectives" className="block rounded-md px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5">
          {open ? "Mapa de Objetivos" : "O"}
        </a>
        <a href="/projects" className="block rounded-md px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5">
          {open ? "Projetos" : "P"}
        </a>
        <a href="/mood" className="block rounded-md px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5">
          {open ? "Manejo Emocional" : "M"}
        </a>
        <a href="/study" className="block rounded-md px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5">
          {open ? "Sala de Estudos" : "S"}
        </a>
        <a href="/finance" className="block rounded-md px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5">
          {open ? "Finanças" : "F"}
        </a>
        <a href="/library" className="block rounded-md px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5">
          {open ? "Biblioteca" : "B"}
        </a>
        <a href="/tools" className="block rounded-md px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5">
          {open ? "Ferramentas" : "T"}
        </a>
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