import React, { createContext, useContext, useMemo, useState } from "react";

const TabsCtx = createContext(null);

export default function Tabs({ defaultValue, value: controlled, onValueChange, children, className = "" }) {
  const isControlled = controlled !== undefined;
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = isControlled ? controlled : uncontrolled;

  const api = useMemo(
    () => ({
      value,
      setValue: (v) => {
        if (!isControlled) setUncontrolled(v);
        onValueChange?.(v);
      },
    }),
    [value, isControlled, onValueChange]
  );

  return (
    <TabsCtx.Provider value={api}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabsList({ children, className = "" }) {
  return (
    <div role="tablist" className={`inline-flex items-center gap-1 rounded-lg border border-[var(--pc-border)] bg-[var(--pc-surface)] p-1 ${className}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className = "" }) {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error("TabsTrigger deve estar dentro de <Tabs>.");
  const active = ctx.value === value;

  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={`px-3 py-1.5 text-sm rounded-md transition ${
        active ? "bg-black/5 dark:bg-white/5 font-medium" : "hover:bg-black/5 dark:hover:bg-white/5"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = "" }) {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error("TabsContent deve estar dentro de <Tabs>.");
  if (ctx.value !== value) return null;
  return <div className={className}>{children}</div>;
}
