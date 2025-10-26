from fastapi import FastAPI
import os, asyncpg, json
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

DB_DSN = os.environ.get("DB_DSN", "postgresql://events:events@events-db:5432/events")
app = FastAPI(title="COMPSs Events API")

class Event(BaseModel):
    ts: datetime
    agent_id: str
    node_name: str
    thread_type: str
    thread_id: int
    event_type: int
    event_code: int
    event_name: str
    is_end: bool = False
    task_id: Optional[int] = None
    core_id: Optional[int] = None
    func_name: Optional[str] = None  # <---- NUEVO

class GraphEvent(BaseModel):
    ts: datetime
    run_id: Optional[str] = None
    app_id: int
    type: str
    task_id: Optional[int] = None
    task_name: Optional[str] = None
    producer_id: Optional[int] = None
    producer_name: Optional[str] = None
    consumer_id: Optional[int] = None
    consumer_name: Optional[str] = None
    data_id: Optional[int] = None
    data_version: Optional[int] = None
    edge_kind: Optional[str] = None
    group_name: Optional[str] = None
    sync_id: Optional[int] = None
    master_name: Optional[str] = None
    payload: Optional[dict] = None

@app.on_event("startup")
async def startup():
    app.state.pool = await asyncpg.create_pool(dsn=DB_DSN, min_size=1, max_size=8)

@app.on_event("shutdown")
async def shutdown():
    await app.state.pool.close()

@app.post("/events")
async def ingest(events: List[Event]):
    stmt = """INSERT INTO events
      (ts, agent_id, node_name, thread_type, thread_id,
       event_type, event_code, event_name, is_end, task_id, core_id, func_name)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)"""
    async with app.state.pool.acquire() as con:
      await con.executemany(stmt, [
        (e.ts, e.agent_id, e.node_name, e.thread_type, e.thread_id,
         e.event_type, e.event_code, e.event_name, e.is_end, e.task_id, e.core_id, e.func_name)
        for e in events
      ])
    return {"inserted": len(events)}

@app.post("/graph-events")
async def ingest_graph(events: List[GraphEvent]):
    stmt = """
      INSERT INTO graph_events
        (ts, run_id, app_id, type,
         task_id, task_name, producer_id, producer_name,
         consumer_id, consumer_name, data_id, data_version,
         edge_kind, group_name, sync_id, master_name, payload)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    """
    rows = [
        (
            e.ts, e.run_id, e.app_id, e.type,
            e.task_id, e.task_name, e.producer_id, e.producer_name,
            e.consumer_id, e.consumer_name, e.data_id, e.data_version,
            e.edge_kind, e.group_name, e.sync_id, e.master_name,
            json.dumps(e.payload) if e.payload is not None else None   # <-- clave
        )
        for e in events
    ]
    async with app.state.pool.acquire() as con:
        await con.executemany(stmt, rows)
    return {"inserted": len(events)}

@app.get("/healthz")
async def health():
    return {"ok": True}

