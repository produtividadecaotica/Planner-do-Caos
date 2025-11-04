import { Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";

// Páginas
import DashboardPage from "./pages/DashboardPage.jsx";
import PlanningPage from "./pages/PlanningPage.jsx";
import ObjectivesPage from "./pages/ObjectivesPage.jsx";
import ObjectiveDetailPage from "./pages/ObjectiveDetailPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import EmotionalPage from "./pages/EmotionalPage.jsx";
import StudyRoomPage from "./pages/StudyRoomPage.jsx";
import FinancePage from "./pages/FinancePage.jsx";
import LibraryPage from "./pages/LibraryPage.jsx";
import InboxPage from "./pages/InboxPage.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--pc-bg)] text-[var(--pc-text)]">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Header />
          <main className="p-4 md:p-6 grid gap-6">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/planning" element={<PlanningPage />} />
              <Route path="/objectives" element={<ObjectivesPage />} />
              <Route path="/objectives/:id" element={<ObjectiveDetailPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/mood" element={<EmotionalPage />} />
              <Route path="/study" element={<StudyRoomPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/tools" element={<InboxPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
