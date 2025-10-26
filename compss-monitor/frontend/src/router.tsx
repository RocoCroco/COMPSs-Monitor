// src/router.tsx
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Agents from "./pages/Agents";
import MonitorAgents from "./pages/MonitorAgents";
import Help from "./pages/Help";
import SelectWorkspace from "./pages/SelectWorkspace";
import RequireWorkspace from "./components/RequireWorkspace";
import AgentDetails from "./pages/AgentDetails";
import MonitorLocal from "./pages/MonitorLocal";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Públicas (no requieren workspace)
      { index: true, element: <MonitorLocal /> }, // landing por defecto
      { path: "monitor/local", element: <MonitorLocal /> },
      { path: "help", element: <Help /> },
      { path: "workspaces/select", element: <SelectWorkspace /> },

      // Rutas que requieren workspace seleccionado
      {
        element: <RequireWorkspace />,
        children: [
          
          { path: "agents", element: <Agents /> },
          { path: "agents/:agentId", element: <AgentDetails /> }, // detalle de un agente
          { path: "monitor/agents", element: <MonitorAgents /> },
        ],
      },
    ],
  },
]);

export default router;