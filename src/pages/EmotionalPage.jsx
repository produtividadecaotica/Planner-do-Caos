import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Settings, RefreshCw, Star, Plus, Trash2, BookOpen, Droplet, Bike, BrainCircuit } from "lucide-react";
import Dialog from "../ui/dialog.jsx";
import { useDailyStorage, listDailyRange } from "../hooks/useDailyStorage.js";
import { storage } from "../lib/utils.js";

// ---------- Datas helpers ----------
function toYMD(dateObj = new Date()) {
  const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}
function addDays(d, n) { const nd = new Date(d); nd.setDate(nd.getDate() + n); return nd; }
function startOfMonth(date) { const d = new Date(date); d.setDate(1); return d; }
function endOfMonth(date) { const d = new Date(date); d.setMonth(d.getMonth() + 1); d.setDate(0); return d; }
function dayOfYear(d) { const start = new Date(d.getFullYear(), 0, 0); const diff = (d - start) + ((start.getTimezoneOffset() - d.getTimezoneOffset()) * 60000); return Math.floor(diff / 86400000); }

// ---------- Prompts (365 determinísticos) ----------
const SEEDS_A = ["pico e vale", "padrão invisível", "energia", "coragem", "prioridade real", "microvitórias", "gentileza", "limite", "foco", "descanso", "ambiente", "autocrítica", "curiosidade", "rotas de fuga", "atrito", "alívio", "procrastinação útil", "1% melhor", "fricção", "expectativa", "frustração", "orgulho", "aprendizado", "pedido de ajuda", "não feito", "feito", "leveza", "intenção", "autonomia", "cuidado"];
const SEEDS_B = ["manhã", "tarde", "noite", "rotina", "agenda", "corpo", "casa", "trabalho", "relacionamentos", "sozinho", "ruído", "silêncio", "cansaço", "âncora", "ritual", "movimento", "trava", "desbloqueio", "prazo", "medo", "alegria", "raiva", "tristeza", "ansiedade", "satisfação", "tédio", "impulso", "hábito", "planejamento", "execução"];
const TEMPLATES = [
  (a, b) => `Qual foi o ${a} e o ${b} do seu dia?`,
  (a, b) => `O que drenou e o que gerou ${a} hoje? E onde você pode criar ${b} amanhã?`,
  (a, b) => `Se amanhã fosse +1% em ${a}, o que você faria por 10 minutos? E o que não faria?`,
  (a, b) => `Que gatilho te jogou no ${a}? Qual micro-regra impediria esse ${b} amanhã?`,
  (a, b) => `Cite 3 microvitórias de hoje e 1 ajuste para reduzir ${a} e ampliar ${b}.`,
  (a, b) => `Qual padrão invisível entre ${a} e ${b} apareceu hoje? Como você quer agir diante dele?`,
  (a, b) => `O que você adiou? Por quê? Que versão “mínima viável” de ${a} cabe amanhã?`,
  (a, b) => `Quais sinais de ${a} seu corpo deu? E qual gesto de ${b} você pode fazer agora?`,
];
function promptForDate(dateObj) {
  const doy = dayOfYear(dateObj);
  const a = SEEDS_A[doy % SEEDS_A.length];
  const b = SEEDS_B[(doy * 7) % SEEDS_B.length];
  const t = TEMPLATES[(doy * 13) % TEMPLATES.length];
  return t(a, b);
}

