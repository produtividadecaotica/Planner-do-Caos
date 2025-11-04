import React, { useEffect, useMemo, useState } from "react";
import Select from "@/components/ui/select.jsx";
import { Checkbox } from "@/components/ui/checkbox.jsx";
import { Input } from "@/components/ui/button.jsx"; // apenas pelo estilo .input se você usa
import { Calendar, Repeat, X } from "lucide-react";

/**
 * Shape esperado/emitido:
 * {
 *   enabled: boolean,
 *   rule: {
 *     freq: 'DAILY'|'WEEKLY'|'MONTHLY'|'YEARLY',
 *     interval: number,
 *     byweekday?: number[], // 0-dom ... 6-sáb
 *     bymonthday?: number[], // para mensal por dia do mês
 *     count?: number|null,
 *     until?: string|null (ISO)
 *   }
 * }
 */

const FREQS = [
  { value: "DAILY", label: "Diária" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "MONTHLY", label: "Mensal" },
  { value: "YEARLY", label: "Anual" },
];

const WEEKDAYS = [
  { i: 1, short: "Seg" },
  { i: 2, short: "Ter" },
  { i: 3, short: "Qua" },
  { i: 4, short: "Qui" },
  { i: 5, short: "Sex" },
  { i: 6, short: "Sáb" },
  { i: 0, short: "Dom" },
];

export default function RecurrenceEditor({ value, onChange, compact = false }) {
  const [enabled, setEnabled] = useState(!!value?.enabled);
  const [freq, setFreq] = useState(value?.rule?.freq || "WEEKLY");
  const [interval, setInterval] = useState(value?.rule?.interval || 1);
  const [byweekday, setByweekday] = useState(value?.rule?.byweekday || [1, 3, 5]); // seg, qua, sex
  const [bymonthday, setBymonthday] = useState(value?.rule?.bymonthday || []);
  const [endType, setEndType] = useState(() => value?.rule?.count ? "count" : value?.rule?.until ? "until" : "never");
  const [count, setCount] = useState(value?.rule?.count || 10);
  const [until, setUntil] = useState(value?.rule?.until || "");

  useEffect(() => {
    if (!onChange) return;
    if (!enabled) {
      onChange({ enabled: false, rule: null });
      return;
    }
    const rule = {
      freq,
      interval: Number(interval) || 1,
    };
    if (freq === "WEEKLY") rule.byweekday = [...byweekday].sort((a, b) => a - b);
    if (freq === "MONTHLY" && bymonthday.length) rule.bymonthday = bymonthday.map(n => Number(n));
    if (endType === "count") rule.count = Number(count) || 1;
    if (endType === "until") rule.until = until || null;
    onChange({ enabled: true, rule });
  }, [enabled, freq, interval, byweekday, bymonthday, endType, count, until, onChange]);

  function toggleWD(i) {
    setByweekday(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  }

  function setMonthDaysFromText(txt) {
    const vals = (txt || "")
      .split(/[,;\s]+/g)
      .map(s => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter(n => !isNaN(n) && n >= 1 && n <= 31);
    setBymonthday([...new Set(vals)].sort((a, b) => a - b));
  }

  return (
    <div className={`rounded-xl border border-[var(--pc-border)] ${compact ? 'p-3' : 'p-4'} bg-[var(--pc-surface)]`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEnabled(v => !v)}
            className={`rounded-full border px-3 py-1 text-xs ${enabled ? 'bg-[var(--pc-primary)] text-white' : ''}`}
          >
            {enabled ? "Recorrente: ON" : "Recorrente: OFF"}
          </button>
          <span className="text-xs text-[var(--pc-muted)]">Configure regras personalizadas</span>
        </div>
        <Repeat className="w-4 h-4 opacity-60" />
      </div>

      {enabled && (
        <div className="mt-3 grid gap-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <Select label="Frequência" value={freq} onChange={setFreq} options={FREQS} />
            <label className="grid gap-1 text-sm">
              <span>Intervalo</span>
              <input className="input" type="number" min={1} value={interval} onChange={e => setInterval(e.target.value)} />
            </label>

            <label className="grid gap-1 text-sm">
              <span>Término</span>
              <select className="input" value={endType} onChange={e => setEndType(e.target.value)}>
                <option value="never">Nunca</option>
                <option value="count">Após X ocorrências</option>
                <option value="until">Até a data</option>
              </select>
            </label>
          </div>

          {freq === "WEEKLY" && (
            <div className="grid gap-2">
              <span className="text-sm">Dias da semana</span>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(w => (
                  <button key={w.i}
                    type="button"
                    onClick={() => toggleWD(w.i)}
                    className={`rounded-full border px-3 py-1 text-sm ${byweekday.includes(w.i) ? 'bg-purple-50 border-purple-300 text-purple-700' : ''}`}>
                    {w.short}
                  </button>
                ))}
              </div>
            </div>
          )}

          {freq === "MONTHLY" && (
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span>Dias do mês (ex.: 1, 15, 31)</span>
                <input className="input" placeholder="1, 15, 31"
                  value={bymonthday.join(", ")}
                  onChange={(e) => setMonthDaysFromText(e.target.value)}
                />
              </label>
            </div>
          )}

          {endType === "count" && (
            <label className="grid gap-1 text-sm w-44">
              <span>Ocorrências</span>
              <input className="input" type="number" min={1} value={count} onChange={e => setCount(e.target.value)} />
            </label>
          )}

          {endType === "until" && (
            <label className="grid gap-1 text-sm w-64">
              <span>Até</span>
              <input className="input" type="date" value={until} onChange={e => setUntil(e.target.value)} />
            </label>
          )}
        </div>
      )}
    </div>
  );
}