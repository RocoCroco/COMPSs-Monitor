// src/lib/workspaces.ts
import { api } from "./api";

export type Workspace = { id: number; name: string };

export async function listWorkspaces(): Promise<Workspace[]> {
  const { data } = await api.get<Workspace[]>("/workspaces");
  return data;
}

export async function createWorkspace(name: string): Promise<Workspace> {
  const { data } = await api.post<Workspace>("/workspaces", { name });
  return data;
}

export async function deleteWorkspace(workspaceId: number): Promise<{ ok: true }> {
  const { data } = await api.delete<{ ok: true}>(`/workspaces/${workspaceId}`);
  return data;
}
