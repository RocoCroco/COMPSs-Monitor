import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";

export type MonitorControlsValue = {
  preset: "5m" | "15m" | "30m" | "1h" | "3h" | "24h" | "7d" | "custom";
  customFrom: string; // ej: "now-6h" o epoch ms como string
  customTo: string;   // ej: "now"
  refresh: "off" | "5s" | "10s" | "30s" | "1m" | "5m";
};

export default function MonitorControls({
  value,
  onChange,
  onApply,
  onRebuild,
  disabled,
}: {
  value: MonitorControlsValue;
  onChange: (v: MonitorControlsValue) => void;
  onApply: () => void;    // aplica rango/refresh actuales
  onRebuild: () => void;  // regenera dashboard con los mismos parámetros
  disabled?: boolean;
}) {
  const [local, setLocal] = useState<MonitorControlsValue>(value);
  useEffect(() => setLocal(value), [value]);

  const showCustom = local.preset === "custom";

  const set = (patch: Partial<MonitorControlsValue>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange(next);
  };

  const hint = useMemo(() => {
    if (showCustom) return `${local.customFrom || "?"} → ${local.customTo || "?"}`;
    const map: Record<string, string> = {
      "5m": "now-5m → now",
      "15m": "now-15m → now",
      "30m": "now-30m → now",
      "1h": "now-1h → now",
      "3h": "now-3h → now",
      "24h": "now-24h → now",
      "7d": "now-7d → now",
    };
    return map[local.preset] || "";
  }, [local, showCustom]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset */}
      <div className="inline-flex items-center gap-2">
        <label className="text-sm text-neutral-600">Range</label>
        <select
          className="rounded-md border bg-white px-2 py-1 text-sm"
          value={local.preset}
          onChange={(e) => set({ preset: e.target.value as any })}
          disabled={disabled}
        >
          <option value="5m">Last 5 minutes</option>
          <option value="15m">Last 15 minutes</option>
          <option value="30m">Last 30 minutes</option>
          <option value="1h">Last 1 hour</option>
          <option value="3h">Last 3 hours</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="custom">Custom…</option>
        </select>
        <span className="text-xs text-neutral-500">{hint}</span>
      </div>

      {showCustom && (
        <>
          <input
            className="rounded-md border px-2 py-1 text-sm"
            placeholder="from (e.g. now-6h or 1696000000000)"
            value={local.customFrom}
            onChange={(e) => set({ customFrom: e.target.value })}
            disabled={disabled}
          />
          <input
            className="rounded-md border px-2 py-1 text-sm"
            placeholder="to (e.g. now or 1696100000000)"
            value={local.customTo}
            onChange={(e) => set({ customTo: e.target.value })}
            disabled={disabled}
          />
        </>
      )}

      {/* Refresh */}
      <div className="inline-flex items-center gap-2">
        <label className="text-sm text-neutral-600">Refresh</label>
        <select
          className="rounded-md border bg-white px-2 py-1 text-sm"
          value={local.refresh}
          onChange={(e) => set({ refresh: e.target.value as any })}
          disabled={disabled}
        >
          <option value="off">off</option>
          <option value="5s">5s</option>
          <option value="10s">10s</option>
          <option value="30s">30s</option>
          <option value="1m">1m</option>
          <option value="5m">5m</option>
        </select>
      </div>

      {/* Botones */}
      <button
        onClick={onApply}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-50"
        title="Apply time & refresh"
      >
        Apply
      </button>

      <button
        onClick={onRebuild}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-50"
        title="Rebuild dashboard"
      >
        <RotateCcw className="h-4 w-4" />
        Rebuild
      </button>
    </div>
  );
}

/* Helper para convertir el preset a {from,to} */
export function makeRange(value: MonitorControlsValue): { from?: string | number; to?: string | number } {
  if (value.preset === "custom") {
    return {
      from: value.customFrom || undefined,
      to: value.customTo || undefined,
    };
  }
  const map: Record<string, string> = {
    "5m": "now-5m",
    "15m": "now-15m",
    "30m": "now-30m",
    "1h": "now-1h",
    "3h": "now-3h",
    "24h": "now-24h",
    "7d": "now-7d",
  };
  return { from: map[value.preset], to: "now" };
}
