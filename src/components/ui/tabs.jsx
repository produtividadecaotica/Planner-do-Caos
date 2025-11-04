import { useState } from "react";

/**
 * Tabs refinadas (como Finanças e Biblioteca).
 */
export default function Tabs({ tabs }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div className="grid gap-3">
      <div className="flex border-b border-[var(--pc-border)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-4 py-2 text-sm font-medium transition ${active === t.id
                ? "border-b-2 border-[var(--pc-primary)] text-[var(--pc-primary)]"
                : "text-[var(--pc-muted)] hover:text-[var(--pc-text)]"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{tabs.find((t) => t.id === active)?.content}</div>
    </div>
  );
}