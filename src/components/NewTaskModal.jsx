import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function NewTaskModal() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const submit = (e) => {
    e.preventDefault();
    // TODO: integrar com Inbox/Calendar (contexts)
    setTitle("");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-[var(--pc-border)] px-3 py-1.5 text-xs hover:bg-black/5 dark:hover:bg-white/5"
      >
        Nova tarefa
      </button>

      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[var(--pc-z-modal)]">
            <div
              className="absolute inset-0"
              style={{ background: "var(--pc-overlay)" }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-0 grid place-items-center p-4">
              <div className="w-full max-w-md rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5 shadow-pc-strong">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-semibold tracking-tight">Nova tarefa</h3>
                  <button
                    className="text-sm text-[var(--pc-muted)] hover:underline"
                    onClick={() => setOpen(false)}
                  >
                    fechar
                  </button>
                </div>
                <form onSubmit={submit} className="grid gap-3">
                  <label className="grid gap-1 text-sm">
                    <span>Título</span>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="rounded-md border border-[var(--pc-border)] bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--pc-primary)]"
                      placeholder="Descreva em uma frase"
                      autoFocus
                    />
                  </label>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      className="rounded-md border border-[var(--pc-border)] px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                      onClick={() => setOpen(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="rounded-md px-3 py-2 text-sm font-medium"
                      style={{
                        background: "var(--pc-primary)",
                        color: "white",
                        boxShadow: "var(--pc-shadow)",
                      }}
                    >
                      Criar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.getElementById("pc-modal-root")
        )}
    </>
  );
}