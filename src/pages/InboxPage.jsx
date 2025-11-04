// ... seus imports existentes
import { storage } from "../lib/utils.js";
import { useEffect, useState } from "react";
import { CheckCircle2, Inbox, ChevronRight } from "lucide-react";

function useUndatedTasks() {
  const [items, setItems] = useState(() => storage.get("inbox.items", []));
  useEffect(() => {
    const i = setInterval(() => setItems(storage.get("inbox.items", [])), 800);
    return () => clearInterval(i);
  }, []);
  return items.filter(it => it.status === "inbox" && !it.dueAt && !(it.recurrence?.enabled));
}

export default function DashboardPage() {
  // ... resto do seu Dashboard

  const undated = useUndatedTasks().slice(0, 10); // mostra as 10 mais recentes

  return (
    <div className="grid gap-6">
      {/* ... cards anteriores */}

      <section className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5 shadow-pc">
        <header className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Inbox className="w-4 h-4" /> Tarefas sem data
          </h3>
          <a href="#/inbox" className="text-xs underline flex items-center gap-1">abrir Inbox <ChevronRight className="w-3 h-3" /></a>
        </header>
        <div className="grid gap-2">
          {undated.length === 0 && <div className="text-sm text-[var(--pc-muted)]">Nada por aqui — tudo que tem data foi para o calendário.</div>}
          {undated.map(it => (
            <div key={it.id} className="rounded-lg border px-3 py-2 text-sm flex items-center justify-between">
              <div className="truncate">{it.title}</div>
              <a href={`#/inbox?edit=${it.id}`} className="text-xs underline flex items-center gap-1">editar <CheckCircle2 className="w-3 h-3" /></a>
            </div>
          ))}
        </div>
      </section>

      {/* ... resto do seu Dashboard */}
    </div>
  );
}