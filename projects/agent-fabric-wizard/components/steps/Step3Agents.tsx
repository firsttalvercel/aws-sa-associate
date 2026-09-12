"use client";

import { useState } from "react";
import { useWizardStore } from "@/store";
import FormField from "@/components/ui/FormField";
import AddItemList from "@/components/ui/AddItemList";
import TryItPanel from "@/components/ui/TryItPanel";
import { Loader, Download, Lock } from "lucide-react";
import type { AgentDef } from "@/lib/types";

const isTemplateUrl = (url: string) => url.includes("a2d-ai.com");

const defaultMessage = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("credit")) return "Run a credit check for applicant John Smith, requested loan 25000";
  if (n.includes("document") || n.includes("verif")) return "Verify the documents for this loan application";
  if (n.includes("fraud")) return "Run a fraud check on this loan application";
  return `Send a test message to ${name}`;
};

function AgentRow({ agent, index }: { agent: AgentDef; index: number }) {
  const config = useWizardStore((s) => s.config);
  const updateConfig = useWizardStore((s) => s.updateConfig);

  const [fetchState, setFetchState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [fetchError, setFetchError] = useState("");
  const [urlOverride, setUrlOverride] = useState(false);

  const agentType = agent.agentType ?? "a2a";

  const updateAgent = (patch: Partial<AgentDef>) => {
    const agents = [...config.agents];
    agents[index] = { ...agents[index], ...patch };
    updateConfig({ agents });
  };

  const updateSkill = (si: number, patch: { id?: string; description?: string }) => {
    const agents = [...config.agents];
    const skills = [...(agents[index].skills ?? [])];
    skills[si] = { ...skills[si], ...patch };
    agents[index] = { ...agents[index], skills };
    updateConfig({ agents });
  };

  const handleFetch = async () => {
    if (!agent.url.trim()) return;
    setFetchState("loading");
    setFetchError("");
    try {
      const res = await fetch("/api/fetch-agent-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: agent.url }),
      });
      const data = await res.json();
      if (data.ok) {
        const patch: Partial<AgentDef> = {};
        if (data.name && !agent.name.trim()) patch.name = data.name;
        if (data.skills?.length) patch.skills = data.skills;
        updateAgent(patch);
        setFetchState("ok");
      } else {
        setFetchState("error");
        setFetchError(data.error ?? "Could not fetch agent card.");
      }
    } catch {
      setFetchState("error");
      setFetchError("Network error.");
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-gray-50 rounded-lg border border-gray-200 p-4">
      {/* Type toggle */}
      <div className="flex gap-2">
        {(["a2a", "subagent"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => updateAgent({ agentType: t })}
            className="px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
            style={agentType === t ? {
              background: t === "a2a" ? "#059669" : "#7c3aed",
              borderColor: t === "a2a" ? "#047857" : "#6d28d9",
              color: "#fff",
            } : {
              background: "#fff",
              borderColor: "#e5e7eb",
              color: "#6b7280",
            }}
          >
            {t === "a2a" ? "A2A Agent" : "Inline Subagent"}
          </button>
        ))}
        <span className="text-[11px] text-gray-400 self-center ml-1">
          {agentType === "a2a"
            ? "External service called via the A2A protocol. Requires a URL and skills."
            : "Inline LLM node defined by a system prompt. No external URL needed."}
        </span>
      </div>

      {agentType === "a2a" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Agent Name" required>
              <input
                type="text"
                value={agent.name}
                onChange={(e) => updateAgent({ name: e.target.value })}
                placeholder="e.g. Credit Scoring Agent"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
              />
            </FormField>

            <FormField label="A2A URL" hint={isTemplateUrl(agent.url) && !urlOverride ? undefined : "Paste the agent URL. Skills will auto-populate."}>
              {isTemplateUrl(agent.url) && !urlOverride ? (
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
                    value={agent.url}
                    onChange={(e) => { updateAgent({ url: e.target.value }); setFetchState("idle"); }}
                    onBlur={(e) => { if (e.target.value.trim()) handleFetch(); }}
                    placeholder="https://..."
                    className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  />
                  <button
                    type="button"
                    onClick={handleFetch}
                    disabled={!agent.url.trim() || fetchState === "loading"}
                    title="Fetch agent card and auto-populate skills"
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
                <p className="text-[11px] text-emerald-600 mt-1">Skills imported from agent card.</p>
              )}
              {fetchState === "error" && (
                <p className="text-[11px] text-amber-600 mt-1">{fetchError} Add skills manually below.</p>
              )}
            </FormField>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Skills</p>
            <AddItemList
              items={agent.skills ?? []}
              addLabel="Add Skill"
              emptyLabel="No skills. Paste the agent URL above and click Fetch, or add manually."
              onAdd={() => updateAgent({ skills: [...(agent.skills ?? []), { id: "", description: "" }] })}
              onRemove={(si) => updateAgent({ skills: (agent.skills ?? []).filter((_, idx) => idx !== si) })}
              renderItem={(skill, si) => (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skill.id}
                    onChange={(e) => updateSkill(si, { id: e.target.value })}
                    placeholder="skill-id"
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  />
                  <input
                    type="text"
                    value={skill.description ?? ""}
                    onChange={(e) => updateSkill(si, { description: e.target.value })}
                    placeholder="Description (optional)"
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              )}
            />
          </div>

          {agent.url.trim() && (
            <TryItPanel
              defaultInput={defaultMessage(agent.name)}
              onRun={async (input) => {
                const res = await fetch("/api/test-broker", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ url: agent.url, message: input }),
                });
                const data = await res.json();
                return { ok: data.ok, result: data.body, error: data.error };
              }}
            />
          )}
        </>
      ) : (
        /* Subagent — name, system prompt, and which agents/tools it can call */
        <div className="flex flex-col gap-3">
          <FormField label="Subagent Name" required>
            <input
              type="text"
              value={agent.name}
              onChange={(e) => updateAgent({ name: e.target.value })}
              placeholder="e.g. Risk Assessor"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
            />
          </FormField>
          <FormField label="System Prompt" hint="What this subagent does and how it should reason">
            <textarea
              value={agent.systemPrompt ?? ""}
              onChange={(e) => updateAgent({ systemPrompt: e.target.value })}
              placeholder="e.g. You are a risk assessor. Given credit score, fraud check, and document verification results, produce a final risk verdict: LOW, MEDIUM, or HIGH."
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 resize-none"
            />
          </FormField>
          {/* Available actions — which A2A agents and MCP tools this subagent can call */}
          {(() => {
            const otherAgents = config.agents
              .filter((a, i) => i !== index && a.agentType !== "subagent" && a.name)
              .map(a => ({ value: a.name, label: a.name, kind: "A2A" as const }));
            const mcpTools = config.mcps.flatMap(m =>
              (m.tools ?? []).filter(Boolean).map(t => ({ value: t, label: `${t} (${m.name})`, kind: "MCP" as const }))
            );
            const allOptions = [...otherAgents, ...mcpTools];
            if (!allOptions.length) return (
              <p className="text-[11px] text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                No agents or MCP tools available to connect yet. Add them first in this step or Step 4, then come back to assign them here.
              </p>
            );
            const selected = new Set(agent.subagentActions ?? []);
            const toggle = (val: string) => {
              const next = new Set(selected);
              next.has(val) ? next.delete(val) : next.add(val);
              updateAgent({ subagentActions: [...next] });
            };
            return (
              <FormField label="Can call" hint="Agents and tools this subagent can invoke during reasoning">
                <div className="flex flex-wrap gap-2 mt-1">
                  {allOptions.map(opt => {
                    const on = selected.has(opt.value);
                    return (
                      <button key={opt.value} type="button" onClick={() => toggle(opt.value)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors"
                        style={on ? {
                          background: opt.kind === "A2A" ? "#eff6ff" : "#faf5ff",
                          borderColor: opt.kind === "A2A" ? "#93c5fd" : "#c4b5fd",
                          color: opt.kind === "A2A" ? "#1d4ed8" : "#6d28d9",
                        } : {
                          background: "#f9fafb", borderColor: "#e5e7eb", color: "#9ca3af",
                        }}>
                        <span className="text-[9px] font-bold px-1 py-px rounded"
                          style={on ? {
                            background: opt.kind === "A2A" ? "#dbeafe" : "#ede9fe",
                            color: opt.kind === "A2A" ? "#1d4ed8" : "#6d28d9",
                          } : { background: "#e5e7eb", color: "#9ca3af" }}>
                          {opt.kind}
                        </span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </FormField>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default function Step3Agents() {
  const config = useWizardStore((s) => s.config);
  const updateConfig = useWizardStore((s) => s.updateConfig);

  return (
    <div className="flex flex-col gap-4">
      <AddItemList
        items={config.agents}
        addLabel="Add Agent"
        emptyLabel="No agents added yet. Add external A2A agents or inline subagent reasoning nodes."
        onAdd={() => updateConfig({ agents: [...config.agents, { name: "", agentType: "a2a", url: "", skills: [] }] })}
        onRemove={(i) => updateConfig({ agents: config.agents.filter((_, idx) => idx !== i) })}
        renderItem={(agent, i) => <AgentRow key={i} agent={agent} index={i} />}
      />
    </div>
  );
}
