import { Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";

// Páginas existentes (conforme sua pasta src/pages)
import DashboardPage from "./pages/DashboardPage.jsx";
import EmotionalPage from "./pages/EmotionalPage.jsx";
import FinancePage from "./pages/FinancePage.jsx";
import InboxPage from "./pages/InboxPage.jsx";
import LibraryPage from "./pages/LibraryPage.jsx";
import ObjectiveDetailPage from "./pages/ObjectiveDetailPage.jsx";
import ObjectivesPage from "./pages/ObjectivesPage.jsx";
import PlanningPage from "./pages/PlanningPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import StudyRoomPage from "./pages/StudyRoomPage.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--pc-bg)] text-[var(--pc-text)]">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Header />
          <main className="p-4 md:p-6 grid gap-6">
            <Routes>
              {/* Dashboard */}
              <Route path="/" element={<DashboardPage />} />

              {/* Rotas que já existem no seu repo */}
              <Route path="/mood" element={<EmotionalPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/tools" element={<InboxPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/objectives" element={<ObjectivesPage />} />
              <Route path="/objectives/:id" element={<ObjectiveDetailPage />} />
              <Route path="/planning" element={<PlanningPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/study" element={<StudyRoomPage />} />

              {/* Fallback: manda pro dashboard se a rota não existir */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
