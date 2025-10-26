// src/pages/Agents.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import { useWorkspace } from "../lib/workspace-context";
import { checkAgentOnline, createAgent, listAgents } from "../lib/agents";
import type { Agent } from "../lib/agents";
import { useDebouncedValue } from "../lib/hooks";
import { Search } from "lucide-react";
import AgentCard from "../components/AgentCard";
import AgentCreateModal from "../components/modals/AgentCreateModal";
import DotGrid from '../components/visual/DotGrid';

type StatusMap = Record<number, boolean>; // agent.id -> online?

export default function AgentsPage() {
  const { currentWorkspace } = useWorkspace();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [status, setStatus] = useState<StatusMap>({});
  const [tab, setTab] = useState<"online" | "offline">("online");
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query, 200);

  // carga de agentes
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!currentWorkspace) return;
      setLoading(true);
      try {
        const rows = await listAgents(currentWorkspace.id);
        if (!mounted) return;
        setAgents(rows);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [currentWorkspace]);

  // estado online por id
const inFlightRef = useRef(false);

useEffect(() => {
  if (!agents.length) {
    setStatus({});
    return;
  }

  let alive = true;

  const tick = async () => {
    if (inFlightRef.current) return; // evita solaparse si la anterior no terminó
    inFlightRef.current = true;
    try {
      const entries = await Promise.all(
        agents.map(async (a) => {
          const online = await checkAgentOnline(a.agent_id, a.rest_port ?? undefined);
          return [a.id, online] as const;
        })
      );
      if (!alive) return;
      setStatus((prev) => {
        const next: StatusMap = { ...prev };
        for (const [id, on] of entries) next[id] = on;
        return next;
      });
    } finally {
      inFlightRef.current = false;
    }
  };

  // dispara ahora y luego cada 5s
  tick();
  const id = setInterval(tick, 5000);

  return () => {
    alive = false;
    clearInterval(id);
  };
}, [agents]);

  // buscador
  const filtered = useMemo(() => {
    const norm = (x: any) => String(x ?? "").toLowerCase();
    const terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return agents;

    return agents.filter((a) => {
      const haystack = [
        a.label,
        a.agent_id,
        a.rest_port,
        a.comm_port,
        a.events_port,
        a.metrics_port,
      ]
        .map(norm)
        .join(" ");

      return terms.every((t) => haystack.includes(t));
    });
  }, [agents, q]);

  const onlineList = filtered.filter((a) => status[a.id]);
  const offlineList = filtered.filter((a) => !status[a.id]);

  const onCreate = async (data: Parameters<typeof createAgent>[1]) => {
    if (!currentWorkspace) return;
    await createAgent(currentWorkspace.id, data);
    // refrescamos lista
    const rows = await listAgents(currentWorkspace.id);
    setAgents(rows);
    setTab("online");
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agents</h1>
          <div className="text-sm text-neutral-500 mt-4 font-semibold">{currentWorkspace?.name}</div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpenModal(true)}
            className="rounded-md border border-[#FF8659] text-[#FF8659] px-3 py-1.5 text-sm hover:bg-[#FF8659]/10"
          >
            + New
          </button>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="mt-6 flex items-center justify-start gap-3 border-b">
        <div className="flex items-center gap-6 ">
          <button
            onClick={() => setTab("online")}
            className={[
              "pb-1.5 border-b-2",
              tab === "online" ? "border-[#FF8659] text-black font-semibold" : "hover:text-black border-transparent text-neutral-500",
            ].join(" ")}
          >
            Online ({onlineList.length})
          </button>

          <button
            onClick={() => setTab("offline")}
            className={[
              "pb-1.5 border-b-2",
              tab === "offline" ? "border-[#FF8659] text-black font-semibold" : "hover:text-black border-transparent text-neutral-500",
            ].join(" ")}
          >
            Offline ({offlineList.length})
          </button>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-3">
        <div className="relative w-80 justify-end ">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
                placeholder="Search agents"
                className="w-full pl-8 pr-3 py-1 rounded-md border hover:bg-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#FF8659] focus:border-[#FF8659]"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
        </div>
      </div>
      {/* Listado */}
      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="text-sm text-neutral-500">Loading…</div>
        ) : (tab === "online" ? onlineList : offlineList).length === 0 ? (
          <div className="text-sm text-neutral-500">No agents found.</div>
        ) : (
          (tab === "online" ? onlineList : offlineList).map((a) => (
            <AgentCard key={a.id} agent={a} online={!!status[a.id]} />
          ))
        )}
      </div>

      {/* Modal crear */}
      <AgentCreateModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreate={onCreate}
      />
    </div>
  );
}
