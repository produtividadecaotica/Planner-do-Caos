export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-md font-medium transition focus:outline-none";
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-3 text-base",
  };
  const variants = {
    primary:
      "bg-[var(--pc-primary)] text-white shadow-pc hover:opacity-90 active:opacity-100",
    outline:
      "border border-[var(--pc-border)] hover:bg-black/5 dark:hover:bg-white/5",
    ghost: "hover:bg-black/5 dark:hover:bg-white/5 text-[var(--pc-text)]",
  };
  return (
    <button
      {...props}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}