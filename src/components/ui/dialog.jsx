import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function Dialog({ open, onClose, title, children }) {
  if (!open) return null;

  const overlayRoot = document.getElementById("pc-overlay-root");
  const modalRoot = document.getElementById("pc-modal-root");
  const overlayRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => { dialogRef.current?.focus(); }, []);

  const overlay = (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className="fixed inset-0 bg-black/50 dark:bg-black/60"
      onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
      style={{ pointerEvents: "auto", zIndex: "var(--pc-z-overlay)" }}
    />
  );

  const dialog = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 grid place-items-center p-4"
      style={{ pointerEvents: "none", zIndex: "var(--pc-z-modal)" }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] shadow-2xl outline-none"
        style={{ pointerEvents: "auto" }}
      >
        {title && (
          <div className="px-5 py-4 border-b border-[var(--pc-border)]">
            {typeof title === "string" ? <h2 className="text-base font-semibold">{title}</h2> : title}
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
        <div className="px-5 py-3 border-t border-[var(--pc-border)] flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-[var(--pc-border)] px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {overlayRoot ? createPortal(overlay, overlayRoot) : overlay}
      {modalRoot ? createPortal(dialog, modalRoot) : dialog}
    </>
  );
}
