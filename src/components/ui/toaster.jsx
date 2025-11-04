import { createPortal } from "react-dom";
import { useToastStore } from "./use-toast.js";
import Toast from "./toast.jsx";

/**
 * Toaster global (monta via portal).
 */
export default function Toaster() {
  const { toasts } = useToastStore();

  if (!toasts.length) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[var(--pc-z-toast)]">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} />
      ))}
    </div>,
    document.getElementById("pc-toast-root")
  );
}