import { useCallback, useEffect, useState } from "react";
import { useWorkspace } from "../lib/workspace-context";
import { reconcileMonitor, type ReconcileOut } from "../lib/monitor";
import BrandLoader from "../components/BrandLoader";
import MonitorControls, { makeRange, type MonitorControlsValue } from "../components/monitor/MonitorControls";

export default function MonitorAgents() {
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ReconcileOut | null>(null);

  // estado de controles (defaults)
  const [controls, setControls] = useState<MonitorControlsValue>({
    preset: "1h",
    customFrom: "",
    customTo: "now",
    refresh: "5s",
  });

  const run = useCallback(async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    setErr(null);
    try {
      const { from, to } = makeRange(controls);
      const out = await reconcileMonitor(currentWorkspace.id, {
        from, to, refresh: controls.refresh,
      });
      setData(out);
    } catch (e: any) {
      setErr(e?.message || "Failed to load Grafana dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, controls]);

  useEffect(() => { run(); }, [run]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <h1 className="text-2xl font-semibold">Agents Monitor</h1>
        <MonitorControls
          value={controls}
          onChange={setControls}
          onApply={run}
          onRebuild={run}
          disabled={!currentWorkspace || loading}
        />
      </div>

      {/* Body */}
      <div className="flex-1 min-h-[400px] rounded-md border bg-white overflow-hidden">
        {loading ? (
          <BrandLoader />
        ) : err ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 p-6">
            <div className="text-sm text-red-600">{err}</div>
            <button onClick={run} className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50">Try again</button>
          </div>
        ) : data?.iframe ? (
          <iframe
            key={data.iframe}
            src={data.iframe}
            title="Grafana Monitor"
            className="w-full h-full"
            allow="fullscreen"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-neutral-500">
            No iframe URL returned.
          </div>
        )}
      </div>
    </div>
  );
}
