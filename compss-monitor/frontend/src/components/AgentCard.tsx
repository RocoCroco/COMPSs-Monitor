// src/components/AgentCard.tsx
import type { Agent } from "../lib/agents";
import { Link } from "react-router-dom";
import SpotlightCard from "./visual/SpotlightCard";

export default function AgentCard({
  agent,
  online,
}: {
  agent: Agent;
  online: boolean;
}) {
  return (
    <Link to={`/agents/${agent.id}`} className="block">
    {/*<SpotlightCard className="custom-spotlight-card" spotlightColor="rgba(255, 134, 89, 0.5)">*/}
    <div className="flex items-center space-x-4 px-4 py-4 rounded-md border bg-[#ffffff]/70 hover:bg-[#bbbbbb]/10 border-neutral-200">
      {/* status dot */}
      <div className="relative">
        {/* Punto principal */}
        <span
          className={[
            "inline-block h-2.5 w-2.5 rounded-full",
            online ? "bg-green-500 animate-pulse" : "bg-neutral-300",
          ].join(" ")}
          aria-label={online ? "online" : "offline"}
        />
        
        
      </div>

      {/* label */}
      <div className="font-medium w-1/12">{agent.label}</div>

      {/* datos básicos */}
      <div className="flex space-x-8 text-sm text-neutral-700">
        <div className="w-1/10">{agent.agent_id ?? "-"}</div>
        <div className="w-1/10">{agent.rest_port ?? "-"}</div>
        <div className="w-1/10">{agent.comm_port ?? "-"}</div>
        <div className="w-1/10">{agent.events_port ?? "-"}</div>
        <div className="w-1/10">{agent.metrics_port ?? "-"}</div>
      </div>
    </div>
    {/*</SpotlightCard>*/}
    </Link>
  );
}
