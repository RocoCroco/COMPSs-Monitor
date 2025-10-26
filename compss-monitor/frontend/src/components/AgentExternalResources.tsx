// src/components/AgentExternalResources.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAgentResources,
  listAgents,
  type AgentResource,
  type Agent,
  addExternalResources,
  reduceExternalResources,
  type ExternalResourceSpec,
} from "../lib/agents";
import { useWorkspace } from "../lib/workspace-context";
import { RotateCcw, Link2, Wrench } from "lucide-react";

export default function AgentExternalResources({ agent }: { agent?: Agent | null }) {
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [resources, setResources] = useState<AgentResource[]>([]);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [knownAgents, setKnownAgents] = useState<Agent[]>([]);

  // panel de ajuste (con animación)
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [submitting, setSubmitting] = useState<"add" | "reduce" | null>(null);
  const [opMsg, setOpMsg] = useState<string | null>(null);
  const panelOuterRef = useRef<HTMLDivElement | null>(null);
  const panelInnerRef = useRef<HTMLDivElement | null>(null);
  const [panelHeight, setPanelHeight] = useState(0);

  // form: puedes elegir un agente registrado o meterlo manualmente
  const [selectedAgentId, setSelectedAgentId] = useState<number | "">("");
  const [workerHost, setWorkerHost] = useState<string>(""); // IP/host del recurso externo
  const [commPort, setCommPort] = useState<number | "">(""); // puerto de comms del recurso externo

  // recursos (opcional)
  const [cpu, setCpu] = useState<number | "">("");
  const [gpu, setGpu] = useState<number | "">("");
  const [fpga, setFpga] = useState<number | "">("");
  const [memorySize, setMemorySize] = useState<number | "">("");
  const [memoryType, setMemoryType] = useState<string>("");
  const [storageSize, setStorageSize] = useState<number | "">("");
  const [storageType, setStorageType] = useState<string>("");
  const [osType, setOsType] = useState<string>("");
  const [osDistribution, setOsDistribution] = useState<string>("");
  const [osVersion, setOsVersion] = useState<string>("");

  const resetForm = () => {
    setSelectedAgentId("");
    setWorkerHost("");
    setCommPort("");
    setCpu(""); setGpu(""); setFpga("");
    setMemorySize(""); setMemoryType("");
    setStorageSize(""); setStorageType("");
    setOsType(""); setOsDistribution(""); setOsVersion("");
    setOpMsg(null);
  };

  const compactPayload = (): ExternalResourceSpec => {
    const n = (v: number | "") => (v === "" ? undefined : v);
    const s = (v: string) => (v.trim() ? v.trim() : undefined);
    return {
      workerHost: s(workerHost),
      commPort: n(commPort),
      cpu: n(cpu),
      gpu: n(gpu),
      fpga: n(fpga),
      memorySize: n(memorySize),
      memoryType: s(memoryType),
      storageSize: n(storageSize),
      storageType: s(storageType),
      osType: s(osType),
      osDistribution: s(osDistribution),
      osVersion: s(osVersion),
    };
  };

  const load = async () => {
    if (!currentWorkspace?.id || !agent?.id) return;
    setLoading(true);
    setErr(null);
    try {
      const [data, agents] = await Promise.all([
        getAgentResources(currentWorkspace.id, agent.id, "external"),
        listAgents(currentWorkspace.id),
      ]);
      setEndpoint(data.endpoint);
      setFetchedAt(data.fetchedAt);
      setResources(data.resources ?? []);
      setKnownAgents(agents);
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || "Failed to load external resources");
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentWorkspace?.id && agent?.id) load();
    else {
      setResources([]);
      setEndpoint(null);
      setFetchedAt(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent?.id, currentWorkspace?.id]);

  // cuando seleccionas un agente registrado, autorrellena host/puerto
  useEffect(() => {
    if (!selectedAgentId || !knownAgents.length) return;
    const a = knownAgents.find((x) => x.id === selectedAgentId);
    if (a) {
      if (a.agent_id) setWorkerHost(a.agent_id);
      if (a.comm_port !== undefined && a.comm_port !== null) setCommPort(a.comm_port);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgentId]);

  // animación: medir alto del panel
  const measurePanel = () => {
    if (panelInnerRef.current) setPanelHeight(panelInnerRef.current.scrollHeight);
  };
  useEffect(() => {
    if (!adjustOpen) return;
    measurePanel();
    const onR = () => measurePanel();
    window.addEventListener("resize", onR);
    const id = requestAnimationFrame(measurePanel);
    return () => {
      window.removeEventListener("resize", onR);
      cancelAnimationFrame(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustOpen, selectedAgentId, workerHost, commPort, cpu, gpu, fpga, memorySize, memoryType, storageSize, storageType, osType, osDistribution, osVersion]);

  const rows = useMemo(() => {
    return resources.map((r) => {
      const linked = knownAgents.find((a) => a.agent_id === r.name) || null;
      const cpuUnits = (r.description?.processors || []).reduce((acc, p) => acc + (Number(p.units) || 0), 0);
      return { r, linked, cpuUnits };
    });
  }, [resources, knownAgents]);

  if (!agent) {
    return (
      <section className="rounded-md border bg-white">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-medium">External Resources</h2>
        </div>
        <div className="p-4 text-sm text-neutral-500">Waiting for agent…</div>
      </section>
    );
  }

  const handleAdd = async () => {
    if (!currentWorkspace?.id || !agent?.id) return;
    try {
      setSubmitting("add");
      setOpMsg(null);
      const payload = compactPayload();
      if (!payload.workerHost || payload.commPort === undefined) {
        setOpMsg("workerHost and commPort are required for Add.");
        setSubmitting(null);
        return;
      }
      await addExternalResources(currentWorkspace.id, agent.id, payload);
      setOpMsg("External resources added successfully.");
      setAdjustOpen((v) => !v);
      await load();
    } catch (e: any) {
      setOpMsg(e?.response?.data?.error || e?.message || "Failed to add external resources");
    } finally {
      setSubmitting(null);
    }
  };

  const handleReduce = async () => {
    if (!currentWorkspace?.id || !agent?.id) return;
    try {
      setSubmitting("reduce");
      setOpMsg(null);
      const payload = compactPayload();
      if (!payload.workerHost) {
        setOpMsg("workerHost is required for Reduce.");
        setSubmitting(null);
        return;
      }
      await reduceExternalResources(currentWorkspace.id, agent.id, payload);
      setOpMsg("External resources reduced successfully.");
      setAdjustOpen((v) => !v);
      await load();
    } catch (e: any) {
      setOpMsg(e?.response?.data?.error || e?.message || "Failed to reduce external resources");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <section className="rounded-md border bg-white">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="text-lg font-medium">External Resources</h2>
        <div className="flex items-center gap-2">
          {fetchedAt && (
            <span className="text-xs text-neutral-500 hidden sm:inline">
              Updated: {new Date(fetchedAt).toLocaleString()}
            </span>
          )}
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50"
            title="Refresh"
            disabled={!currentWorkspace?.id || !agent?.id}
          >
            <RotateCcw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              setAdjustOpen((v) => !v);
              if (!adjustOpen) resetForm();
            }}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50"
            title="Adjust external resources"
            disabled={!currentWorkspace?.id || !agent?.id}
          >
            <Wrench className="h-4 w-4" />
            {adjustOpen ? "Close" : "Adjust"}
          </button>
          
        </div>
      </div>

      {/* Tabla / contenido */}
      {loading ? (
        <div className="p-4 text-sm text-neutral-500">Loading external resources…</div>
      ) : err ? (
        <div className="p-4 text-sm text-red-600">{err}</div>
      ) : rows.length === 0 ? (
        <div className="p-4 text-sm text-neutral-500">No external resources.</div>
      ) : (
        <div className="p-2">
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Name (IP/Host)</th>
                  <th className="px-3 py-2 font-medium">Adaptor</th>
                  <th className="px-3 py-2 font-medium">CPU Units</th>
                  <th className="px-3 py-2 font-medium">Linked Agent</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ r, linked, cpuUnits }, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2">{r.adaptor}</td>
                    <td className="px-3 py-2">{cpuUnits || "-"}</td>
                    <td className="px-3 py-2">
                      {linked ? (
                        <Link
                          to={`/agents/${linked.id}`}
                          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs bg-green-50 text-green-700 border border-green-200"
                          title={`Go to agent "${linked.label}"`}
                        >
                          <Link2 className="h-3 w-3" />
                          {linked.label}
                        </Link>
                      ) : (
                        <span className="text-neutral-500">Not registered</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-neutral-400">—</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Panel de ajuste con animación slide */}
      <div
        ref={panelOuterRef}
        className={`border-t bg-neutral-50/50 overflow-hidden
                    transition-[max-height,opacity,transform] duration-300 ease-out
                    ${adjustOpen ? "opacity-100" : "opacity-0"}`}
        style={{
          maxHeight: adjustOpen ? panelHeight : 0,
          transform: adjustOpen ? "translateY(0)" : "translateY(-8px)",
        }}
      >
        <div ref={panelInnerRef} className="p-4">
          {/* Selector de agente registrado (opcional) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Field label="Pick registered agent (optional)">
              <select
                className="w-full rounded-md border px-3 py-2 bg-white"
                value={selectedAgentId === "" ? "" : selectedAgentId}
                onChange={(e) =>
                  setSelectedAgentId(e.target.value === "" ? "" : Number(e.target.value))
                }
              >
                <option value="">— Select —</option>
                {knownAgents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} ({a.agent_id || "no-ip"})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Worker host (IP / DNS)">
              <input
                className="w-full rounded-md border px-3 py-2"
                value={workerHost}
                onChange={(e) => setWorkerHost(e.target.value)}
                placeholder="e.g. 127.0.0.2"
              />
            </Field>

            <Field label="Comm port">
              <input
                type="number"
                className="w-full rounded-md border px-3 py-2"
                value={commPort === "" ? "" : (commPort as any)}
                onChange={(e) => setCommPort(e.target.value === "" ? "" : Number(e.target.value))}
                min={1}
                placeholder="e.g. 46201"
              />
            </Field>
          </div>

          {/* Especificación de recursos (opcional) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="CPU units">
              <input
                type="number"
                className="w-full rounded-md border px-3 py-2"
                value={cpu === "" ? "" : (cpu as any)}
                onChange={(e) => setCpu(e.target.value === "" ? "" : Number(e.target.value))}
                min={0}
              />
            </Field>
            <Field label="GPU units">
              <input
                type="number"
                className="w-full rounded-md border px-3 py-2"
                value={gpu === "" ? "" : (gpu as any)}
                onChange={(e) => setGpu(e.target.value === "" ? "" : Number(e.target.value))}
                min={0}
              />
            </Field>
            <Field label="FPGA units">
              <input
                type="number"
                className="w-full rounded-md border px-3 py-2"
                value={fpga === "" ? "" : (fpga as any)}
                onChange={(e) => setFpga(e.target.value === "" ? "" : Number(e.target.value))}
                min={0}
              />
            </Field>
            <Field label="Memory size">
              <input
                type="number"
                className="w-full rounded-md border px-3 py-2"
                value={memorySize === "" ? "" : (memorySize as any)}
                onChange={(e) => setMemorySize(e.target.value === "" ? "" : Number(e.target.value))}
                min={0}
                placeholder="-1 = unassigned"
              />
            </Field>
            <Field label="Memory type">
              <input
                className="w-full rounded-md border px-3 py-2"
                value={memoryType}
                onChange={(e) => setMemoryType(e.target.value)}
                placeholder="[unassigned]"
              />
            </Field>
            <Field label="Storage size">
              <input
                type="number"
                className="w-full rounded-md border px-3 py-2"
                value={storageSize === "" ? "" : (storageSize as any)}
                onChange={(e) => setStorageSize(e.target.value === "" ? "" : Number(e.target.value))}
                min={0}
                placeholder="-1 = unassigned"
              />
            </Field>
            <Field label="Storage type">
              <input
                className="w-full rounded-md border px-3 py-2"
                value={storageType}
                onChange={(e) => setStorageType(e.target.value)}
                placeholder="[unassigned]"
              />
            </Field>
            <Field label="OS type">
              <input
                className="w-full rounded-md border px-3 py-2"
                value={osType}
                onChange={(e) => setOsType(e.target.value)}
                placeholder="[unassigned]"
              />
            </Field>
            <Field label="OS distribution">
              <input
                className="w-full rounded-md border px-3 py-2"
                value={osDistribution}
                onChange={(e) => setOsDistribution(e.target.value)}
                placeholder="[unassigned]"
              />
            </Field>
            <Field label="OS version">
              <input
                className="w-full rounded-md border px-3 py-2"
                value={osVersion}
                onChange={(e) => setOsVersion(e.target.value)}
                placeholder="[unassigned]"
              />
            </Field>
          </div>

          {opMsg && <div className="mt-3 text-sm text-neutral-600">{opMsg}</div>}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={handleAdd}
              disabled={submitting !== null}
              className="rounded-md bg-black text-white px-3 py-1.5 text-sm disabled:opacity-50"
              title="Add external resources"
            >
              {submitting === "add" ? "Adding…" : "Add external"}
            </button>
            <button
              onClick={handleReduce}
              disabled={submitting !== null}
              className="rounded-md border border-red-300 text-red-600 px-3 py-1.5 text-sm hover:bg-red-50 disabled:opacity-50"
              title="Reduce external resources"
            >
              {submitting === "reduce" ? "Reducing…" : "Reduce external"}
            </button>
            <button
              onClick={resetForm}
              disabled={submitting !== null}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-50"
            >
              Reset
            </button>
          </div>

          {/* Aviso si el agente seleccionado no tiene comm_port */}
          {selectedAgentId !== "" && commPort === "" && (
            <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
              The selected agent has no <code>comm_port</code> configured. Please enter it manually.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1">
      <div className="text-neutral-500">{label}</div>
      {children}
    </label>
  );
}
