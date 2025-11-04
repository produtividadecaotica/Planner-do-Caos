import { create } from "zustand";

let id = 0;

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { id: ++id, title: toast.title, message: toast.message, type: toast.type || "info" },
      ],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Helper para uso rápido
export function useToast() {
  const { addToast, removeToast } = useToastStore();
  return {
    toast: (title, message, type = "info") => {
      const t = { title, message, type };
      addToast(t);
      setTimeout(() => removeToast(t.id), 5000);
    },
  };
}