// ---------- Átomos ----------
function StarRating({ value = 0, onChange, size = 18 }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Avaliação">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} role="radio" aria-checked={value === n} onClick={() => onChange?.(n)}
          className={`p-0.5 rounded transition hover:scale-[1.1] ${value >= n ? "text-yellow-400" : "text-zinc-300 hover:text-zinc-400"}`}>
          <Star size={size} strokeWidth={2} fill={value >= n ? "currentColor" : "transparent"} />
        </button>
      ))}
    </div>
  );
}
function SectionCard({ title, icon, right, children }) {
  return (
    <section className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5 shadow-pc">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold tracking-tight flex items-center gap-2">{icon}{title}</h3>
        {right}
      </div>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

// ---------- Mini Calendário com heatmap ----------
function MiniCalendar({ monthDate, onPickDate, heat }) {
  const first = startOfMonth(monthDate);
  const last = endOfMonth(monthDate);
  const f = new Date(first); f.setDate(first.getDate() - ((first.getDay() + 6) % 7)); // começa na segunda
  const weeks = [];
  let cur = new Date(f);
  while (cur <= last || cur.getDay() !== 1) { // fecha semana
    const row = [];
    for (let i = 0; i < 7; i++) {
      const ymd = toYMD(cur);
      const inMonth = cur.getMonth() === monthDate.getMonth();
      const score = heat[ymd]; // 0..1
      const bg = score != null ? `linear-gradient(0deg, color-mix(in oklab, var(--pc-primary) ${Math.round(score * 85)}%, transparent), color-mix(in oklab, var(--pc-primary) ${Math.round(score * 85)}%, transparent))` : "transparent";
      row.push(
        <button key={i}
          onClick={() => onPickDate(new Date(cur))}
          title={cur.toLocaleDateString("pt-BR")}
          className={`h-8 w-8 grid place-items-center rounded-md text-xs ${inMonth ? "" : "opacity-40"} hover:outline hover:outline-1 hover:outline-[var(--pc-primary)]`}
          style={{ background: bg }}
        >
          {cur.getDate()}
        </button>
      );
      cur = addDays(cur, 1);
    }
    weeks.push(<div key={cur.toISOString()} className="grid grid-cols-7 gap-1">{row}</div>);
  }
  const labels = ["S", "T", "Q", "Q", "S", "S", "D"]; // seg a dom visual
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-7 gap-1 text-[10px] text-[var(--pc-muted)]">
        {labels.map(l => <div key={l} className="text-center">{l}</div>)}
      </div>
      <div className="grid gap-1">{weeks}</div>
    </div>
  );
}

// ---------- Modal de hábitos ----------
function HabitsModal({ open, onClose, habits, setHabits }) {
  const [newHabit, setNewHabit] = useState("");
  function add() {
    const v = newHabit.trim(); if (!v) return;
    if (!habits.includes(v)) setHabits(prev => { const next = [...prev, v]; storage.set("habits.list", next); return next; });
    setNewHabit("");
  }
  function remove(h) { setHabits(prev => { const next = prev.filter(x => x !== h); storage.set("habits.list", next); return next; }); }
  return (
    <Dialog open={open} onClose={onClose} title="Gerenciar hábitos">
      <div className="grid gap-3">
        <div className="max-h-60 overflow-y-auto pr-1 space-y-2">
          {habits.map(h => (
            <div key={h} className="flex items-center justify-between rounded-lg border border-[var(--pc-border)] bg-black/5 dark:bg-white/5 px-3 py-2">
              <span className="text-sm">{h}</span>
              <button onClick={() => remove(h)} className="p-1.5 rounded-full text-red-500 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {!habits.length && <p className="text-sm text-[var(--pc-muted)]">Nenhum hábito cadastrado.</p>}
        </div>
        <div className="flex gap-2">
          <input value={newHabit} onChange={e => setNewHabit(e.target.value)} onKeyDown={e => e.key === "Enter" && add()}
            placeholder="Novo hábito…" className="rounded-md border border-[var(--pc-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--pc-primary)] w-full" />
          <button onClick={add} className="rounded-md px-3 py-2 text-sm font-medium" style={{ background: "var(--pc-primary)", color: "#fff", boxShadow: "var(--pc-shadow)" }}>
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-end">
          <button onClick={onClose} className="rounded-md border border-[var(--pc-border)] px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5">
            Concluir
          </button>
        </div>
      </div>
    </Dialog>
  );
}

// ---------- Página principal ----------
export default function EmotionalPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthCursor, setMonthCursor] = useState(() => new Date()); // para o mini calendário
  const dateISO = toYMD(currentDate);
  const isToday = useMemo(() => toYMD(new Date()) === dateISO, [dateISO]);

  // master list de hábitos
  const [habits, setHabits] = useState(() => storage.get("habits.list", ["Água", "Exercício", "Leitura", "Meditação"]));
  useEffect(() => { storage.set("habits.list", habits); }, [habits]);

  // registros diários
  const [moods, setMoods] = useDailyStorage("mood", dateISO, { morning: null, afternoon: null, night: null });
  const [sleep, setSleep] = useDailyStorage("sleep", dateISO, { hours: "", minutes: "", quality: 3 });
  const [check, setCheck] = useDailyStorage("habits", dateISO, {}); // { [habit]: boolean }
  const [journal, setJournal] = useDailyStorage("journal", dateISO, { rating: 0, prompt: promptForDate(currentDate), text: "" });

  // heatmap do mês (carrega mood/journal daquele range)
  const [heat, setHeat] = useState({});
  useEffect(() => {
    (async () => {
      const start = startOfMonth(monthCursor).toISOString();
      const end = endOfMonth(monthCursor).toISOString();
      const [mList, jList] = await Promise.all([
        listDailyRange("mood", start, end),
        listDailyRange("journal", start, end),
      ]);
      const map = {};
      mList.forEach(r => {
        const v = r.value || {};
        const arr = [v.morning, v.afternoon, v.night].filter(x => x != null);
        if (arr.length) map[r.dateKey] = (arr.reduce((a, b) => a + b, 0) / (arr.length * 4)); // normaliza em ~0..1
      });
      jList.forEach(r => {
        if (!map[r.dateKey]) {
          const rating = Number(r.value?.rating || 0);
          if (rating) map[r.dateKey] = rating / 5;
        }
      });
      setHeat(map);
    })();
  }, [monthCursor]);

  // modal hábitos
  const [openHabits, setOpenHabits] = useState(false);

  // Ícones para chips de hábito
  const habitIcons = { "Água": <Droplet className="w-4 h-4" />, "Exercício": <Bike className="w-4 h-4" />, "Leitura": <BookOpen className="w-4 h-4" />, "Meditação": <BrainCircuit className="w-4 h-4" /> };

  // UI helpers
  const moodEmojis = ["😄", "🙂", "😐", "😕", "😣"];
  const moodRow = (label, value, onChange) => (
    <div className="grid grid-cols-[90px_1fr] items-center gap-3">
      <span className="text-sm text-[var(--pc-muted)]">{label}:</span>
      <div role="radiogroup" className="flex flex-wrap gap-3">
        {moodEmojis.map((emoji, i) => {
          const active = value === i;
          return (
            <button key={i} onClick={() => onChange(i)} aria-pressed={active} title={`${i + 1}/5`}
              className={`h-11 w-11 grid place-items-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                ${active ? "border-yellow-400 bg-yellow-50" : "border-[var(--pc-border)] bg-transparent hover:bg-black/5 dark:hover:bg-white/5"}`}>
              <span className="text-[20px]">{emoji}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <motion.div key={dateISO} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid gap-6">
      {/* Header com navegação + calendário compacto */}
      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-4 shadow-pc flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Manejo Emocional</h1>
          <div className="flex items-center gap-2 p-1 rounded-lg border border-[var(--pc-border)] bg-[var(--pc-surface)]">
            <button onClick={() => setCurrentDate(d => addDays(d, -1))} className="p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5" title="Dia anterior">
              <ChevronLeft className="w-5 h-5 text-[var(--pc-muted)]" />
            </button>
            <span className="font-medium text-sm tabular-nums w-36 text-center flex items-center justify-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[var(--pc-muted)]" />
              {isToday ? "Hoje" : currentDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <button onClick={() => setCurrentDate(d => addDays(d, 1))} disabled={isToday} className="p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50" title="Próximo dia">
              <ChevronRight className="w-5 h-5 text-[var(--pc-muted)]" />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-4 shadow-pc">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">{monthCursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</div>
            <div className="flex gap-1">
              <button className="px-2 py-1 rounded-md border border-[var(--pc-border)] text-xs" onClick={() => setMonthCursor(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>◀</button>
              <button className="px-2 py-1 rounded-md border border-[var(--pc-border)] text-xs" onClick={() => setMonthCursor(new Date())}>Hoje</button>
              <button className="px-2 py-1 rounded-md border border-[var(--pc-border)] text-xs" onClick={() => setMonthCursor(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>▶</button>
            </div>
          </div>
          <MiniCalendar monthDate={monthCursor} onPickDate={setCurrentDate} heat={heat} />
        </div>
      </div>

      {/* Humor */}
      <SectionCard title="Humor do Dia" icon={<span className="w-5 h-5 grid place-items-center">🙂</span>}>
        {moodRow("Manhã", moods?.morning, v => setMoods({ ...moods, morning: v }))}
        {moodRow("Tarde", moods?.afternoon, v => setMoods({ ...moods, afternoon: v }))}
        {moodRow("Noite", moods?.night, v => setMoods({ ...moods, night: v }))}
      </SectionCard>

      {/* Sono */}
      <SectionCard title="Sono" icon={<span className="w-5 h-5 grid place-items-center">💤</span>}>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col">
            <span className="text-sm">Horas</span>
            <input type="number" min="0" max="24" value={sleep?.hours ?? ""} onChange={e => setSleep({ ...sleep, hours: e.target.value })}
              placeholder="8" className="rounded-md border border-[var(--pc-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--pc-primary)] mt-1" />
          </label>
          <label className="flex flex-col">
            <span className="text-sm">Minutos</span>
            <input type="number" min="0" max="59" value={sleep?.minutes ?? ""} onChange={e => setSleep({ ...sleep, minutes: e.target.value })}
              placeholder="30" className="rounded-md border border-[var(--pc-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--pc-primary)] mt-1" />
          </label>
          <div className="flex flex-col">
            <span className="text-sm">Qualidade</span>
            <div className="mt-2"><StarRating value={sleep?.quality || 0} onChange={v => setSleep({ ...sleep, quality: v })} size={20} /></div>
          </div>
        </div>
      </SectionCard>

      {/* Hábitos */}
      <SectionCard
        title="Hábitos do Dia"
        icon={<span className="w-5 h-5 grid place-items-center text-emerald-600">✓</span>}
        right={
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--pc-muted)] tabular-nums">
              {Object.values(check || {}).filter(Boolean).length}/{habits.length}
            </span>
            <button onClick={() => setOpenHabits(true)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5" title="Gerenciar hábitos">
              <Settings className="w-5 h-5 text-[var(--pc-muted)]" />
            </button>
          </div>
        }
      >
        <div className="flex flex-wrap gap-2">
          {habits.map(h => {
            const active = !!check?.[h];
            return (
              <button key={h} onClick={() => setCheck({ ...(check || {}), [h]: !active })}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition font-medium
                  ${active ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-[var(--pc-border)] bg-transparent hover:bg-black/5 dark:hover:bg-white/5"}`}>
                {habitIcons[h] || <Star className="w-4 h-4" />}{h}
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Diário */}
      <SectionCard
        title="Diário de Hoje"
        icon={<BookOpen className="w-5 h-5 text-purple-500" />}
        right={<StarRating value={journal?.rating || 0} onChange={v => setJournal({ ...journal, rating: v })} />}
      >
        <div className="flex items-center gap-2">
          <p className="text-sm text-[var(--pc-muted)]">{journal?.prompt || promptForDate(currentDate)}</p>
          <button onClick={() => setJournal({ ...journal, prompt: promptForDate(addDays(currentDate, 1)) })}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5" title="Trocar pergunta">
            <RefreshCw className="w-3 h-3 text-[var(--pc-muted)]" />
          </button>
        </div>
        <textarea
          className="rounded-md border border-[var(--pc-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--pc-primary)] min-h-[120px]"
          placeholder="Escreva aqui…"
          value={journal?.text || ""}
          onChange={(e) => setJournal({ ...journal, text: e.target.value })}
        />
      </SectionCard>

      <HabitsModal open={openHabits} onClose={() => setOpenHabits(false)} habits={habits} setHabits={setHabits} />
    </motion.div>
  );
}