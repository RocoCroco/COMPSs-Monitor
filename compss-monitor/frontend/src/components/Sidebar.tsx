// src/components/Sidebar.tsx
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { TvMinimal, HelpCircle, ChevronLeft, ServerCog } from "lucide-react";

type LinkItem = { to: string; label: string; icon: any; end?: boolean };
type Section = { title: string | null; items: LinkItem[] };

const sections: Section[] = [
  {
    title: "LOCAL",
    items: [
      { to: "/monitor/local", label: "Local Monitor", icon: TvMinimal },
    ],
  },
  {
    title: "AGENTS",
    items: [
      { to: "/agents", label: "Agent Manager", icon: ServerCog, end: false }, // activo también en /agents/123
      { to: "/monitor/agents", label: "Agents Monitor", icon: TvMinimal },
    ],
  },
  {
    title: null, // separador sin título antes de "Help"
    items: [{ to: "/help", label: "Help", icon: HelpCircle }],
  },
];

const LS_COLLAPSED = "ui:sidebar-collapsed";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_COLLAPSED) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_COLLAPSED, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  return (
    <aside
      className={[
        "relative h-full bg-white border-r border-neutral-200",
        "transition-all duration-300 ease-out",
        collapsed ? "w-16" : "w-64",
      ].join(" ")}
      aria-label="Sidebar"
      data-collapsed={collapsed ? "true" : "false"}
    >
      <nav className="p-3 space-y-3">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {/* Título de sección (oculto en colapsado). Si title === null, dibujamos separador */}
            {!collapsed ? (
              section.title ? (
                <div className="px-3 text-[11px] font-semibold tracking-widest text-neutral-500 select-none">
                  {section.title}
                </div>
              ) : (
                <div className="my-2 border-t border-neutral-200" role="separator" />
              )
            ) : null}

            {/* Links de la sección */}
            {section.items.map(({ to, label, icon: Icon, end }, i) => (
              <NavLink
                key={to}
                to={to}
                title={label} // tooltip útil en colapsado
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-2 rounded-md text-sm transition-all",
                    "px-3 py-2",
                    collapsed ? "justify-center" : "justify-start",
                    isActive
                      ? "bg-neutral-300 text-black font-semibold border-l-4 border-[#FF8659]"
                      : "text-neutral-700 hover:bg-neutral-200",
                  ].join(" ")
                }
                end={end ?? true}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Imagen inferior izquierda (solo expandida) 
      {!collapsed && (
        <div className="absolute left-3 bottom-5">
          <img
            src="/src/assets/bsc_logo.png"
            alt="Decoration"
            className="h-12 w-auto object-contain opacity-90"
            draggable={false}
          />
        </div>
      )}*/}

      {/* Botón colapsar/expandir - abajo a la derecha */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={[
          "absolute bottom-5 right-3 inline-flex items-center justify-center",
          "h-8 w-8 rounded-full border border-neutral-300 bg-white",
          "shadow-sm hover:bg-neutral-50 active:scale-95",
          "transition-all duration-300",
        ].join(" ")}
      >
        <ChevronLeft
          className={[
            "h-4 w-4 transition-transform duration-300",
            collapsed ? "rotate-180" : "rotate-0",
          ].join(" ")}
          aria-hidden="true"
        />
      </button>
    </aside>
  );
}
