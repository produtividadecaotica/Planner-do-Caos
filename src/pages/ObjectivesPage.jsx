
import React, { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog.jsx";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog.jsx";
import { useToast } from "@/components/ui/use-toast.js";
import { Plus, Edit2, Trash2, Search, Calendar, Target, ChevronRight, Star, Flag } from "lucide-react";
import ProjectsPage from "./ProjectsPage.jsx";

/* ========== Storage utils ========== */
const store = {
  get(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch { return fallback; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
};
const uid = () => Math.random().toString(36).slice(2, 10);

/* ========== Helpers ========== */
const QUARTERS = ["Ano inteiro", "Q1", "Q2", "Q3", "Q4"];
const STATUS = ["planejado", "em progresso", "concluído", "pausado", "cancelado"];
const PRIORITIES = ["baixa", "média", "alta"];

function statusBadgeColor(s) {
  switch (s) {
    case "em progresso": return "bg-amber-50 text-amber-700 border-amber-200";
    case "concluído": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "pausado": return "bg-zinc-50 text-zinc-700 border-zinc-200";
    case "cancelado": return "bg-red-50 text-red-700 border-red-200";
    default: return "bg-indigo-50 text-indigo-700 border-indigo-200";
  }
}

/* ========== Modal de objetivo (criar/editar rápido) ========== */
function ObjectiveModal({ open, onClose, initial, onSave }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [year, setYear] = useState(initial?.year || new Date().getFullYear());
  const [quarter, setQuarter] = useState(initial?.quarter || "Ano inteiro");
  const [status, setStatus] = useState(initial?.status || "planejado");
  const [priority, setPriority] = useState(initial?.priority || "média");
  const [dueDate, setDueDate] = useState(initial?.dueDate || "");
  const [progress, setProgress] = useState(initial?.progress ?? 0);
  const [tags, setTags] = useState((initial?.tags || []).join(", "));

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || "");
      setDescription(initial?.description || "");
      setYear(initial?.year || new Date().getFullYear());
      setQuarter(initial?.quarter || "Ano inteiro");
      setStatus(initial?.status || "planejado");
      setPriority(initial?.priority || "média");
      setDueDate(initial?.dueDate || "");
      setProgress(initial?.progress ?? 0);
      setTags((initial?.tags || []).join(", "));
    }
  }, [open, initial]);

  function confirm() {
    const payload = {
      ...(initial || { id: uid() }),
      title: title.trim(),
      description: description.trim(),
      year: Number(year) || new Date().getFullYear(),
      quarter,
      status,
      priority,
      dueDate,
      progress: Math.max(0, Math.min(100, Number(progress) || 0)),
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      projectIds: initial?.projectIds || [],
      keyResults: initial?.keyResults || []
    };
    onSave(payload);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar objetivo" : "Novo objetivo"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <label className="grid gap-1 text-sm">
            <span>Título</span>
            <input className="pc-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Atingir R$ 100k de faturamento" />
          </label>

          <label className="grid gap-1 text-sm">
            <span>Descrição</span>
            <textarea className="pc-textarea min-h-[90px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contexto, por quê importa, hipótese…" />
          </label>

          <div className="grid sm:grid-cols-4 gap-3">
            <label className="grid gap-1 text-sm">
              <span>Ano</span>
              <input className="pc-input" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Trimestre</span>
              <select className="pc-input" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
                {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span>Status</span>
              <select className="pc-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span>Prioridade</span>
              <select className="pc-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="grid gap-1 text-sm">
              <span>Prazo (opcional)</span>
              <input className="pc-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Progresso %</span>
              <input className="pc-input" type="number" min="0" max="100" value={progress} onChange={(e) => setProgress(e.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Tags (separadas por vírgula)</span>
              <input className="pc-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="crescimento, marketing, mpc…" />
            </label>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <button className="pc-btn ghost">Cancelar</button>
          </DialogClose>
          <button className="pc-btn primary" disabled={!title.trim()} onClick={confirm}>Salvar</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ========== Cartão de objetivo ========== */
function ObjectiveCard({ obj, onEdit, onDelete, onOpenDetail }) {
  return (
    <div className="pc-card p-0 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold leading-tight">{obj.title}</div>
            <div className="text-xs text-[var(--pc-muted)]">{obj.description || "—"}</div>
          </div>
          <span className={`text-[11px] border rounded-full px-2 py-0.5 ${statusBadgeColor(obj.status)}`}>{obj.status}</span>
        </div>

        <div className="mt-3 grid sm:grid-cols-3 gap-2 text-[12px] text-[var(--pc-muted)]">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" /> {obj.year} • {obj.quarter}
          </div>
          <div className="flex items-center gap-1">
            <Flag className="w-4 h-4" /> prioridade: <b className="ml-1">{obj.priority}</b>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4" /> progresso: <b className="ml-1">{obj.progress || 0}%</b>
          </div>
        </div>

        {!!obj.tags?.length && (
          <div className="mt-2 flex flex-wrap gap-1">
            {obj.tags.map(t => (
              <span key={t} className="text-[11px] px-2 py-0.5 rounded-full border border-[var(--pc-border)]">{t}</span>
            ))}
          </div>
        )}

        {!!obj.projectIds?.length && (
          <div className="mt-2 text-[12px] text-[var(--pc-muted)]">
            {obj.projectIds.length} projeto(s) vinculados
          </div>
        )}
      </div>

      <div className="border-t border-[var(--pc-border)] p-3 flex items-center justify-between">
        <div className="flex gap-2">
          <button className="pc-btn ghost" onClick={onEdit}><Edit2 className="w-4 h-4" /> editar</button>
          <button className="pc-btn danger ghost" onClick={onDelete}><Trash2 className="w-4 h-4" /> excluir</button>
        </div>
        <button className="pc-btn" onClick={onOpenDetail}>
          abrir <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ========== Página principal ========== */
export default function ObjectivesPage() {
  const { toast } = useToast();
  const [items, setItems] = useState(() => store.get("obj:list", []));
  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { store.set("obj:list", items); }, [items]);

  const years = useMemo(() => {
    const all = Array.from(new Set(items.map(i => i.year))).sort();
    return all.length ? all : [new Date().getFullYear()];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(o => {
      if (yearFilter && String(o.year) !== String(yearFilter)) return false;
      if (statusFilter && o.status !== statusFilter) return false;
      if (priorityFilter && o.priority !== priorityFilter) return false;
      if (!q) return true;
      const hay = `${o.title} ${o.description} ${(o.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, yearFilter, statusFilter, priorityFilter]);

  function addNew() {
    setEditing(null);
    setOpenModal(true);
  }
  function editObj(obj) {
    setEditing(obj);
    setOpenModal(true);
  }
  function saveObj(payload) {
    setItems(prev => {
      const exists = prev.some(p => p.id === payload.id);
      const next = exists ? prev.map(p => p.id === payload.id ? payload : p) : [payload, ...prev];
      return next;
    });
    setOpenModal(false);
    toast({ title: "Objetivo salvo!" });
  }
  function confirmDelete() {
    if (!deletingId) return;
    setItems(prev => prev.filter(p => p.id !== deletingId));
    setDeletingId(null);
    toast({ title: "Objetivo excluído." });
  }
  function openDetail(id) {
    // ajuste o caminho conforme seu router
    window.location.href = `/objective-detail?id=${id}`;
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Objetivos</h1>
        <button className="pc-btn primary flex items-center gap-2" onClick={addNew}>
          <Plus className="w-4 h-4" /> Novo objetivo
        </button>
      </div>

      <Tabs defaultValue="objectives">
        <TabsList>
          <TabsTrigger value="objectives">Objetivos</TabsTrigger>
          <TabsTrigger value="projects">Projetos</TabsTrigger>
        </TabsList>

        <TabsContent value="objectives">
          <div className="pc-card">
            <div className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pc-muted)]" />
                <input className="pc-input pl-9 w-full" placeholder="Buscar por título, descrição ou tag…" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <select className="pc-input" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                <option value="">Ano</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select className="pc-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Status</option>
                {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="pc-input" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                <option value="">Prioridade</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-3">
              <div className="rounded-xl border border-dashed border-[var(--pc-border)] p-8 text-center text-[var(--pc-muted)]">
                Nenhum objetivo. Clique em <b>Novo objetivo</b> para começar.
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-3">
              {filtered.map(obj => (
                <ObjectiveCard
                  key={obj.id}
                  obj={obj}
                  onEdit={() => editObj(obj)}
                  onDelete={() => setDeletingId(obj.id)}
                  onOpenDetail={() => openDetail(obj.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="projects">
          {/* Renderiza sua página de projetos como uma aba dentro de Objetivos */}
          <ProjectsPage />
        </TabsContent>
      </Tabs>

      {openModal && (
        <ObjectiveModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          initial={editing}
          onSave={saveObj}
        />
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
