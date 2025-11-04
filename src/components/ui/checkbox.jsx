export default function Checkbox({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="appearance-none w-4 h-4 border border-[var(--pc-border)] rounded-sm checked:bg-[var(--pc-primary)] checked:border-[var(--pc-primary)]"
      />
      {label && <span>{label}</span>}
    </label>
  );
}