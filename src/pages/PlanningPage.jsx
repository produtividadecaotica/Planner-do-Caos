
import React, { useMemo, useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog.jsx";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { useToast } from "@/components/ui/use-toast.js";
import { useCalendar } from "@/contexts/CalendarContext.jsx";

import AnnualView from "@/components/planning/AnnualView.jsx";
import QuarterlyView from "@/components/planning/QuarterlyView.jsx";
import MonthlyView from "@/components/planning/MonthlyView.jsx";
import WeeklyView from "@/components/planning/WeeklyView.jsx";
import DailyView from "@/components/planning/DailyView.jsx";
import RecurrenceEditor from "@/components/planning/RecurrenceEditor.jsx";

import {
  Calendar as CalIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock3,
  Repeat,
  Trash2,
  Save,
  Palette,
  MapPin
} from "lucide-react";

/* =========================
   Utils
========================= */
const uid = () => Math.random().toString(36).slice(2, 10);
const toISO = (d) => (d instanceof Date ? d : new Date(d)).toISOString();
const parseLocalDateTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalDateTime = (str) => (str ? new Date(str) : null);
const COLORS = [
  "#6D28D9", // roxo
  "#B45309", // dourado queimado
  "#0EA5E9",
  "#16A34A",
  "#DC2626",
  "#7C3AED",
  "#F59E0B"
];

/* =========================
   Event Modal
========================= */
function EventModal({ open, onClose, initial, onSave, onDelete }) {
  const isEditing = !!initial?.id;

  const [title, setTitle] = useState(initial?.title || "");
  const [allDay, setAllDay] = useState(!!initial?.allDay);
  const [startStr, setStartStr] = useState(parseLocalDateTime(initial?.start) || "");
  const [endStr, setEndStr] = useState(parseLocalDateTime(initial?.end) || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [color, setColor] = useState(initial?.color || COLORS[0]);

  const [recurrence, setRecurrence] = useState(initial?.recurrence || null);
  const [showRecur, setShowRecur] = useState(!!initial?.recurrence);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || "");
      setAllDay(!!initial?.allDay);
      setStartStr(parseLocalDateTime(initial?.start) || "");
      setEndStr(parseLocalDateTime(initial?.end) || "");
      setLocation(initial?.location || "");
      setNotes(initial?.notes || "");
      setColor(initial?.color || COLORS[0]);
      setRecurrence(initial?.recurrence || null);
      setShowRecur(!!initial?.recurrence);
    }
  }, [open, initial]);

  function confirm() {
    const start = fromLocalDateTime(startStr);
    const end = fromLocalDateTime(endStr);
    if (!title.trim()) return alert("Dê um título ao evento.");
    if (!start || !end) return alert("Defina início e término.");
    if (end < start) return alert("O término não pode ser antes do início.");

    const payload = {
      ...(initial || { id: uid() }),
      title: title.trim(),
      allDay,
      start: toISO(start),
      end: toISO(end),
      location: location.trim(),
      notes: notes.trim(),
      color,
      recurrence: showRecur ? recurrence : null
    };
    onSave(payload);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar evento" : "Novo evento"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <label className="grid gap-1 text-sm">
            <span>Título</span>
            <input
              className="pc-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Sessão de focus / Consulta / Reunião"
            />
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span className="flex items-center gap-2"><Clock3 className="w-4 h-4" /> Início</span>
              <input
                className="pc-input"
                type="datetime-local"
                value={startStr}
                onChange={(e) => setStartStr(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="flex items-center gap-2"><Clock3 className="w-4 h-4" /> Término</span>
              <input
                className="pc-input"
                type="datetime-local"
                value={endStr}
                onChange={(e) => setEndStr(e.target.value)}
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            <span>Dia inteiro</span>
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Local (opcional)</span>
              <input className="pc-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="ex.: Online / Clínica / Home office" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="flex items-center gap-2"><Palette className="w-4 h-4" /> Cor</span>
              <div className="flex items-center gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    className={`h-7 w-7 rounded-full border ${c === color ? "ring-2 ring-offset-2" : ""}`}
                    style={{ backgroundColor: c, borderColor: "rgba(0,0,0,.1)" }}
                    onClick={() => setColor(c)}
                    title={c}
                  />
                ))}
              </div>
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span>Notas</span>
            <textarea className="pc-textarea min-h-[100px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalhes, links, checklists…" />
          </label>

          <div className="rounded-xl border border-[var(--pc-border)] p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <Repeat className="w-4 h-4 text-purple-500" />
                Recorrência
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showRecur} onChange={(e) => setShowRecur(e.target.checked)} />
                <span>ativar</span>
              </label>
            </div>
            {showRecur && (
              <div className="mt-3">
                <RecurrenceEditor
                  startISO={startStr ? fromLocalDateTime(startStr).toISOString() : null}
                  value={recurrence}
                  onChange={setRecurrence}
                // inclui: diária, semanal (dias úteis), quinzenal, mensal (por dia/por posição),
                // anual, última sexta do mês, fim após N ocorrências, pular feriados (campo boolean)
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          {isEditing ? (
            <button className="pc-btn danger ghost flex items-center gap-2 mr-auto" onClick={onDelete}>
              <Trash2 className="w-4 h-4" /> Excluir
            </button>
          ) : (
            <span />
          )}
          <DialogClose asChild>
            <button className="pc-btn ghost">Cancelar</button>
          </DialogClose>
          <button className="pc-btn primary flex items-center gap-2" onClick={confirm}>
            <Save className="w-4 h-4" /> Salvar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =========================
   Toolbar superior
========================= */
function TopBar({ date, setDate, view, setView, onNewEvent }) {
  const go = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d);
  };
  const goToday = () => setDate(new Date());

  return (
    <div className="pc-card flex flex-wrap items-center gap-3 justify-between">
      <div className="flex items-center gap-2">
        <button className="pc-btn ghost" onClick={() => go(-1)} title="Anterior">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="pc-btn ghost" onClick={() => go(1)} title="Próximo">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button className="pc-btn" onClick={goToday}>Hoje</button>
        <div className="flex items-center gap-2 pl-2 text-sm text-[var(--pc-muted)]">
          <CalIcon className="w-4 h-4" />
          {date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select value={view} onValueChange={setView}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Visão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="year">Ano</SelectItem>
            <SelectItem value="quarter">Trimestre</SelectItem>
            <SelectItem value="month">Mês</SelectItem>
            <SelectItem value="week">Semana</SelectItem>
            <SelectItem value="day">Dia</SelectItem>
          </SelectContent>
        </Select>

        <button className="pc-btn primary flex items-center gap-2" onClick={onNewEvent}>
          <Plus className="w-4 h-4" /> Novo evento
        </button>
      </div>
    </div>
  );
}

/* =========================
   Página principal
========================= */
export default function PlanningPage() {
  const { toast } = useToast();
  const { events, addEvent, updateEvent, removeEvent } = useCalendar(); // pressupõe API do seu contexto
  const [date, setDate] = useState(() => new Date()); // sempre abre “hoje”
  const [view, setView] = useState("month"); // padrão: Mês

  // Modal de evento
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Preferências de layout (colisão/overlap): guardadas localmente
  const [allowOverlap, setAllowOverlap] = useState(() => {
    try { return JSON.parse(localStorage.getItem("plan:overlap")) ?? true; } catch { return true; }
  });
  useEffect(() => {
    localStorage.setItem("plan:overlap", JSON.stringify(allowOverlap));
  }, [allowOverlap]);

  // Filtragem simples (ex.: por cor)
  const [colorFilter, setColorFilter] = useState("");
  const filteredEvents = useMemo(() => {
    if (!colorFilter) return events || [];
    return (events || []).filter((e) => e.color === colorFilter);
  }, [events, colorFilter]);

  /* ---------- handlers comuns para TODAS as views ---------- */

  // criação APENAS por clique
  function handleCreateAt(slotInfo) {
    // slotInfo pode ser uma data ou { start, end, allDay }
    let start = null;
    let end = null;
    if (slotInfo instanceof Date) {
      start = slotInfo;
      end = new Date(slotInfo);
      end.setHours(end.getHours() + 1);
    } else if (slotInfo?.start) {
      start = new Date(slotInfo.start);
      end = new Date(slotInfo.end || slotInfo.start);
      if (start.getTime() === end.getTime()) end.setHours(end.getHours() + 1);
    } else {
      start = new Date(date);
      end = new Date(date);
      end.setHours(end.getHours() + 1);
    }
    setEditing({
      title: "",
      start: toISO(start),
      end: toISO(end),
      allDay: !!slotInfo?.allDay,
      color: COLORS[0],
      location: "",
      notes: "",
      recurrence: null
    });
    setModalOpen(true);
  }

  function handleEditEvent(event) {
    setEditing(event);
    setModalOpen(true);
  }

  function handleDropOrResize({ id, start, end }) {
    // drag/resize de evento existente
    const ev = (events || []).find((e) => e.id === id);
    if (!ev) return;
    updateEvent({ ...ev, start: toISO(start), end: toISO(end) });
  }

  function handleSave(payload) {
    if (payload.id && (events || []).some((e) => e.id === payload.id)) {
      updateEvent(payload);
      toast({ title: "Evento atualizado." });
    } else {
      addEvent(payload);
      toast({ title: "Evento criado." });
    }
    setModalOpen(false);
    setEditing(null);
  }

  function confirmDelete() {
    if (!deletingId) return;
    removeEvent(deletingId);
    toast({ title: "Evento excluído." });
    setModalOpen(false);
    setEditing(null);
    setDeletingId(null);
  }

  /* ---------- Cabeçalho + filtros ---------- */
  const Filters = (
    <div className="pc-card flex flex-wrap items-center gap-3">
      <div className="text-sm text-[var(--pc-muted)]">Preferências:</div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={allowOverlap} onChange={(e) => setAllowOverlap(e.target.checked)} />
        <span>Permitir sobreposição (stack)</span>
      </label>

      <div className="ml-auto flex items-center gap-2">
        <Select value={colorFilter || ""} onValueChange={(v) => setColorFilter(v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por cor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as cores</SelectItem>
            {COLORS.map((c) => (
              <SelectItem key={c} value={c}>
                <div className="inline-flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                  {c}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Planejamento</h1>
      </div>

      <TopBar date={date} setDate={setDate} view={view} setView={setView} onNewEvent={() => handleCreateAt({ start: date, end: date })} />

      {Filters}

      <Tabs value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="year">Ano</TabsTrigger>
          <TabsTrigger value="quarter">Trimestre</TabsTrigger>
          <TabsTrigger value="month">Mês</TabsTrigger>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="day">Dia</TabsTrigger>
        </TabsList>

        <TabsContent value="year">
          <AnnualView
            date={date}
            setDate={setDate}
            events={filteredEvents}
            allowOverlap={allowOverlap}
            // criação por clique no dia
            onCreateAt={(d) => handleCreateAt(d)}
            // editar ao clicar no evento
            onSelectEvent={(e) => handleEditEvent(e)}
            // drag/resize se suportado
            onEventDrop={(p) => handleDropOrResize(p)}
            onEventResize={(p) => handleDropOrResize(p)}
          />
        </TabsContent>

        <TabsContent value="quarter">
          <QuarterlyView
            date={date}
            setDate={setDate}
            events={filteredEvents}
            allowOverlap={allowOverlap}
            onCreateAt={(d) => handleCreateAt(d)}
            onSelectEvent={(e) => handleEditEvent(e)}
            onEventDrop={(p) => handleDropOrResize(p)}
            onEventResize={(p) => handleDropOrResize(p)}
          />
        </TabsContent>

        <TabsContent value="month">
          <MonthlyView
            date={date}
            setDate={setDate}
            events={filteredEvents}
            allowOverlap={allowOverlap}
            onCreateAt={(d) => handleCreateAt(d)}
            onSelectEvent={(e) => handleEditEvent(e)}
            onEventDrop={(p) => handleDropOrResize(p)}
            onEventResize={(p) => handleDropOrResize(p)}
          />
        </TabsContent>

        <TabsContent value="week">
          <WeeklyView
            date={date}
            setDate={setDate}
            events={filteredEvents}
            allowOverlap={allowOverlap}
            // criação APENAS por clique num slot/coluna de hora
            onCreateAt={(rangeOrDate) => handleCreateAt(rangeOrDate)}
            onSelectEvent={(e) => handleEditEvent(e)}
            onEventDrop={(p) => handleDropOrResize(p)}
            onEventResize={(p) => handleDropOrResize(p)}
          // dica: WeeklyView deve exibir grade por horas
          />
        </TabsContent>

        <TabsContent value="day">
          <DailyView
            date={date}
            setDate={setDate}
            events={filteredEvents}
            allowOverlap={allowOverlap}
            onCreateAt={(rangeOrDate) => handleCreateAt(rangeOrDate)}
            onSelectEvent={(e) => handleEditEvent(e)}
            onEventDrop={(p) => handleDropOrResize(p)}
            onEventResize={(p) => handleDropOrResize(p)}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de criar/editar */}
      <EventModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        initial={editing}
        onSave={handleSave}
        onDelete={() => setDeletingId(editing.id)}
      />

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
