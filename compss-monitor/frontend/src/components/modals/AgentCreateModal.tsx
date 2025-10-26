// src/components/AgentCreateModal.tsx
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import type { CreateAgentInput } from "../../lib/agents";

export default function AgentCreateModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: CreateAgentInput) => Promise<void> | void;
}) {
  const [form, setForm] = useState<CreateAgentInput>({
    label: "",
    agent_id: "",
    rest_port: undefined,
    comm_port: undefined,
    events_port: undefined,
    metrics_port: undefined,
  });

  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      setForm({
        label: "",
        agent_id: "",
        rest_port: undefined,
        comm_port: undefined,
        events_port: undefined,
        metrics_port: undefined,
      });
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.label.trim() || !form.agent_id.trim()) return;
    await onCreate({
      ...form,
      rest_port: norm(form.rest_port),
      comm_port: norm(form.comm_port),
      events_port: norm(form.events_port),
      metrics_port: norm(form.metrics_port),
    });
    onClose();
  };

  const norm = (v?: number | null) => (v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v));

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-neutral-200 p-5
                   animate-[fadeIn_180ms_ease-out] data-[closing=true]:animate-[fadeOut_150ms_ease-in]"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-lg font-semibold mb-4">New agent</h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm block mb-1">Label *</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                required
                placeholder="Agent name"
              />
            </div>

            <div className="col-span-2">
              <label className="text-sm block mb-1">Agent IP/Host *</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={form.agent_id}
                onChange={(e) => setForm((f) => ({ ...f, agent_id: e.target.value }))}
                required
                placeholder="127.0.0.1"
              />
            </div>

            {[
              ["REST port", "rest_port"] as const,
              ["Comm port", "comm_port"] as const,
              ["Events port", "events_port"] as const,
              ["Metrics port", "metrics_port"] as const,
            ].map(([label, key]) => (
              <div key={key}>
                <label className="text-sm block mb-1">{label}</label>
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2"
                  value={(form as any)[key] ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value === "" ? undefined : Number(e.target.value) }))
                  }
                  placeholder="46201"
                  min={0}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
              disabled={!form.label.trim() || !form.agent_id.trim()}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
