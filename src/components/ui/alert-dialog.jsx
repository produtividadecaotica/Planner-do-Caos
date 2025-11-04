import { createPortal } from "react-dom";
import { useEffect } from "react";

/**
 * Alerta de confirmação simples: "tem certeza?"
 * Usa portal (#pc-modal-root) com overlay 100% opaco.
 */
export default function AlertDialog({ open, title, message, onConfirm, onCancel }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onCancel?.();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[var(--pc-z-modal)]">
      <div
        className="absolute inset-0"
        style={{ background: "var(--pc-overlay)" }}
        onClick={onCancel}
      />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5 shadow-pc-strong">
          <h3 className="text-base font-semibold mb-2">{title}</h3>
          <p className="text-sm text-[var(--pc-muted)] mb-4">{message}</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="rounded-md border border-[var(--pc-border)] px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="rounded-md px-3 py-2 text-sm font-medium"
              style={{
                background: "var(--pc-primary)",
                color: "white",
                boxShadow: "var(--pc-shadow)",
              }}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById("pc-modal-root")
  );
}