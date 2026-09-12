"use client";

import { useState } from "react";
import { useWizardStore } from "@/store";
import FormField from "@/components/ui/FormField";
import AddItemList from "@/components/ui/AddItemList";
import { Loader, Download, Lock, Play, ChevronDown, ChevronRight } from "lucide-react";
import type { McpDef, McpToolSchema } from "@/lib/types";

const isTemplateUrl = (url: string) => url.includes("a2d-ai.com");

function McpToolTester({ mcp, selectedTool, setSelectedTool, onSchemasLoaded }: {
  mcp: McpDef;
  selectedTool: string;
  setSelectedTool: (t: string) => void;
  onSchemasLoaded: (schemas: McpToolSchema[]) => void;
}) {
  const tools = mcp.tools ?? [];
  const active = selectedTool || tools[0] || "";
  const [open, setOpen] = useState(false);
  const [schemaFetching, setSchemaFetching] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState<number | null>(null);

  // Auto-fetch schemas when opening if not already loaded
  const handleOpen = async () => {
    const nowOpen = !open;
    setOpen(nowOpen);
    if (nowOpen && !mcp.toolSchemas?.length && mcp.url.trim() && !schemaFetching) {
      setSchemaFetching(true);
      try {
        const res = await fetch("/api/fetch-mcp-tools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: mcp.url }),
        });
        const data = await res.json();
        if (data.ok && data.tools?.length) onSchemasLoaded(data.tools as McpToolSchema[]);
      } catch { /* silent */ }
      finally { setSchemaFetching(false); }
    }
  };

  const schema = mcp.toolSchemas?.find(s => s.name === active);
  const properties = schema?.inputSchema?.properties ?? {};
  const required = schema?.inputSchema?.required ?? [];
  const paramKeys = Object.keys(properties);
  const inputKeys = paramKeys.length > 0 ? paramKeys : (schema ? [] : ["input"]);

  const setField = (key: string, val: string) => setFields(f => ({ ...f, [key]: val }));

  const handleRun = async () => {
    setState("loading");
    setResult(null);
    setError("");
    const start = Date.now();
    const params: Record<string, unknown> = {};
    if (paramKeys.length > 0) {
      paramKeys.forEach(k => {
        if (fields[k] !== undefined && fields[k] !== "") {
          const propType = properties[k]?.type;
          params[k] = propType === "number" ? Number(fields[k]) : fields[k];
        }
      });
    } else if (fields["input"]) {
      params["input"] = fields["input"];
    }
    const res = await fetch("/api/test-mcp-tool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: mcp.url, tool: active, params }),
    });
    const data = await res.json();
    setElapsed(Date.now() - start);
    if (data.ok) { setState("ok"); setResult(data.result); }
    else { setState("error"); setError(data.error ?? "Unknown error."); }
  };

  const canRun = !required.some(k => !fields[k]?.trim()) && state !== "loading";

  return (
    <div className="mt-1 rounded-lg border border-dashed border-violet-200 overflow-hidden">
      <button type="button" onClick={handleOpen}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-violet-600 hover:text-violet-800 hover:bg-violet-50/60 transition-colors">
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        Try it
        {schemaFetching && <Loader size={10} className="animate-spin ml-1 text-violet-400" />}
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2 border-t border-dashed border-violet-100 bg-violet-50/30">
          {tools.length > 1 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Tool</span>
              <select value={active} onChange={e => { setSelectedTool(e.target.value); setState("idle"); setFields({}); }}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-blue-500 focus:outline-none">
                {tools.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          {schema?.description && (
            <p className="text-[11px] text-gray-400 mt-1">{schema.description}</p>
          )}
          <div className="flex flex-col gap-2 mt-1">
            {inputKeys.map(key => {
              const prop = properties[key];
              const isReq = required.includes(key);
              return (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-500">
                    {key}{isReq && <span className="text-red-400 ml-0.5">*</span>}
                    {prop?.description && <span className="font-normal text-gray-400 ml-1">({prop.description})</span>}
                  </label>
                  <input type="text" value={fields[key] ?? ""} onChange={e => setField(key, e.target.value)}
                    placeholder={prop?.type === "string" ? `string` : prop?.type ?? "value"}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10" />
                </div>
              );
            })}
          </div>
          <button type="button" onClick={handleRun}
            disabled={!canRun}
            className="self-start flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
            {state === "loading" ? <Loader size={12} className="animate-spin" /> : <Play size={12} />}
            {state === "loading" ? "Running…" : "Run"}
          </button>
          {(state === "ok" || state === "error") && (
            <div className={`rounded-lg border text-xs font-mono p-3 leading-relaxed whitespace-pre-wrap overflow-x-auto ${
              state === "ok" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-700"
            }`}>
              {state === "ok" ? JSON.stringify(result, null, 2) : error}
              {elapsed && state === "ok" && <span className="block mt-1 text-emerald-500 text-[10px]">{elapsed}ms</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function McpRow({ mcp, index }: { mcp: McpDef; index: number }) {
  const config = useWizardStore((s) => s.config);
  const updateConfig = useWizardStore((s) => s.updateConfig);

  const [fetchState, setFetchState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [fetchError, setFetchError] = useState("");
  const [urlOverride, setUrlOverride] = useState(false);
  const [selectedTool, setSelectedTool] = useState("");

  const updateMcp = (patch: Partial<McpDef>) => {
    const mcps = [...config.mcps];
    mcps[index] = { ...mcps[index], ...patch };
    updateConfig({ mcps });
  };

  const updateTool = (ti: number, value: string) => {
    const mcps = [...config.mcps];
    const tools = [...(mcps[index].tools ?? [])];
    tools[ti] = value;
    mcps[index] = { ...mcps[index], tools };
    updateConfig({ mcps });
  };

  const handleFetch = async () => {
    if (!mcp.url.trim()) return;
    setFetchState("loading");
    setFetchError("");
    try {
      const res = await fetch("/api/fetch-mcp-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: mcp.url }),
      });
      const data = await res.json();
      if (data.ok && data.tools?.length) {
        const patch: Partial<McpDef> = {
          tools: data.tools.map((t: McpToolSchema) => t.name),
          toolSchemas: data.tools,
        };
        if (data.name && !mcp.name.trim()) patch.name = data.name;
        updateMcp(patch);
        setFetchState("ok");
      } else if (data.ok && !data.tools?.length) {
        setFetchState("error");
        setFetchError("MCP responded but returned no tools.");
      } else {
        setFetchState("error");
        setFetchError(data.error ?? "Could not fetch tools.");
      }
    } catch {
      setFetchState("error");
      setFetchError("Network error.");
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-gray-50 rounded-lg border border-gray-200 p-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="MCP Name" required>
          <input
            type="text"
            value={mcp.name}
            onChange={(e) => updateMcp({ name: e.target.value })}
            placeholder="e.g. Document MCP"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          />
        </FormField>

        <FormField label="URL" hint={isTemplateUrl(mcp.url) && !urlOverride ? undefined : "Paste the MCP URL. Tools will auto-populate."}>
          {isTemplateUrl(mcp.url) && !urlOverride ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-400">
                <Lock size={12} className="flex-shrink-0 text-gray-300" />
                <span>Demo endpoint (pre-configured)</span>
              </div>
              <button
                type="button"
                onClick={() => setUrlOverride(true)}
                className="flex-shrink-0 text-xs text-blue-500 hover:text-blue-700 transition-colors px-1"
              >
                Edit
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={mcp.url}
                onChange={(e) => { updateMcp({ url: e.target.value }); setFetchState("idle"); }}
                onBlur={(e) => { if (e.target.value.trim()) handleFetch(); }}
                placeholder="https://.../mcp/"
                className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
              />
              <button
                type="button"
                onClick={handleFetch}
                disabled={!mcp.url.trim() || fetchState === "loading"}
                title="Fetch MCP tools list"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm flex-shrink-0"
              >
                {fetchState === "loading"
                  ? <Loader size={13} className="animate-spin text-blue-500" />
                  : <Download size={13} />}
                {fetchState === "loading" ? "Fetching…" : "Fetch"}
              </button>
            </div>
          )}
          {fetchState === "ok" && (
            <p className="text-[11px] text-emerald-600 mt-1">Tools imported from MCP server.</p>
          )}
          {fetchState === "error" && (
            <p className="text-[11px] text-amber-600 mt-1">{fetchError} Add tools manually below.</p>
          )}
        </FormField>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Tools</p>
        <AddItemList
          items={mcp.tools ?? []}
          addLabel="Add Tool"
          emptyLabel="No tools. Paste the MCP URL above and click Fetch, or add manually."
          onAdd={() => updateMcp({ tools: [...(mcp.tools ?? []), ""] })}
          onRemove={(ti) => updateMcp({ tools: (mcp.tools ?? []).filter((_, idx) => idx !== ti) })}
          renderItem={(tool, ti) => (
            <input
              type="text"
              value={tool}
              onChange={(e) => updateTool(ti, e.target.value)}
              placeholder="tool_name"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
            />
          )}
        />
      </div>

      {mcp.url.trim() && (mcp.tools ?? []).length > 0 && (
        <McpToolTester
          mcp={mcp}
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
          onSchemasLoaded={(schemas) => updateMcp({ toolSchemas: schemas })}
        />
      )}
    </div>
  );
}

export default function Step4MCPs() {
  const config = useWizardStore((s) => s.config);
  const updateConfig = useWizardStore((s) => s.updateConfig);

  return (
    <div className="flex flex-col gap-4">
      <AddItemList
        items={config.mcps}
        addLabel="Add MCP Server"
        emptyLabel="No MCP servers added yet. MCPs expose tools your broker can call directly."
        onAdd={() => updateConfig({ mcps: [...config.mcps, { name: "", url: "", tools: [] }] })}
        onRemove={(i) => updateConfig({ mcps: config.mcps.filter((_, idx) => idx !== i) })}
        renderItem={(mcp, i) => <McpRow key={i} mcp={mcp} index={i} />}
      />
    </div>
  );
}
