// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";

// garante que o splash suma quando o app montar
try { window.__pc_ready__ && window.__pc_ready__(); } catch {}

const root = document.getElementById("root");
createRoot(root).render(
  <HashRouter>
    <App />
  </HashRouter>
);
