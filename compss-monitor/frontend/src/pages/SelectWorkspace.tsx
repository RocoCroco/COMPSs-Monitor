// src/pages/SelectWorkspace.tsx
import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../lib/workspace-context";

export default function SelectWorkspace() {
  const { isLoading, workspaces, select, createAndSelect, refresh } = useWorkspace();
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSelect = (id: number) => {
    select(id);
    navigate("/agents"); // redirige donde prefieras como landing
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const ws = await createAndSelect(name.trim());
    setName("");
    navigate("/agents");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Select workspace</h1>

      {isLoading ? (
        <div className="text-sm text-neutral-500">Loading…</div>
      ) : workspaces.length === 0 ? (
        <div className="space-y-4">
          <p className="text-neutral-700">Start by creating your first workspace</p>
          <form onSubmit={handleCreate} className="flex items-center gap-2">
            <input
              className="border rounded-md px-3 py-2 flex-1"
              placeholder="Workspace name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              type="submit"
              className="rounded-md bg-black hover:bg-gray-700 text-white px-4 py-2"
            >
              Create
            </button>
          </form>
        </div>
      ) : (
        
        <div className="space-y-6">
            <div className="border-b pb-6">
            <h2 className="text-lg font-medium mb-2">Create new workspace</h2>
            <form onSubmit={handleCreate} className="flex items-center gap-2">
              <input
                className="border rounded-md px-3 py-2 flex-1"
                placeholder="Workspace name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                type="submit"
                className="rounded-md bg-black hover:bg-gray-700 text-white px-4 py-2"
              >
                Create
              </button>
              <button
                type="button"
                onClick={refresh}
                className="rounded-md border px-4 py-2 hover:bg-neutral-100"
              >
                Refresh
              </button>
            </form>
          </div>
          <div className="rounded-md border">
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => handleSelect(w.id)}
                className="w-full flex justify-between items-center px-4 py-3 border-b hover:bg-neutral-100"
              >
                <span>{w.name}</span>
                <span className="text-xs text-neutral-500">Select</span>
              </button>
            ))}
          </div>

          
        </div>
      )}
    </div>
  );
}
