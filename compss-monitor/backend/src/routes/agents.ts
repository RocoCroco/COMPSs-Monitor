import { Router } from 'express';
import db from '../db.js';
import http from 'http';
import axios from 'axios';
import type { Agent } from '../types.js';

const r = Router();

function xEsc(s: string) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function processorsXml(cpu = 0, gpu = 0, fpga = 0) {
  const mk = (type: "CPU"|"GPU"|"FPGA", units: number) => `
        <processor>
          <name>MainProcessor</name>
          <type>${type}</type>
          <architecture>[unassigned]</architecture>
          <computingUnits>${units}</computingUnits>
          <internalMemory>-1.0</internalMemory>
          <propName>[unassigned]</propName>
          <propValue>[unassigned]</propValue>
          <speed>-1.0</speed>
        </processor>`;
  let out = "";
  if (cpu && cpu > 0) out += mk("CPU", cpu);
  if (gpu && gpu > 0) out += mk("GPU", gpu);
  if (fpga && fpga > 0) out += mk("FPGA", fpga);
  // Si no hay ningún processor, enviamos al menos 0 CPU? El API acepta sin processors, pero
  // por compatibilidad enviamos vacío (el ejemplo reduce no obliga). 
  return out;
}

function resourcesXml(spec: {
  cpu?: number; gpu?: number; fpga?: number;
  memorySize?: number; memoryType?: string;
  storageSize?: number; storageType?: string;
  osType?: string; osDistribution?: string; osVersion?: string;
}) {
  const {
    cpu=0, gpu=0, fpga=0,
    memorySize=0, memoryType='[unassigned]',
    storageSize=0, storageType='[unassigned]',
    osType='[unassigned]', osDistribution='[unassigned]', osVersion='[unassigned]',
  } = spec || {};
  return `
      <processors>
        ${processorsXml(cpu, gpu, fpga)}
      </processors>
      <memorySize>${memorySize}</memorySize>
      <memoryType>${xEsc(memoryType)}</memoryType>
      <storageSize>${storageSize}</storageSize>
      <storageType>${xEsc(storageType)}</storageType>
      <operatingSystemDistribution>${xEsc(osDistribution)}</operatingSystemDistribution>
      <operatingSystemType>${xEsc(osType)}</operatingSystemType>
      <operatingSystemVersion>${xEsc(osVersion)}</operatingSystemVersion>
      <pricePerUnit>-1.0</pricePerUnit>
      <priceTimeUnit>-1</priceTimeUnit>
      <value>0.0</value>
      <wallClockLimit>-1</wallClockLimit>`;
}

function buildLocalAddXML(workerName: string, spec: any) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<newResource>
  <externalResource>
    <name>${xEsc(workerName)}</name>
    <description>
${resourcesXml(spec)}
    </description>
    <adaptor>es.bsc.compss.agent.comm.CommAgentAdaptor</adaptor>
  </externalResource>
</newResource>`;
}

function buildLocalReduceXML(workerName: string, spec: any) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<reduceNode>
  <workerName>${xEsc(workerName)}</workerName>
  <resources>
${resourcesXml(spec)}
  </resources>
</reduceNode>`;
}

function buildExternalAddXML(workerHost: string, commPort: number, spec: any) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<newResource>
  <externalResource>
    <name>${xEsc(workerHost)}</name>
    <description>
${resourcesXml(spec)}
    </description>
    <adaptor>es.bsc.compss.agent.comm.CommAgentAdaptor</adaptor>
    <resourceConf xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="ResourcesExternalAdaptorProperties">
      <Property>
        <Name>Port</Name>
        <Value>${commPort}</Value>
      </Property>
    </resourceConf>
  </externalResource>
