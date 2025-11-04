import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCalendar } from "@/contexts/CalendarContext.jsx";
import { Dialog } from "@/components/ui/dialog.jsx";
import RecurrenceEditor from "./RecurrenceEditor.jsx";
import { ChevronLeft, ChevronRight, Clock, Layers, Plus } from "lucide-react";

/** Helpers */
function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfDay(d) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
function toISO(d) { return new Date(d).toISOString(); }
function fromISO(iso) { return new Date(iso); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
const HOURS = [...Array(24)].map((_, h) => h);

export default function DailyView() {
  const cal = useCalendar();
  const [date, setDate] = useState(new Date());
  const range = useMemo(() => ({
    startISO: toISO(startOfDay(date)),
    endISO: toISO(endOfDay(date))
  }), [date]);

  const events = useMemo(() => cal.getOccurrences(range.startISO, range.endISO), [cal, range]);

  // UI: colisão (empilhar/sobrepor)
  const [collision, setCollision] = useState("stack"); // 'stack' | 'overlap'

  // Criação por clique
  const [createAt, setCreateAt] = useState(null); // ISO ou null
  const [editData, setEditData] = useState(null); // {kind:'single'|'recur', data}

  function slotClick(h) {
    const dt = new Date(date);
    dt.setHours(h, 0, 0, 0);
    setCreateAt(toISO(dt));
  }

  // Drag/Resize simplificado
  const dragRef = useRef(null);
  function onMouseDown(ev, eMeta, mode) { // mode:'move'|'resize'
    ev.preventDefault();
    const startY = ev.clientY;
    const box = ev.currentTarget.closest(".day-grid").getBoundingClientRect();
    const hourHeight = box.height / 24;

    const origStart = fromISO(eMeta.start);
    const origEnd = fromISO(eMeta.end || eMeta.start);
    dragRef.current = { mode, startY, hourHeight, eMeta, origStart, origEnd };

    function onMove(e) {
      if (!dragRef.current) return;
      const dy = e.clientY - dragRef.current.startY;
      const hoursDelta = dy / dragRef.current.hourHeight;
      if (dragRef.current.mode === "move") {
        const s = new Date(dragRef.current.origStart);
        const e2 = new Date(dragRef.current.origEnd);
        s.setHours(s.getHours() + hoursDelta);
        e2.setHours(e2.getHours() + hoursDelta);
        setEditData({ kind: eMeta.kind, data: { ...eMeta, start: toISO(s), end: toISO(e2) } });
      } else {
        const e2 = new Date(dragRef.current.origEnd);
        e2.setHours(e2.getHours() + hoursDelta);
        if (e2 < dragRef.current.origStart) return;
        setEditData({ kind: eMeta.kind, data: { ...eMeta, end: toISO(e2) } });
      }
    }
    function onUp() {
      if (!dragRef.current) return;
      const { eMeta } = dragRef.current;
      const payload = editData?.data || eMeta;
      if (payload && (payload.start !== eMeta.start || payload.end !== eMeta.end)) {
        if (eMeta.kind === "recur") {
          // atualiza molde
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
      dragRef.current = null;
      setEditData(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function hourTop(h) { return `${(h / 24) * 100}%`; }
  function eventRect(e) {
    const s = fromISO(e.start); const ed = fromISO(e.end || e.start);
    const top = ((s.getHours() + s.getMinutes() / 60) / 24) * 100;
    const height = Math.max(1, ((ed - s) / (1000 * 60 * 60)) / 24 * 100);
    return { top: `${top}%`, height: `${height}%` };
  }

  const drawEvents = editData ? events.map(x => x.id === editData.data.id ? editData.data : x) : events;

  // agrupamento por colisão (stack)
  const columns = useMemo(() => {
    if (collision !== "stack") return [{ items: drawEvents }];
    // algoritmo simples: varre e cria colunas por conflito
    const cols = [];
    drawEvents.forEach(ev => {
      const s = +fromISO(ev.start); const ed = +fromISO(ev.end || ev.start);
      let placed = false;
      for (const col of cols) {
        const clash = col.items.some(it => {
          const s2 = +fromISO(it.start), e2 = +fromISO(it.end || it.start);
          return !(ed <= s2 || s >= e2);
        });
        if (!clash) { col.items.push(ev); placed = true; break; }
      }
      if (!placed) cols.push({ items: [ev] });
    });
    return cols;
  }, [drawEvents, collision]);

  return (
    <div className="grid gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="rounded-md border px-2 py-1" onClick={() => setDate(addDays(date, -1))}><ChevronLeft className="w-4 h-4" /></button>
          <button className="rounded-md border px-2 py-1" onClick={() => setDate(new Date())}>Hoje</button>
          <button className="rounded-md border px-2 py-1" onClick={() => setDate(addDays(date, 1))}><ChevronRight className="w-4 h-4" /></button>
          <div className="text-sm font-medium ml-2">{date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
        </div>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 opacity-60" />
          <select className="input w-[150px]" value={collision} onChange={(e) => setCollision(e.target.value)}>
            <option value="stack">Empilhar</option>
            <option value="overlap">Sobrepor</option>
          </select>
        </div>
      </div>

      {/* Grid do dia */}
      <div className="relative day-grid rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface)] overflow-hidden" style={{ height: 900 }}>
        {/* linhas das horas */}
        {HOURS.map(h => (
          <div key={h} className="absolute left-0 right-0 border-t border-[var(--pc-border)]" style={{ top: hourTop(h) }}>
            <div className="absolute -translate-y-1/2 left-2 text-[11px] text-[var(--pc-muted)]">{String(h).padStart(2, '0')}:00</div>
          </div>
        ))}
        {/* clique para criar */}
        {HOURS.map(h => (
          <button
            key={`slot-${h}`}
            className="absolute left-0 right-0"
            style={{ top: hourTop(h), height: `${(1 / 24) * 100}%` }}
            onClick={() => slotClick(h)}
            aria-label={`Criar às ${h}:00`}
          />
        ))}

        {/* Eventos */}
        {collision === "overlap" ? (
          drawEvents.map(ev => {
            const rect = eventRect(ev);
            return (
              <div key={ev.id}
                className="absolute left-1/2 -translate-x-1/2 w-[96%] rounded-lg border border-[var(--pc-border)] bg-white shadow-pc cursor-move"
                style={{ top: rect.top, height: rect.height }}
                onMouseDown={(e) => onMouseDown(e, ev, "move")}
              >
                <EventCard ev={ev} onResizeStart={(e) => onMouseDown(e, ev, "resize")} />
              </div>
            );
          })
        ) : (
          // empilhado: divide largura pelas colunas
          columns.map((col, cIdx) => col.items.map(ev => {
            const rect = eventRect(ev);
            const width = 100 / columns.length;
            return (
              <div key={ev.id}
                className="absolute rounded-lg border border-[var(--pc-border)] bg-white shadow-pc cursor-move"
                style={{ left: `${cIdx * width + 1}%`, width: `${width - 2}%`, top: rect.top, height: rect.height }}
                onMouseDown={(e) => onMouseDown(e, ev, "move")}
              >
                <EventCard ev={ev} onResizeStart={(e) => onMouseDown(e, ev, "resize")} />
              </div>
            );
          }))
        )}
      </div>

      {/* Criar */}
      {createAt && (
        <CreateEventModal
          startISO={createAt}
          onClose={() => setCreateAt(null)}
          onSave={(payload) => {
            if (payload.recurrence?.enabled) {
              cal.addRecurrence({
                title: payload.title, notes: payload.notes || "",
                start: payload.start, end: payload.end, rule: payload.recurrence.rule
              });
            } else {
              cal.addEvent({
                title: payload.title, notes: payload.notes || "",
                start: payload.start, end: payload.end, allDay: false
              });
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

  useEffect(() => {
    if (start) {
      const d = new Date(start);
      const e = new Date(d); e.setHours(e.getHours() + 1);
      setEnd(e.toISOString().slice(0, 16));
    }
  }, [start]);

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