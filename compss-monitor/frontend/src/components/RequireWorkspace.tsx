// src/components/RequireWorkspace.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useWorkspace } from "../lib/workspace-context";

export default function RequireWorkspace() {
  const { isLoading, currentWorkspace } = useWorkspace();

  if (isLoading) return <div className="p-4 text-sm text-neutral-500">Loading…</div>;

  if (!currentWorkspace) {
    // No seleccionado: te mandamos a la pantalla de selección
    return <Navigate to="/workspaces/select" replace />;
  }

  return <Outlet />;
}
