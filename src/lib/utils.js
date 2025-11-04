import { DateTime, Interval } from "luxon";

/** UID curto para itens locais */
export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Clamp numérico */
export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/** Debounce simples */
export function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/** Try/catch JSON */
export const safeJSON = {
  parse: (s, fb = null) => {
    try { return JSON.parse(s); } catch { return fb; }
  },
  stringify: (v, space = 0, fb = "") => {
    try { return JSON.stringify(v, null, space); } catch { return fb; }
  },
};

/** Datas utilitárias */
export function isToday(iso) {
  const d = DateTime.fromISO(iso);
  return d.hasSame(DateTime.now(), "day");
}
export function startOfWeek(iso = DateTime.now().toISO()) {
  return DateTime.fromISO(iso).startOf("week").toISODate();
}
export function endOfWeek(iso = DateTime.now().toISO()) {
  return DateTime.fromISO(iso).endOf("week").toISODate();
}
export function formatDate(iso, fmt = "dd/LL/yyyy") {
  if (!iso) return "";
  return DateTime.fromISO(iso).toFormat(fmt);
}
export function formatTime(iso, fmt = "HH:mm") {
  if (!iso) return "";
  return DateTime.fromISO(iso).toFormat(fmt);
}
export function between(isoStart, isoEnd, incl = true) {
  return Interval.fromDateTimes(DateTime.fromISO(isoStart), DateTime.fromISO(isoEnd)).length(
    "days"
  );
}

/** Moeda BRL */
export function formatBRL(n) {
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      Number(n || 0)
    );
  } catch {
    return `R$ ${Number(n || 0).toFixed(2)}`;
  }
}

/** Download JSON (exportação local) */
export function downloadJSON(filename, data) {
  const blob = new Blob([safeJSON.stringify(data, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Upload (file→texto) */
export function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsText(file, "utf-8");
  });
}

/** File → DataURL (para capas/imagens da Biblioteca/Projetos) */
export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

/** Normaliza URL (para imagens por URL) */
export function normalizeUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    return u.toString();
  } catch {
    // tenta adicionar http
    try {
      return new URL(`https://${url}`).toString();
    } catch {
      return url;
    }
  }
}

/** Categorias financeiras padrão (pode customizar depois) */
export const FINANCE_CATEGORIES = [
  "Moradia",
  "Alimentação",
  "Transporte",
  "Lazer",
  "Saúde",
  "Educação",
  "Assinaturas",
  "Impostos",
  "Investimentos",
  "Outros",
];

/** Gera um resumo rápido de contas que vencem “hoje” */
export function dueToday(items = [], todayISO = DateTime.now().toISODate()) {
  return items.filter((x) => (x.dueDate ? DateTime.fromISO(x.dueDate).toISODate() === todayISO : false));
}

/** Agrupa por uma chave */
export function groupBy(arr, key) {
  return arr.reduce((acc, cur) => {
    const k = typeof key === "function" ? key(cur) : cur[key];
    (acc[k] ||= []).push(cur);
    return acc;
  }, {});
}

/** Ordena por data ISO asc */
export function sortByDateAsc(arr, key = "date") {
  return [...arr].sort((a, b) => DateTime.fromISO(a[key]) - DateTime.fromISO(b[key]));
}

/** Deep merge simples (objetos/arrays) */
export function deepMerge(target, source) {
  if (Array.isArray(target) && Array.isArray(source)) {
    return [...target, ...source];
  } else if (isObject(target) && isObject(source)) {
    const out = { ...target };
    for (const k of Object.keys(source)) {
      out[k] = k in target ? deepMerge(target[k], source[k]) : source[k];
    }
    return out;
  }
  return source;
}
const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);

/** Safe localStorage (com prefixo) */
const LSP = "pc.";
export const storage = {
  get: (k, fb = null) => {
    try {
      const raw = localStorage.getItem(LSP + k);
      return raw ? JSON.parse(raw) : fb;
    } catch {
      return fb;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(LSP + k, JSON.stringify(v));
    } catch { }
  },
  remove: (k) => {
    try {
      localStorage.removeItem(LSP + k);
    } catch { }
  },
};