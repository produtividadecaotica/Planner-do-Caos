
import React, { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog.jsx";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { useToast } from "@/components/ui/use-toast.js";
import {
  Plus, Edit2, Trash2, Link2, Unlink, Calendar, Clock, Target, ChevronLeft, ChevronRight,
  Image as ImageIcon, Plane, Train, Bus, Car, Hotel, FileText, DollarSign, FolderKanban, ListChecks, Upload
} from "lucide-react";

/* =======================
   Helpers & Storage
======================= */
const store = {
  get(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
};
const uid = () => Math.random().toString(36).slice(2, 10);
const pad = n => String(n).padStart(2, "0");
const asDate = (v) => v ? new Date(v) : null;
const fmtBR = (iso) => iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";

/* =======================
   Esquemas
======================= */
// Projeto base
// {
//   id, title, type: "personal"|"work"|"travel",
//   objectiveId?: string|null,
//   status: "todo"|"doing"|"done",
//   startDate?: ISO, endDate?: ISO, dueDate?: ISO,
//   budget?: number, imageUrl?: string,
//   notes?: string,
//   tasks: [{ id, title, status }], // status herda do projeto? aqui é próprio da tarefa
//   costs: [{ id, label, planned?:number, actual?:number }],
//   docs: [{ id, label, url }],
//   travel?: {
//     stays: [{ id, name, address, checkin, checkout, price?:number, reservationCode?:string, imageUrl?:string, notes?:string }],
//     transports: [{ id, mode:"plane"|"bus"|"train"|"car", company?:string, number?:string, date?:ISO, from?:string, to?:string, price?:number, docUrl?:string, notes?:string }]
//   }
// }

const DEFAULT_COLUMNS = [
  { key: "todo", label: "A Fazer" },
  { key: "doing", label: "Fazendo" },
  { key: "done", label: "Concluído" }
];

/* =======================
   UI utilitários
======================= */
function Section({ title, actions, children }) {
  return (
    <div className="pc-card">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--pc-border)]">
        <h3 className="pc-title flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-purple-500" /> {title}
        </h3>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
function Empty({ children }) {
  return <div className="rounded-xl border border-dashed border-[var(--pc-border)] p-6 text-center text-[var(--pc-muted)]">{children}</div>;
}
function Row({ label, value }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 text-sm">
      <div className="text-[var(--pc-muted)]">{label}</div>
      <div className="font-medium">{value ?? "—"}</div>
    </div>
  );
}

/* =======================
   Modais
======================= */
function ProjectModal({ open, onClose, initial, objectives, onSave }) {
  const isEdit = !!initial?.id;
  const [title, setTitle] = useState(initial?.title || "");
  const [type, setType] = useState(initial?.type || "personal");
  const [status, setStatus] = useState(initial?.status || "todo");
  const [objectiveId, setObjectiveId] = useState(initial?.objectiveId || "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || "");
  const [startDate, setStartDate] = useState(initial?.startDate ? initial.startDate.slice(0, 10) : "");
  const [endDate, setEndDate] = useState(initial?.endDate ? initial.endDate.slice(0, 10) : "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ? initial.dueDate.slice(0, 10) : "");
  const [budget, setBudget] = useState(initial?.budget ?? "");

  const [notes, setNotes] = useState(initial?.notes || "");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || "");
      setType(initial?.type || "personal");
      setStatus(initial?.status || "todo");
      setObjectiveId(initial?.objectiveId || "");
      setImageUrl(initial?.imageUrl || "");
      setStartDate(initial?.startDate ? initial.startDate.slice(0, 10) : "");
      setEndDate(initial?.endDate ? initial.endDate.slice(0, 10) : "");
      setDueDate(initial?.dueDate ? initial.dueDate.slice(0, 10) : "");
      setBudget(initial?.budget ?? "");
      setNotes(initial?.notes || "");
    }
  }, [open, initial]);

  function confirm() {
    if (!title.trim()) return alert("Dê um nome ao projeto.");
    const payload = {
      ...(initial || { id: uid() }),
      title: title.trim(),
      type,
      status,
      objectiveId: objectiveId || null,
      imageUrl: imageUrl?.trim() || "",
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      budget: budget ? Number(budget) : null,
      notes: notes.trim()
    };
    onSave(payload);
  }

  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar projeto" : "Novo projeto"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span>Título</span>
              <input className="pc-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome do projeto" />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Tipo</span>
              <select className="pc-input" value={type} onChange={e => setType(e.target.value)}>
                <option value="personal">Pessoal</option>
                <option value="work">Trabalho</option>
                <option value="travel">Viagem</option>
              </select>
            </label>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="grid gap-1 text-sm">
              <span>Status</span>
              <select className="pc-input" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="todo">A Fazer</option>
                <option value="doing">Fazendo</option>
                <option value="done">Concluído</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span>Vincular a objetivo</span>
              <select className="pc-input" value={objectiveId || ""} onChange={e => setObjectiveId(e.target.value)}>
                <option value="">— sem vínculo —</option>
                {objectives.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span>Orçamento (R$)</span>
              <input className="pc-input" type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0,00" />
            </label>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="grid gap-1 text-sm">
              <span>Início</span>
              <input className="pc-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Término</span>
              <input className="pc-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Prazo</span>
              <input className="pc-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span>Imagem (URL)</span>
            <input className="pc-input" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
          </label>

          <label className="grid gap-1 text-sm">
            <span>Notas</span>
            <textarea className="pc-textarea min-h-[90px]" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Detalhes, referências…" />
          </label>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <button className="pc-btn ghost">Cancelar</button>
          </DialogClose>
          <button className="pc-btn primary" onClick={confirm}><Plus className="w-4 h-4" /> Salvar</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskModal({ open, onClose, initial, onSave }) {
  const isEdit = !!initial?.id;
  const [title, setTitle] = useState(initial?.title || "");
  const [status, setStatus] = useState(initial?.status || "todo");

  useEffect(() => {
    if (open) { setTitle(initial?.title || ""); setStatus(initial?.status || "todo"); }
  }, [open, initial]);

  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span>Título</span>
            <input className="pc-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex.: Briefing, Roteiro, Gravação…" />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Status</span>
            <select className="pc-input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="todo">A Fazer</option>
              <option value="doing">Fazendo</option>
              <option value="done">Concluído</option>
            </select>
          </label>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <button className="pc-btn ghost" >Cancelar</button>
          </DialogClose>
          <button className="pc-btn primary" onClick={() => onSave({ ...(initial || { id: uid() }), title: title.trim(), status })}><Plus className="w-4 h-4" /> Salvar</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StayModal({ open, onClose, initial, onSave }) {
  const isEdit = !!initial?.id;
  const [name, setName] = useState(initial?.name || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [checkin, setCheckin] = useState(initial?.checkin ? initial.checkin.slice(0, 10) : "");
  const [checkout, setCheckout] = useState(initial?.checkout ? initial.checkout.slice(0, 10) : "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [reservationCode, setReservationCode] = useState(initial?.reservationCode || "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  useEffect(() => {
    if (open) {
      setName(initial?.name || ""); setAddress(initial?.address || "");
      setCheckin(initial?.checkin ? initial.checkin.slice(0, 10) : "");
      setCheckout(initial?.checkout ? initial.checkout.slice(0, 10) : "");
      setPrice(initial?.price ?? ""); setReservationCode(initial?.reservationCode || "");
      setImageUrl(initial?.imageUrl || ""); setNotes(initial?.notes || "");
    }
  }, [open, initial]);

  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar hospedagem" : "Nova hospedagem"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm"><span>Hotel / Acomodação</span><input className="pc-input" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do hotel" /></label>
          <label className="grid gap-1 text-sm"><span>Endereço</span><input className="pc-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, cidade, país" /></label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm"><span>Check-in</span><input className="pc-input" type="date" value={checkin} onChange={e => setCheckin(e.target.value)} /></label>
            <label className="grid gap-1 text-sm"><span>Check-out</span><input className="pc-input" type="date" value={checkout} onChange={e => setCheckout(e.target.value)} /></label>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm"><span>Preço total (R$)</span><input className="pc-input" type="number" value={price} onChange={e => setPrice(e.target.value)} /></label>
            <label className="grid gap-1 text-sm"><span>Código de reserva</span><input className="pc-input" value={reservationCode} onChange={e => setReservationCode(e.target.value)} placeholder="ABC123" /></label>
          </div>
          <label className="grid gap-1 text-sm"><span>Imagem (URL)</span><input className="pc-input" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." /></label>
          <label className="grid gap-1 text-sm"><span>Notas</span><textarea className="pc-textarea min-h-[80px]" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações, horários de check-in/out, políticas…" /></label>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <button className="pc-btn ghost">Cancelar</button>
          </DialogClose>
          <button className="pc-btn primary" onClick={() => onSave({
            ...(initial || { id: uid() }),
            name: name.trim(), address: address.trim(),
            checkin: checkin ? new Date(checkin).toISOString() : null,
            checkout: checkout ? new Date(checkout).toISOString() : null,
            price: price ? Number(price) : null,
            reservationCode: reservationCode.trim(),
            imageUrl: imageUrl.trim(), notes: notes.trim()
          })}><Plus className="w-4 h-4" /> Salvar</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TransportModal({ open, onClose, initial, onSave }) {
  const isEdit = !!initial?.id;
  const [mode, setMode] = useState(initial?.mode || "plane");
  const [company, setCompany] = useState(initial?.company || "");
  const [number, setNumber] = useState(initial?.number || "");
  const [date, setDate] = useState(initial?.date ? initial.date.slice(0, 16) : "");
  const [from, setFrom] = useState(initial?.from || "");
  const [to, setTo] = useState(initial?.to || "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [docUrl, setDocUrl] = useState(initial?.docUrl || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  useEffect(() => {
    if (open) {
      setMode(initial?.mode || "plane"); setCompany(initial?.company || "");
      setNumber(initial?.number || ""); setDate(initial?.date ? initial.date.slice(0, 16) : "");
      setFrom(initial?.from || ""); setTo(initial?.to || "");
      setPrice(initial?.price ?? ""); setDocUrl(initial?.docUrl || ""); setNotes(initial?.notes || "");
    }
  }, [open, initial]);

  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar transporte" : "Novo transporte"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span>Modo</span>
              <select className="pc-input" value={mode} onChange={e => setMode(e.target.value)}>
                <option value="plane">Aéreo</option>
                <option value="bus">Ônibus</option>
                <option value="train">Trem</option>
                <option value="car">Carro</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm"><span>Companhia</span><input className="pc-input" value={company} onChange={e => setCompany(e.target.value)} placeholder="Azul / Latam / Itapemirim…" /></label>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm"><span>Nº / Código</span><input className="pc-input" value={number} onChange={e => setNumber(e.target.value)} placeholder="Voo 1234 / Ônibus 56…" /></label>
            <label className="grid gap-1 text-sm"><span>Data & hora</span><input className="pc-input" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} /></label>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm"><span>Origem</span><input className="pc-input" value={from} onChange={e => setFrom(e.target.value)} placeholder="GIG / Centro RJ…" /></label>
            <label className="grid gap-1 text-sm"><span>Destino</span><input className="pc-input" value={to} onChange={e => setTo(e.target.value)} placeholder="GRU / Copacabana…" /></label>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm"><span>Preço (R$)</span><input className="pc-input" type="number" value={price} onChange={e => setPrice(e.target.value)} /></label>
            <label className="grid gap-1 text-sm"><span>Documento (URL)</span><input className="pc-input" value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="Cartão de embarque, reserva…" /></label>
          </div>
          <label className="grid gap-1 text-sm"><span>Notas</span><textarea className="pc-textarea min-h-[80px]" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Assentos, bagagens, conexões…" /></label>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <button className="pc-btn ghost">Cancelar</button>
          </DialogClose>
          <button className="pc-btn primary" onClick={() => onSave({
            ...(initial || { id: uid() }),
            mode, company: company.trim(), number: number.trim(),
            date: date ? new Date(date).toISOString() : null,
            from: from.trim(), to: to.trim(),
            price: price ? Number(price) : null,
            docUrl: docUrl.trim(), notes: notes.trim()
          })}><Plus className="w-4 h-4" /> Salvar</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =======================
   Sub-blocos
======================= */
function Kanban({ project, onChange }) {
  const [openTask, setOpenTask] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const tasks = project.tasks || [];
  const grouped = useMemo(() => {
    const g = { todo: [], doing: [], done: [] };
    tasks.forEach(t => { (g[t.status] ||= []).push(t); });
    return g;
  }, [tasks]);

  function upsert(task) {
    const arr = tasks.some(t => t.id === task.id) ? tasks.map(t => t.id === task.id ? task : t) : [task, ...tasks];
    onChange({ ...project, tasks: arr });
  }
  function confirmDelete() {
    if (!deletingId) return;
    onChange({ ...project, tasks: tasks.filter(t => t.id !== deletingId) });
    setDeletingId(null);
  }
  function move(t, dir) {
    const order = ["todo", "doing", "done"];
    const idx = order.indexOf(t.status);
    const next = dir === "left" ? Math.max(0, idx - 1) : Math.min(order.length - 1, idx + 1);
    upsert({ ...t, status: order[next] });
  }

  return (
    <>
      <div className="grid md:grid-cols-3 gap-3">
        {DEFAULT_COLUMNS.map(col => (
          <div key={col.key} className="rounded-xl border border-[var(--pc-border)] bg-white p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{col.label}</div>
              {col.key === "todo" && (
                <button className="pc-btn ghost" onClick={() => { setEditing(null); setOpenTask(true); }}>
                  <Plus className="w-4 h-4" /> Nova
                </button>
              )}
            </div>
            <div className="grid gap-2">
              {(grouped[col.key] || []).map(t => (
                <div key={t.id} className="rounded-lg border border-[var(--pc-border)] p-2">
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-[12px] text-[var(--pc-muted)]">{col.label}</div>
                    <div className="flex items-center gap-1">
                      <button className="pc-btn ghost text-xs" onClick={() => move(t, "left")}>⟵</button>
                      <button className="pc-btn ghost text-xs" onClick={() => move(t, "right")}>⟶</button>
                      <button className="pc-btn ghost text-xs" onClick={() => { setEditing(t); setOpenTask(true); }}><Edit2 className="w-4 h-4" /></button>
                      <button className="pc-btn danger ghost text-xs" onClick={() => setDeletingId(t.id)}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
              {(grouped[col.key] || []).length === 0 && <div className="text-center text-[12px] text-[var(--pc-muted)]">Vazio</div>}
            </div>
          </div>
        ))}
      </div>
      {openTask && (
        <TaskModal
          open={openTask}
          onClose={() => setOpenTask(false)}
          initial={editing}
          onSave={(task) => { upsert(task); setOpenTask(false); }}
        />
      )}
      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir tarefa?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CostsTable({ project, onChange }) {
  const items = project.costs || [];
  const [label, setLabel] = useState("");
  const [planned, setPlanned] = useState("");
  const [actual, setActual] = useState("");

  function add() {
    if (!label.trim()) return;
    const row = { id: uid(), label: label.trim(), planned: planned ? Number(planned) : null, actual: actual ? Number(actual) : null };
    onChange({ ...project, costs: [row, ...items] });
    setLabel(""); setPlanned(""); setActual("");
  }
  function remove(id) {
    onChange({ ...project, costs: items.filter(i => i.id !== id) });
  }

  const sumPlanned = items.reduce((s, i) => s + (i.planned || 0), 0);
  const sumActual = items.reduce((s, i) => s + (i.actual || 0), 0);

  return (
    <div className="grid gap-3">
      <div className="rounded-xl border border-[var(--pc-border)] overflow-hidden">
        <div className="grid grid-cols-[1fr_0.6fr_0.6fr_80px] bg-[var(--pc-surface)] text-[12px] text-[var(--pc-muted)] px-3 py-2">
          <div>Item</div><div>Previsto</div><div>Real</div><div></div>
        </div>
        <div className="divide-y divide-[var(--pc-border)]">
          {items.map(i => (
            <div key={i.id} className="grid grid-cols-[1fr_0.6fr_0.6fr_80px] items-center px-3 py-2 text-sm">
              <div>{i.label}</div>
              <div>R$ {(i.planned || 0).toFixed(2)}</div>
              <div>R$ {(i.actual || 0).toFixed(2)}</div>
              <div className="flex justify-end">
                <button className="pc-btn danger ghost" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="p-4 text-center text-[var(--pc-muted)]">Sem itens.</div>}
        </div>
        <div className="px-3 py-2 bg-[var(--pc-surface)] flex items-center justify-end gap-6 text-sm">
          <div>Previsto: <b>R$ {sumPlanned.toFixed(2)}</b></div>
          <div>Real: <b>R$ {sumActual.toFixed(2)}</b></div>
          <div>Diferença: <b>R$ {(sumActual - sumPlanned).toFixed(2)}</b></div>
        </div>
      </div>

      <div className="grid sm:grid-cols-[1fr_0.5fr_0.5fr_120px] gap-2">
        <input className="pc-input" placeholder="Descrição" value={label} onChange={e => setLabel(e.target.value)} />
        <input className="pc-input" type="number" placeholder="Previsto" value={planned} onChange={e => setPlanned(e.target.value)} />
        <input className="pc-input" type="number" placeholder="Real" value={actual} onChange={e => setActual(e.target.value)} />
        <button className="pc-btn primary" onClick={add}><Plus className="w-4 h-4" /> Adicionar</button>
      </div>
    </div>
  );
}

function DocsBlock({ project, onChange }) {
  const docs = project.docs || [];
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  function add() {
    if (!label.trim() || !url.trim()) return;
    onChange({ ...project, docs: [{ id: uid(), label: label.trim(), url: url.trim() }, ...docs] });
    setLabel(""); setUrl("");
  }
  function remove(id) {
    onChange({ ...project, docs: docs.filter(d => d.id !== id) });
  }

  return (
    <div className="grid gap-3">
      <div className="grid sm:grid-cols-[1fr_1fr_120px] gap-2">
        <input className="pc-input" placeholder="Nome do documento" value={label} onChange={e => setLabel(e.target.value)} />
        <input className="pc-input" placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} />
        <button className="pc-btn primary" onClick={add}><Upload className="w-4 h-4" /> Adicionar</button>
      </div>
      {docs.length === 0 ? <Empty>Nenhum documento.</Empty> : (
        <div className="grid gap-2">
          {docs.map(d => (
            <div key={d.id} className="rounded-lg border border-[var(--pc-border)] p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" />
                <a className="text-sm font-medium underline" href={d.url} target="_blank" rel="noreferrer">{d.label}</a>
              </div>
              <button className="pc-btn danger ghost" onClick={() => remove(d.id)}><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TravelBlock({ project, onChange }) {
  const travel = project.travel || { stays: [], transports: [] };
  const [openStay, setOpenStay] = useState(false);
  const [editingStay, setEditingStay] = useState(null);
  const [openTransport, setOpenTransport] = useState(false);
  const [editingTransport, setEditingTransport] = useState(null);

  function upsertStay(s) {
    const arr = travel.stays.some(x => x.id === s.id) ? travel.stays.map(x => x.id === s.id ? s : x) : [s, ...travel.stays];
    onChange({ ...project, travel: { ...travel, stays: arr } });
  }
  function removeStay(id) {
    onChange({ ...project, travel: { ...travel, stays: travel.stays.filter(x => x.id !== id) } });
  }

  function upsertTransport(t) {
    const arr = travel.transports.some(x => x.id === t.id) ? travel.transports.map(x => x.id === t.id ? t : x) : [t, ...travel.transports];
    onChange({ ...project, travel: { ...travel, transports: arr } });
  }
  function removeTransport(id) {
    onChange({ ...project, travel: { ...travel, transports: travel.transports.filter(x => x.id !== id) } });
  }

  const sumStay = travel.stays.reduce((s, x) => s + (x.price || 0), 0);
  const sumTrans = travel.transports.reduce((s, x) => s + (x.price || 0), 0);

  const modeIcon = (m) => m === "plane" ? <Plane className="w-4 h-4" /> :
    m === "bus" ? <Bus className="w-4 h-4" /> :
      m === "train" ? <Train className="w-4 h-4" /> :
        <Car className="w-4 h-4" />;

  return (
    <div className="grid lg:grid-cols-2 gap-3">
      <div className="pc-card">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--pc-border)]">
          <h4 className="pc-title flex items-center gap-2"><Hotel className="w-5 h-5 text-purple-500" /> Hospedagens</h4>
          <button className="pc-btn ghost" onClick={() => { setEditingStay(null); setOpenStay(true); }}><Plus className="w-4 h-4" /> Adicionar</button>
        </div>
        <div className="mt-2 grid gap-2">
          {(travel.stays || []).map(s => (
            <div key={s.id} className="rounded-lg border border-[var(--pc-border)] p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{s.name}</div>
                <div className="flex items-center gap-1">
                  <button className="pc-btn ghost" onClick={() => { setEditingStay(s); setOpenStay(true); }}><Edit2 className="w-4 h-4" /></button>
                  <button className="pc-btn danger ghost" onClick={() => removeStay(s.id)}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="text-[12px] text-[var(--pc-muted)]">{s.address || "—"}</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>Check-in: <b>{fmtBR(s.checkin)}</b></div>
                <div>Check-out: <b>{fmtBR(s.checkout)}</b></div>
                <div>Preço: <b>R$ {(s.price || 0).toFixed(2)}</b></div>
                <div>Reserva: <b>{s.reservationCode || "—"}</b></div>
              </div>
              {s.imageUrl && <img src={s.imageUrl} alt="" className="mt-2 w-full h-36 object-cover rounded-lg" />}
              {s.notes && <div className="mt-2 text-sm">{s.notes}</div>}
            </div>
          ))}
          {(travel.stays || []).length === 0 && <Empty>Nenhuma hospedagem cadastrada.</Empty>}
        </div>
        <div className="mt-2 text-sm text-right">Total hospedagens: <b>R$ {sumStay.toFixed(2)}</b></div>
      </div>

      <div className="pc-card">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--pc-border)]">
          <h4 className="pc-title flex items-center gap-2"><Plane className="w-5 h-5 text-purple-500" /> Transportes</h4>
          <button className="pc-btn ghost" onClick={() => { setEditingTransport(null); setOpenTransport(true); }}><Plus className="w-4 h-4" /> Adicionar</button>
        </div>
        <div className="mt-2 grid gap-2">
          {(travel.transports || []).map(t => (
            <div key={t.id} className="rounded-lg border border-[var(--pc-border)] p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold flex items-center gap-2">{modeIcon(t.mode)} {t.company || "—"}</div>
                <div className="flex items-center gap-1">
                  <button className="pc-btn ghost" onClick={() => { setEditingTransport(t); setOpenTransport(true); }}><Edit2 className="w-4 h-4" /></button>
                  <button className="pc-btn danger ghost" onClick={() => removeTransport(t.id)}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="text-[12px] text-[var(--pc-muted)]">Nº {t.number || "—"} • {t.date ? new Date(t.date).toLocaleString("pt-BR") : "—"}</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>Origem: <b>{t.from || "—"}</b></div>
                <div>Destino: <b>{t.to || "—"}</b></div>
                <div>Preço: <b>R$ {(t.price || 0).toFixed(2)}</b></div>
                <div>Documento: {t.docUrl ? <a className="underline" href={t.docUrl} target="_blank" rel="noreferrer">abrir</a> : "—"}</div>
              </div>
              {t.notes && <div className="mt-2 text-sm">{t.notes}</div>}
            </div>
          ))}
          {(travel.transports || []).length === 0 && <Empty>Nenhum transporte cadastrado.</Empty>}
        </div>
        <div className="mt-2 text-sm text-right">Total transportes: <b>R$ {sumTrans.toFixed(2)}</b></div>
      </div>

      {openStay && (
        <StayModal
          open={openStay}
          onClose={() => setOpenStay(false)}
          initial={editingStay}
          onSave={(s) => { upsertStay(s); setOpenStay(false); }}
        />
      )}
      {openTransport && (
        <TransportModal
          open={openTransport}
          onClose={() => setOpenTransport(false)}
          initial={editingTransport}
          onSave={(t) => { upsertTransport(t); setOpenTransport(false); }}
        />
      )}
    </div>
  );
}

/* =======================
   Página principal
======================= */
export default function ProjectsPage() {
  const { toast } = useToast();

  const [projects, setProjects] = useState(() => store.get("projects:list", []));
  const [objectives] = useState(() => store.get("obj:list", [])); // já existe na sua app
  const [openProject, setOpenProject] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [selectedId, setSelectedId] = useState(null); // modo detalhe
  const selected = useMemo(() => projects.find(p => p.id === selectedId) || null, [projects, selectedId]);

  useEffect(() => store.set("projects:list", projects), [projects]);

  function upsertProject(payload) {
    setProjects(prev => {
      const exists = prev.some(p => p.id === payload.id);
      return exists ? prev.map(p => p.id === payload.id ? { ...p, ...payload } : p) : [{ ...payload, tasks: [], docs: [], costs: [], travel: { stays: [], transports: [] } }, ...prev];
    });
    toast({ title: "Projeto salvo." });
  }
  function confirmDelete() {
    if (!deletingId) return;
    setProjects(prev => prev.filter(p => p.id !== deletingId));
    if (selectedId === deletingId) setSelectedId(null);
    setDeletingId(null);
    toast({ title: "Projeto excluído." });
  }
  function patchSelected(next) {
    setProjects(prev => prev.map(p => p.id === next.id ? next : p));
  }

  // Kanban por status (todos os tipos)
  const grouped = useMemo(() => {
    const g = { todo: [], doing: [], done: [] };
    projects.forEach(p => (g[p.status] ||= []).push(p));
    return g;
  }, [projects]);

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projetos</h1>
        <button className="pc-btn primary" onClick={() => { setEditing(null); setOpenProject(true); }}>
          <Plus className="w-4 h-4" /> Novo projeto
        </button>
      </div>

      {/* Kanban de projetos */}
      {!selected && (
        <div className="grid md:grid-cols-3 gap-3">
          {DEFAULT_COLUMNS.map(col => (
            <div key={col.key} className="rounded-xl border border-[var(--pc-border)] bg-white p-3">
              <div className="font-semibold mb-2">{col.label}</div>
              <div className="grid gap-2">
                {(grouped[col.key] || []).map(p => (
                  <div key={p.id} className="rounded-lg border border-[var(--pc-border)] p-3 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{p.title}</div>
                      <div className="flex items-center gap-1">
                        <button className="pc-btn ghost" onClick={() => { setEditing(p); setOpenProject(true); }}><Edit2 className="w-4 h-4" /></button>
                        <button className="pc-btn danger ghost" onClick={() => setDeletingId(p.id)}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="mt-1 text-[12px] text-[var(--pc-muted)]">
                      {p.type === "personal" ? "Pessoal" : p.type === "work" ? "Trabalho" : "Viagem"} {p.objectiveId ? "• Vinculado a objetivo" : ""}
                    </div>
                    {p.imageUrl && <img src={p.imageUrl} alt="" className="mt-2 w-full h-28 object-cover rounded-lg" />}

                    <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                      <div><Calendar className="inline w-3 h-3" /> Início: <b>{fmtBR(p.startDate)}</b></div>
                      <div><Clock className="inline w-3 h-3" /> Prazo: <b>{fmtBR(p.dueDate)}</b></div>
                      <div><Target className="inline w-3 h-3" /> Término: <b>{fmtBR(p.endDate)}</b></div>
                      <div><DollarSign className="inline w-3 h-3" /> Orçamento: <b>R$ {(p.budget || 0).toFixed(2)}</b></div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <button className="pc-btn ghost" onClick={() => setSelectedId(p.id)}>Abrir</button>
                      <div className="text-[12px] text-[var(--pc-muted)]">{(p.tasks || []).length} tarefas</div>
                    </div>
                  </div>
                ))}
                {(grouped[col.key] || []).length === 0 && <div className="text-center text-[12px] text-[var(--pc-muted)]">Vazio</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detalhe do projeto */}
      {selected && (
        <div className="pc-card">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--pc-border)]">
            <div className="flex items-center gap-3">
              <button className="pc-btn ghost" onClick={() => setSelectedId(null)}><ChevronLeft className="w-4 h-4" /> Voltar</button>
              <h3 className="pc-title">{selected.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button className="pc-btn ghost" onClick={() => { setEditing(selected); setOpenProject(true); }}><Edit2 className="w-4 h-4" /> Editar</button>
              <button className="pc-btn danger ghost" onClick={() => setDeletingId(selected.id)}><Trash2 className="w-4 h-4" /> Excluir</button>
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tarefas</TabsTrigger>
              <TabsTrigger value="travel" disabled={selected.type !== "travel"}>Viagem</TabsTrigger>
              <TabsTrigger value="costs">Custos</TabsTrigger>
              <TabsTrigger value="docs">Documentos</TabsTrigger>
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value="overview">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="grid gap-3">
                  <Row label="Tipo" value={selected.type === "personal" ? "Pessoal" : selected.type === "work" ? "Trabalho" : "Viagem"} />
                  <Row label="Status" value={selected.status === "todo" ? "A Fazer" : selected.status === "doing" ? "Fazendo" : "Concluído"} />
                  <Row label="Vinculado a objetivo" value={selected.objectiveId ? "Sim" : "Não"} />
                  <Row label="Início" value={fmtBR(selected.startDate)} />
                  <Row label="Término" value={fmtBR(selected.endDate)} />
                  <Row label="Prazo" value={fmtBR(selected.dueDate)} />
                  <Row label="Orçamento" value={`R$ ${(selected.budget || 0).toFixed(2)}`} />
                  <div>
                    <div className="text-sm text-[var(--pc-muted)] mb-1">Notas</div>
                    <div className="text-sm">{selected.notes || "—"}</div>
                  </div>
                </div>
                <div>
                  {selected.imageUrl ? (
                    <img src={selected.imageUrl} alt="" className="w-full h-64 object-cover rounded-xl border border-[var(--pc-border)]" />
                  ) : (
                    <Empty>Sem imagem.</Empty>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAREFAS */}
            <TabsContent value="tasks">
              <Kanban project={selected} onChange={patchSelected} />
            </TabsContent>

            {/* VIAGEM */}
            <TabsContent value="travel">
              <TravelBlock project={selected} onChange={patchSelected} />
            </TabsContent>

            {/* CUSTOS */}
            <TabsContent value="costs">
              <CostsTable project={selected} onChange={patchSelected} />
            </TabsContent>

            {/* DOCUMENTOS */}
            <TabsContent value="docs">
              <DocsBlock project={selected} onChange={patchSelected} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Modal de projeto */}
      {openProject && (
        <ProjectModal
          open={openProject}
          onClose={() => setOpenProject(false)}
          initial={editing}
          objectives={objectives}
          onSave={(payload) => { upsertProject(payload); setOpenProject(false); if (selected) setSelectedId(payload.id); }}
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
