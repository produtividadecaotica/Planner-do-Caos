export default function CallToAction() {
  return (
    <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-6 shadow-pc">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Próximo passo</h3>
          <p className="text-sm text-[var(--pc-muted)]">
            Abra o Calendário e crie seu primeiro evento (clique para criar, arraste para mover/redimensionar).
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/planning"
            className="rounded-md px-4 py-2 text-sm font-medium"
            style={{ background: "var(--pc-primary)", color: "white", boxShadow: "var(--pc-shadow)" }}
          >
            Ir para Calendário
          </a>
          <a
            href="/projects"
            className="rounded-md border border-[var(--pc-border)] px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
          >
            Abrir Projetos
          </a>
        </div>
      </div>
    </div>
  );
}