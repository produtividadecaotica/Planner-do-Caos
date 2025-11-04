import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

/**
 * Objetivo:
 * {
 *   id: string,
 *   title: string,
 *   year?: number,
 *   quarter?: 1|2|3|4,
 *   description?: string,
 *   status?: "ativo" | "pausado" | "concluido",
 *   projectIds?: string[] // relação opcional com projetos
 * }
 */

const ObjectiveContext = createContext(null);
const STORAGE_KEY = "pc.objectives.v1";

export function ObjectiveProvider({ children }) {
  const [objectives, setObjectives] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(objectives));
    } catch { }
  }, [objectives]);

  const inc = useRef(0);
  const nextId = () => `${Date.now()}-obj-${++inc.current}`;

  function addObjective(data) {
    const obj = {
      id: nextId(),
      title: data.title || "Sem título",
      year: data.year,
      quarter: data.quarter,
      description: data.description || "",
      status: data.status || "ativo",
      projectIds: data.projectIds || [],
    };
    setObjectives((prev) => [...prev, obj]);
    return obj.id;
  }

  function updateObjective(id, patch) {
    setObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  function removeObjective(id) {
    setObjectives((prev) => prev.filter((o) => o.id !== id));
  }

  function linkProject(objectiveId, projectId) {
    setObjectives((prev) =>
      prev.map((o) =>
        o.id === objectiveId
          ? { ...o, projectIds: Array.from(new Set([...(o.projectIds || []), projectId])) }
          : o
      )
    );
  }

  function unlinkProject(objectiveId, projectId) {
    setObjectives((prev) =>
      prev.map((o) =>
        o.id === objectiveId
          ? { ...o, projectIds: (o.projectIds || []).filter((id) => id !== projectId) }
          : o
      )
    );
  }

  const value = useMemo(
    () => ({
      objectives,
      addObjective,
      updateObjective,
      removeObjective,
      linkProject,
      unlinkProject,
    }),
    [objectives]
  );

  return <ObjectiveContext.Provider value={value}>{children}</ObjectiveContext.Provider>;
}

export function useObjectives() {
  const ctx = useContext(ObjectiveContext);
  if (!ctx) throw new Error("useObjectives deve ser usado dentro de <ObjectiveProvider>");
  return ctx;
}