// src/pages/AgentDetails.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkspace } from "../lib/workspace-context";
import { listAgents, checkAgentOnline, deleteAgent } from "../lib/agents";
import type { Agent } from "../lib/agents";
import AgentBasicInfo from "../components/AgentBasicInfo";
import AgentLocalResources from "../components/AgentLocalResources.tsx";
import AgentExternalResources from "../components/AgentExternalResources";
import AgentOperations from "../components/AgentOperations";
import { Link } from "react-router-dom";
import type { TabKey } from "../components/SectionTabs.tsx";
import SectionTabs from "../components/SectionTabs.tsx";

export default function AgentDetails() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [tab, setTab] = useState<TabKey>("basic");

  // cargar lista y seleccionar agente
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!currentWorkspace) return;
      setLoading(true);
      try {
        const rows = await listAgents(currentWorkspace.id);
        console.log(rows);
        if (!alive) return;
        setAgents(rows);
        const id = Number(agentId);
        console.log(agentId);
        setAgent(rows.find((a) => a.id === id) ?? null);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [currentWorkspace, agentId]);

  // polling de estado online cada 5s (si hay datos del agente)
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (!agent) return;
      const on = await checkAgentOnline(agent.agent_id, agent.rest_port ?? undefined);
      if (alive) setOnline(on);
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [agent]);

  const handleDeleted = async () => {
    if (!currentWorkspace) return;
    if (!agent) return;
    const ok = window.confirm(`Delete agent "${agent.label}"? This cannot be undone.`);
    if (!ok) return;
    try {
      setDeleting(true);
      await deleteAgent(currentWorkspace.id, agent.id);
      navigate("/agents"); // vuelve al listado tras borrar
    } catch (e) {
      console.error(e);
      alert("Failed to delete agent");
    } finally {
      setDeleting(false);
    }
  };

  const breadcrumb = useMemo(() => {
    const wsName = currentWorkspace?.name ?? "Workspace";
    const label = agent?.label ?? "Agent";
    return `${wsName}  ›  ${label}`;
  }, [currentWorkspace, agent]);

  if (loading) {
    return <div className="p-4 text-sm text-neutral-500">Loading agent…</div>;
  }

  if (!agent) {
    return (
      <div className="p-4">
        <div className="text-sm text-neutral-500 mb-3">Agent not found.</div>
        <button
          onClick={() => navigate("/agents")}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          Back to Agents
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb y título */}
      <div className="flex items-center justify-between">
        <div>
            <Link to="/agents" className="text-sm hover:underline ">
                <div className="text-sm text-neutral-500">{breadcrumb}</div>
            </Link>
            <h1 className="text-2xl font-semibold mt-3">{agent.label}</h1>
        </div>
        <div className="flex items-center gap-2">
            <button
            onClick={handleDeleted}
            disabled={deleting}
            className="rounded-md border border-red-300 text-red-600 px-3 py-1.5 text-sm hover:bg-[#fca5a5]/10 disabled:opacity-50"
            >
            {deleting ? "Deleting…" : "Delete"}
            </button>
        </div>
      </div>

      <SectionTabs value={tab} onChange={setTab} />

      {/* Contenido por sección */}
      {tab === "basic" && <AgentBasicInfo agent={agent} online={online} onSaved={(updated) => {
      // actualiza el estado local del detalle
      setAgent(updated);
      // si cambian campos que afectan a otras secciones (p.ej. rest_port),
      // aquí podrías reiniciar el polling del "online" si lo tienes:
      // restartOnlineCheck();
    }} />}
      {tab === "local" && <AgentLocalResources agent={agent} />}
      {tab === "external" && <AgentExternalResources agent={agent} />}
      {tab === "ops" && <AgentOperations agent={agent}/>}
    </div>
  );
}
