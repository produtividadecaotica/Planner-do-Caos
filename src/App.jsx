import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import WelcomeMessage from "./components/WelcomeMessage.jsx";
import CallToAction from "./components/CallToAction.jsx";

// páginas
import DashboardPage from "./pages/DashboardPage.jsx";
import PlanningPage from "./pages/PlanningPage.jsx";
import ObjectivesPage from "./pages/ObjectivesPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import EmotionalPage from "./pages/EmotionalPage.jsx";
import StudyRoomPage from "./pages/StudyRoomPage.jsx";
import FinancePage from "./pages/FinancePage.jsx";
import LibraryPage from "./pages/LibraryPage.jsx";
import InboxPage from "./pages/InboxPage.jsx";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[var(--pc-bg)] text-[var(--pc-text)]">
      <div className="flex">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />

        <div className="flex-1 min-w-0">
          <Header onToggleSidebar={() => setSidebarOpen(v => !v)} />

          <main className="p-4 md:p-6 grid gap-6">
            <Routes>
              {/* Dashboard */}
              <Route
                path="/"
                element={
                  <>
                    <WelcomeMessage />
                    <section className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-6 shadow-pc">
                        <h2 className="text-lg font-semibold mb-2">Hoje</h2>
                        <p className="text-sm text-[var(--pc-muted)]">Tarefas e eventos de hoje aparecem aqui.</p>
                      </div>
                      <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-6 shadow-pc">
                        <h2 className="text-lg font-semibold mb-2">Contas que vencem hoje</h2>
                        <p className="text-sm text-[var(--pc-muted)]">Financeiro resumido do dia.</p>
                      </div>
                    </section>
                    <CallToAction />
                  </>
                }
              />

              {/* Demais páginas */}
              <Route path="/planning" element={<PlanningPage />} />
              <Route path="/objectives" element={<ObjectivesPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/mood" element={<EmotionalPage />} />
              <Route path="/study" element={<StudyRoomPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/tools" element={<InboxPage />} />

              {/* Fallback */}
              <Route path="*" element={<DashboardPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
