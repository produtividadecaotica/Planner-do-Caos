
// pages/StudyRoomPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs.jsx";
import { Dialog } from "@/components/ui/dialog.jsx";
import { useToast } from "@/components/ui/use-toast.js";
import { Play as // base
  Play, Pause, RotateCcw, Flag, Clock, Volume2, VolumeX, Music2, Bell, Settings, CheckCircle2, Calendar, Plus, Trash2, Edit2, FileText, Shuffle, ListChecks, Clock7 as // scenes/icons
  Coffee, Trees, Building2, Home, BookOpen, SlidersHorizontal as // misc
  SlidersHorizontal, Sparkles, Dice5, ChevronRight, ChevronDown, Gauge, BarChart3, Heart, Brain } from 'lucide-react';

/* =====================================================================================
   PERSISTÊNCIA & UTILS
===================================================================================== */
const store = {
  get(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { } },
  del(key) { try { localStorage.removeItem(key); } catch { } }
};
const uid = () => Math.random().toString(36).slice(2, 10);
const todayKey = () => new Date().toISOString().slice(0, 10);
const pad = (n) => String(n).padStart(2, "0");
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const secondsToMMSS = (t) => `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;

/* =====================================================================================
   AUDIO HELPERS
===================================================================================== */
function createBrownNoise(context) {
  const node = context.createScriptProcessor(4096, 1, 1);
  let lastOut = 0.0;
  node.onaudioprocess = function (e) {
    const out = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < out.length; i++) {
      const white = Math.random() * 2 - 1;
      const brown = (lastOut + 0.02 * white) / 1.02;
      lastOut = brown;
      out[i] = brown * 0.8;
    }
  };
  return node;
}
function playChime(context) {
  const now = context.currentTime;
  [880, 660, 990].forEach((f, i) => {
    const osc = context.createOscillator();
    const g = context.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    g.gain.setValueAtTime(0.0001, now + i * 0.18);
    g.gain.exponentialRampToValueAtTime(0.25, now + i * 0.18 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.16);
    osc.connect(g).connect(context.destination);
    osc.start(now + i * 0.18);
    osc.stop(now + i * 0.18 + 0.18);
  });
}

/* =====================================================================================
   CENAS (POMODORO)
===================================================================================== */
const SCENES = [
  { key: "nature", label: "Natureza", icon: Trees, url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1280&auto=format&fit=crop" },
  { key: "library", label: "Biblioteca", icon: BookOpen, url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1280&auto=format&fit=crop" },
  { key: "cafe", label: "Café", icon: Coffee, url: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?q=80&w=1280&auto=format&fit=crop" },
  { key: "city", label: "Cidade", icon: Building2, url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1280&auto=format&fit=crop" },
  { key: "room", label: "Quarto", icon: Home, url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1280&auto=format&fit=crop" },
];

/* =====================================================================================
   POMODORO (TUDO JUNTO)
===================================================================================== */
function PomodoroAllInOne() {
  const { toast } = useToast?.() || { toast: () => { } };
  const [settings, setSettings] = useState(() => store.get("study:pomo:settings", {
    workMin: 25, breakMin: 5, cycles: 4, autoContinue: false,
    scene: "library", soundMode: "brown", soundUrl: "", volume: 0.4
  }));
  useEffect(() => store.set("study:pomo:settings", settings), [settings]);

  const [phase, setPhase] = useState("idle"); // idle | work | break
  const [remaining, setRemaining] = useState(settings.workMin * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cycle, setCycle] = useState(1);
  const [sessions, setSessions] = useState(() => store.get("study:pomo:sessions", {}));
  useEffect(() => store.set("study:pomo:sessions", sessions), [sessions]);

  const audioCtxRef = useRef(null);
  const gainRef = useRef(null);
  const brownNodeRef = useRef(null);
  const urlAudioRef = useRef(null);
  const tickRef = useRef(null);
  const startTimeRef = useRef(null);

  function ensureCtx() {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtxRef.current;
  }
  function stopAmbience() {
    if (brownNodeRef.current) { try { brownNodeRef.current.disconnect(); } catch { } brownNodeRef.current = null; }
    if (gainRef.current) { try { gainRef.current.disconnect(); } catch { } gainRef.current = null; }
    if (urlAudioRef.current) { try { urlAudioRef.current.pause(); } catch { } urlAudioRef.current = null; }
  }
  function startAmbience() {
    if (settings.soundMode === "off") return;
    const ctx = ensureCtx();
    if (settings.soundMode === "brown") {
      const node = createBrownNoise(ctx);
      const gain = ctx.createGain();
      gain.gain.value = clamp(settings.volume, 0, 1);
      node.connect(gain).connect(ctx.destination);
      brownNodeRef.current = node; gainRef.current = gain;
    } else if (settings.soundMode === "url" && settings.soundUrl.trim()) {
      const el = new Audio(settings.soundUrl.trim());
      el.loop = true; el.volume = clamp(settings.volume, 0, 1);
      el.play().catch(() => { });
      urlAudioRef.current = el;
    }
  }

  useEffect(() => {
    if (phase === "work") setRemaining(settings.workMin * 60);
    if (phase === "break") setRemaining(settings.breakMin * 60);
  }, [settings.workMin, settings.breakMin]); // eslint-disable-line

  useEffect(() => {
    if (!isRunning) { clearInterval(tickRef.current); tickRef.current = null; return; }
    startAmbience();
    tickRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev > 1) return prev - 1;
        const ctx = ensureCtx(); playChime(ctx);
        logSession(phase);

        if (phase === "work") {
          if (cycle >= settings.cycles) {
            setIsRunning(false); setPhase("idle"); setCycle(1);
            clearInterval(tickRef.current); tickRef.current = null; stopAmbience();
            toast({ title: "Ciclo concluído 🎯", description: "Todos os blocos finalizados." });
            return settings.workMin * 60;
          } else {
            setPhase("break");
            if (!settings.autoContinue) { setIsRunning(false); stopAmbience(); }
            return settings.breakMin * 60;
          }
        } else {
          setCycle(c => c + 1); setPhase("work");
          if (!settings.autoContinue) { setIsRunning(false); stopAmbience(); }
          return settings.workMin * 60;
        }
      });
    }, 1000);
    return () => { clearInterval(tickRef.current); tickRef.current = null; };
  }, [isRunning, phase, cycle, settings.autoContinue, settings.workMin, settings.breakMin, settings.cycles]); // eslint-disable-line

  function logSession(_phase) {
    const key = todayKey();
    const arr = sessions[key] || [];
    const startISO = startTimeRef.current || new Date().toISOString();
    const durationSec = _phase === "work" ? settings.workMin * 60 : settings.breakMin * 60;
    const updated = { ...sessions, [key]: [{ startISO, durationSec, phase: _phase }, ...arr] };
    setSessions(updated);
    startTimeRef.current = new Date().toISOString();
  }
  function handleStart() {
    if (phase === "idle") { setPhase("work"); setRemaining(settings.workMin * 60); setCycle(1); }
    setIsRunning(true); startTimeRef.current = new Date().toISOString();
    const ctx = ensureCtx(); if (ctx.state === "suspended") ctx.resume(); startAmbience();
  }
  function handlePause() { setIsRunning(false); stopAmbience(); }
  function handleReset() { setIsRunning(false); setPhase("idle"); setRemaining(settings.workMin * 60); setCycle(1); stopAmbience(); }

  const focusedTodaySec = useMemo(() => (sessions[todayKey()] || []).filter(s => s.phase === "work").reduce((a, b) => a + (b.durationSec || 0), 0), [sessions]);
  const sceneObj = SCENES.find(s => s.key === settings.scene) || SCENES[1];

  return (
    <div className="relative">
      <div aria-hidden className="absolute inset-0 -z-10 bg-center bg-cover opacity-15" style={{ backgroundImage: `url(${sceneObj.url})` }} />
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
        {/* Timer */}
        <div className="pc-card">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--pc-border)]">
            <div className="pc-title flex items-center gap-2"><Flag className="w-5 h-5 text-purple-500" />{phase === "idle" ? "Pronto para começar" : phase === "work" ? "Foco" : "Pausa"}</div>
            <div className="text-sm text-[var(--pc-muted)]">Ciclo {cycle} de {settings.cycles}</div>
          </div>
          <div className="mt-6 grid place-items-center gap-6">
            <div className="text-6xl font-semibold tabular-nums">{secondsToMMSS(remaining)}</div>
            <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-yellow-500"
                style={{
                  width: (() => {
                    const total = phase === "work" ? settings.workMin * 60 : phase === "break" ? settings.breakMin * 60 : settings.workMin * 60;
                    const pct = 100 * (1 - remaining / total);
                    return `${clamp(pct, 0, 100)}%`;
                  })()
                }} />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {!isRunning
                ? <button className="pc-btn primary" onClick={handleStart}><Play className="w-4 h-4" /> Iniciar</button>
                : <button className="pc-btn" onClick={handlePause}><Pause className="w-4 h-4" /> Pausar</button>}
              <button className="pc-btn ghost" onClick={handleReset}><RotateCcw className="w-4 h-4" /> Resetar</button>
            </div>
          </div>
        </div>

        {/* Painel + Config + Áudio & Cena */}
        <div className="grid gap-6">
          <div className="pc-card py-2 px-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span className="text-sm">Foco hoje</span></div>
            <b className="tabular-nums">{pad(Math.floor(focusedTodaySec / 60))}m</b>
          </div>

          <div className="pc-card">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--pc-border)]">
              <div className="pc-title flex items-center gap-2"><Settings className="w-5 h-5 text-purple-500" />Timer</div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <label className="grid gap-1 text-sm"><span>Foco (min)</span>
                <input className="pc-input" type="number" min={1} value={settings.workMin}
                  onChange={e => setSettings(s => ({ ...s, workMin: clamp(parseInt(e.target.value || "0"), 1, 300) }))} /></label>
              <label className="grid gap-1 text-sm"><span>Pausa (min)</span>
                <input className="pc-input" type="number" min={1} value={settings.breakMin}
                  onChange={e => setSettings(s => ({ ...s, breakMin: clamp(parseInt(e.target.value || "0"), 1, 120) }))} /></label>
              <label className="grid gap-1 text-sm"><span>Ciclos</span>
                <input className="pc-input" type="number" min={1} value={settings.cycles}
                  onChange={e => setSettings(s => ({ ...s, cycles: clamp(parseInt(e.target.value || "0"), 1, 12) }))} /></label>
            </div>
            <div className="mt-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="pc-checkbox"
                  checked={settings.autoContinue}
                  onChange={e => setSettings(s => ({ ...s, autoContinue: e.target.checked }))} />
                Auto-continuar
              </label>
            </div>
          </div>

          <div className="pc-card">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--pc-border)]">
              <div className="pc-title flex items-center gap-2"><Music2 className="w-5 h-5 text-purple-500" />Ambiente (Som & Cena)</div>
            </div>

            <div className="grid gap-3">
              <div className="grid sm:grid-cols-3 gap-3">
                <label className="grid gap-1 text-sm"><span>Som</span>
                  <select className="pc-input" value={settings.soundMode}
                    onChange={e => setSettings(s => ({ ...s, soundMode: e.target.value }))}>
                    <option value="brown">Brown noise (interno)</option>
                    <option value="url">Áudio por URL</option>
                    <option value="off">Sem áudio</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm sm:col-span-2"><span>URL do áudio (loop)</span>
                  <input className="pc-input" placeholder="Link direto para mp3/ogg…"
                    value={settings.soundUrl}
                    onChange={e => setSettings(s => ({ ...s, soundUrl: e.target.value }))} />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4" />
                  <input type="range" min={0} max={1} step={0.01} value={settings.volume}
                    onChange={e => setSettings(s => ({ ...s, volume: parseFloat(e.target.value) }))} />
                  {settings.volume === 0 ? <VolumeX className="w-4 h-4" /> : <span className="text-sm tabular-nums">{Math.round(settings.volume * 100)}%</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button className="pc-btn ghost" onClick={() => {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const node = settings.soundMode === "brown" ? createBrownNoise(ctx) : null;
                    if (settings.soundMode === "brown") {
                      const g = ctx.createGain(); g.gain.value = clamp(settings.volume, 0, 1);
                      node.connect(g).connect(ctx.destination);
                      setTimeout(() => { try { node.disconnect(); } catch { } }, 1200);
                    } else if (settings.soundMode === "url" && settings.soundUrl.trim()) {
                      const el = new Audio(settings.soundUrl.trim()); el.volume = settings.volume; el.play(); setTimeout(() => el.pause(), 1200);
                    }
                  }}><Music2 className="w-4 h-4" />Testar</button>
                  <button className="pc-btn ghost" onClick={() => {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)(); playChime(ctx);
                  }}><Bell className="w-4 h-4" />Sino</button>
                </div>
              </div>

              <div className="grid sm:grid-cols-5 gap-2">
                {SCENES.map(s => {
                  const Icon = s.icon;
                  const active = settings.scene === s.key;
                  return (
                    <button key={s.key}
                      className={`rounded-lg border p-2 text-sm flex flex-col items-center gap-2 transition ${active ? "border-purple-400 bg-purple-50" : "border-[var(--pc-border)] hover:bg-zinc-50"}`}
                      onClick={() => setSettings(st => ({ ...st, scene: s.key }))}>
                      <Icon className="w-5 h-5 text-purple-600" />{s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pc-card">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--pc-border)]">
              <div className="pc-title flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-purple-500" />Sessões de hoje</div>
              <div className="text-sm text-[var(--pc-muted)]">{(sessions[todayKey()] || []).length} registro(s)</div>
            </div>
            {!(sessions[todayKey()] || []).length ? (
              <div className="rounded-xl border border-dashed border-[var(--pc-border)] p-6 text-center text-[var(--pc-muted)]">Nenhuma sessão registrada.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-[12px] text-[var(--pc-muted)]"><th className="py-2">Início</th><th>Duração</th><th>Fase</th></tr></thead>
                  <tbody>
                    {(sessions[todayKey()] || []).map((s, i) => (
                      <tr key={i} className="border-t border-[var(--pc-border)]">
                        <td className="py-2">{new Date(s.startISO).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</td>
                        <td>{pad(Math.floor((s.durationSec || 0) / 60))}m {pad((s.durationSec || 0) % 60)}s</td>
                        <td>{s.phase === "work" ? "Foco" : "Pausa"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================================
   FERRAMENTA #1 – BINGO (3×3)
===================================================================================== */
const DEFAULT_TAGS = [
  { id: "limpeza", name: "Limpeza", color: "#3B82F6" },
  { id: "casa", name: "Casa", color: "#8B5CF6" },
  { id: "trabalho", name: "Trabalho", color: "#F59E0B" },
  { id: "contatos", name: "Contatos", color: "#EF4444" },
  { id: "autocuidado", name: "Autocuidado", color: "#10B981" },
];

function Confetti({ show }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] grid place-items-center">
      <div className="animate-ping w-40 h-40 rounded-full bg-yellow-400/30" />
      <div className="absolute text-4xl">✨ BINGO!</div>
    </div>
  );
}
function BingoTool() {
  const { toast } = useToast?.() || { toast: () => { } };
  const [tags, setTags] = useState(() => store.get("study:bingo:tags", DEFAULT_TAGS));
  useEffect(() => store.set("study:bingo:tags", tags), [tags]);

  const emptyBoard = () => Array.from({ length: 9 }).map(() => ({ text: "", tagId: null, done: false }));
  const [board, setBoard] = useState(() => store.get("study:bingo:board", emptyBoard()));
  useEffect(() => store.set("study:bingo:board", board), [board]);

  const [pool, setPool] = useState(() => store.get("study:bingo:pool", [])); // para embaralhar
  useEffect(() => store.set("study:bingo:pool", pool), [pool]);

  const [showConfetti, setShowConfetti] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  function tagById(id) { return tags.find(t => t.id === id); }
  function setCell(i, patch) { setBoard(b => b.map((c, idx) => idx === i ? { ...c, ...patch } : c)); }
  function resetDone() { setBoard(b => b.map(c => ({ ...c, done: false }))); }
  function shuffleFromPool() {
    if (!pool.length) return toast({ title: "Adicione itens à lista para embaralhar." });
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 9);
    setBoard(b => b.map((c, i) => ({ ...c, text: shuffled[i] || "", done: false })));
  }
  function checkVictory(newBoard) {
    const b = newBoard || board;
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]          // diagonals
    ];
    const won = lines.some(line => line.filter(idx => b[idx].done).length === 3);
    if (won) {
      setShowConfetti(true);
      if (soundOn) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)(); playChime(ctx);
      }
      setTimeout(() => setShowConfetti(false), 1600);
    }
  }

  return (
    <div className="grid gap-6">
      <Confetti show={showConfetti} />
      <div className="flex flex-wrap items-center gap-2">
        <button className="pc-btn primary" onClick={shuffleFromPool}><Shuffle className="w-4 h-4" /> Embaralhar do texto</button>
        <button className="pc-btn ghost" onClick={resetDone}><RotateCcw className="w-4 h-4" /> Resetar “Feito”</button>
        <label className="ml-auto text-sm flex items-center gap-2">
          <input type="checkbox" className="pc-checkbox" checked={soundOn} onChange={e => setSoundOn(e.target.checked)} /> Som
        </label>
      </div>

      {/* Bingo 3x3 */}
      <div className="grid grid-cols-3 gap-3">
        {board.map((cell, i) => (
          <div key={i} className={`rounded-xl border p-3 bg-white shadow-sm flex flex-col gap-2 ${cell.done ? "ring-1 ring-yellow-400" : ""}`}>
            <input
              className="pc-input"
              placeholder={`Atividade #${i + 1}`}
              value={cell.text}
              onChange={e => setCell(i, { text: e.target.value })}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <select className="pc-input text-sm"
                  value={cell.tagId || ""}
                  onChange={e => setCell(i, { tagId: e.target.value || null })}>
                  <option value="">Sem categoria</option>
                  {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {cell.tagId && (
                  <span className="text-[12px] px-2 py-1 rounded-full"
                    style={{ backgroundColor: (tagById(cell.tagId)?.color || "#eee") + "20", color: tagById(cell.tagId)?.color }}>
                    {tagById(cell.tagId)?.name}
                  </span>
                )}
              </div>
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" className="pc-checkbox" checked={cell.done}
                  onChange={e => {
                    const nb = board.map((c, idx) => idx === i ? { ...c, done: e.target.checked } : c);
                    setBoard(nb); if (e.target.checked) checkVictory(nb);
                  }} />
                Feito
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Lista base para embaralhar + gestão de categorias */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="pc-card">
          <div className="pc-title flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" />Lista para Embaralhar</div>
          <PoolEditor pool={pool} setPool={setPool} />
        </div>
        <div className="pc-card">
          <div className="pc-title flex items-center gap-2"><SlidersHorizontal className="w-5 h-5 text-purple-500" />Categorias</div>
          <TagManager tags={tags} setTags={setTags} />
        </div>
      </div>
    </div>
  );
}
function PoolEditor({ pool, setPool }) {
  const [txt, setTxt] = useState("");
  function add() { const t = txt.trim(); if (!t) return; setPool([t, ...pool]); setTxt(""); }
  function rm(i) { setPool(pool.filter((_, idx) => idx !== i)); }
  return (
    <div className="mt-3 grid gap-2">
      <div className="grid sm:grid-cols-[1fr_120px] gap-2">
        <input className="pc-input" placeholder="Adicionar item…" value={txt}
          onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
        <button className="pc-btn primary" onClick={add}><Plus className="w-4 h-4" />Adicionar</button>
      </div>
      {!pool.length ? (
        <div className="rounded-xl border border-dashed border-[var(--pc-border)] p-6 text-center text-[var(--pc-muted)]">Sem itens ainda.</div>
      ) : (
        <ul className="grid gap-2">
          {pool.map((p, i) => (
            <li key={i} className="flex items-center justify-between rounded border p-2">
              <span className="text-sm">{p}</span>
              <button className="pc-btn danger ghost" onClick={() => rm(i)}><Trash2 className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
function TagManager({ tags, setTags }) {
  const [name, setName] = useState(""); const [color, setColor] = useState("#8B5CF6");
  function add() {
    const n = name.trim(); if (!n) return;
    setTags([{ id: uid(), name: n, color }, ...tags]); setName("");
  }
  function rm(id) { setTags(tags.filter(t => t.id !== id)); }
  function updateColor(id, c) { setTags(tags.map(t => t.id === id ? { ...t, color: c } : t)); }
  return (
    <div className="mt-3 grid gap-2">
      <div className="grid sm:grid-cols-[1fr_120px_120px] gap-2">
        <input className="pc-input" placeholder="Nome da categoria…" value={name} onChange={e => setName(e.target.value)} />
        <input className="pc-input" type="color" value={color} onChange={e => setColor(e.target.value)} />
        <button className="pc-btn primary" onClick={add}><Plus className="w-4 h-4" />Adicionar</button>
      </div>
      {!tags.length ? <div className="text-[var(--pc-muted)]">Sem categorias.</div> : (
        <ul className="grid gap-2">
          {tags.map(t => (
            <li key={t.id} className="flex items-center justify-between rounded border p-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="text-sm font-medium">{t.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="color" className="pc-input" value={t.color} onChange={e => updateColor(t.id, e.target.value)} />
                <button className="pc-btn danger ghost" onClick={() => rm(t.id)}><Trash2 className="w-4 h-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* =====================================================================================
   FERRAMENTA #2 – PIORES TAREFAS
===================================================================================== */
function WorstTasksTool() {
  const key = "study:worstTasks:list";
  const [rows, setRows] = useState(() => store.get(key, [])); // {id, task, why, makeLessAwful}
  useEffect(() => store.set(key, rows), [rows]);

  const [task, setTask] = useState(""); const [why, setWhy] = useState(""); const [how, setHow] = useState("");
  function add() {
    const t = task.trim(); if (!t) return;
    setRows([{ id: uid(), task: t, why: why.trim(), makeLessAwful: how.trim() }, ...rows]);
    setTask(""); setWhy(""); setHow("");
  }
  function rm(id) { setRows(rows.filter(r => r.id !== id)); }
  function update(id, patch) { setRows(rows.map(r => r.id === id ? { ...r, ...patch } : r)); }

  return (
    <div className="grid gap-3">
      <div className="pc-card">
        <div className="pc-title flex items-center gap-2"><ListChecks className="w-5 h-5 text-purple-500" />Adicionar</div>
        <div className="mt-3 grid md:grid-cols-3 gap-2">
          <input className="pc-input" placeholder="Tarefa que odeio" value={task} onChange={e => setTask(e.target.value)} />
          <input className="pc-input" placeholder="Motivos para odiá-la" value={why} onChange={e => setWhy(e.target.value)} />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input className="pc-input" placeholder="Como torná-la menos odiosa?" value={how} onChange={e => setHow(e.target.value)} />
            <button className="pc-btn primary" onClick={add}><Plus className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
      <div className="pc-card">
        {!rows.length ? <div className="rounded-xl border border-dashed border-[var(--pc-border)] p-6 text-center text-[var(--pc-muted)]">Sem itens.</div> :
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[12px] text-[var(--pc-muted)]"><th className="py-2">Tarefa</th><th>Motivos</th><th>Como melhorar</th><th></th></tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2"><input className="pc-input" value={r.task} onChange={e => update(r.id, { task: e.target.value })} /></td>
                    <td><input className="pc-input" value={r.why} onChange={e => update(r.id, { why: e.target.value })} /></td>
                    <td><input className="pc-input" value={r.makeLessAwful} onChange={e => update(r.id, { makeLessAwful: e.target.value })} /></td>
                    <td className="text-right"><button className="pc-btn danger ghost" onClick={() => rm(r.id)}><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
      </div>
    </div>
  );
}

/* =====================================================================================
   FERRAMENTA #3 – IDENTIFICANDO BLOQUEIOS
===================================================================================== */
function BlockersTool() {
  const key = "study:blockers:list";
  const [rows, setRows] = useState(() => store.get(key, [])); // {id, goal, block, solution}
  useEffect(() => store.set(key, rows), [rows]);

  const [goal, setGoal] = useState(""); const [block, setBlock] = useState(""); const [solution, setSolution] = useState("");
  function add() {
    if (!goal.trim()) return;
    setRows([{ id: uid(), goal: goal.trim(), block: block.trim(), solution: solution.trim() }, ...rows]);
    setGoal(""); setBlock(""); setSolution("");
  }
  function rm(id) { setRows(rows.filter(r => r.id !== id)); }
  function update(id, patch) { setRows(rows.map(r => r.id === id ? { ...r, ...patch } : r)); }

  return (
    <div className="grid gap-3">
      <div className="pc-card">
        <div className="pc-title flex items-center gap-2"><Brain className="w-5 h-5 text-purple-500" />Novo Bloqueio</div>
        <div className="mt-3 grid md:grid-cols-3 gap-2">
          <input className="pc-input" placeholder="Objetivo" value={goal} onChange={e => setGoal(e.target.value)} />
          <input className="pc-input" placeholder="Bloqueio (por que é difícil)" value={block} onChange={e => setBlock(e.target.value)} />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input className="pc-input" placeholder="Possível solução" value={solution} onChange={e => setSolution(e.target.value)} />
            <button className="pc-btn primary" onClick={add}><Plus className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {rows.map(r => (
          <div key={r.id} className="pc-card">
            <div className="flex items-start justify-between">
              <div className="font-semibold">{r.goal || "Objetivo"}</div>
              <button className="pc-btn danger ghost" onClick={() => rm(r.id)}><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="mt-2 grid gap-2">
              <textarea className="pc-textarea" placeholder="Bloqueio…" value={r.block} onChange={e => update(r.id, { block: e.target.value })} />
              <textarea className="pc-textarea" placeholder="Possível solução…" value={r.solution} onChange={e => update(r.id, { solution: e.target.value })} />
            </div>
          </div>
        ))}
        {!rows.length && <div className="rounded-xl border border-dashed border-[var(--pc-border)] p-6 text-center text-[var(--pc-muted)]">Sem registros ainda.</div>}
      </div>
    </div>
  );
}

/* =====================================================================================
   FERRAMENTA #4 – CARA OU COROA
===================================================================================== */
function CoinTool() {
  const listKey = "study:coin:tasks";
  const dateKey = "study:coin:lastDate";
  const [tasks, setTasks] = useState(() => store.get(listKey, [])); // {id, text, result: null|'cara'|'coroa'}
  const [lastDate, setLastDate] = useState(() => store.get(dateKey, null));
  const [newTask, setNewTask] = useState("");

  // reset diário dos RESULTADOS (mantém lista)
  useEffect(() => {
    const today = todayKey();
    if (lastDate !== today) {
      setTasks(ts => ts.map(t => ({ ...t, result: null })));
      setLastDate(today);
      store.set(dateKey, today);
    }
  }, []); // eslint-disable-line

  useEffect(() => store.set(listKey, tasks), [tasks]);

  function add() {
    const t = newTask.trim(); if (!t) return;
    setTasks([{ id: uid(), text: t, result: null }, ...tasks]); setNewTask("");
  }
  function rm(id) { setTasks(tasks.filter(t => t.id !== id)); }
  function roll(id) {
    setTasks(tasks.map(t => {
      if (t.id !== id || t.result) return t;
      const result = Math.random() < 0.5 ? "cara" : "coroa";
      // som leve
      const ctx = new (window.AudioContext || window.webkitAudioContext)(); playChime(ctx);
      return { ...t, result };
    }));
  }
  function rollAll() {
    const ids = tasks.filter(t => !t.result).map(t => t.id);
    if (!ids.length) return;
    ids.forEach((id, idx) => setTimeout(() => roll(id), 200 * idx));
  }

  const fazerHoje = tasks.filter(t => t.result === "cara");

  return (
    <div className="grid gap-6">
      <div className="pc-card">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--pc-border)]">
          <div className="pc-title flex items-center gap-2"><Dice5 className="w-5 h-5 text-purple-500" />Adicionar</div>
          <div className="flex items-center gap-2">
            <button className="pc-btn" onClick={rollAll}>Jogar para todas</button>
          </div>
        </div>
        <div className="mt-3 grid sm:grid-cols-[1fr_140px] gap-2">
          <input className="pc-input" placeholder="Tarefa…" value={newTask}
            onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
          <button className="pc-btn primary" onClick={add}><Plus className="w-4 h-4" />Adicionar</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="pc-card">
          <div className="pc-title flex items-center gap-2">Cara ou Coroa</div>
          {!tasks.length ? <Empty /> : (
            <ul className="grid gap-2">
              {tasks.map(t => (
                <li key={t.id} className="rounded border p-2 flex items-center justify-between">
                  <input className="pc-input" value={t.text} onChange={e => setTasks(tasks.map(x => x.id === t.id ? { ...x, text: e.target.value } : x))} />
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${t.result === "cara" ? "bg-emerald-50 text-emerald-700" : ""
                      } ${t.result === "coroa" ? "bg-zinc-100 text-zinc-700" : ""}`}>
                      {t.result ? (t.result === "cara" ? "Cara" : "Coroa") : "—"}
                    </span>
                    <button className="pc-btn" disabled={!!t.result} onClick={() => roll(t.id)}>Jogar</button>
                    <button className="pc-btn danger ghost" onClick={() => rm(t.id)}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="pc-card">
          <div className="pc-title flex items-center gap-2">Faça Hoje</div>
          {!fazerHoje.length ? <Empty text="Nada caiu em Cara (ainda)." /> : (
            <ul className="grid gap-2">
              {fazerHoje.map(t => (
                <li key={t.id} className="rounded border p-2 flex items-center justify-between">
                  <span className="text-sm">{t.text}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">Cara</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
function Empty({ text = "Sem itens." }) { return <div className="rounded-xl border border-dashed border-[var(--pc-border)] p-6 text-center text-[var(--pc-muted)]">{text}</div>; }

/* =====================================================================================
   FERRAMENTA #5 – FAÇA O MÍNIMO
===================================================================================== */
function MinimoTool() {
  const key = "study:minimo:sessions";
  const [sessions, setSessions] = useState(() => store.get(key, [])); // {id, title, essential, later}
  useEffect(() => store.set(key, sessions), [sessions]);

  function add() { setSessions([{ id: uid(), title: "", essential: "", later: "" }, ...sessions]); }
  function rm(id) { setSessions(sessions.filter(s => s.id !== id)); }
  function update(id, patch) { setSessions(sessions.map(s => s.id === id ? { ...s, ...patch } : s)); }

  return (
    <div className="grid gap-3">
      <div className="flex justify-end">
        <button className="pc-btn primary" onClick={add}><Plus className="w-4 h-4" />Nova análise</button>
      </div>
      {!sessions.length ? <Empty text="Nenhuma análise ainda." /> : (
        <div className="grid md:grid-cols-2 gap-3">
          {sessions.map(s => (
            <div key={s.id} className="pc-card">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--pc-border)]">
                <input className="pc-input font-semibold" placeholder="Tarefa/projeto que te sobrecarrega…" value={s.title} onChange={e => update(s.id, { title: e.target.value })} />
                <button className="pc-btn danger ghost" onClick={() => rm(s.id)}><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="grid md:grid-cols-2 gap-3 mt-3">
                <div>
                  <div className="text-sm font-medium mb-1">O que é absolutamente necessário?</div>
                  <textarea className="pc-textarea" rows={6} value={s.essential} onChange={e => update(s.id, { essential: e.target.value })} />
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">O que eu posso adicionar depois?</div>
                  <textarea className="pc-textarea" rows={6} value={s.later} onChange={e => update(s.id, { later: e.target.value })} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =====================================================================================
   FERRAMENTA #6 – MENU DE DOPAMINA (4 QUADROS + DnD)
===================================================================================== */
const DOPA_KEYS = ["entrada", "aperitivo", "acompanhamento", "sobremesa"];
function DopamineTool() {
  const [lists, setLists] = useState(() => store.get("study:dopamine:lists", {
    entrada: [], aperitivo: [], acompanhamento: [], sobremesa: []
  })); // {entrada:[{id,text}], ...}
  useEffect(() => store.set("study:dopamine:lists", lists), [lists]);

  const [filter, setFilter] = useState("");
  const columns = [
    { key: "entrada", title: "Entrada", desc: "coisas mais longas que te fazem se sentir viva!" },
    { key: "aperitivo", title: "Aperitivo", desc: "atividades de 5–10 minutos que ligam seu cérebro!" },
    { key: "acompanhamento", title: "Acompanhamento", desc: "coisas que se sobrepõem às tarefas chatas" },
    { key: "sobremesa", title: "Sobremesa", desc: "boas com moderação (podem hiperestimular)" },
  ];

  // drag & drop simples
  const dragItem = useRef(null);
  function onDragStart(col, id) { dragItem.current = { col, id }; }
  function onDrop(toCol) {
    const info = dragItem.current; if (!info) return;
    if (info.col === toCol) return;
    const item = lists[info.col].find(i => i.id === info.id);
    setLists(prev => {
      const from = prev[info.col].filter(i => i.id !== info.id);
      const to = [{ ...item }, ...prev[toCol]];
      return { ...prev, [info.col]: from, [toCol]: to };
    });
    dragItem.current = null;
  }

  function add(col, text) {
    if (!text.trim()) return;
    setLists(prev => ({ ...prev, [col]: [{ id: uid(), text: text.trim() }, ...prev[col]] }));
  }
  function rm(col, id) { setLists(prev => ({ ...prev, [col]: prev[col].filter(i => i.id !== id) })); }
  function edit(col, id, text) { setLists(prev => ({ ...prev, [col]: prev[col].map(i => i.id === id ? { ...i, text } : i) })); }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <div className="pc-title flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" />Menu de Dopamina</div>
        <input className="pc-input w-64" placeholder="Buscar…" value={filter} onChange={e => setFilter(e.target.value)} />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {columns.map(col => (
          <div key={col.key} className="pc-card" onDragOver={e => e.preventDefault()} onDrop={() => onDrop(col.key)}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{col.title}</div>
                <div className="text-[12px] text-[var(--pc-muted)]">{col.desc}</div>
              </div>
              <SuggestButton list={lists[col.key]} />
            </div>
            <AddLine onAdd={txt => add(col.key, txt)} />
            <ul className="mt-2 grid gap-2">
              {lists[col.key].filter(i => i.text.toLowerCase().includes(filter.toLowerCase())).map(i => (
                <li key={i.id} draggable
                  onDragStart={() => onDragStart(col.key, i.id)}
                  className="rounded border p-2 flex items-center justify-between">
                  <input className="pc-input" value={i.text} onChange={e => edit(col.key, i.id, e.target.value)} />
                  <button className="pc-btn danger ghost" onClick={() => rm(col.key, i.id)}><Trash2 className="w-4 h-4" /></button>
                </li>
              ))}
              {!lists[col.key].length && <div className="text-[var(--pc-muted)] text-sm">Sem itens.</div>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
function AddLine({ onAdd }) {
  const [txt, setTxt] = useState("");
  return (
    <div className="grid grid-cols-[1fr_auto] gap-2 mt-3">
      <input className="pc-input" placeholder="Adicionar…" value={txt}
        onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === "Enter" && (onAdd(txt), setTxt(""))} />
      <button className="pc-btn" onClick={() => { onAdd(txt); setTxt(""); }}><Plus className="w-4 h-4" /></button>
    </div>
  );
}
function SuggestButton({ list }) {
  return (
    <button className="pc-btn ghost" onClick={() => {
      if (!list.length) return;
      const pick = list[Math.floor(Math.random() * list.length)]?.text;
      if (pick) alert(`Sugestão: ${pick}`);
    }}>Sugerir uma agora</button>
  );
}

/* =====================================================================================
   FERRAMENTA #7 – RODA DA VIDA (Radar SVG + comparação opcional)
===================================================================================== */
const WHEEL_AREAS = [
  "Saúde & Disposição", "Desenvolvimento Intelectual", "Equilíbrio Emocional", "Realização & Propósito",
  "Recursos Financeiros", "Contribuição Social", "Família", "Desenvolvimento Amoroso",
  "Vida Social", "Criatividade/Hobbies & Diversão", "Plenitude & Felicidade", "Espiritualidade"
];
function WheelOfLifeTool() {
  const snapKey = "study:wheel:snapshots"; // { "YYYY-MM": { area: value } }
  const [snaps, setSnaps] = useState(() => store.get(snapKey, {}));
  useEffect(() => store.set(snapKey, snaps), [snaps]);

  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [compareOn, setCompareOn] = useState(false);
  const [compareMonths, setCompareMonths] = useState(() => []); // até 3

  const values = snaps[month] || {};
  function setVal(area, v) {
    const val = clamp(parseInt(v || "0"), 0, 10);
    setSnaps(prev => ({ ...prev, [month]: { ...(prev[month] || {}), [area]: val } }));
  }

  return (
    <div className="grid gap-4">
      <div className="pc-card">
        <div className="flex items-center justify-between">
          <div className="pc-title flex items-center gap-2"><Gauge className="w-5 h-5 text-purple-500" />Roda da Vida</div>
          <div className="flex items-center gap-2">
            <input className="pc-input" type="month" value={month} onChange={e => setMonth(e.target.value)} />
            <label className="text-sm flex items-center gap-2 ml-2">
              <input type="checkbox" className="pc-checkbox" checked={compareOn} onChange={e => setCompareOn(e.target.checked)} />
              Comparar meses
            </label>
          </div>
        </div>
        <div className="mt-4 grid lg:grid-cols-2 gap-4">
          {/* Radar */}
          <div className="rounded-xl border p-3 grid place-items-center">
            <RadarChart areas={WHEEL_AREAS} current={values} overlays={compareOn ? compareMonths.map(m => ({ label: m, values: snaps[m] || {} })) : []} />
          </div>
          {/* Editors */}
          <div className="grid gap-2 max-h-[460px] overflow-auto pr-2">
            {WHEEL_AREAS.map(a => (
              <div key={a} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                <div className="text-sm">{a}</div>
                <input type="range" min={0} max={10} value={values[a] || 0} onChange={e => setVal(a, e.target.value)} />
                <input className="pc-input w-16 text-center" type="number" min={0} max={10} value={values[a] || 0} onChange={e => setVal(a, e.target.value)} />
              </div>
            ))}
            {compareOn && (
              <div className="mt-2">
                <div className="text-sm font-medium mb-1">Meses para comparar (até 3)</div>
                <ComparePicker snaps={snaps} selected={compareMonths} setSelected={setCompareMonths} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function RadarChart({ areas, current, overlays = [] }) {
  const size = 360, center = size / 2, radius = 150;
  const angle = (i) => (Math.PI * 2 * i / areas.length) - Math.PI / 2;
  const point = (i, value) => {
    const r = (value / 10) * radius;
    return [center + r * Math.cos(angle(i)), center + r * Math.sin(angle(i))];
  };
  function pathFor(values, close = true) {
    const pts = areas.map((a, i) => point(i, values[a] || 0));
    return (close ? "M" : "") + pts.map(([x, y], idx) => `${idx === 0 ? "" : "L"}${x},${y}`).join(" ") + (close ? " Z" : "");
  }
  const gridRings = [2, 4, 6, 8, 10];

  return (
    <svg width={size} height={size} className="text-[var(--pc-muted)]">
      {/* grid rings */}
      {gridRings.map((v, i) => (
        <circle key={i} cx={center} cy={center} r={radius * (v / 10)} fill="none" stroke="currentColor" strokeOpacity="0.15" />
      ))}
      {/* axes */}
      {areas.map((a, i) => {
        const [x, y] = point(i, 10);
        return <line key={a} x1={center} y1={center} x2={x} y2={y} stroke="currentColor" strokeOpacity="0.15" />;
      })}
      {/* overlays */}
      {overlays.map((ov, i) => (
        <path key={ov.label + i} d={pathFor(ov.values)} fill="none" stroke="#a78bfa" strokeOpacity="0.5" strokeWidth="2" />
      ))}
      {/* current */}
      <path d={pathFor(current)} fill="#f59e0b22" stroke="#f59e0b" strokeWidth="2" />
    </svg>
  );
}
function ComparePicker({ snaps, selected, setSelected }) {
  const months = Object.keys(snaps).sort().reverse().filter(m => m !== new Date().toISOString().slice(0, 7));
  function toggle(m) {
    if (selected.includes(m)) setSelected(selected.filter(x => x !== m));
    else if (selected.length < 3) setSelected([...selected, m]);
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {months.length === 0 ? <div className="text-sm text-[var(--pc-muted)]">Sem meses anteriores.</div> :
        months.map(m => (
          <button key={m} onClick={() => toggle(m)}
            className={`text-sm rounded border px-2 py-1 ${selected.includes(m) ? "border-purple-400 bg-purple-50" : "hover:bg-zinc-50"}`}>{m}</button>
        ))}
    </div>
  );
}

/* =====================================================================================
   FERRAMENTA #8 – REGISTRO DE PROCRASTINAÇÃO
===================================================================================== */
function ProcrastinationTool() {
  const key = "study:procrastination:entries";
  const [entries, setEntries] = useState(() => store.get(key, [])); // {id, task, feeling, thought, selfTalk, result, dateISO}
  useEffect(() => store.set(key, entries), [entries]);

  const [filter, setFilter] = useState("");

  function add() {
    setEntries([{ id: uid(), task: "", feeling: "", thought: "", selfTalk: "", result: "", dateISO: new Date().toISOString() }, ...entries]);
  }
  function rm(id) { setEntries(entries.filter(e => e.id !== id)); }
  function update(id, patch) { setEntries(entries.map(e => e.id === id ? { ...e, ...patch } : e)); }

  const display = entries.filter(e => {
    const s = `${e.task} ${e.feeling} ${e.thought} ${e.result}`.toLowerCase();
    return s.includes(filter.toLowerCase());
  });

  // resumo
  const emotionCount = useMemo(() => {
    const map = {}; entries.forEach(e => { if (e.feeling) map[e.feeling] = (map[e.feeling] || 0) + 1; }); return map;
  }, [entries]);
  const topEmotion = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <button className="pc-btn primary" onClick={add}><Plus className="w-4 h-4" />Novo registro</button>
        <input className="pc-input w-64" placeholder="Filtrar por emoção/palavra…" value={filter} onChange={e => setFilter(e.target.value)} />
      </div>
      <div className="pc-card py-2 px-3 flex items-center justify-between">
        <div className="text-sm">Emoção mais recorrente: <b>{topEmotion}</b></div>
        <div className="text-sm">Total registros: <b>{entries.length}</b></div>
      </div>
      {!display.length ? <Empty text="Sem registros." /> : (
        <div className="grid md:grid-cols-2 gap-3">
          {display.map(e => (
            <div key={e.id} className="pc-card">
              <div className="flex items-center justify-between">
                <input className="pc-input font-semibold" placeholder="Atividade que procrastinei…" value={e.task} onChange={ev => update(e.id, { task: ev.target.value })} />
                <button className="pc-btn danger ghost" onClick={() => rm(e.id)}><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="text-[12px] text-[var(--pc-muted)] mt-1">Data: {new Date(e.dateISO).toLocaleString("pt-BR")}</div>
              <div className="grid gap-2 mt-2">
                <input className="pc-input" placeholder="Emoção (ex.: medo, cansaço)" value={e.feeling} onChange={ev => update(e.id, { feeling: ev.target.value })} />
                <textarea className="pc-textarea" placeholder="O que estava pensando quando procrastinei?" value={e.thought} onChange={ev => update(e.id, { thought: ev.target.value })} />
                <textarea className="pc-textarea" placeholder="O que eu me disse para continuar procrastinando?" value={e.selfTalk} onChange={ev => update(e.id, { selfTalk: ev.target.value })} />
                <input className="pc-input" placeholder="Qual foi o resultado?" value={e.result} onChange={ev => update(e.id, { result: ev.target.value })} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =====================================================================================
   FERRAMENTA #9 – DIÁRIO DE PREOCUPAÇÕES
===================================================================================== */
function WorryDiaryTool() {
  const key = "study:worry:entries";
  const [entries, setEntries] = useState(() => store.get(key, [])); // {id,title,dateISO,trigger,level,duration,type,notes,image}
  useEffect(() => store.set(key, entries), [entries]);

  function add() {
    setEntries([{ id: uid(), title: "", dateISO: new Date().toISOString(), trigger: "", level: 5, duration: "", type: "Improdutiva", notes: "", image: "" }, ...entries]);
  }
  function rm(id) { setEntries(entries.filter(e => e.id !== id)); }
  function update(id, patch) { setEntries(entries.map(e => e.id === id ? { ...e, ...patch } : e)); }

  // estatísticas
  const stats = useMemo(() => {
    if (!entries.length) return { avgLevel: 0, topType: "—" };
    const avgLevel = Math.round(entries.reduce((a, b) => a + (b.level || 0), 0) / entries.length * 10) / 10;
    const types = {}; entries.forEach(e => { types[e.type] = (types[e.type] || 0) + 1; });
    const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    return { avgLevel, topType };
  }, [entries]);

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <button className="pc-btn primary" onClick={add}><Plus className="w-4 h-4" />Novo registro</button>
        <div className="text-sm text-[var(--pc-muted)]">Média de desconforto: <b>{stats.avgLevel}</b> • Tipo mais recorrente: <b>{stats.topType}</b></div>
      </div>
      {!entries.length ? <Empty text="Sem registros." /> : (
        <div className="grid md:grid-cols-2 gap-3">
          {entries.map(e => (
            <div key={e.id} className="pc-card">
              {e.image && <div className="w-full h-32 rounded-lg overflow-hidden bg-zinc-100 mb-2">
                <img alt="" src={e.image} className="w-full h-full object-cover" />
              </div>}
              <div className="flex items-center justify-between">
                <input className="pc-input font-semibold" placeholder="Título da preocupação…" value={e.title} onChange={ev => update(e.id, { title: ev.target.value })} />
                <button className="pc-btn danger ghost" onClick={() => rm(e.id)}><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="grid gap-2 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <input type="datetime-local" className="pc-input" value={e.dateISO.slice(0, 16)} onChange={ev => update(e.id, { dateISO: new Date(ev.target.value).toISOString() })} />
                  <input className="pc-input" placeholder="URL da imagem (opcional)" value={e.image} onChange={ev => update(e.id, { image: ev.target.value })} />
                </div>
                <input className="pc-input" placeholder="Fator desencadeante" value={e.trigger} onChange={ev => update(e.id, { trigger: ev.target.value })} />
                <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                    <span className="text-sm">Nível</span>
                    <input type="range" min={0} max={10} value={e.level || 0} onChange={ev => update(e.id, { level: parseInt(ev.target.value) })} />
                    <span className="text-sm w-6 text-right">{e.level || 0}</span>
                  </div>
                  <input className="pc-input" placeholder="Duração (ex.: 2 horas)" value={e.duration} onChange={ev => update(e.id, { duration: ev.target.value })} />
                </div>
                <select className="pc-input" value={e.type} onChange={ev => update(e.id, { type: ev.target.value })}>
                  <option>Improdutiva</option>
                  <option>Produtiva</option>
                </select>
                <textarea className="pc-textarea" placeholder="Notas (opcional)" value={e.notes} onChange={ev => update(e.id, { notes: ev.target.value })} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =====================================================================================
   ABA MASTER – ESTUDO (TABS)
===================================================================================== */
export default function StudyRoomPage() {
  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sala de Estudos</h1>
        <div className="text-sm text-[var(--pc-muted)] flex items-center gap-2">
          <Calendar className="w-4 h-4" />{new Date().toLocaleDateString("pt-BR")}
        </div>
      </header>

      <Tabs defaultValue="pomodoro" className="w-full">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
          <TabsTrigger value="bingo">Bingo</TabsTrigger>
          <TabsTrigger value="worst">Piores Tarefas</TabsTrigger>
          <TabsTrigger value="blockers">Bloqueios</TabsTrigger>
          <TabsTrigger value="coin">Cara ou Coroa</TabsTrigger>
          <TabsTrigger value="minimo">Faça o Mínimo</TabsTrigger>
          <TabsTrigger value="dopamine">Menu de Dopamina</TabsTrigger>
          <TabsTrigger value="wheel">Roda da Vida</TabsTrigger>
          <TabsTrigger value="procrastination">Registro de Procrastinação</TabsTrigger>
          <TabsTrigger value="worry">Diário de Preocupações</TabsTrigger>
        </TabsList>

        <TabsContent value="pomodoro"><PomodoroAllInOne /></TabsContent>
        <TabsContent value="bingo"><BingoTool /></TabsContent>
        <TabsContent value="worst"><WorstTasksTool /></TabsContent>
        <TabsContent value="blockers"><BlockersTool /></TabsContent>
        <TabsContent value="coin"><CoinTool /></TabsContent>
        <TabsContent value="minimo"><MinimoTool /></TabsContent>
        <TabsContent value="dopamine"><DopamineTool /></TabsContent>
        <TabsContent value="wheel"><WheelOfLifeTool /></TabsContent>
        <TabsContent value="procrastination"><ProcrastinationTool /></TabsContent>
        <TabsContent value="worry"><WorryDiaryTool /></TabsContent>
      </Tabs>
    </div>
  );
}