</newResource>`;
}


// ---- status SIN PARÁMETROS ----
r.get("/status", (req, res) => {
  const ip = req.query.ip as string | undefined;
  const port = Number(req.query.port);
  console.log("[agent-status] IN  ip=%s port=%s", ip, port);
  if (!ip || !port) return res.status(400).json({ error: "ip and port required" });

  const options = { hostname: ip, port, path: "/COMPSs/test", method: "GET", timeout: 1500 };
  const t0 = Date.now();
  const req2 = http.request(options, (resp) => {
    resp.resume();
    const ms = Date.now() - t0;
    console.log("[agent-status] UP %s:%s -> %s in %dms", ip, port, resp.statusCode, ms);
    if (resp.statusCode === 200) return res.send("OK");
    return res.status(resp.statusCode || 502).send("Error");
  });
  req2.on("timeout", () => { console.log("[agent-status] TIMEOUT %s:%s", ip, port); req2.destroy(new Error("timeout")); });
  req2.on("error", (err) => { console.log("[agent-status] ERR %s:%s -> %s", ip, port, err.message); res.status(502).send("Error connecting to the agent"); });
  req2.end();
});

// listar agentes de un workspace
r.get('/:workspaceId', (req, res) => {
  const w = Number(req.params.workspaceId);
  const rows = db.prepare('SELECT * FROM agents WHERE workspace_id=? ORDER BY id').all(w);
  res.json(rows);
});

// crear agente
r.post('/:workspaceId', (req, res) => {
  const w = Number(req.params.workspaceId);
  const { label, agent_id, rest_port, comm_port, events_port, metrics_port } = req.body || {};
  if (!label || !agent_id) return res.status(400).json({ error: 'label and agent_id required' });
  const stmt = db.prepare(`
    INSERT INTO agents(workspace_id,label,agent_id,rest_port,comm_port,events_port,metrics_port)
    VALUES (?,?,?,?,?,?,?)
  `);
  const info = stmt.run(w, label, agent_id, rest_port||null, comm_port||null, events_port||null, metrics_port||null);
  res.json({ id: info.lastInsertRowid });
});

// ---------- editar (parcial) un agente ----------
r.patch('/:workspaceId/:agentId', (req, res) => {
  const w = Number(req.params.workspaceId);
  const id = Number(req.params.agentId);

  // Campos permitidos
  const allowed = ['label', 'agent_id', 'rest_port', 'comm_port', 'events_port', 'metrics_port'] as const;
  const payload = req.body || {};

  // Filtra solo los campos válidos que vienen definidos
  const entries = Object.entries(payload).filter(([k, v]) => allowed.includes(k as any) && v !== undefined);

  if (entries.length === 0) return res.status(400).json({ error: 'no valid fields to update' });

  // Validaciones simples de tipo (puedes endurecerlas si quieres)
  for (const [k, v] of entries) {
    if (['rest_port','comm_port','events_port','metrics_port'].includes(k) && v !== null && typeof v !== 'number') {
      return res.status(400).json({ error: `field ${k} must be number or null` });
    }
    if (['label','agent_id'].includes(k) && v !== null && typeof v !== 'string') {
      return res.status(400).json({ error: `field ${k} must be string` });
    }
  }

  // Si cambia agent_id, evitamos duplicados en el mismo workspace
  const newAgentId = payload.agent_id as string | undefined;
  if (newAgentId) {
    const dup = db.prepare('SELECT id FROM agents WHERE workspace_id=? AND agent_id=? AND id<>?').get(w, newAgentId, id);
    if (dup) return res.status(409).json({ error: 'agent_id already exists in this workspace' });
  }

  // Construye SET dinámico
  const setClause = entries.map(([k]) => `${k}=@${k}`).join(', ');
  const params = Object.fromEntries(entries);
  const stmt = db.prepare(`UPDATE agents SET ${setClause} WHERE id=@id AND workspace_id=@workspace_id`);
  const info = stmt.run({ ...params, id, workspace_id: w });
  if (info.changes === 0) return res.status(404).json({ error: 'agent not found' });

  const row = db.prepare('SELECT * FROM agents WHERE id=? AND workspace_id=?').get(id, w);
  res.json(row);
});

// eliminar agente
r.delete('/:workspaceId/:agentId', (req, res) => {
  const w = Number(req.params.workspaceId);
  const id = Number(req.params.agentId);
  db.prepare('DELETE FROM agents WHERE id=? AND workspace_id=?').run(id, w);
  res.json({ ok: true });
});

r.get('/:workspaceId/:agentId/resources', (req, res) => {
  const w = Number(req.params.workspaceId);
  const id = Number(req.params.agentId);
  const filter = String(req.query.type || 'all').toLowerCase(); // local|external|all

  const row = db.prepare('SELECT * FROM agents WHERE id=? AND workspace_id=?').get(id, w) as Agent | undefined;
  if (!row) return res.status(404).json({ error: 'agent not found' });

  const ip = row.agent_id as string | undefined;
  const restPort = Number(row.rest_port);
  if (!ip || !restPort) {
    return res.status(400).json({ error: 'agent has no ip/rest_port configured' });
  }

  const options = {
    hostname: ip,
    port: restPort,
    path: '/COMPSs/resources',
    method: 'GET',
    timeout: 2500,
  };

  const httpReq = http.request(options, (resp: any) => {
    let data = '';
    resp.setEncoding('utf8');
    resp.on('data', (chunk: string) => (data += chunk));
    resp.on('end', () => {
      if (resp.statusCode !== 200) {
        return res.status(resp.statusCode || 502).json({ error: 'agent returned error', status: resp.statusCode });
      }
      try {
        const parsed = JSON.parse(data);
        const resources: any[] = Array.isArray(parsed?.resources) ? parsed.resources : [];

        const isLocal = (r: any) =>
          typeof r?.adaptor === 'string' && r.adaptor.includes('es.bsc.compss.types.COMPSsMaster');
        const isExternal = (r: any) =>
          typeof r?.adaptor === 'string' && r.adaptor.includes('es.bsc.compss.agent.comm.CommAgentWorker');

        let filtered = resources;
        if (filter === 'local') filtered = resources.filter(isLocal);
        else if (filter === 'external') filtered = resources.filter(isExternal);
        // 'all' → sin filtrar

        return res.json({
          workspace_id: w,
          agent_id: row.id,
          endpoint: `http://${ip}:${restPort}/COMPSs/resources`,
          type: filter,
          count: filtered.length,
          total: resources.length,
          resources: filtered,
          fetchedAt: new Date().toISOString(),
        });
      } catch (e: any) {
        return res.status(502).json({ error: 'invalid JSON from agent', details: e.message });
      }
    });
  });

  httpReq.on('timeout', () => {
    httpReq.destroy(new Error('timeout'));
    res.status(504).json({ error: 'timeout contacting agent' });
  });
  httpReq.on('error', (err: any) => {
    res.status(502).json({ error: 'error contacting agent', details: err.message });
  });
  httpReq.end();
});

