import { Routes, Route, Navigate } from "react-router-dom";
import Shell from "./layouts/Shell.jsx";

// Páginas
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
  return (
    <Routes>
      <Route element={<Shell />}>
        {/* index = "/" */}
        <Route index element={<DashboardPage />} />

        {/* Demais rotas */}
        <Route path="/planning" element={<PlanningPage />} />
        <Route path="/objectives" element={<ObjectivesPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/mood" element={<EmotionalPage />} />
        <Route path="/study" element={<StudyRoomPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/tools" element={<InboxPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
