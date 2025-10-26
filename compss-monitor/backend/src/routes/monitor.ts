// src/routes/monitor.ts
import { Router } from 'express';
import db from '../db.js';
import { buildAndUpsertDashboard, buildAndUpsertLocalDashboard } from '../grafana.js';
import { Workspace } from '../types.js';

const r = Router();

// genera/actualiza el dashboard del workspace y devuelve la URL para embeber
r.post('/reconcile/:workspaceId', async (req, res) => {
  const w = Number(req.params.workspaceId);
  const ws = db.prepare('SELECT * FROM workspaces WHERE id=?').get(w) as Workspace | undefined;
  if (!ws) return res.status(404).json({ error: 'workspace not found' });

  const { from, to, refresh } = req.body || {};   // <--- NUEVO
  const title = `Monitor – ${ws.name}`;
  const out = await buildAndUpsertDashboard(w, title);

  // Parámetros de tiempo/refresco para el iframe (opcionales)
  const base = process.env.GRAFANA_URL ?? 'http://localhost:3000';
  const url  = `${base}${out.url}`;

  let iframeUrl = `${url}?kiosk`;  // kiosk simple

  const qp = new URLSearchParams();
  if (from)    qp.set('from', from);
  if (to)      qp.set('to', to);
  if (refresh) qp.set('refresh', refresh);

  if ([...qp].length > 0) {
    iframeUrl += `&${qp.toString()}`;
  }

  return res.json({
    uid: out.uid,
    url: out.url,
    iframe: iframeUrl
  });
});

/**
 * Regenera la dashboard local (uid fija) para agent_id = "local-master".
 */
r.post('/local/reconcile', async (req, res) => {   // <--- acepta body también
  try {
    const { from, to, refresh } = req.body || {};  // <--- NUEVO
    const title = 'Monitor – Local';
    const out = await buildAndUpsertLocalDashboard(title);

    const base = process.env.GRAFANA_URL ?? 'http://localhost:3000';
    const url  = `${base}${out.url}`;

    let iframeUrl = `${url}?kiosk`;  // kiosk simple

    const qp = new URLSearchParams();
    if (from)    qp.set('from', from);
    if (to)      qp.set('to', to);
    if (refresh) qp.set('refresh', refresh);

    if ([...qp].length > 0) {
      iframeUrl += `&${qp.toString()}`;
    }

    return res.json({
      uid: out.uid,
      url: out.url,
      iframe: iframeUrl
    });
  } catch (err: any) {
    res.status(500).send(String(err?.stack || err?.message || err));
  }
});

export default r;