/**
 * Añadir recursos LOCALES al agente
 * Body opcional: { workerName?, cpu?, gpu?, fpga?, memorySize?, memoryType?, storageSize?, storageType?, osType?, osDistribution?, osVersion? }
 */
r.post("/:workspaceId/:agentId/resources/local/add", async (req, res) => {
  const w = Number(req.params.workspaceId);
  const id = Number(req.params.agentId);
  const ag = db.prepare("SELECT * FROM agents WHERE id=? AND workspace_id=?").get(id, w) as Agent | undefined;
  if (!ag) return res.status(404).json({ error: "agent not found" });
  if (!ag.rest_port) return res.status(400).json({ error: "agent has no rest_port configured" });

  const workerName = (req.body?.workerName || ag.agent_id) as string;
  const xml = buildLocalAddXML(workerName, req.body || {});
  const url = `http://${ag.agent_id}:${ag.rest_port}/COMPSs/addResources`;

  try {
    const resp = await axios.put(url, xml, { headers: { "Content-Type": "application/xml" }, timeout: 5000 });
    return res.json({ ok: true, status: resp.status });
  } catch (e: any) {
    return res.status(502).json({ error: "addResources failed", detail: e?.message || String(e) });
  }
});

/**
 * Reducir recursos LOCALES del agente
 * Body opcional: { workerName?, cpu?, gpu?, fpga?, memorySize?, memoryType?, storageSize?, storageType?, osType?, osDistribution?, osVersion? }
 */
r.post("/:workspaceId/:agentId/resources/local/reduce", async (req, res) => {
  const w = Number(req.params.workspaceId);
  const id = Number(req.params.agentId);
  const ag = db.prepare("SELECT * FROM agents WHERE id=? AND workspace_id=?").get(id, w) as Agent | undefined;
  if (!ag) return res.status(404).json({ error: "agent not found" });
  if (!ag.rest_port) return res.status(400).json({ error: "agent has no rest_port configured" });

  const workerName = (req.body?.workerName || ag.agent_id) as string;
  const xml = buildLocalReduceXML(workerName, req.body || {});
  const url = `http://${ag.agent_id}:${ag.rest_port}/COMPSs/removeResources`;

  try {
    const resp = await axios.put(url, xml, { headers: { "Content-Type": "application/xml" }, timeout: 5000 });
    return res.json({ ok: true, status: resp.status });
  } catch (e: any) {
    return res.status(502).json({ error: "removeResources failed", detail: e?.message || String(e) });
  }
});

