"use client";

import { useWizardStore } from "@/store";
import FormField from "@/components/ui/FormField";
import AddItemList from "@/components/ui/AddItemList";
import type { IntentRoute } from "@/lib/types";

export default function Step5Routing() {
  const config = useWizardStore((s) => s.config);
  const updateConfig = useWizardStore((s) => s.updateConfig);

  const handlerOptions = [
    ...config.agents.filter((a) => a.name).map((a) => ({ value: a.name, label: `${a.name} (agent)` })),
    ...config.mcps.flatMap((m) =>
      (m.tools ?? []).filter(Boolean).map((t) => ({ value: t, label: `${t} (${m.name} tool)` }))
    ),
  ];

  const updateIntent = (i: number, patch: Partial<IntentRoute>) => {
    const intents = [...(config.routing.intents ?? [])];
    intents[i] = { ...intents[i], ...patch };
    updateConfig({ routing: { ...config.routing, intents } });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Routing type toggle */}
      <FormField label="Routing Mode" required>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit mb-2">
          {(["intent", "linear"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                updateConfig({
                  routing: {
                    ...config.routing,
                    type,
                    // Preserve intents when switching — don't wipe them
                    intents: config.routing.intents ?? [],
                    linearHandler: config.routing.linearHandler,
                  },
                })
              }
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                config.routing.type === type
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-500 hover:text-gray-700"
              }`}
            >
              {type === "intent" ? "Intent-based" : "Linear"}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          {config.routing.type === "intent"
            ? "The broker classifies each incoming message into one of your defined intents and routes it to the matching agent or tool. Best for brokers that handle multiple distinct request types."
            : "Every incoming message goes directly to a single agent or orchestrator. Best for simple, single-purpose brokers."}
        </p>
      </FormField>

      {config.routing.type === "intent" && (
        <div>
          {handlerOptions.length === 0 && (
            <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              Define agents or MCPs first to assign handlers to intents.
            </div>
          )}
          <AddItemList
            items={config.routing.intents ?? []}
            addLabel="Add Intent"
            emptyLabel="No intents defined. Each intent maps a request type to a handler."
            onAdd={() =>
              updateConfig({
                routing: {
                  ...config.routing,
                  intents: [...(config.routing.intents ?? []), { label: "", description: "", handler: "" }],
                },
              })
            }
            onRemove={(i) =>
              updateConfig({
                routing: {
                  ...config.routing,
                  intents: (config.routing.intents ?? []).filter((_, idx) => idx !== i),
                },
              })
            }
            renderItem={(intent, i) => (
              <div className="flex flex-col gap-2 bg-gray-50 rounded-lg border border-gray-200 p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={intent.label}
                    onChange={(e) => updateIntent(i, { label: e.target.value })}
                    placeholder="Label (e.g. styling)"
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  />
                  <select
                    value={intent.handler}
                    onChange={(e) => updateIntent(i, { handler: e.target.value })}
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="">Select handler</option>
                    {handlerOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={intent.description}
                  onChange={(e) => updateIntent(i, { description: e.target.value })}
                  placeholder="Description (e.g. Outfit and fashion questions)"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            )}
          />
        </div>
      )}

      {config.routing.type === "intent" && (() => {
        const assignedHandlers = new Set((config.routing.intents ?? []).map(i => i.handler));
        const unassigned = config.agents.filter(a => a.name && !assignedHandlers.has(a.name));
        if (!unassigned.length) return null;
        return (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-widest">Unassigned agents</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              These agents are defined but not assigned to any intent route. They will not be called in the generated broker:
            </p>
            <ul className="mt-1 flex flex-col gap-1.5">
              {unassigned.map(a => (
                <li key={a.name} className="flex items-center gap-2 text-xs text-amber-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="font-medium">{a.name}</span>
                  <span className="rounded px-1 py-px text-[9px] font-bold"
                        style={{ background: a.agentType === "subagent" ? "#f0fdf4" : "#eff6ff",
                                 color:      a.agentType === "subagent" ? "#059669" : "#2563eb",
                                 border:     `1px solid ${a.agentType === "subagent" ? "#bbf7d0" : "#bfdbfe"}` }}>
                    {a.agentType === "subagent" ? "Subagent" : "A2A"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-amber-600 mt-1">
              Add an intent above and select each agent as its handler to include it in the flow.
            </p>
          </div>
        );
      })()}

      {config.routing.type === "linear" && (
        <FormField label="Handler" required hint="All requests go directly to this agent or tool.">
          <select
            value={config.routing.linearHandler ?? ""}
            onChange={(e) =>
              updateConfig({ routing: { ...config.routing, linearHandler: e.target.value } })
            }
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          >
            <option value="">Select handler</option>
            {handlerOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FormField>
      )}
    </div>
  );
}
