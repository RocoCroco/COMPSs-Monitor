// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import "./index.css";
import { WorkspaceProvider } from "./lib/workspace-context";
import '@fontsource-variable/inter'; // <-- carga la fuente variable (100–900, normal/italic)


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WorkspaceProvider>
      <RouterProvider router={router} />
    </WorkspaceProvider>
  </React.StrictMode>
);