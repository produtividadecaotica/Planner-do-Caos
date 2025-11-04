/**
 * Toast unitário.
 */
export default function Toast({ title, message, type = "info" }) {
  const colors = {
    info: "border-[var(--pc-primary)]",
    success: "border-green-500",
    error: "border-red-500",
  };

  return (
    <div
      className={`rounded-md border-l-4 p-3 shadow-pc bg-[var(--pc-surface)] mb-2 ${colors[type]}`}
    >
      <div className="font-semibold text-sm">{title}</div>
      {message && <div className="text-xs text-[var(--pc-muted)]">{message}</div>}
    </div>
  );
}