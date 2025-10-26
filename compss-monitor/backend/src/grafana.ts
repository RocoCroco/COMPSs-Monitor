// src/grafana.ts
import fs from "fs";
import path from "path";
import db from "./db.js";
import type { Agent } from "./types.js";

const GRAFANA_URL = process.env.GRAFANA_URL ?? "http://localhost:3000";
const GRAFANA_TOKEN = process.env.GRAFANA_API_KEY ?? "";
const GRAFANA_FOLDER_UID = process.env.GRAFANA_FOLDER_UID ?? ""; // opcional

// UIDs reales de tus datasources (mismas que en Grafana)
const DS_UID_PG  = process.env.DS_UID_PG  ?? "postgres-events"; // grafana-postgresql-datasource
const DS_UID_PROM= process.env.DS_UID_PROM?? "prometheus-metrics"; // prometheus

type Panel = Record<string, any>;
type Dashboard = Record<string, any>;

async function grafanaFetch(pathname: string, init?: RequestInit) {
  const url = new URL(pathname, GRAFANA_URL).toString();
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GRAFANA_TOKEN}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Grafana ${res.status} ${res.statusText}: ${txt}`);
  }
  return res.json();
}

// Carga plantillas
function loadBase(): Dashboard {
  const p = path.join(process.cwd(), "src/grafana/base-meta.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function loadRowTemplate(): Panel[] {
  const p = path.join(process.cwd(), "src/grafana/row-agent.json");
  return JSON.parse(fs.readFileSync(p, "utf8")); // <- array de panels
}
function loadLocalRowTemplate(): Panel[] {
  const p = path.join(process.cwd(), "src/grafana/row-local.json");
  return JSON.parse(fs.readFileSync(p, "utf8")); // <- array de panels
}

// Reemplazos en una cadena SQL/PromQL para el agente
function rewriteAgentId(str: string, agentId: string): string {
  // Coincide "127.0.0.1" entre comillas simples o dobles y conserva el tipo de comilla
  return str.replace(/(['"])127\.0\.0\.1\1/g, (_m, quote) => `${quote}${agentId}${quote}`);
}

// Reasigna datasources y queries de cada panel del bloque
function applyAgentToPanel(p: Panel, agentLabel: string, agentId: string) {
  // 1) título de la row
  if (p.type === "row") {
    p.title = `${agentLabel}(${agentId})`;
  }

  // 2) datasources y queries
  //   - panel.datasource (Prometheus en gauges)
  if (p.datasource?.type === "prometheus") {
    p.datasource.uid = DS_UID_PROM;
  }
  for (const t of p.targets ?? []) {
    // Reasigna UIDs de datasources
    if (t.datasource?.type === "grafana-postgresql-datasource" || t.datasource?.type === "postgres") {
        t.datasource.uid = DS_UID_PG;
    }
    if (t.datasource?.type === "prometheus") {
        t.datasource.uid = DS_UID_PROM;
    }

    // Reemplazos de agente en consultas
    if (typeof t.rawSql === "string") {
        t.rawSql = rewriteAgentId(t.rawSql, agentId);
    }
    if (typeof t.expr === "string") {
        t.expr = rewriteAgentId(t.expr, agentId);
    }
}
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

// Reubica gridPos.y de todos los panels de un bloque (manteniendo x/w/h)
function placeBlock(panels: Panel[], startY: number): { placed: Panel[]; height: number } {
  // tu bloque por agente: 1(row h=1), + 4 panels de 8 h = 33 total
  // (en tu plantilla: Row + CPU gauge(8) + Mem gauge(8) + Runtime(8) + Exec state(8) + Exec API(8) + Exec Tasks(8) => 1 + 8 + 8 + 8 + 8 + 8 = 41 si incluyes todos)
  let y = startY;
  let maxBottom = startY;
  const out: Panel[] = [];
  for (const p of panels) {
    const cp = clone(p);
    const h = cp.gridPos?.h ?? 8;
    cp.gridPos = cp.gridPos || { h: 8, w: 24, x: 0, y };
    cp.gridPos.y = y;
    y += h;
    maxBottom = Math.max(maxBottom, cp.gridPos.y + h);
    out.push(cp);
  }
  return { placed: out, height: (maxBottom - startY) };
}

// Asigna ids consecutivos para todo el dashboard
function renumberPanelIds(panels: Panel[]) {
  let id = 1;
  for (const p of panels) p.id = id++;
}

export async function buildAndUpsertDashboard(workspaceId: number, title: string) {
  const base = loadBase();            // objeto dashboard base
  const rowTplPanels = loadRowTemplate(); // array panels

  // Saca agentes del workspace (ajusta al esquema de tu DB)
  const agents = db.prepare("SELECT * FROM agents WHERE workspace_id=? ORDER BY id ASC").all(workspaceId) as Agent[];

  // Construye panels = sumatoria de bloques por agente
  let y = 0;
  const finalPanels: Panel[] = [];

  for (const ag of agents) {
    const agentPanels = clone(rowTplPanels);

    // personaliza por agente
    for (const p of agentPanels) applyAgentToPanel(p, ag.label, ag.agent_id);

    // colócalos (uno detrás de otro, respetando alturas)
    const { placed, height } = placeBlock(agentPanels, y);
    finalPanels.push(...placed);
    y += height;
  }

  renumberPanelIds(finalPanels);

  // inserta panels y metadatos
  const dashboard: Dashboard = {
    ...base,
    title,
    panels: finalPanels,
  };
  if (GRAFANA_FOLDER_UID) dashboard["folderUid"] = GRAFANA_FOLDER_UID;

  // Upsert en Grafana (crea o actualiza por UID si base-meta trae "uid")
  const payload = {
    dashboard,
    folderUid: GRAFANA_FOLDER_UID || undefined,
    message: `reconcile ws=${workspaceId}`,
    overwrite: true,
  };

  const res = await grafanaFetch("/api/dashboards/db", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  // res: { id, uid, url, status, version, slug }
  return { id: res.id, uid: res.uid, url: res.url };
}

export async function buildAndUpsertLocalDashboard(title = "Monitor – Local") {
  // 1) Cargamos base y plantilla de “un agente”
  const base = loadBase();                 // objeto dashboard (solo meta)
  const rowTplPanels = loadLocalRowTemplate();  // array de panels (incluye la row + 5 panels)

  // 2) Un único “agente”: local-master
  const agentId = "local-master";
  const agentLabel = "Local";

  const agentPanels = clone(rowTplPanels);
  for (const p of agentPanels) applyAgentToPanel(p, agentLabel, agentId);

  // 3) Colocar ese bloque de panels empezando en y=0
  const { placed } = placeBlock(agentPanels, 0);
  renumberPanelIds(placed);

  // 4) Construir dashboard final
  const dashboard: Dashboard = {
    ...base,
    uid: "monitor-local",     // UID fijo para poder sobreescribir siempre la misma
    title,
    panels: placed,
    tags: Array.isArray(base.tags) ? Array.from(new Set([...(base.tags||[]), "auto", "local"])) : ["auto", "local"],
    time: base.time || { from: "now-3h", to: "now" },
    refresh: base.refresh || "5s",
  };

  // Si usas carpeta por UID, la respetamos. Si no, no pasa nada.
  const payload = {
    dashboard,
    folderUid: GRAFANA_FOLDER_UID || undefined,
    message: "reconcile local monitor",
    overwrite: true,
  };

  const res = await grafanaFetch("/api/dashboards/db", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  // res: { id, uid, url, status, version, slug }
  return { id: res.id, uid: res.uid, url: res.url };
}
