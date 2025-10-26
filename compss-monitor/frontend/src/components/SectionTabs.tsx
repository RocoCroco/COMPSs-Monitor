// src/components/SectionTabs.tsx
type TabKey = "basic" | "local" | "external" | "ops";

const TABS: { key: TabKey; label: string }[] = [
  { key: "basic",   label: "Basic Info" },
  { key: "local",   label: "Local Resources" },   // (Internal/Local)
  { key: "external",label: "External Resources" },
  { key: "ops",     label: "Call operation" },
];

export default function SectionTabs({
  value,
  onChange,
}: {
  value: TabKey;
  onChange: (v: TabKey) => void;
}) {
  return (
    <div role="tablist" aria-label="Agent sections" className="flex items-center gap-6 border-b">
      {TABS.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={[
              "pb-2 -mb-px text-sm transition-colors",
              active ? "border-b-2 border-[#FF8659] text-black font-medium"
                     : "border-b-2 border-transparent text-neutral-500 hover:text-black"
            ].join(" ")}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export type { TabKey };
