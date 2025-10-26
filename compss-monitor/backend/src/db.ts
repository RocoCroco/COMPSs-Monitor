import Database from 'better-sqlite3';
import dotenv from 'dotenv';
dotenv.config();

const db = new Database(process.env.DB_FILE || './monitor.db');
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS workspaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  agent_id TEXT NOT NULL,  -- ej: "127.0.0.1" (lo que usas en tus queries)
  rest_port INTEGER,
  comm_port INTEGER,
  events_port INTEGER,
  metrics_port INTEGER,
  UNIQUE(workspace_id, agent_id),
  FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);
`);

export default db;