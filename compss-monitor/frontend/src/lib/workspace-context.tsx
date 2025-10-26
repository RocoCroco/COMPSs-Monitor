// src/lib/workspace-context.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createWorkspace, listWorkspaces } from "./workspaces";
import type { Workspace } from "./workspaces";

type WorkspaceContextType = {
  isLoading: boolean;
  workspaces: Workspace[];
  currentWorkspaceId: number | null;
  currentWorkspace: Workspace | null;
  refresh: () => Promise<void>;
  select: (id: number) => void;
  createAndSelect: (name: string) => Promise<Workspace>;
  clearSelection: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

const LS_KEY = "currentWorkspaceId";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<number | null>(() => {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? Number(raw) : null;
  });

  const currentWorkspace = useMemo(
    () => workspaces.find(w => w.id === currentWorkspaceId) ?? null,
    [workspaces, currentWorkspaceId]
  );

  const refresh = async () => {
    setIsLoading(true);
    try {
      const rows = await listWorkspaces();
      setWorkspaces(rows);
      // Si el seleccionado ya no existe, limpiamos
      if (currentWorkspaceId && !rows.some(w => w.id === currentWorkspaceId)) {
        setCurrentWorkspaceId(null);
        localStorage.removeItem(LS_KEY);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const select = (id: number) => {
    setCurrentWorkspaceId(id);
    localStorage.setItem(LS_KEY, String(id));
  };

  const createAndSelect = async (name: string) => {
    const ws = await createWorkspace(name);
    setWorkspaces(prev => [...prev, ws]);
    select(ws.id);
    return ws;
  };

  const clearSelection = () => {
    setCurrentWorkspaceId(null);
    localStorage.removeItem(LS_KEY);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: WorkspaceContextType = {
    isLoading,
    workspaces,
    currentWorkspaceId,
    currentWorkspace,
    refresh,
    select,
    createAndSelect,
    clearSelection,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
