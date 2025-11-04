import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Toaster from "./ui/toaster.jsx";

import "./index.css";
import App from "./App.jsx";

// Providers
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { CalendarProvider } from "./contexts/CalendarContext.jsx";
import { ObjectiveProvider } from "./contexts/ObjectiveContext.jsx";
import { ProjectProvider } from "./contexts/ProjectContext.jsx";

function RootProviders({ children }) {
  return (
    <ThemeProvider>
      <CalendarProvider>
        <ObjectiveProvider>
          <ProjectProvider>
            {children}
            <Toaster />
          </ProjectProvider>
        </ObjectiveProvider>
      </CalendarProvider>
    </ThemeProvider>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(
  <RootProviders>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </RootProviders>
);
