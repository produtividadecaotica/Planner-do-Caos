// pages/DashboardPage.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.jsx";
import {
  Calendar, Plus, CheckCircle2, Clock, Sparkles, BookOpen,
  Coins, ListTodo, Flame, ChevronRight, Play, Trash2, Smile,
  BedDouble, Settings, GripVertical
} from "lucide-react";

/* ---------------------------------- utils ---------------------------------- */
const store = {
  get(k, f) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : f; } catch { return f; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } }
};
const todayISO = () => new Date().toISOString().split("T")[0];
const fmtTime = (d) => new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const fmtDate = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

/* ---------------------------- quick action modals --------------------------- */
function QuickAddInbox({ open, onClose }) {
  const [text, setText] = useState("");
  function add() {
    if (!text.trim()) return;
    const key = "inbox:items";
    const items = store.get(key, []);
    const newItem = { id: crypto.randomUUID?.() || Math.random().toString(36).slice(2), text, createdAt: new Date().toISOString(), due: null, recur: null, done: false };
    store.set(key, [newItem, ...items]);
    onClose(true);
  }
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose(false)}>
      <DialogContent>
        <DialogHeader><DialogTitle>Adicionar à Inbox</DialogTitle></DialogHeader>
        <input className="pc-input" placeholder="O que precisa entrar?" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
        <DialogFooter>
          <button className="pc-btn ghost" onClick={() => onClose(false)}>Cancelar</button>
          <button className="pc-btn primary" onClick={add}><Plus className="w-4 h-4" />Adicionar</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function QuickAddEvent({ open, onClose }) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState(() => new Date().toISOString().slice(0, 16));
  const [end, setEnd] = useState(() => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16));
  function add() {
    if (!title.trim()) return;
    const key = "calendar:events";
    const items = store.get(key, []);
    const ev = { id: crypto.randomUUID?.() || Math.random().toString(36).slice(2), title, startISO: new Date(start).toISOString(), endISO: new Date(end).toISOString(), allDay: false, rrule: null };
    store.set(key, [ev, ...items]);
    onClose(true);
  }
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose(false)}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo evento</DialogTitle></DialogHeader>
        <div className="grid gap-2">
          <input className="pc-input" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input type="datetime-local" className="pc-input" value={start} onChange={e => setStart(e.target.value)} />
            <input type="datetime-local" className="pc-input" value={end} onChange={e => setEnd(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <button className="pc-btn ghost" onClick={() => onClose(false)}>Cancelar</button>
          <button className="pc-btn primary" onClick={add}><Plus className="w-4 h-4" />Adicionar</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function QuickAddExpense({ open, onClose }) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState(() => new Date().toISOString().slice(0, 10));
  function add() {
    if (!desc.trim()) return;
    const key = "finance:bills";
    const list = store.get(key, []);
    const it = { id: crypto.randomUUID?.() || Math.random().toString(36).slice(2), desc, value: Number(amount) || 0, dueISO: new Date(due).toISOString(), paid: false, cardId: null, category: "outros" };
    store.set(key, [it, ...list]);
    onClose(true);
  }
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose(false)}>
      <DialogContent>
        <DialogHeader><DialogTitle>Conta a pagar</DialogTitle></DialogHeader>
        <div className="grid gap-2">
          <input className="pc-input" placeholder="Descrição" value={desc} onChange={e => setDesc(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className="pc-input" placeholder="Valor" value={amount} onChange={e => setAmount(e.target.value)} />
            <input type="date" className="pc-input" value={due} onChange={e => setDue(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <button className="pc-btn ghost" onClick={() => onClose(false)}>Cancelar</button>
          <button className="pc-btn primary" onClick={add}><Plus className="w-4 h-4" />Adicionar</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------- dashboard config modal ------------------------- */
const DEFAULT_PREFS = {
  agenda: true,
  bills: true,
  moodSleep: true,
  habits: true,
  inbox: true,
  focusToday: true,
  projects: true,
  dopamine: true
};
const DEFAULT_ORDER = ["agenda", "inbox", "bills", "projects", "moodSleep", "habits", "focusToday", "dopamine"];

function ConfigDashboard({ open, onClose }) {
  const [prefs, setPrefs] = useState(() => store.get("dashboard:prefs", DEFAULT_PREFS));
  useEffect(() => setPrefs(store.get("dashboard:prefs", DEFAULT_PREFS)), [open]);

  const toggle = (k) => setPrefs(p => ({ ...p, [k]: !p[k] }));
  const save = () => {
    // limpa a ordem de widgets invisíveis
    const order = store.get("dashboard:order", DEFAULT_ORDER).filter(k => prefs[k]);
    store.set("dashboard:order", order);
    store.set("dashboard:prefs", prefs);
    onClose(true);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar Dashboard</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          {Object.entries({
            agenda: "Agenda de Hoje",
            bills: "Próximas Contas (7 dias)",
            moodSleep: "Humor & Sono (hoje)",
            habits: "Hábitos de Hoje",
            inbox: "Inbox – Sem data",
            focusToday: "Foco de Estudo de Hoje",
            projects: "Projetos Ativos",
            dopamine: "Dopamina do Dia",
          }).map(([k, label]) => (
            <label key={k} className="flex items-center justify-between rounded-lg border p-3">
              <span className="font-medium">{label}</span>
              <input type="checkbox" className="pc-checkbox" checked={!!prefs[k]} onChange={() => toggle(k)} />
            </label>
          ))}
        </div>
        <DialogFooter>
          <button className="pc-btn ghost" onClick={() => onClose(false)}>Cancelar</button>
          <button className="pc-btn primary" onClick={save}>Salvar</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------- widgets --------------------------------- */
function TopQuickBar({ onOpenConfig }) {
  const [inboxOpen, setInboxOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);

  const sessions = store.get("study:pomo:sessions", {});
  const today = sessions[todayISO()] || [];
  const focusMin = Math.round((today.filter(s => s.phase === "work").reduce((a, b) => a + (b.durationSec || 0), 0)) / 60);

  return (
    <>
      <div className="pc-card py-3 px-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="pc-btn" onClick={() => setInboxOpen(true)}><Plus className="w-4 h-4" />Inbox</button>
          <button className="pc-btn" onClick={() => setEventOpen(true)}><Plus className="w-4 h-4" />Evento</button>
          <button className="pc-btn" onClick={() => setBillOpen(true)}><Plus className="w-4 h-4" />Conta</button>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-2"><Flame className="w-4 h-4 text-purple-600" />Foco hoje: <b className="tabular-nums">{focusMin}m</b></span>
          <button className="pc-btn ghost" onClick={onOpenConfig}><Settings className="w-4 h-4" />Configurar</button>
        </div>
      </div>
      <QuickAddInbox open={inboxOpen} onClose={() => setInboxOpen(false)} />
      <QuickAddEvent open={eventOpen} onClose={() => setEventOpen(false)} />
      <QuickAddExpense open={billOpen} onClose={() => setBillOpen(false)} />
    </>
  );
}

function WidgetAgenda() {
  const events = store.get("calendar:events", []);
  const today = todayISO();
  const list = events
    .filter(e => e.allDay ? e.startISO.slice(0, 10) === today : e.startISO.slice(0, 10) === today)
    .sort((a, b) => new Date(a.startISO) - new Date(b.startISO));
  return (
    <div className="pc-card">
      <div className="pc-title flex items-center gap-2"><Calendar className="w-5 h-5 text-purple-500" />Agenda de Hoje</div>
      {!list.length ? <Empty text="Sem eventos hoje." /> :
        <ul className="mt-2 grid gap-2">
          {list.map(ev => (
            <li key={ev.id} className="rounded border p-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700 tabular-nums">{fmtTime(ev.startISO)}</span>
                <span className="font-medium">{ev.title}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </li>
          ))}
        </ul>}
    </div>
  );
}
function WidgetBills() {
  const key = "finance:bills";
  const [bills, setBills] = useState(() => store.get(key, []));
  useEffect(() => store.set(key, bills), [bills]);

  const now = new Date(); const in7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const upcoming = bills
    .filter(b => !b.paid)
    .filter(b => new Date(b.dueISO) >= new Date(now.toDateString()) && new Date(b.dueISO) <= in7)
    .sort((a, b) => new Date(a.dueISO) - new Date(b.dueISO));

  function markPaid(id) { setBills(bs => bs.map(b => b.id === id ? { ...b, paid: true } : b)); }
  const total = upcoming.reduce((a, b) => a + (b.value || 0), 0);

  return (
    <div className="pc-card">
      <div className="flex items-center justify-between">
        <div className="pc-title flex items-center gap-2"><Coins className="w-5 h-5 text-yellow-500" />Próximas contas (7 dias)</div>
        <div className="text-sm text-[var(--pc-muted)]">Total: <b>R$ {total.toFixed(2)}</b></div>
      </div>
      {!upcoming.length ? <Empty text="Nada vence nos próximos 7 dias." /> :
        <ul className="mt-2 grid gap-2">
          {upcoming.map(b => (
            <li key={b.id} className="rounded border p-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700">{fmtDate(b.dueISO)}</span>
                <span>{b.desc}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular-nums text-sm">R$ {Number(b.value || 0).toFixed(2)}</span>
                <button className="pc-btn" onClick={() => markPaid(b.id)}><CheckCircle2 className="w-4 h-4" /></button>
              </div>
            </li>
          ))}
        </ul>}
    </div>
  );
}
function WidgetMoodSleep() {
  const keyDate = todayISO();
  const moods = store.get(`mood:${keyDate}`, { morning: null, afternoon: null, night: null });
  const sleep = store.get(`sleep:${keyDate}`, { hours: '', minutes: '', quality: 3 });
  const face = (v) => v == null ? "—" : ["😣", "😕", "😐", "🙂", "😄"][v] || "—";
  return (
    <div className="pc-card">
      <div className="pc-title flex items-center gap-2"><Smile className="w-5 h-5 text-emerald-500" />Humor & Sono (hoje)</div>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div className="rounded border p-2">
          <div className="text-[12px] text-[var(--pc-muted)]">Humor</div>
          <div className="mt-1 grid grid-cols-3 gap-2 text-center">
            <div className="rounded bg-zinc-50 p-2"><div className="text-xs">Manhã</div><div className="text-xl">{face(moods.morning)}</div></div>
            <div className="rounded bg-zinc-50 p-2"><div className="text-xs">Tarde</div><div className="text-xl">{face(moods.afternoon)}</div></div>
            <div className="rounded bg-zinc-50 p-2"><div className="text-xs">Noite</div><div className="text-xl">{face(moods.night)}</div></div>
          </div>
        </div>
        <div className="rounded border p-2">
          <div className="text-[12px] text-[var(--pc-muted)]">Sono</div>
          <div className="mt-1 flex items-center gap-3">
            <BedDouble className="w-5 h-5 text-blue-500" />
            <div className="text-sm">{sleep.hours || 0}h {sleep.minutes || 0}m • Qualidade {sleep.quality || 0}/5</div>
          </div>
        </div>
      </div>
      <div className="mt-2 text-xs text-[var(--pc-muted)]">Edite em Manejo Emocional para atualizar.</div>
    </div>
  );
}
function WidgetHabits() {
  const list = store.get("habits:list", ["Água", "Exercício", "Leitura", "Meditação"]);
  const today = store.get(`habits:${todayISO()}`, {});
  const total = list.length;
  const done = Object.values(today).filter(Boolean).length;
  return (
    <div className="pc-card">
      <div className="pc-title flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" />Hábitos de Hoje</div>
      <div className="mt-2 text-sm">{done}/{total} completos</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {list.map(h => (
          <span key={h} className={`text-xs px-2 py-1 rounded-full border ${today[h] ? "bg-emerald-50 border-emerald-400 text-emerald-700" : "bg-white"}`}>{h}</span>
        ))}
      </div>
      <div className="mt-2 text-xs text-[var(--pc-muted)]">Gerencie em Manejo Emocional.</div>
    </div>
  );
}
function WidgetInbox() {
  const key = "inbox:items";
  const [items, setItems] = useState(() => store.get(key, []));
  useEffect(() => store.set(key, items), [items]);

  const noDate = items.filter(i => !i.due && !i.done).slice(0, 6);
  function toggle(id) { setItems(arr => arr.map(i => i.id === id ? { ...i, done: !i.done } : i)); }
  function del(id) { setItems(arr => arr.filter(i => i.id !== id)); }

  return (
    <div className="pc-card">
      <div className="pc-title flex items-center gap-2"><ListTodo className="w-5 h-5 text-purple-500" />Inbox – sem data</div>
      {!noDate.length ? <Empty text="Inbox vazia (sem data)." /> :
        <ul className="mt-2 grid gap-2">
          {noDate.map(i => (
            <li key={i.id} className="rounded border p-2 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="pc-checkbox" checked={!!i.done} onChange={() => toggle(i.id)} />
                <span className={`${i.done ? "line-through text-zinc-400" : ""}`}>{i.text}</span>
              </label>
              <button className="pc-btn danger ghost" onClick={() => del(i.id)}><Trash2 className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>}
    </div>
  );
}
function WidgetFocusToday() {
  const sessions = store.get("study:pomo:sessions", {});
  const list = sessions[todayISO()] || [];
  const focused = Math.round(list.filter(s => s.phase === "work").reduce((a, b) => a + (b.durationSec || 0), 0) / 60);
  return (
    <div className="pc-card">
      <div className="pc-title flex items-center gap-2"><Clock className="w-5 h-5 text-purple-500" />Foco hoje</div>
      <div className="mt-2 text-4xl font-semibold tabular-nums">{focused}m</div>
      <div className="mt-1 text-sm text-[var(--pc-muted)]">{list.length} sessões registradas</div>
      <a href="#/study" className="pc-btn mt-3"><Play className="w-4 h-4" />Abrir Sala de Estudos</a>
    </div>
  );
}
function WidgetProjects() {
  const items = store.get("projects:items", []); // {id,title,status,objectiveId?,type?}
  const active = items.filter(p => ["todo", "doing"].includes(p.status || "todo")).slice(0, 6);
  return (
    <div className="pc-card">
      <div className="pc-title flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-500" />Projetos Ativos</div>
      {!active.length ? <Empty text="Sem projetos ativos." /> :
        <ul className="mt-2 grid gap-2">
          {active.map(p => (
            <li key={p.id} className="rounded border p-2 flex items-center justify-between">
              <div>
                <div className="font-medium">{p.title}</div>
                <div className="text-xs text-[var(--pc-muted)]">{p.type || "Pessoal"} {p.objectiveId ? "• vinculado a Objetivo" : ""}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${p.status === "doing" ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-700"}`}>{p.status === "doing" ? "Em progresso" : "A fazer"}</span>
            </li>
          ))}
        </ul>}
    </div>
  );
}
function WidgetDopamine() {
  const lists = store.get("study:dopamine:lists", { entrada: [], aperitivo: [], acompanhamento: [], sobremesa: [] });
  const pool = [...lists.aperitivo, ...lists.acompanhamento, ...lists.entrada, ...lists.sobremesa];
  const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)].text : null;
  return (
    <div className="pc-card">
      <div className="pc-title flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" />Dopamina do dia</div>
      <div className="mt-2">{pick ? <>Sugestão: <b>{pick}</b></> : "Adicione itens no Menu de Dopamina."}</div>
      <div className="mt-2 text-xs text-[var(--pc-muted)]">Use quando precisar “ligar o cérebro”.</div>
    </div>
  );
}
function Empty({ text = "Sem dados." }) { return <div className="rounded-xl border border-dashed border-[var(--pc-border)] p-6 text-center text-[var(--pc-muted)]">{text}</div>; }

/* ------------------------------ DnD container ------------------------------- */
const WIDGET_MAP = {
  agenda: WidgetAgenda,
  inbox: WidgetInbox,
  bills: WidgetBills,
  projects: WidgetProjects,
  moodSleep: WidgetMoodSleep,
  habits: WidgetHabits,
  focusToday: WidgetFocusToday,
  dopamine: WidgetDopamine,
};

function DraggableWidget({ id, index, onDragStart, onDragOver, onDrop, children }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className="group relative"
    >
      {/* handle */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none">
        <div className="px-2 py-1 text-xs rounded-full bg-zinc-800/80 text-white flex items-center gap-1">
          <GripVertical className="w-3 h-3" /> arraste
        </div>
      </div>
      {children}
    </div>
  );
}

/* --------------------------------- dashboard -------------------------------- */
export default function DashboardPage() {
  const [openCfg, setOpenCfg] = useState(false);

  const prefs = store.get("dashboard:prefs", DEFAULT_PREFS);
  // filtra a ordem apenas para widgets visíveis; adiciona visíveis que ainda não estão na ordem
  const initialOrder = useMemo(() => {
    const saved = store.get("dashboard:order", DEFAULT_ORDER);
    const onlyVisible = saved.filter(k => prefs[k]);
    const missing = Object.keys(WIDGET_MAP).filter(k => prefs[k] && !onlyVisible.includes(k));
    return [...onlyVisible, ...missing];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(prefs)]);

  const [order, setOrder] = useState(initialOrder);
  useEffect(() => { store.set("dashboard:order", order); }, [order]);

  // DnD handlers
  const dragIndexRef = useRef(null);
  const onDragStart = (e, idx) => { dragIndexRef.current = idx; e.dataTransfer.effectAllowed = "move"; };
  const onDragOver = (e, idx) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const onDrop = (e, dropIdx) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === dropIdx) return;
    setOrder(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(dropIdx, 0, moved);
      return arr;
    });
    dragIndexRef.current = null;
  };

  const visibleOrder = order.filter(k => prefs[k]);

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="text-sm text-[var(--pc-muted)]">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</div>
      </header>

      <TopQuickBar onOpenConfig={() => setOpenCfg(true)} />

      {/* grid responsivo — os cards seguem a ordem e o usuário rearranja por DnD */}
      <div className="grid xl:grid-cols-3 lg:grid-cols-2 gap-6">
        {visibleOrder.map((key, idx) => {
          const Comp = WIDGET_MAP[key];
          return (
            <DraggableWidget
              key={key}
              id={key}
              index={idx}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
            >
              <Comp />
            </DraggableWidget>
          );
        })}
      </div>

      <ConfigDashboard open={openCfg} onClose={() => setOpenCfg(false)} />
    </div>
  );
}