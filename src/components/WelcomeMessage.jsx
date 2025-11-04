import HeroImage from "./HeroImage.jsx";

export default function WelcomeMessage() {
  return (
    <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-6 shadow-pc">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Bem-vinda ao Planner do Caos
          </h1>
          <p className="text-sm text-[var(--pc-muted)] mt-1">
            Painel inicial com o essencial: tarefas de hoje, vencimentos, energia do dia —
            tudo conectado às suas páginas (Calendário, Projetos, Finanças, Biblioteca…).
          </p>
        </div>
        <div className="w-48 hidden md:block">
          <HeroImage />
        </div>
      </div>
    </div>
  );
}