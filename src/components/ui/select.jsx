/**
 * Select estilizado simples.
 */
export default function Select({ label, value, options, onChange }) {
  return (
    <label className="grid gap-1 text-sm">
      {label && <span>{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="rounded-md border border-[var(--pc-border)] bg-transparent px-3 py-2 focus:ring-2 focus:ring-[var(--pc-primary)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}