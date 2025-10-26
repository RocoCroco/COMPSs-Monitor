import { Router } from 'express';
import db from '../db.js';

const r = Router();

r.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM workspaces ORDER BY id').all();
  res.json(rows);
});

r.post('/', (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const info = db.prepare('INSERT INTO workspaces(name) VALUES (?)').run(name);
  res.json({ id: info.lastInsertRowid, name });
});

r.delete('/:workspaceId', (req, res) => {
  const w = Number(req.params.workspaceId);
  if (!Number.isFinite(w)) return res.status(400).json({ error: 'invalid workspace id' });

  const info = db.prepare('DELETE FROM workspaces WHERE id=?').run(w);
  if (info.changes === 0) return res.status(404).json({ error: 'workspace not found' });
  res.json({ ok: true });
});

export default r;