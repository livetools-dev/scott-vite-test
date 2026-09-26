import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LivetoolsProvider } from "@livetools/ui";
import "./globals.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LivetoolsProvider>
      <App />
    </LivetoolsProvider>
  </StrictMode>,
);
