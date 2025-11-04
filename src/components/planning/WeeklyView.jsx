import React, { useMemo, useRef, useState } from "react";
import { useCalendar } from "@/contexts/CalendarContext.jsx";
import { Dialog } from "@/components/ui/dialog.jsx";
import RecurrenceEditor from "./RecurrenceEditor.jsx";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Layers } from "lucide-react";

/** Helpers */
function startOfWeek(d) { const x = new Date(d); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); x.setHours(0, 0, 0, 0); return x; }
function endOfWeek(d) { const x = startOfWeek(d); x.setDate(x.getDate() + 6); x.setHours(23, 59, 59, 999); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function toISO(d) { return new Date(d).toISOString(); }
function fromISO(iso) { return new Date(iso); }
const HOURS = [...Array(24)].map((_, h) => h);

export default function WeeklyView() {
  const cal = useCalendar();
  const [anchor, setAnchor] = useState(new Date());
  const range = useMemo(() => ({
    startISO: toISO(startOfWeek(anchor)),
    endISO: toISO(endOfWeek(anchor))
  }), [anchor]);
  const days = [...Array(7)].map((_, i) => addDays(startOfWeek(anchor), i));

  const events = useMemo(() => cal.getOccurrences(range.startISO, range.endISO), [cal, range]);

  const [collision, setCollision] = useState("stack"); // 'stack' | 'overlap'
  const [createAt, setCreateAt] = useState(null); // { dayIndex, hour }
  const [editData, setEditData] = useState(null);

  function slotClick(dayIndex, hour) {
    const base = new Date(days[dayIndex]); base.setHours(hour, 0, 0, 0);
    setCreateAt({ dayIndex, hour, start: toISO(base) });
  }

  // Drag/Resize
  const dragRef = useRef(null);
  function onMouseDown(ev, eMeta, mode) {
    ev.preventDefault();
    const columnEl = ev.currentTarget.closest(`[data-col='${new Date(eMeta.start).getDay()}']`) || ev.currentTarget.closest(".week-grid");
    const box = columnEl.getBoundingClientRect();
    const hourHeight = box.height / 24;
    const startY = ev.clientY;

    const origStart = fromISO(eMeta.start);
    const origEnd = fromISO(eMeta.end || eMeta.start);

    dragRef.current = { mode, startY, hourHeight, eMeta, origStart, origEnd };

    function onMove(e) {
      if (!dragRef.current) return;
      const dy = e.clientY - dragRef.current.startY;
      const hoursDelta = dy / dragRef.current.hourHeight;
      if (dragRef.current.mode === "move") {
        const s = new Date(dragRef.current.origStart);
        const ed = new Date(dragRef.current.origEnd);
        s.setHours(s.getHours() + hoursDelta);
        ed.setHours(ed.getHours() + hoursDelta);
        setEditData({ kind: eMeta.kind, data: { ...eMeta, start: toISO(s), end: toISO(ed) } });
      } else {
        const ed = new Date(dragRef.current.origEnd);
        ed.setHours(ed.getHours() + hoursDelta);
        if (ed < dragRef.current.origStart) return;
        setEditData({ kind: eMeta.kind, data: { ...eMeta, end: toISO(ed) } });
      }
    }
    function onUp() {
      const { eMeta } = dragRef.current || {};
      const payload = editData?.data || eMeta;
      if (payload && (payload.start !== eMeta.start || payload.end !== eMeta.end)) {
        if (eMeta.kind === "recur") {
          cal.updateRecurrence({
            id: eMeta.parentId,
            title: eMeta.title,
            notes: eMeta.notes,
            start: payload.start,
            end: payload.end || payload.start,
            rule: cal.recurrences.find(r => r.id === eMeta.parentId)?.rule
          });
        } else {
          cal.updateEvent({ id: eMeta.id, title: eMeta.title, notes: eMeta.notes, start: payload.start, end: payload.end || payload.start, allDay: false });
        }
      }
      dragRef.current = null; setEditData(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function eventRect(ev) {
    const s = fromISO(ev.start); const ed = fromISO(ev.end || ev.start);
    const dIdx = (s.getDay() + 6) % 7; // segunda=0
    const top = ((s.getHours() + s.getMinutes() / 60) / 24) * 100;
    const height = Math.max(1, ((ed - s) / (1000 * 60 * 60)) / 24 * 100);
    return { dIdx, top: `${top}%`, height: `${height}%` };
  }

  // Agrupar por dia
  const perDay = useMemo(() => {
    const map = Array.from({ length: 7 }, () => []);
    (editData ? events.map(e => e.id === editData.data.id ? editData.data : e) : events).forEach(e => {
      const idx = (new Date(e.start).getDay() + 6) % 7;
      map[idx].push(e);
    });
    return map;
  }, [events, editData]);

  return (
    <div className="grid gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="rounded-md border px-2 py-1" onClick={() => setAnchor(addDays(anchor, -7))}><ChevronLeft className="w-4 h-4" /></button>
          <button className="rounded-md border px-2 py-1" onClick={() => setAnchor(new Date())}>Esta semana</button>
          <button className="rounded-md border px-2 py-1" onClick={() => setAnchor(addDays(anchor, 7))}><ChevronRight className="w-4 h-4" /></button>
          <div className="text-sm font-medium ml-2 flex items-center gap-2">
            <CalIcon className="w-4 h-4" />
            {days[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – {days[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 opacity-60" />
          <select className="input w-[150px]" value={collision} onChange={(e) => setCollision(e.target.value)}>
            <option value="stack">Empilhar</option>
            <option value="overlap">Sobrepor</option>
          </select>
        </div>
      </div>

      {/* Grade semanal */}
      <div className="grid grid-cols-7 gap-2 week-grid">
        {days.map((d, idx) => (
          <div key={idx} data-col={d.getDay()} className="relative rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface)] overflow-hidden" style={{ height: 720 }}>
            <div className="absolute top-2 left-2 text-xs font-medium">
              {d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}
            </div>
            {/* slots de clique */}
            {HOURS.map(h => (
              <button key={h}
                className="absolute left-0 right-0 border-t border-[var(--pc-border)]"
                style={{ top: `${(h / 24) * 100}%`, height: `${(1 / 24) * 100}%` }}
                onClick={() => slotClick(idx, h)}
                aria-label={`Criar ${h}:00`}
              />
            ))}

            {/* eventos do dia */}
            {(() => {
              const dayEvents = perDay[idx] || [];
              if (collision === "overlap") {
                return dayEvents.map(e => {
                  const rect = eventRect(e);
                  return (
                    <div key={e.id}
                      className="absolute left-1/2 -translate-x-1/2 w-[96%] rounded-lg border border-[var(--pc-border)] bg-white shadow-pc cursor-move"
                      style={{ top: rect.top, height: rect.height }}
                      onMouseDown={(ev) => onMouseDown(ev, e, "move")}
                    >
                      <EventCard ev={e} onResizeStart={(ev) => onMouseDown(ev, e, "resize")} />
                    </div>
                  );
                });
              }
              // stack simples
              const cols = [];
              dayEvents.forEach(e => {
                const s = +fromISO(e.start), ed = +fromISO(e.end || e.start);
                let placed = false;
                for (const col of cols) {
                  const clash = col.some(it => {
                    const s2 = +fromISO(it.start), e2 = +fromISO(it.end || it.start);
                    return !(ed <= s2 || s >= e2);
                  });
                  if (!clash) { col.push(e); placed = true; break; }
                }
                if (!placed) cols.push([e]);
              });
              const width = 100 / (cols.length || 1);
              return cols.flatMap((col, cIdx) => col.map(e => {
                const rect = eventRect(e);
                return (
                  <div key={e.id}
                    className="absolute rounded-lg border border-[var(--pc-border)] bg-white shadow-pc cursor-move"
                    style={{ left: `${cIdx * width + 1}%`, width: `${width - 2}%`, top: rect.top, height: rect.height }}
                    onMouseDown={(ev) => onMouseDown(ev, e, "move")}
                  >
                    <EventCard ev={e} onResizeStart={(ev) => onMouseDown(ev, e, "resize")} />
                  </div>
                );
              }));
            })()}
          </div>
        ))}
      </div>

      {/* Criar */}
      {createAt && (
        <CreateEventModal
          startISO={createAt.start}
          onClose={() => setCreateAt(null)}
          onSave={(payload) => {
            if (payload.recurrence?.enabled) {
              cal.addRecurrence({ title: payload.title, notes: payload.notes || "", start: payload.start, end: payload.end, rule: payload.recurrence.rule });
            } else {
              cal.addEvent({ title: payload.title, notes: payload.notes || "", start: payload.start, end: payload.end, allDay: false });
            }
            setCreateAt(null);
          }}
        />
      )}
    </div>
  );
}

function EventCard({ ev, onResizeStart }) {
  const isRecur = ev.kind === "recur";
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-2 py-1 text-xs font-semibold truncate">{ev.title}</div>
      <div className="px-2 pb-1 text-[11px] text-[var(--pc-muted)] truncate">
        {new Date(ev.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        {" – "}
        {new Date(ev.end || ev.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        {isRecur && <span className="ml-2 rounded-full border px-1 py-0.5">recorrente</span>}
      </div>
      <button className="mt-auto h-2 w-full cursor-ns-resize bg-black/5" onMouseDown={onResizeStart} title="Redimensionar" />
    </div>
  );
}

function CreateEventModal({ startISO, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [start, setStart] = useState(startISO);
  const [end, setEnd] = useState(() => {
    const d = new Date(startISO); d.setHours(d.getHours() + 1); return d.toISOString().slice(0, 16);
  });
  const [recurrence, setRecurrence] = useState({ enabled: false, rule: null });

  return (
    <Dialog open onClose={onClose} title="Criar evento">
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm">
          <span>Título</span>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome do evento" />
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">
            <span>Início</span>
            <input className="input" type="datetime-local" value={start.slice(0, 16)} onChange={e => setStart(e.target.value)} />
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