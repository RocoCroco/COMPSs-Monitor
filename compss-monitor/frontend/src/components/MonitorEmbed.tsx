import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function MonitorEmbed(){
  const { data: cur } = useQuery({ queryKey:["settings"], queryFn: async()=> (await api.get("/settings")).data });
  const { data: url } = useQuery({
    queryKey:["embedUrl",cur?.current_workspace_id],
    enabled: !!cur?.current_workspace_id,
    queryFn: async()=> {
      const { data } = await api.post(`/workspaces/${cur.current_workspace_id}/sync-grafana`);
      return data.embedUrl as string;
    }
  });

  if (!url) return null;
  return <iframe src={url} className="w-full h-[80vh] border rounded"/>;
}
