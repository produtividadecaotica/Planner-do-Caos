import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

/**
 * Projeto:
 * {
 *   id: string,
 *   title: string,
 *   coverUrl?: string,
 *   status?: "ideia" | "em-andamento" | "concluido" | "pausado",
 *   objectiveId?: string, // vínculo opcional
 *   notes?: string
 * }
 */

const ProjectContext = createContext(null);
const STORAGE_KEY = "pc.projects.v1";

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch { }
  }, [projects]);

  const inc = useRef(0);
  const nextId = () => `${Date.now()}-prj-${++inc.current}`;

  function addProject(data) {
    const prj = {
      id: nextId(),
      title: data.title || "Novo projeto",
      coverUrl: data.coverUrl || "",
      status: data.status || "ideia",
      objectiveId: data.objectiveId,
      notes: data.notes || "",
    };
    setProjects((prev) => [...prev, prj]);
    return prj.id;
  }

  function updateProject(id, patch) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function removeProject(id) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  const value = useMemo(
    () => ({
      projects,
      addProject,
      updateProject,
      removeProject,
    }),
    [projects]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjects deve ser usado dentro de <ProjectProvider>");
  return ctx;
}