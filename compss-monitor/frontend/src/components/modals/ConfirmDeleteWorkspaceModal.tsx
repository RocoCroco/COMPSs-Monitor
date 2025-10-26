// src/components/modals/ConfirmDeleteWorkspaceModal.tsx
import { useEffect, useRef, useState } from "react";

type Props = {
  name: string;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void; // se llama solo si el nombre coincide
};

export default function ConfirmDeleteWorkspaceModal({ name, open, onCancel, onConfirm }: Props) {
  const [typed, setTyped] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const canDelete = typed.trim() === name;

  useEffect(() => {
    if (open) {
      setTyped("");
      setSubmitting(false);
      // focus al input
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-white shadow-lg border">
          <div className="px-5 py-4 border-b">
            <h2 className="text-lg font-semibold">Delete workspace</h2>
            <p className="text-sm text-neutral-600 mt-1">
              This action <span className="font-semibold">cannot be undone</span>. Type the workspace name to confirm:
            </p>
            <p className="mt-1 text-sm">
              <code className="px-1 py-0.5 rounded bg-neutral-100">{name}</code>
            </p>
          </div>
          <div className="px-5 py-4 space-y-3">
            <input
              ref={inputRef}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Type workspace name exactly…"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!canDelete) return;
                  try {
                    setSubmitting(true);
                    await onConfirm();
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={!canDelete || submitting}
                className="rounded-md bg-red-600 text-white px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {submitting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