// === ADD EXTERNAL RESOURCES ===
// body: { workerHost: string, commPort: number, cpu?, gpu?, fpga?, memorySize?, memoryType?, storageSize?, storageType?, osType?, osDistribution?, osVersion? }
r.post("/:workspaceId/:agentId/resources/external/add", async (req, res) => {
  const w = Number(req.params.workspaceId);
  const id = Number(req.params.agentId);
  const ag = db.prepare("SELECT * FROM agents WHERE id=? AND workspace_id=?").get(id, w) as Agent | undefined;
  if (!ag) return res.status(404).json({ error: "agent not found" });
  if (!ag.rest_port) return res.status(400).json({ error: "agent has no rest_port configured" });

  const workerHost = String(req.body?.workerHost || "").trim();
  const commPort = Number(req.body?.commPort);
  if (!workerHost || !commPort) {
    return res.status(400).json({ error: "workerHost and commPort are required" });
  }

  const xml = buildExternalAddXML(workerHost, commPort, req.body || {});
  const url = `http://${ag.agent_id}:${ag.rest_port}/COMPSs/addResources`;

  try {
    const resp = await axios.put(url, xml, { headers: { "Content-Type": "application/xml" }, timeout: 8000 });
    return res.json({ ok: true, status: resp.status });
  } catch (e: any) {
    return res.status(502).json({ error: "addResources (external) failed", detail: e?.message || String(e) });
  }
});

// === REDUCE EXTERNAL RESOURCES ===
// body: { workerHost: string, cpu?, gpu?, fpga?, memorySize?, memoryType?, storageSize?, storageType?, osType?, osDistribution?, osVersion? }
r.post("/:workspaceId/:agentId/resources/external/reduce", async (req, res) => {
  const w = Number(req.params.workspaceId);
  const id = Number(req.params.agentId);
  const ag = db.prepare("SELECT * FROM agents WHERE id=? AND workspace_id=?").get(id, w) as Agent | undefined;
  if (!ag) return res.status(404).json({ error: "agent not found" });
  if (!ag.rest_port) return res.status(400).json({ error: "agent has no rest_port configured" });

  const workerHost = String(req.body?.workerHost || "").trim();
  if (!workerHost) return res.status(400).json({ error: "workerHost is required" });

  // reuse resourcesXml() para detallar qué se reduce (CPU/GPU/FPGA, etc.)
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<reduceNode>
  <workerName>${xEsc(workerHost)}</workerName>
  <resources>
${resourcesXml(req.body || {})}
  </resources>
</reduceNode>`;

  const url = `http://${ag.agent_id}:${ag.rest_port}/COMPSs/removeResources`;

  try {
    const resp = await axios.put(url, xml, { headers: { "Content-Type": "application/xml" }, timeout: 8000 });
    return res.json({ ok: true, status: resp.status });
  } catch (e: any) {
    return res.status(502).json({ error: "removeResources (external) failed", detail: e?.message || String(e) });
  }
});

