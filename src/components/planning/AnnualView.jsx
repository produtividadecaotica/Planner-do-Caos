import React, { useMemo, useState } from "react";
import { useCalendar } from "@/contexts/CalendarContext.jsx";
import { Dialog } from "@/components/ui/dialog.jsx";
import RecurrenceEditor from "./RecurrenceEditor.jsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Helpers */
function yearRange(y) { return { start: new Date(y, 0, 1, 0, 0, 0, 0), end: new Date(y, 11, 31, 23, 59, 59, 999) }; }
function toISO(d) { return new Date(d).toISOString(); }
function daysInMonth(y, m) { const last = new Date(y, m + 1, 0); return [...Array(last.getDate())].map((_, i) => new Date(y, m, i + 1)); }

export default function AnnualView() {
  const cal = useCalendar();
  const [year, setYear] = useState(new Date().getFullYear());
  const rng = yearRange(year);

  const events = useMemo(() => cal.getOccurrences(toISO(rng.start), toISO(rng.end)), [cal, year]);

  const perDay = useMemo(() => {
    const map = {}; for (let m = 0; m < 12; m++) { daysInMonth(year, m).forEach(d => map[d.toDateString()] = []); }
    events.forEach(e => { const k = new Date(e.start).toDateString(); if (map[k]) map[k].push(e); });
    return map;
  }, [events, year]);

  const [createDay, setCreateDay] = useState(null);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="rounded-md border px-2 py-1" onClick={() => setYear(y => y - 1)}><ChevronLeft className="w-4 h-4" /></button>
          <div className="text-sm font-medium">{year}</div>
          <button className="rounded-md border px-2 py-1" onClick={() => setYear(y => y + 1)}><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {Array.from({ length: 12 }).map((_, m) => (
          <div key={m} className="rounded-xl border border-[var(--pc-border)] p-3 bg-[var(--pc-surface)]">
            <div className="font-semibold text-sm mb-2">{new Date(2000, m, 1).toLocaleDateString('pt-BR', { month: 'long' })}</div>
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth(year, m).map((d, i) => {
                const list = perDay[d.toDateString()] || [];
                return (
                  <button key={i} className="rounded-md border px-1 py-1 text-left bg-white hover:bg-zinc-50"
                    onClick={() => setCreateDay(new Date(d))}>
                    <div className="text-[10px] opacity-70">{d.getDate()}</div>
                    {list.slice(0, 1).map(ev => (
                      <div key={ev.id} className="mt-1 rounded-sm border px-1 py-0.5 text-[10px] truncate">{ev.title}</div>
                    ))}
                    {list.length > 1 && <div className="text-[10px] text-[var(--pc-muted)]">+{list.length - 1}</div>}
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
    <Dialog open onClose={onClose} title="Criar evento (anual)">
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