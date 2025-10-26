// src/lib/monitor.ts
import { api } from "./api";

export type ReconcileOut = {
  uid: string;
  url: string;     // e.g. "/d/xxxx/monitor-ws-foo"
  iframe: string;  // e.g. "http://localhost:3000/d/xxxx/monitor-ws-foo?kiosk"
};

export type ReconcileOpts = {
  from?: string | number;   // ej: "now-3h" o epoch ms
  to?: string | number;     // ej: "now" o epoch ms
  refresh?: string;         // ej: "5s" | "30s" | "1m" | "off"
};

// Nota: este path asume que montas el router en /api/monitor
// (tu axios ya tiene baseURL "http://localhost:4000/api")
export async function reconcileMonitor(workspaceId: number, opts: ReconcileOpts = {}): Promise<ReconcileOut> {
  const { data } = await api.post<ReconcileOut>(`/monitor/reconcile/${workspaceId}`, opts);
  return data;
}

// Local monitor (no workspace)
export async function reconcileMonitorLocal(opts: ReconcileOpts = {}): Promise<ReconcileOut> {
  const { data } = await api.post<ReconcileOut>(`/monitor/local/reconcile`, opts);
  return data;
}