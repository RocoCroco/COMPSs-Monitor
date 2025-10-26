// src/lib/agents.ts
import { api } from "./api";

export type Agent = {
  id: number;
  workspace_id: number;
  label: string;
  agent_id: string;      // IP o hostname
  rest_port?: number | null;
  comm_port?: number | null;
  events_port?: number | null;
  metrics_port?: number | null;
};

const AGENTS_BASE = "/agents"; // ⇐ cambia a "/agents" si tu backend usa inglés

export async function listAgents(workspaceId: number): Promise<Agent[]> {
  const { data } = await api.get<Agent[]>(`${AGENTS_BASE}/${workspaceId}`);
  return data;
}

export type CreateAgentInput = {
  label: string;
  agent_id: string;
  rest_port?: number | null;
  comm_port?: number | null;
  events_port?: number | null;
  metrics_port?: number | null;
};

export type AgentUpdateInput = Partial<{
  label: string | null;
  agent_id: string | null;
  rest_port: number | null;
  comm_port: number | null;
  events_port: number | null;
  metrics_port: number | null;
}>;

export type AgentResourceProcessor = {
  name: string;
  units: number;
  architecture?: string;
};

export type AgentResourceDescription = {
  storage_type?: string;
  storage_bandwidth?: number; // -1 si no asignado
  storage_size?: number;      // -1 si no asignado
  memory_type?: string;
  memory_size?: number;       // -1 si no asignado
  processors?: AgentResourceProcessor[];
};

export type AgentResource = {
  name: string;                // e.g. "127.0.0.2"
  description?: AgentResourceDescription;
  adaptor: string;             // COMPSsMaster | CommAgentWorker
};

export type AgentResourcesResponse = {
  workspace_id: number;
  agent_id: number;            // id DB del agente (no confundir con agent_id/ip)
  endpoint: string;
  type: "local" | "external" | "all";
  count: number;
  total: number;
  resources: AgentResource[];
  fetchedAt: string;
};

export async function createAgent(workspaceId: number, payload: CreateAgentInput) {
  const { data } = await api.post(`${AGENTS_BASE}/${workspaceId}`, payload);
  return data as { id: number };
}

// Endpoint sugerido por ti. Devuelve true si responde 200, false en cualquier error.
export async function checkAgentOnline(ip?: string | null, port?: number | null): Promise<boolean> {
  if (!ip || !port) return false;
  try {
    const res = await api.get("/agents/status", {
      params: { ip, port },
      timeout: 1500,                 // evita cuelgues
      validateStatus: () => true,    // no lances excepción en 404/5xx
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

export async function updateAgent(
  workspaceId: number,
  agentId: number,
  payload: AgentUpdateInput
): Promise<Agent> {
  const { data } = await api.patch<Agent>(`${AGENTS_BASE}/${workspaceId}/${agentId}`, payload);
  return data;
}

export async function deleteAgent(
  workspaceId: number,
  agentId: number
): Promise<{ ok: true }> {
  const { data } = await api.delete<{ ok: true }>(`${AGENTS_BASE}/${workspaceId}/${agentId}`);
  return data;
}

export async function getAgentResources(
  workspaceId: number,
  agentId: number,
  type: "local" | "external" | "all" = "all"
): Promise<AgentResourcesResponse> {
  const { data } = await api.get<AgentResourcesResponse>(
    `${AGENTS_BASE}/${workspaceId}/${agentId}/resources`,
    { params: { type } }
  );
  return data;
}

// --- ajustar recursos locales ---
export type LocalResourceSpec = Partial<{
  workerName: string;
  cpu: number;
  gpu: number;
  fpga: number;
  memorySize: number;
  memoryType: string;
  storageSize: number;
  storageType: string;
  osType: string;
  osDistribution: string;
  osVersion: string;
}>;

export async function addLocalResources(
  workspaceId: number,
  agentId: number,
  payload: LocalResourceSpec
): Promise<{ ok: boolean; status?: number }> {
  const { data } = await api.post<{ ok: boolean; status?: number }>(
    `/agents/${workspaceId}/${agentId}/resources/local/add`,
    payload
  );
  return data;
}

export async function reduceLocalResources(
  workspaceId: number,
  agentId: number,
  payload: LocalResourceSpec
): Promise<{ ok: boolean; status?: number }> {
  const { data } = await api.post<{ ok: boolean; status?: number }>(
    `/agents/${workspaceId}/${agentId}/resources/local/reduce`,
    payload
  );
  return data;
}

export type ExternalResourceSpec = Partial<{
  workerHost: string;       // requerido para add/reduce
  commPort: number;         // requerido para add
  cpu: number;
  gpu: number;
  fpga: number;
  memorySize: number;
  memoryType: string;
  storageSize: number;
  storageType: string;
  osType: string;
  osDistribution: string;
  osVersion: string;
}>;

export async function addExternalResources(
  workspaceId: number,
  agentId: number,
  payload: ExternalResourceSpec
): Promise<{ ok: boolean; status?: number }> {
  const { data } = await api.post<{ ok: boolean; status?: number }>(
    `/agents/${workspaceId}/${agentId}/resources/external/add`,
    payload
  );
  return data;
}

export async function reduceExternalResources(
  workspaceId: number,
  agentId: number,
  payload: ExternalResourceSpec
): Promise<{ ok: boolean; status?: number }> {
  const { data } = await api.post<{ ok: boolean; status?: number }>(
    `/agents/${workspaceId}/${agentId}/resources/external/reduce`,
    payload
  );
  return data;
}

export type CallOperationPayload = {
  lang: "JAVA" | "PYTHON";
  className: string;                // p.ej. "pkg.Main" o "script.py"
  methodName?: string;              // por defecto "main" si no se manda
  cei?: string;                     // opcional
  stop?: boolean;                   // enviar acción stop
  forwardTo?: string[];             // hosts a los que reenviar (solo si stop)
  // parámetros en modo simple:
  params?: string[];                // lista de args
  parametersArray?: boolean;        // true → se envía array (main(String[]))
  // modo avanzado:
  rawParametersXml?: string;        // si se pasa, se usa tal cual
};

export async function callAgentOperation(
  workspaceId: number,
  agentId: number,
  payload: CallOperationPayload
): Promise<{ ok: boolean; status: number }> {
  const { data } = await api.post<{ ok: boolean; status: number }>(
    `/agents/${workspaceId}/${agentId}/call`,
    payload
  );
  return data;
}