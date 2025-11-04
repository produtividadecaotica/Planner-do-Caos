import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { FolderKanban, ChevronRight } from "lucide-react";

const store = {
  get(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }
};

function Section({ title, children }) {
  return (
    <div className="pc-card">
      <div className="pb-3 border-b border-[var(--pc-border)]">
        <h3 className="pc-title">{title}</h3>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function ObjectiveDetailPage() {
  const { id } = useParams();
  const objectives = store.get("obj:list", []);
  const projects = store.get("projects:list", []);
  const objective = useMemo(() => objectives.find(o => o.id === id) || null, [id, objectives]);

  const linked = useMemo(() => projects.filter(p => p.objectiveId === id), [projects, id]);

  if (!objective) {
    return <div className="pc-card">Objetivo não encontrado.</div>;
  }

  return (
    <div className="grid gap-6">
      <div className="pc-card">
        <div className="pb-3 border-b border-[var(--pc-border)]">
          <h1 className="text-2xl font-bold">{objective.title}</h1>
          {objective.description && <p className="mt-2 text-sm">{objective.description}</p>}
        </div>
        {/* ... aqui ficariam outros dados do seu objetivo (indicadores, metas, etc.) */}
      </div>

      <Section title="Projetos vinculados">
        {linked.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--pc-border)] p-6 text-center text-[var(--pc-muted)]">
            Nenhum projeto vinculado a este objetivo.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {linked.map(p => (
              <div key={p.id} className="rounded-lg border border-[var(--pc-border)] p-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{p.title}</div>
                  <FolderKanban className="w-4 h-4 text-purple-500" />
                </div>
                {p.imageUrl && <img src={p.imageUrl} alt="" className="mt-2 w-full h-28 object-cover rounded-lg" />}
                <div className="mt-2 text-[12px] text-[var(--pc-muted)]">
                  Tipo: {p.type === "personal" ? "Pessoal" : p.type === "work" ? "Trabalho" : "Viagem"} • Status: {p.status === "todo" ? "A Fazer" : p.status === "doing" ? "Fazendo" : "Concluído"}
                </div>
                <div className="mt-3 flex items-center justify-end">
                  <Link to="/projects" className="pc-btn ghost text-sm">
                    Abrir em Projetos <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}