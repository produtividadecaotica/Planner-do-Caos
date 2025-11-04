import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";

// (Se você usa providers, adicione aqui)
import Toaster from "./ui/toaster.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { CalendarProvider } from "./contexts/CalendarContext.jsx";
import { ObjectiveProvider } from "./contexts/ObjectiveContext.jsx";
import { ProjectProvider } from "./contexts/ProjectContext.jsx";

function RootProviders({ children }) {
  return (
    <ThemeProvider>
      <CalendarProvider>
        <ObjectiveProvider>
          <ProjectProvider>{children}</ProjectProvider>
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
      <Toaster />
    </BrowserRouter>
  </RootProviders>
);
