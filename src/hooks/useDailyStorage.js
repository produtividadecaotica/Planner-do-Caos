import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Storage diário local-first
 * - IndexedDB via Dexie (se disponível)
 * - Fallback: localStorage
 *
 * Estrutura no IndexedDB:
 * db: "pc"
 * table: "daily" com índice composto [namespace+dateKey]
 *
 * Cada registro:
 * {
 *   namespace: string,
 *   dateKey: "YYYY-MM-DD",
 *   value: any,
 *   updatedAt: number (epoch ms)
 * }
 */

// ===== Dexie (opcional) =====
let dexie = null;
try {
  // lazy require para não quebrar SSR ou ambiente sem Dexie
  const { Dexie } = require("dexie");
  dexie = new Dexie("pc");
  dexie.version(1).stores({
    daily: "++id, &[namespace+dateKey], namespace, dateKey, updatedAt",
  });
} catch {
  // fallback sem Dexie
  dexie = null;
}

// ===== Helpers de data =====
export function toDateKey(dateISOOrDate = new Date()) {
  const d = typeof dateISOOrDate === "string" ? new Date(dateISOOrDate) : dateISOOrDate;
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ===== Fallback localStorage =====
const LS_KEY = (ns, dateKey) => `pc.daily.${ns}.${dateKey}`;

async function lsGet(ns, dateKey) {
  try {
    const raw = localStorage.getItem(LS_KEY(ns, dateKey));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
async function lsSet(ns, dateKey, value) {
  try {
    localStorage.setItem(
      LS_KEY(ns, dateKey),
      JSON.stringify({ value, updatedAt: Date.now() })
    );
  } catch { }
}
async function lsRemove(ns, dateKey) {
  try {
    localStorage.removeItem(LS_KEY(ns, dateKey));
  } catch { }
}
async function lsRange(ns, startKey, endKey) {
  // localStorage não indexa; varremos chaves (limitado, mas serve de fallback)
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(`pc.daily.${ns}.`)) continue;
      const dk = k.split(".").pop();
      if (dk >= startKey && dk <= endKey) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const obj = JSON.parse(raw);
          out.push({ namespace: ns, dateKey: dk, value: obj.value, updatedAt: obj.updatedAt || 0 });
        }
      }
    }
  } catch { }
  out.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  return out;
}

// ===== IndexedDB (Dexie) impl =====
async function dbGet(ns, dateKey) {
  const rec = await dexie.daily.get({ namespace: ns, dateKey });
  return rec ? { value: rec.value, updatedAt: rec.updatedAt } : null;
}
async function dbSet(ns, dateKey, value) {
  const updatedAt = Date.now();
  const existing = await dexie.daily.get({ namespace: ns, dateKey });
  if (existing) {
    await dexie.daily.update(existing.id, { value, updatedAt });
  } else {
    await dexie.daily.add({ namespace: ns, dateKey, value, updatedAt });
  }
}
async function dbRemove(ns, dateKey) {
  const rec = await dexie.daily.get({ namespace: ns, dateKey });
  if (rec) await dexie.daily.delete(rec.id);
}
async function dbRange(ns, startKey, endKey) {
  const list = await dexie.daily
    .where("namespace")
    .equals(ns)
    .and((x) => x.dateKey >= startKey && x.dateKey <= endKey)
    .sortBy("dateKey");
  return list;
}

// ===== API pública async =====
export async function getDaily(namespace, dateKey) {
  if (dexie) return dbGet(namespace, dateKey);
  return lsGet(namespace, dateKey);
}

export async function setDaily(namespace, dateKey, value) {
  if (dexie) return dbSet(namespace, dateKey, value);
  return lsSet(namespace, dateKey, value);
}

export async function removeDaily(namespace, dateKey) {
  if (dexie) return dbRemove(namespace, dateKey);
  return lsRemove(namespace, dateKey);
}

export async function listDailyRange(namespace, startISO, endISO) {
  const startKey = toDateKey(startISO);
  const endKey = toDateKey(endISO);
  if (dexie) return dbRange(namespace, startKey, endKey);
  return lsRange(namespace, startKey, endKey);
}

// ===== Hook reativo =====
/**
 * useDailyStorage(namespace, dateISO, initialValue)
 * - Lê e escreve um valor para aquele dia + namespace.
 * - Retorna [value, setValue, meta]
 *   meta = { loading, dateKey, save, remove, updatedAt }
 */
export function useDailyStorage(namespace, dateISO, initialValue) {
  const dateKey = useMemo(() => toDateKey(dateISO || new Date()), [dateISO]);
  const mounted = useRef(true);
  const [state, setState] = useState(() => ({
    loading: true,
    value: initialValue,
    updatedAt: undefined,
  }));

  useEffect(() => {
    mounted.current = true;
    (async () => {
      const rec = await getDaily(namespace, dateKey);
      if (!mounted.current) return;
      if (rec) {
        setState({ loading: false, value: rec.value, updatedAt: rec.updatedAt });
      } else {
        // inicializa com initialValue sem salvar automaticamente
        setState({ loading: false, value: initialValue, updatedAt: undefined });
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, [namespace, dateKey]);

  const save = async (nextValue) => {
    setState((s) => ({ ...s, value: nextValue }));
    await setDaily(namespace, dateKey, nextValue);
    if (!mounted.current) return;
    setState((s) => ({ ...s, updatedAt: Date.now() }));
  };

  const remove = async () => {
    await removeDaily(namespace, dateKey);
    if (!mounted.current) return;
    setState({ loading: false, value: initialValue, updatedAt: undefined });
  };

  return [
    state.value,
    save,
    { loading: state.loading, dateKey, remove, updatedAt: state.updatedAt },
  ];
}