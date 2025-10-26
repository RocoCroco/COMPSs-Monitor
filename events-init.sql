-- ============================================
--  COMPSs Monitoring Database Initialization
-- ============================================

-- ============================================
--  Table: events (runtime-level events)
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id           BIGSERIAL PRIMARY KEY,
  ts           TIMESTAMPTZ NOT NULL,
  agent_id     TEXT        NOT NULL,   -- master name
  node_name    TEXT        NOT NULL,
  thread_type  TEXT        NOT NULL,   -- AP | TD | EXEC
  thread_id    BIGINT      NOT NULL,
  event_type   INT         NOT NULL,   -- TraceEventType code (e.g. 8001002 = RUNTIME)
  event_code   INT         NOT NULL,   -- TraceEvent ID (e.g. 47 = Execute tasks)
  event_name   TEXT        NOT NULL,   -- human-readable name
  is_end       BOOLEAN     NOT NULL DEFAULT FALSE,
  task_id      BIGINT,
  core_id      BIGINT,
  func_name    TEXT
);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_time
  ON events (ts);

CREATE INDEX IF NOT EXISTS idx_events_agent_time
  ON events (agent_id, ts);

CREATE INDEX IF NOT EXISTS idx_events_thread_time
  ON events (thread_type, thread_id, ts);


-- ============================================
--  Table: graph_events (dependency graph + app-level tracing)
-- ============================================
CREATE TABLE IF NOT EXISTS graph_events (
  id             BIGSERIAL PRIMARY KEY,
  ts             TIMESTAMPTZ NOT NULL,
  run_id         TEXT,                     -- optional: runtime execution UUID
  app_id         BIGINT      NOT NULL,     -- COMPSs application ID
  type           TEXT        NOT NULL,     -- e.g. dependency_added, task_analysis_start, barrier

  -- Common optional fields (for fast queries without JSON parsing)
  task_id        BIGINT,
  task_name      TEXT,
  producer_id    BIGINT,
  producer_name  TEXT,
  consumer_id    BIGINT,
  consumer_name  TEXT,
  data_id        INT,
  data_version   INT,
  edge_kind      TEXT,                     -- DATA_DEP | USER_DEP | STREAM_DEP
  group_name     TEXT,
  sync_id        INT,
  master_name    TEXT,                     -- name of the master process (for filtering)

  -- Generic payload for flexible extensions
  payload        JSONB
);

-- Indexes for graph_events
CREATE INDEX IF NOT EXISTS idx_graph_events_app_time
  ON graph_events (app_id, ts);

CREATE INDEX IF NOT EXISTS idx_graph_events_type_time
  ON graph_events (type, ts);

CREATE INDEX IF NOT EXISTS idx_graph_events_run_time
  ON graph_events (run_id, ts);

CREATE INDEX IF NOT EXISTS idx_graph_events_master_time
  ON graph_events (master_name, ts);


-- ============================================
--  End of initialization script
-- ============================================

