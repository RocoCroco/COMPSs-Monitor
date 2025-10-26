// src/components/AgentLocalResources.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { getAgentResources, type AgentResource } from "../lib/agents";
import type { Agent } from "../lib/agents";
import { addLocalResources, reduceLocalResources, type LocalResourceSpec } from "../lib/agents";
import { useWorkspace } from "../lib/workspace-context";
import { RotateCcw, Wrench } from "lucide-react";

export default function AgentLocalResources({ agent }: { agent?: Agent | null }) {
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<AgentResource | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  // panel de ajuste
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [submitting, setSubmitting] = useState<"add" | "reduce" | null>(null);
  const [opMsg, setOpMsg] = useState<string | null>(null);

  // refs/animación: medimos el alto del contenido para animar max-height
  const panelOuterRef = useRef<HTMLDivElement | null>(null);
  const panelInnerRef = useRef<HTMLDivElement | null>(null);
  const [panelHeight, setPanelHeight] = useState(0);

  // form state
  const [workerName, setWorkerName] = useState<string>("");
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
    setWorkerName(res?.name || agent?.agent_id || "");
    setCpu("");
    setGpu("");
    setFpga("");
    setMemorySize("");
    setMemoryType("");
    setStorageSize("");
    setStorageType("");
    setOsType("");
    setOsDistribution("");
    setOsVersion("");
    setOpMsg(null);
  };

  const compactPayload = (): LocalResourceSpec => {
    const n = (v: number | "") => (v === "" ? undefined : v);
    const s = (v: string) => (v.trim() ? v.trim() : undefined);
    return {
      workerName: s(workerName) ?? undefined,
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
      const data = await getAgentResources(currentWorkspace.id, agent.id, "local");
      setEndpoint(data.endpoint);
      setFetchedAt(data.fetchedAt);
      const only = (data.resources ?? [])[0] ?? null;
      setRes(only);
      setWorkerName((only?.name || agent.agent_id) ?? "");
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || "Failed to load local resources");
      setRes(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentWorkspace?.id && agent?.id) load();
    else {
      setRes(null);
      setEndpoint(null);
      setFetchedAt(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent?.id, currentWorkspace?.id]);

  // medir el alto del panel cuando se abre o cambian inputs
  const measurePanel = () => {
    if (panelInnerRef.current) setPanelHeight(panelInnerRef.current.scrollHeight);
  };
  useEffect(() => {
    if (!adjustOpen) return;
    measurePanel();
    const r = () => measurePanel();
    window.addEventListener("resize", r);
    // aseguramos medición tras layout
    const id = requestAnimationFrame(measurePanel);
    return () => {
      window.removeEventListener("resize", r);
      cancelAnimationFrame(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustOpen, workerName, cpu, gpu, fpga, memorySize, memoryType, storageSize, storageType, osType, osDistribution, osVersion]);

  const totals = useMemo(() => {
    if (!res?.description?.processors?.length) return { cpuUnits: null };
    const cpuUnits = res.description.processors.reduce((acc, p) => acc + (Number(p.units) || 0), 0);
    return { cpuUnits };
  }, [res]);

  if (!agent) {
    return (
      <section className="rounded-md border bg-white">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-medium">Local Resources</h2>
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
      await addLocalResources(currentWorkspace.id, agent.id, compactPayload());
      setOpMsg("Resources added successfully.");
      setAdjustOpen((v) => !v);
      await load();
    } catch (e: any) {
      setOpMsg(e?.response?.data?.error || e?.message || "Failed to add resources");
    } finally {
      setSubmitting(null);
    }
  };

  const handleReduce = async () => {
    if (!currentWorkspace?.id || !agent?.id) return;
    try {
      setSubmitting("reduce");
      setOpMsg(null);
      await reduceLocalResources(currentWorkspace.id, agent.id, compactPayload());
      setOpMsg("Resources reduced successfully.");
      setAdjustOpen((v) => !v);
      await load();
    } catch (e: any) {
      setOpMsg(e?.response?.data?.error || e?.message || "Failed to reduce resources");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <section className="rounded-md border bg-white">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="text-lg font-medium">Local Resources</h2>
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
            title="Adjust resources"
            disabled={!currentWorkspace?.id || !agent?.id}
          >
            <Wrench className="h-4 w-4" />
            {adjustOpen ? "Close" : "Adjust"}
          </button>
          
          
        </div>
      </div>

      {/* contenido: resumen actual */}
      {loading ? (
        <div className="p-4 text-sm text-neutral-500">Loading local resources…</div>
      ) : err ? (
        <div className="p-4 text-sm text-red-600">{err}</div>
      ) : !res ? (
        <div className="p-4 text-sm text-neutral-500">No local resource found.</div>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <Info label="Name" value={res.name} />
            <Info label="Adaptor" value={res.adaptor} />
            <Info label="CPU Units" value={fmtNum(totals.cpuUnits)} />
            <Info label="Memory Size" value={fmtSize(res.description?.memory_size)} />
            <Info label="Memory Type" value={fmtText(res.description?.memory_type)} />
            <Info label="Storage Size" value={fmtSize(res.description?.storage_size)} />
            <Info label="Storage Bandwidth" value={fmtBandwidth(res.description?.storage_bandwidth)} />
            <Info label="Storage Type" value={fmtText(res.description?.storage_type)} />
            <Info label="Endpoint" value={endpoint ?? "-"} />
          </div>

          {/*res.description?.processors?.length ? (
            <div className="mt-4">
              <div className="text-sm text-neutral-500 mb-2">Processors</div>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50">
                    <tr className="text-left">
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Units</th>
                      <th className="px-3 py-2 font-medium">Architecture</th>
                    </tr>
                  </thead>
                  <tbody>
                    {res.description.processors.map((p, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">{p.name}</td>
                        <td className="px-3 py-2">{p.units}</td>
                        <td className="px-3 py-2">{fmtText(p.architecture)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null*/}
        </div>
      )}

      {/* panel de ajuste con animación slide down/up */}
      <div
        ref={panelOuterRef}
        className={`border-t bg-neutral-100 overflow-hidden
                    transition-[max-height,opacity,transform] duration-300 ease-out
                    ${adjustOpen ? "opacity-100" : "opacity-0"}`}
        style={{
          maxHeight: adjustOpen ? panelHeight : 0,
          transform: adjustOpen ? "translateY(0)" : "translateY(-8px)",
        }}
      >
        <div ref={panelInnerRef} className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Worker name">
              <input
                className="w-full rounded-md border px-3 py-2"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                placeholder={agent.agent_id}
              />
            </Field>
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
              title="Add resources"
            >
              {submitting === "add" ? "Adding…" : "Add resources"}
            </button>
            <button
              onClick={handleReduce}
              disabled={submitting !== null}
              className="rounded-md border border-red-300 text-red-600 px-3 py-1.5 text-sm hover:bg-red-50 disabled:opacity-50"
              title="Reduce resources"
            >
              {submitting === "reduce" ? "Reducing…" : "Reduce resources"}
            </button>
            <button
              onClick={resetForm}
              disabled={submitting !== null}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <div className="text-neutral-500">{label}</div>
      <div className="font-medium">{value ?? "-"}</div>
    </div>
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

function fmtText(v?: string) {
  if (!v || v === "[unassigned]") return "-";
  return v;
}
function fmtNum(v: number | null) {
  if (v === null || Number.isNaN(v)) return "-";
  return String(v);
}
function fmtSize(n?: number) {
  if (n === undefined || n === null || n < 0) return "-";
  return String(n);
}
function fmtBandwidth(n?: number) {
  if (n === undefined || n === null || n < 0) return "-";
  return String(n);
}
