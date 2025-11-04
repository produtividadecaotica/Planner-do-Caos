import React, { useMemo, useState } from "react";
import { useCalendar } from "@/contexts/CalendarContext.jsx";
import { Dialog } from "@/components/ui/dialog.jsx";
import RecurrenceEditor from "./RecurrenceEditor.jsx";
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from "lucide-react";

/** Helpers */
function startOfMonth(d) { const x = new Date(d); x.setDate(1); x.setHours(0, 0, 0, 0); return x; }
function endOfMonth(d) { const x = new Date(d); x.setMonth(x.getMonth() + 1); x.setDate(0); x.setHours(23, 59, 59, 999); return x; }
function startOfWeek(d) { const x = new Date(d); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); x.setHours(0, 0, 0, 0); return x; }
function addMonths(d, n) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; }
function toISO(d) { return new Date(d).toISOString(); }
function fromISO(iso) { return new Date(iso); }

export default function MonthlyView() {
  const cal = useCalendar();
  const [anchor, setAnchor] = useState(new Date());

  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart);
  const cells = 42; // 6 semanas
  const days = [...Array(cells)].map((_, i) => {
    const dd = new Date(gridStart); dd.setDate(dd.getDate() + i); return dd;
  });

  const events = useMemo(() => cal.getOccurrences(toISO(gridStart), toISO(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + cells, 23, 59, 59, 999))), [cal, anchor]);

  const perDay = useMemo(() => {
    const map = {}; days.forEach(d => map[d.toDateString()] = []);
    events.forEach(e => {
      const key = new Date(e.start).toDateString();
      if (map[key]) map[key].push(e);
    });
    return map;
  }, [events, days]);

  const [createDay, setCreateDay] = useState(null);

  return (
    <div className="grid gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="rounded-md border px-2 py-1" onClick={() => setAnchor(addMonths(anchor, -1))}><ChevronLeft className="w-4 h-4" /></button>
          <button className="rounded-md border px-2 py-1" onClick={() => setAnchor(new Date())}>Mês atual</button>
          <button className="rounded-md border px-2 py-1" onClick={() => setAnchor(addMonths(anchor, 1))}><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <CalendarDays className="w-4 h-4" />
          {anchor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Grid mensal */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, idx) => {
          const inMonth = d.getMonth() === anchor.getMonth();
          const key = d.toDateString();
          const list = perDay[key] || [];
          return (
            <div key={idx} className={`rounded-xl border border-[var(--pc-border)] p-2 bg-[var(--pc-surface)] ${inMonth ? '' : 'opacity-60'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold">{d.toLocaleDateString('pt-BR', { day: '2-digit' })}</div>
                <button className="rounded-md border px-2 py-1 text-xs" onClick={() => setCreateDay(new Date(d))}><Plus className="w-3 h-3" /></button>
              </div>
              <div className="grid gap-1">
                {list.length === 0 && <div className="text-[11px] text-[var(--pc-muted)]">Sem eventos</div>}
                {list.slice(0, 4).map(ev => (
                  <div key={ev.id} className="rounded-md border px-2 py-1 text-[12px] bg-white truncate">
                    {new Date(ev.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – {ev.title}
                  </div>
                ))}
                {list.length > 4 && (<div className="text-[11px] text-[var(--pc-muted)]">+{list.length - 4} mais</div>)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Criar */}
      {createDay && (
        <CreateEventModal
          day={createDay}
          onClose={() => setCreateDay(null)}
          onSave={(payload) => {
            if (payload.recurrence?.enabled) {
              cal.addRecurrence({ title: payload.title, notes: payload.notes || "", start: payload.start, end: payload.end, rule: payload.recurrence.rule });
            } else {
              cal.addEvent({ title: payload.title, notes: payload.notes || "", start: payload.start, end: payload.end, allDay: true });
            }
            setCreateDay(null);
          }}
        />
      )}
    </div>
  );
}

function CreateEventModal({ day, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [start, setStart] = useState(() => {
    const d = new Date(day); d.setHours(9, 0, 0, 0); return d.toISOString().slice(0, 16);
  });
  const [end, setEnd] = useState(() => {
    const d = new Date(day); d.setHours(10, 0, 0, 0); return d.toISOString().slice(0, 16);
  });
  const [recurrence, setRecurrence] = useState({ enabled: false, rule: null });

  return (
    <Dialog open onClose={onClose} title="Criar evento (mensal)">
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm">
          <span>Título</span>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome do evento" />
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">
            <span>Início</span>
            <input className="input" type="datetime-local" value={start} onChange={e => setStart(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Fim</span>
            <input className="input" type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} />
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          <span>Notas</span>
          <textarea className="input min-h-[90px]" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Detalhes..." />
        </label>

        <RecurrenceEditor value={recurrence} onChange={setRecurrence} compact />

        <div className="flex justify-end gap-2">
          <button className="rounded-md border px-3 py-2 text-sm" onClick={onClose}>Cancelar</button>
          <button className="rounded-md px-3 py-2 text-sm font-medium" style={{ background: "var(--pc-primary)", color: "#fff" }}
            onClick={() => onSave({ title, notes, start: new Date(start).toISOString(), end: new Date(end).toISOString(), recurrence })}
            disabled={!title.trim()}>
            Salvar
          </button>
        </div>
      </div>
    </Dialog>
  );
}