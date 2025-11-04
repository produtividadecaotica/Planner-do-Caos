import { useState, useRef, useEffect } from "react";

/**
 * Dropdown simples com clique fora.
 */
export default function DropdownMenu({ label, items = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block text-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-[var(--pc-border)] px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5"
      >
        {label}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-md border border-[var(--pc-border)] bg-[var(--pc-surface)] shadow-pc">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                item.onClick?.();
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}