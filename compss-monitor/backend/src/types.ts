export interface Workspace {
  id: number;
  name: string;
  created_at: string;
}

export interface Agent {
  id: number;
  workspace_id: number;
  label: string;
  agent_id: string;
  rest_port: number;
  comm_port: number;
  events_port: number;
  metrics_port: number;
  created_at: string;
  updated_at: string;
}