r.post("/:workspaceId/:agentId/call", async (req, res) => {
  const w = Number(req.params.workspaceId);
  const id = Number(req.params.agentId);

  const ag = db.prepare("SELECT * FROM agents WHERE id=? AND workspace_id=?").get(id, w) as Agent | undefined;
  if (!ag) return res.status(404).json({ error: "agent not found" });
  if (!ag.rest_port) return res.status(400).json({ error: "agent has no rest_port configured" });

  // --- payload ---
  let {
    lang = "JAVA",
    className,
    methodName,
    cei,
    stop,
    forwardTo,
    params,
    parametersArray,
    rawParametersXml,
  } = req.body || {};

  if (!className || typeof className !== "string") {
    return res.status(400).json({ error: "className is required (e.g., pkg.Main or script.py)" });
  }

  // Normaliza lenguaje
  lang = String(lang).toUpperCase();
  if (lang !== "JAVA" && lang !== "PYTHON") {
    return res.status(400).json({ error: "lang must be JAVA or PYTHON" });
  }

  // Si nos pasan script.py, recortamos sufijo para PYTHON (igual que hace tu script)
  if (lang === "PYTHON" && className.endsWith(".py")) {
    className = className.slice(0, -3);
  }

  // methodName por defecto
  if (!methodName) {
    methodName = "main";
    // en JAVA, suele usarse array de parámetros con main(String[])
    if (lang === "JAVA" && parametersArray === undefined) {
      parametersArray = true;
    }
  }

  let parametersXml: string;
if (typeof rawParametersXml === "string" && rawParametersXml.trim()) {
  parametersXml = rawParametersXml.trim();
} else {
  // 2) si no, replica el bash:
  parametersXml = buildParametersXML(lang, Array.isArray(params) ? params.map(String) : [], !!parametersArray);
}

// monta el resto del XML igual que ya tenías
const ceiXml = cei ? `<ceiClass>${xEsc(cei)}</ceiClass>` : "";
const actionXml = stop
  ? `<action><actionName>stop</actionName>${
      Array.isArray(forwardTo) && forwardTo.length
        ? `<forwardTo>${forwardTo.map((h: string) => `<agent>http://${xEsc(h.trim())}</agent>`).join("")}</forwardTo>`
        : ""
    }</action>`
  : "";

  // --- XML final ---
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<startApplication>
  <lang>${xEsc(lang)}</lang>
  ${ceiXml}
  <className>${xEsc(className)}</className>
  <hasResult>false</hasResult>
  <methodName>${xEsc(methodName)}</methodName>
  ${actionXml}
  ${parametersXml}
</startApplication>`.trim();

  const url = `http://${ag.agent_id}:${ag.rest_port}/COMPSs/startApplication`;

  try {
    const resp = await axios.put(url, xml, {
      headers: { "Content-Type": "application/xml" },
      timeout: 15_000,
      // validateStatus por si el agente devuelve 202/204
      validateStatus: (s) => s >= 200 && s < 500,
    });
    if (resp.status >= 400) {
      return res.status(502).json({ error: "agent returned error", status: resp.status, data: resp.data });
    }
    return res.json({ ok: true, status: resp.status });
  } catch (e: any) {
    return res.status(502).json({ error: "call operation failed", detail: e?.message || String(e) });
  }
});

function buildParametersXML(langRaw: string, params: string[], arrayMode: boolean): string {
  const lang = String(langRaw).toUpperCase();
  const enc = (v: string) => {
    if (lang === "PYTHON") {
      // igual que el bash: base64("#" + param)
      return Buffer.from(`#${v}`).toString("base64");
    }
    return v;
  };

  if (arrayMode) {
    // ====== EQUIVALENTE A get_parameters_as_array ======
    // <parameters>
    //   <params paramId="0"> ... <type>OBJECT_T</type> <array> <componentClassname>java.lang.String</componentClassname>
    //     <values>
    //       <element paramId="i"><className>java.lang.String</className><value ...>enc(param)</value></element>
    //       ...
    //     </values>
    //   </array> </params>
    // </parameters>
    let xml = `
<parameters>
  <params paramId="0">
    <direction>IN</direction>
    <paramName>args</paramName>
    <prefix></prefix>
    <contentType></contentType>
    <stdIOStream>UNSPECIFIED</stdIOStream>
    <type>OBJECT_T</type>
    <array paramId="0">
      <componentClassname>java.lang.String</componentClassname>
      <values>`.trim();

    params.forEach((p, i) => {
      xml += `
        <element paramId="${i}">
          <className>java.lang.String</className>
          <value xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">${xEsc(enc(p))}</value>
        </element>`;
    });

    xml += `
      </values>
    </array>
  </params>
</parameters>`.trim();

    return xml;
  } else {
    // ====== EQUIVALENTE A get_parameters (uno a uno) ======
    // <parameters>
    //   <params paramId="i">
    //     <direction>IN</direction> ... <type>STRING_64_T</type>
    //     <element paramId="i"><className>java.lang.String</className><value ...>enc(param)</value></element>
    //   </params> ...
    // </parameters>
    let xml = `<parameters>`;
    params.forEach((p, i) => {
      xml += `
  <params paramId="${i}">
    <direction>IN</direction>
    <paramName></paramName>
    <prefix></prefix>
    <contentType></contentType>
    <stdIOStream>UNSPECIFIED</stdIOStream>
    <type>STRING_64_T</type>
    <element paramId="${i}">
      <className>java.lang.String</className>
      <value xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">${xEsc(enc(p))}</value>
    </element>
  </params>`;
    });
    xml += `
</parameters>`;
    return xml;
  }
}

export default r;
