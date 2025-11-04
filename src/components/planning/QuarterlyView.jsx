import React, { useMemo, useState } from "react";
import { useCalendar } from "@/contexts/CalendarContext.jsx";
import { Dialog } from "@/components/ui/dialog.jsx";
import RecurrenceEditor from "./RecurrenceEditor.jsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Helpers */
function quarterOf(d) { return Math.floor(d.getMonth() / 3) + 1; }
function startOfQuarter(d) { const q = quarterOf(d); const m = (q - 1) * 3; const x = new Date(d.getFullYear(), m, 1); x.setHours(0, 0, 0, 0); return x; }
function endOfQuarter(d) { const qEnd = new Date(startOfQuarter(d)); qEnd.setMonth(qEnd.getMonth() + 3); qEnd.setDate(0); qEnd.setHours(23, 59, 59, 999); return qEnd; }
function addQuarters(d, n) { const x = new Date(d); x.setMonth(x.getMonth() + 3 * n); return x; }
function toISO(d) { return new Date(d).toISOString(); }
function monthName(m) { return new Date(2000, m, 1).toLocaleDateString('pt-BR', { month: 'short' }); }

export default function QuarterlyView() {
  const cal = useCalendar();
  const [anchor, setAnchor] = useState(new Date());
  const qStart = startOfQuarter(anchor);
  const qEnd = endOfQuarter(anchor);

  const events = useMemo(() => cal.getOccurrences(toISO(qStart), toISO(qEnd)), [cal, anchor]);

  // meses do trimestre
  const months = [qStart.getMonth(), qStart.getMonth() + 1, qStart.getMonth() + 2];

  // distribuir por dia
  const perDay = useMemo(() => {
    const map = {};
    for (let d = new Date(qStart); d <= qEnd; d.setDate(d.getDate() + 1)) {
      map[new Date(d).toDateString()] = [];
    }
    events.forEach(e => {
      const key = new Date(e.start).toDateString();
      if (map[key]) map[key].push(e);
    });
    return map;
  }, [events, qStart, qEnd]);

  const [createDay, setCreateDay] = useState(null);

  function daysInMonth(y, m) {
    const last = new Date(y, m + 1, 0);
    return [...Array(last.getDate())].map((_, i) => new Date(y, m, i + 1));
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="rounded-md border px-2 py-1" onClick={() => setAnchor(addQuarters(anchor, -1))}><ChevronLeft className="w-4 h-4" /></button>
          <button className="rounded-md border px-2 py-1" onClick={() => setAnchor(new Date())}>Trimestre atual</button>
          <button className="rounded-md border px-2 py-1" onClick={() => setAnchor(addQuarters(anchor, 1))}><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="text-sm font-medium">
          T{quarterOf(anchor)} · {anchor.getFullYear()}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {months.map((m, idx) => (
          <div key={idx} className="rounded-xl border border-[var(--pc-border)] p-3 bg-[var(--pc-surface)]">
            <div className="font-semibold text-sm mb-2">{monthName(m)} {anchor.getFullYear()}</div>
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth(anchor.getFullYear(), m).map((d, i) => {
                const list = perDay[d.toDateString()] || [];
                return (
                  <button key={i} className="rounded-md border px-1 py-1 text-left bg-white hover:bg-zinc-50"
                    onClick={() => setCreateDay(new Date(d))}>
                    <div className="text-[10px] opacity-70">{d.getDate()}</div>
                    {list.slice(0, 2).map(ev => (
                      <div key={ev.id} className="mt-1 rounded-sm border px-1 py-0.5 text-[10px] truncate">{ev.title}</div>
                    ))}
                    {list.length > 2 && <div className="text-[10px] text-[var(--pc-muted)]">+{list.length - 2}</div>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {createDay && (
        <CreateEventModal day={createDay} onClose={() => setCreateDay(null)} onSave={(payload) => {
          if (payload.recurrence?.enabled) {
            cal.addRecurrence({ title: payload.title, notes: payload.notes || "", start: payload.start, end: payload.end, rule: payload.recurrence.rule });
          } else {
            cal.addEvent({ title: payload.title, notes: payload.notes || "", start: payload.start, end: payload.end, allDay: true });
          }
          setCreateDay(null);
        }} />
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
    <Dialog open onClose={onClose} title="Criar evento (trimestral)">
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