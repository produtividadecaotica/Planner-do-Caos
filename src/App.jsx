
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import WelcomeMessage from "./components/WelcomeMessage.jsx";
import CallToAction from "./components/CallToAction.jsx";

/**
 * Shell do app (dashboard app + dark academia):
 * - Sidebar à esquerda (colapsável)
 * - Header/topbar
 * - Área de conteúdo com placeholders elegantes (até ligarmos as pages)
 */
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Remove o splash assim que o React subir
    if (typeof window !== "undefined" && window.__pc_ready__) {
      window.__pc_ready__();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[var(--pc-bg)] text-[var(--pc-text)]">
      <div className="flex">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />

        <div className="flex-1 min-w-0">
          <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />

          <main className="p-4 md:p-6 grid gap-6">
            <WelcomeMessage />
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-6 shadow-pc">
                <h2 className="text-lg font-semibold tracking-tight mb-2">Hoje</h2>
                <p className="text-sm text-[var(--pc-muted)]">
                  Tarefas e eventos de hoje aparecem aqui. (Depois vamos ligar ao Calendário/Inbox.)
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-6 shadow-pc">
                <h2 className="text-lg font-semibold tracking-tight mb-2">Contas que vencem hoje</h2>
                <p className="text-sm text-[var(--pc-muted)]">
                  Financeiro resumido do dia. (Ligaremos às tabelas de Finanças.)
                </p>
              </div>
            </section>

            <CallToAction />
          </main>
        </div>
      </div>
    </div>
  );
}
