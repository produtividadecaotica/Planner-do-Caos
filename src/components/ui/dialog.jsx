import { createPortal } from "react-dom";
import { useEffect } from "react";

/**
 * Dialog genérico (usa #pc-modal-root e overlay 100% opaco).
 */
export default function Dialog({ open, title, children, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[var(--pc-z-modal)]">
      <div
        className="absolute inset-0"
        style={{ background: "var(--pc-overlay)" }}
        onClick={onClose}
      />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5 shadow-pc-strong">
          {title && <h3 className="text-base font-semibold mb-3">{title}</h3>}
          {children}
        </div>
      </div>
    </div>,
    document.getElementById("pc-modal-root")
  );
}