import ThemeToggle from "./ThemeToggle.jsx";
import NewTaskModal from "./NewTaskModal.jsx";

export default function Header({ onToggleSidebar }) {
  return (
    <header className="h-14 sticky top-0 z-[10] border-b border-[var(--pc-border)] bg-[var(--pc-surface)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--pc-surface)]/60 flex items-center px-4 gap-3">
      <button className="md:hidden rounded-md border px-2 py-1 text-xs" onClick={onToggleSidebar}>
        Menu
      </button>
      <div className="font-medium">Dashboard mágico • dark academia</div>
      <div className="ml-auto flex items-center gap-2">
        <NewTaskModal />
        <ThemeToggle />
      </div>
    </header>
  );
}