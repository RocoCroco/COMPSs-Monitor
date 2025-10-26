// src/components/AgentBasicInfo.tsx
import { useMemo, useState } from "react";
import { updateAgent } from "../lib/agents";
import type {Agent} from "../lib/agents";
import { useWorkspace } from "../lib/workspace-context";

export default function AgentBasicInfo({
  agent,
  online,
  onSaved,
}: {
  agent: Agent;
  online: boolean;
  onSaved: (a: Agent) => void;
}) {
  const { currentWorkspace } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // formulario local
  const [label, setLabel] = useState(agent.label);
  const [agentId, setAgentId] = useState(agent.agent_id);
  const [rest, setRest] = useState<number | "" | null>(agent.rest_port ?? "");
  const [comm, setComm] = useState<number | "" | null>(agent.comm_port ?? "");
  const [events, setEvents] = useState<number | "" | null>(agent.events_port ?? "");
  const [metrics, setMetrics] = useState<number | "" | null>(agent.metrics_port ?? "");

  // detectar campos cambiados
  const changed = useMemo(() => {
    const diffs: Record<string, any> = {};
    if (label !== agent.label) diffs.label = label;
    if (agentId !== agent.agent_id) diffs.agent_id = agentId;
    const norm = (v: number | "" | null | undefined) =>
      v === "" ? null : (v as number | null | undefined);
    if (norm(rest) !== (agent.rest_port ?? null)) diffs.rest_port = norm(rest);
    if (norm(comm) !== (agent.comm_port ?? null)) diffs.comm_port = norm(comm);
    if (norm(events) !== (agent.events_port ?? null)) diffs.events_port = norm(events);
    if (norm(metrics) !== (agent.metrics_port ?? null)) diffs.metrics_port = norm(metrics);
    return diffs;
  }, [label, agentId, rest, comm, events, metrics, agent]);

  const resetForm = () => {
    setLabel(agent.label);
    setAgentId(agent.agent_id);
    setRest(agent.rest_port ?? "");
    setComm(agent.comm_port ?? "");
    setEvents(agent.events_port ?? "");
    setMetrics(agent.metrics_port ?? "");
    setErr(null);
  };

  const handleSave = async () => {
    if (!currentWorkspace) return;
    if (Object.keys(changed).length === 0) {
      setEditing(false);
      return;
    }
    try {
      setSaving(true);
      setErr(null);
      const updated = await updateAgent(currentWorkspace.id, agent.id, changed);
      onSaved(updated);
      setEditing(false);
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.error || "Failed to save changes";
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-md border bg-white">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="text-lg font-medium">Basic Info</h2>

        <div className="flex items-center gap-4">
          {/* estado online */}
          <div className="flex items-center gap-2 text-sm">
            <span
              className={[
                "inline-block h-2.5 w-2.5 rounded-full",
                online ? "bg-green-500" : "bg-neutral-300",
              ].join(" ")}
            />
            <span className={online ? "text-green-700" : "text-neutral-500"}>
              {online ? "Online" : "Offline"}
            </span>
          </div>

          {/* acciones */}
          {!editing ? (
            <button
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50"
                onClick={() => {
                  resetForm();
                  setEditing(false);
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-black text-white px-3 py-1.5 text-sm disabled:opacity-50"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* error */}
      {err && (
        <div className="px-4 pt-3 text-sm text-red-600">
          {err}
        </div>
      )}

      {/* contenido */}
      {!editing ? (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <Info label="Label" value={agent.label} />
          <Info label="IP / Host" value={agent.agent_id} />
          <Info label="REST Port" value={fmt(agent.rest_port)} />
          <Info label="Comm Port" value={fmt(agent.comm_port)} />
          <Info label="Events Port" value={fmt(agent.events_port)} />
          <Info label="Metrics Port" value={fmt(agent.metrics_port)} />
          <Info label="Workspace ID" value={String(agent.workspace_id)} />
          <Info label="Agent DB ID" value={String(agent.id)} />
        </div>
      ) : (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <Field label="Label *">
            <input
              className="w-full rounded-md border px-3 py-2"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </Field>
          <Field label="IP / Host *">
            <input
              className="w-full rounded-md border px-3 py-2"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              required
            />
          </Field>
          <Field label="REST Port">
            <input
              type="number"
              className="w-full rounded-md border px-3 py-2"
              value={rest === null ? "" : (rest as any)}
              onChange={(e) => setRest(e.target.value === "" ? "" : Number(e.target.value))}
              min={0}
              placeholder="e.g. 46101"
            />
          </Field>
          <Field label="Comm Port">
            <input
              type="number"
              className="w-full rounded-md border px-3 py-2"
              value={comm === null ? "" : (comm as any)}
              onChange={(e) => setComm(e.target.value === "" ? "" : Number(e.target.value))}
              min={0}
            />
          </Field>
          <Field label="Events Port">
            <input
              type="number"
              className="w-full rounded-md border px-3 py-2"
              value={events === null ? "" : (events as any)}
              onChange={(e) => setEvents(e.target.value === "" ? "" : Number(e.target.value))}
              min={0}
            />
          </Field>
          <Field label="Metrics Port">
            <input
              type="number"
              className="w-full rounded-md border px-3 py-2"
              value={metrics === null ? "" : (metrics as any)}
              onChange={(e) => setMetrics(e.target.value === "" ? "" : Number(e.target.value))}
              min={0}
            />
          </Field>
        </div>
      )}
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
    <div className="space-y-1">
      <div className="text-neutral-500">{label}</div>
      {children}
    </div>
  );
}

function fmt(n?: number | null) {
  return n === null || n === undefined ? "-" : String(n);
}
