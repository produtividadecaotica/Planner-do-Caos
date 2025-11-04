import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { storage, uid } from "../lib/utils.js";
import { buildRule, expandOccurrences } from "../lib/rrule.js";

/** ================ STORAGE KEYS ================ */
const K = {
  events: "calendar.events",          // eventos pontuais
  recurrences: "calendar.recurrences" // regras recorrentes
};

/** ================ TIPOS ================
 * Event:
 * { id, title, notes, start, end, allDay, linkedInboxId }
 *
 * Recurrence:
 * { id, title, notes, start, end, rule, linkedInboxId }
 *
 * Regra (rule): objeto compatível com buildRule(rruleOptions)
 * Ex.: { freq:'WEEKLY', interval:1, byweekday:[1,3], count:null, until:null }
 * ======================================= */

const CalendarCtx = createContext(null);
export const useCalendar = () => useContext(CalendarCtx);

export function CalendarProvider({ children }) {
  const [events, setEvents] = useState(() => storage.get(K.events, []));
  const [recurrences, setRecurrences] = useState(() => storage.get(K.recurrences, []));

  useEffect(() => storage.set(K.events, events), [events]);
  useEffect(() => storage.set(K.recurrences, recurrences), [recurrences]);

  /** ---------- CRUD Pontual ---------- */
  function addEvent({ title, notes = "", start, end, allDay = false, linkedInboxId = "" }) {
    const e = { id: uid("evt"), title, notes, start, end, allDay, linkedInboxId };
    setEvents(prev => [e, ...prev]);
    return e.id;
  }
  function updateEvent(ev) {
    setEvents(prev => prev.map(e => e.id === ev.id ? ev : e));
  }
  function removeEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  /** ---------- Recorrência ---------- */
  function addRecurrence({ title, notes = "", start, end, rule, linkedInboxId = "" }) {
    const r = { id: uid("rec"), title, notes, start, end, rule, linkedInboxId };
    setRecurrences(prev => [r, ...prev]);
    return r.id;
  }
  function updateRecurrence(rec) {
    setRecurrences(prev => prev.map(r => r.id === rec.id ? rec : r));
  }
  function removeRecurrence(id) {
    setRecurrences(prev => prev.filter(r => r.id !== id));
  }

  /** ---------- Expansão de ocorrências (para Planning/Calendar UI) ---------- */
  function getOccurrences(rangeStartISO, rangeEndISO) {
    const rangeStart = new Date(rangeStartISO);
    const rangeEnd = new Date(rangeEndISO);

    const flat = [...events.map(e => ({ ...e, kind: "single" }))];

    recurrences.forEach(r => {
      const rule = buildRule(r.rule, r.start);
      const occ = expandOccurrences(rule, rangeStart, rangeEnd).map(dt => ({
        id: `${r.id}:${dt.toISOString()}`,
        title: r.title,
        notes: r.notes,
        start: dt.toISOString(),
        end: r.end, // mesma duração do molde
        allDay: false,
        linkedInboxId: r.linkedInboxId,
        kind: "recur",
        parentId: r.id
      }));
      flat.push(...occ);
    });

    // Ordena por start
    flat.sort((a, b) => new Date(a.start) - new Date(b.start));
    return flat;
  }

  const value = useMemo(() => ({
    events, recurrences,
    addEvent, updateEvent, removeEvent,
    addRecurrence, updateRecurrence, removeRecurrence,
    getOccurrences
  }), [events, recurrences]);

  return <CalendarCtx.Provider value={value}>{children}</CalendarCtx.Provider>;
}