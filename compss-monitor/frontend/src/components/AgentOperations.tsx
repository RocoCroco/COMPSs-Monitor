// src/components/AgentOperations.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { Agent } from "../lib/agents";
import { callAgentOperation, type CallOperationPayload } from "../lib/agents";
import { useWorkspace } from "../lib/workspace-context";
import { Play, Code, List, ChevronDown } from "lucide-react";

export default function AgentOperations({ agent }: { agent: Agent }) {
  const { currentWorkspace } = useWorkspace();

  // Form state
  const [lang, setLang] = useState<"JAVA" | "PYTHON">("JAVA");
  const [className, setClassName] = useState<string>("");
  const [methodName, setMethodName] = useState<string>("main");
  const [cei, setCei] = useState<string>("");

  // Modo parámetros
  const [paramMode, setParamMode] = useState<"simple" | "xml">("simple");
  const [parametersArray, setParametersArray] = useState<boolean>(true); // útil para JAVA main(String[])
  const [paramsText, setParamsText] = useState<string>("");              // 1 arg por línea
  const [rawParametersXml, setRawParametersXml] = useState<string>("");

  // Acción stop / forward
  const [stop, setStop] = useState(false);
  const [forwardToText, setForwardToText] = useState<string>(""); // separados por coma o nueva línea

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // expand/collapse de "Advanced"
  const [advOpen, setAdvOpen] = useState(false);
  const advRef = useRef<HTMLDivElement | null>(null);
  const advInnerRef = useRef<HTMLDivElement | null>(null);
  const [advHeight, setAdvHeight] = useState(0);
  useEffect(() => {
    if (!advOpen) return;
    const measure = () => setAdvHeight(advInnerRef.current?.scrollHeight || 0);
    measure();
    const id = requestAnimationFrame(measure);
    const onR = () => measure();
    window.addEventListener("resize", onR);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", onR);
    };
  }, [advOpen, lang, parametersArray, paramMode]);

  // defaults al cambiar lenguaje
  useEffect(() => {
    if (lang === "JAVA") {
      setMethodName((m) => m || "main");
      setParametersArray(true);
    } else {
      // PYTHON: método típico también "main", pero no hace falta array
      setParametersArray(false);
    }
  }, [lang]);

  const parsedParams: string[] = useMemo(() => {
    return paramsText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [paramsText]);

  const forwardToList: string[] = useMemo(() => {
    return forwardToText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [forwardToText]);

  const canSubmit = !!currentWorkspace?.id && !!agent?.id && className.trim().length > 0 && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentWorkspace || !agent) return;

    try {
      setSubmitting(true);
      setMessage(null);

      const payload: CallOperationPayload = {
        lang,
        className: className.trim(),
        methodName: methodName.trim() || undefined,
        cei: cei.trim() || undefined,
        stop: stop || undefined,
        forwardTo: stop && forwardToList.length ? forwardToList : undefined,
      };

      if (paramMode === "xml") {
        payload.rawParametersXml = rawParametersXml.trim();
      } else {
        payload.params = parsedParams;
        payload.parametersArray = parametersArray;
      }

      const out = await callAgentOperation(currentWorkspace.id, agent.id, payload);
      setMessage({ kind: "ok", text: `Operation sent (HTTP ${out.status}).` });
    } catch (e: any) {
      const errText = e?.response?.data?.error
        ? `${e.response.data.error}${e.response.data.status ? ` (status ${e.response.data.status})` : ""}`
        : (e?.message || "Failed to send operation");
      setMessage({ kind: "err", text: errText });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-md border bg-white">
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-medium">Call operation</h2>
        <div className="text-xs text-neutral-500 mt-1">
          Send a program to execute on the selected agent.
        </div>
      </div>

      <form onSubmit={onSubmit} className="p-4 space-y-4">
        {/* Básicos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Language">
            <select
              className="w-full rounded-md border px-3 py-2 bg-white"
              value={lang}
              onChange={(e) => setLang(e.target.value as "JAVA" | "PYTHON")}
            >
              <option value="JAVA">JAVA</option>
              <option value="PYTHON">PYTHON</option>
            </select>
          </Field>

          <Field label={lang === "PYTHON" ? "Script (e.g. script.py)" : "Class name (e.g. pkg.Main)"}>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder={lang === "PYTHON" ? "script.py" : "com.example.Main"}
              required
            />
          </Field>

          <Field label="Method name">
            <input
              className="w-full rounded-md border px-3 py-2"
              value={methodName}
              onChange={(e) => setMethodName(e.target.value)}
              placeholder="main"
            />
          </Field>
          {lang === "JAVA" &&<Field label="CEI class (optional)">
            <input
              className="w-full rounded-md border px-3 py-2"
              value={cei}
              onChange={(e) => setCei(e.target.value)}
              placeholder="com.example.MyCEI"
            />
          </Field>}
          
        </div>

        {/* Parámetros */}
        <div className="rounded-md border">
          <div className="px-3 py-2 border-b flex items-center gap-2">
            <button
              type="button"
              onClick={() => setParamMode("simple")}
              className={[
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm",
                paramMode === "simple" ? "bg-neutral-200" : "hover:bg-neutral-100",
              ].join(" ")}
            >
              <List className="h-4 w-4" /> Simple
            </button>
            <button
              type="button"
              onClick={() => setParamMode("xml")}
              className={[
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm",
                paramMode === "xml" ? "bg-neutral-200" : "hover:bg-neutral-100",
              ].join(" ")}
              title="Provide raw <parameters> XML"
            >
              <Code className="h-4 w-4" /> Raw XML
            </button>

            {paramMode === "simple" && (
              <label className="ml-auto inline-flex items-center gap-2 text-sm px-2 py-1">
                <input
                  type="checkbox"
                  className="rounded border"
                  checked={parametersArray}
                  onChange={(e) => setParametersArray(e.target.checked)}
                />
                Send as array (main(String[]))
              </label>
            )}
          </div>

          {paramMode === "simple" ? (
            <div className="p-3">
              <Field label="Arguments (one per line)">
                <textarea
                  className="w-full rounded-md border px-3 py-2 min-h-[120px] font-mono"
                  value={paramsText}
                  onChange={(e) => setParamsText(e.target.value)}
                  placeholder={"--input /data/a\n--threads 8\n--verbose"}
                />
              </Field>
              <div className="text-xs text-neutral-500 mt-2">
                For PYTHON, each argument is encoded on the agent (like your bash).
              </div>
            </div>
          ) : (
            <div className="p-3">
              <Field label="&lt;parameters&gt; XML">
                <textarea
                  className="w-full rounded-md border px-3 py-2 min-h-[160px] font-mono"
                  value={rawParametersXml}
                  onChange={(e) => setRawParametersXml(e.target.value)}
                  placeholder={`<parameters>\n  ...\n</parameters>`}
                />
              </Field>
              <div className="text-xs text-neutral-500 mt-2">
                If provided, this raw XML will be used instead of the simple arguments.
              </div>
            </div>
          )}
        </div>

        {/* Acción stop / forward */}
        <div className="rounded-md border">
          <button
            type="button"
            onClick={() => setAdvOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2"
          >
            <span className="text-sm font-medium">Advanced (stop / forward)</span>
            <ChevronDown className={["h-4 w-4 transition-transform", advOpen ? "rotate-180" : "rotate-0"].join(" ")} />
          </button>

          <div
            ref={advRef}
            className="overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out border-t"
            style={{
              maxHeight: advOpen ? advHeight : 0,
              opacity: advOpen ? 1 : 0,
              transform: advOpen ? "translateY(0)" : "translateY(-6px)",
            }}
          >
            <div ref={advInnerRef} className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded border" checked={stop} onChange={(e) => setStop(e.target.checked)} />
                Send stop action
              </label>
              <Field label="Forward to (comma or newline separated)">
                <textarea
                  className="w-full rounded-md border px-3 py-2 min-h-[80px] font-mono"
                  value={forwardToText}
                  onChange={(e) => setForwardToText(e.target.value)}
                  placeholder={"127.0.0.2\nagent.domain\n10.0.0.5"}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Mensaje */}
        {message && (
          <div
            className={[
              "text-sm rounded-md px-3 py-2 border",
              message.kind === "ok" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700",
            ].join(" ")}
          >
            {message.text}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-md bg-orange-600 hover:bg-orange-400 text-white px-3 py-1.5 text-sm disabled:bg-neutral-300"
          >
            <Play className="h-4 w-4" />
            {submitting ? "Sending…" : "Send operation"}
          </button>
          <div className="text-xs text-neutral-500">
            Target agent: <span className="font-medium">{agent.label}</span> ({agent.agent_id}:{agent.rest_port ?? "?"})
          </div>
        </div>
      </form>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1">
      <div className="text-neutral-500">{label}</div>
      {children}
    </label>
  );
}
