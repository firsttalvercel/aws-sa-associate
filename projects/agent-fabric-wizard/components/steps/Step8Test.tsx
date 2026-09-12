"use client";

import { useState, useEffect, Fragment } from "react";
import { useWizardStore } from "@/store";
import { Play, Loader, CheckCircle, XCircle, ChevronDown, ChevronRight, Network, X, Copy, Check, Terminal, RefreshCw } from "lucide-react";
import BrokerDiagram from "@/components/BrokerDiagram";
import type { SimplifiedConfig } from "@/lib/types";
import { buildTestCases } from "@/lib/test-cases";
import type { TestCase } from "@/lib/test-cases";

function FlowPath({ path, runState }: { path: string; runState: RunState }) {
  const nodes = path.split(" → ");
  const [activeIdx, setActiveIdx] = useState(-1);

  useEffect(() => {
    if (runState !== "running") {
      setActiveIdx(-1);
      return;
    }
    setActiveIdx(0);
    let idx = 0;
    const interval = setInterval(() => {
      idx += 1;
      if (idx >= nodes.length) {
        clearInterval(interval);
        return;
      }
      setActiveIdx(idx);
    }, Math.max(300, Math.floor(2800 / nodes.length)));
    return () => clearInterval(interval);
  }, [runState, nodes.length]);

  const nodeBg = (i: number) => {
    if (runState === "pass") return "bg-emerald-50 border-emerald-300 text-emerald-700";
    if (runState === "fail" || runState === "error") return "bg-red-50 border-red-300 text-red-600";
    if (runState === "running" && i === activeIdx) return "bg-blue-500 border-blue-500 text-white shadow-md scale-105";
    if (runState === "running" && i < activeIdx) return "bg-emerald-50 border-emerald-300 text-emerald-700";
    return "bg-gray-50 border-gray-200 text-gray-500";
  };

  return (
    <div className="flex items-center flex-wrap gap-y-1 mt-1.5">
      {nodes.map((node, i) => (
        <Fragment key={i}>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded border transition-all duration-300 ${nodeBg(i)}`}
          >
            {node}
          </span>
          {i < nodes.length - 1 && (
            <span className="text-gray-300 text-xs mx-0.5">→</span>
          )}
        </Fragment>
      ))}
    </div>
  );
}

type RunState = "idle" | "running" | "pass" | "fail" | "error";

interface TestResult {
  state: RunState;
  responseTime?: number;
  body?: unknown;
  error?: string;
}

export default function Step8Test() {
  const config = useWizardStore((s) => s.config);
  const templateId = useWizardStore((s) => s.templateId);
  const standaloneTest = useWizardStore((s) => s.standaloneTest);

  const [brokerUrl, setBrokerUrl] = useState("");
  const [results, setResults] = useState<Record<number, TestResult>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [diagPath, setDiagPath] = useState<string>("");
  const [diagRunState, setDiagRunState] = useState<"idle" | "running" | "pass" | "fail" | "error">("idle");
  const [showDiagram, setShowDiagram] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [freeformMessage, setFreeformMessage] = useState("");
  const [freeformResult, setFreeformResult] = useState<TestResult | null>(null);
  const [loadedConfig, setLoadedConfig] = useState<SimplifiedConfig | null>(null);
  const [loadedSkills, setLoadedSkills] = useState<{ id: string; description: string }[]>([]);
  const [loadingCard, setLoadingCard] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const loadAgentCard = async () => {
    if (!brokerUrl.trim()) return;
    setLoadingCard(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/fetch-agent-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: brokerUrl.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        setLoadError(data.error ?? "Could not load agent card.");
        return;
      }
      const rawSkills: { id: string; description: string }[] = (data.skills ?? []).map(
        (s: { id: string; description: string }) => ({ id: s.id, description: s.description || s.id })
      );
      setLoadedSkills(rawSkills);
      // Build a minimal SimplifiedConfig from the card so BrokerDiagram can render it.
      // Skills are the broker's own A2A interface — map each as an A2A agent so the
      // diagram renders them with the correct node type (blue A2A, not purple MCP).
      const intents = rawSkills.map((s) => ({
        label: s.id,
        description: s.description,
        handler: s.id,
      }));
      const cfg: SimplifiedConfig = {
        name: data.name || "Broker",
        description: data.name || "Broker",
        orgId: "",
        llm: { provider: "openai", model: "gpt-4.1-mini" },
        agents: rawSkills.map((s) => ({
          name: s.id,
          agentType: "a2a" as const,
          url: brokerUrl.trim(),
          skills: [{ id: s.id, description: s.description }],
        })),
        mcps: [],
        routing: intents.length
          ? { type: "intent", intents }
          : { type: "linear" },
      };
      setLoadedConfig(cfg);
    } finally {
      setLoadingCard(false);
    }
  };

  // Turn a skill id + description into a natural first-person request message
  function buildExampleMessage(id: string, description: string): string {
    // Verb-first descriptions → wrap as an imperative request
    const verbFirst = /^(retrieve|get|check|run|evaluate|verify|detect|forecast|assess|book|schedule|place|submit|redeem|dispatch|generate|calculate|identify|scan|screen|extract|fetch)/i;
    const d = (description || id.replace(/-/g, " ")).replace(/\.$/, "");
    if (verbFirst.test(d)) return d.charAt(0).toUpperCase() + d.slice(1);
    // Noun-first descriptions → prefix with a request verb
    return `Please ${d.charAt(0).toLowerCase()}${d.slice(1)}`;
  }

  const buildCurl = (message: string) => {
    const url = brokerUrl.trim() || "<broker-url>";
    return `curl -s -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -H "A2A-Version: 1.0" \\
  -d '${JSON.stringify({
    jsonrpc: "2.0",
    id: "test-1",
    method: "SendMessage",
    params: {
      message: {
        messageId: "test-1",
        role: "ROLE_USER",
        parts: [{ text: message, mediaType: "text/plain" }],
      },
    },
  })}'`;
  };

  const runFreeform = async () => {
    if (!brokerUrl.trim() || !freeformMessage.trim()) return;
    setFreeformResult({ state: "running" });
    setDiagPath("");
    setDiagRunState("running");
    const start = Date.now();
    try {
      const res = await fetch("/api/test-broker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: brokerUrl, message: freeformMessage }),
      });
      const data = await res.json();
      const elapsed = Date.now() - start;
      if (data.ok) {
        setFreeformResult({ state: "pass", responseTime: elapsed, body: data.body });
        setDiagRunState("pass");
      } else {
        setFreeformResult({ state: "fail", responseTime: elapsed, body: data.body, error: data.error });
        setDiagRunState("fail");
      }
    } catch (e) {
      setFreeformResult({ state: "error", error: e instanceof Error ? e.message : "Network error" });
      setDiagRunState("error");
    }
  };

  const testCases = buildTestCases(standaloneTest ? "" : templateId);

  const runTest = async (idx: number, message: string, expectPass?: boolean) => {
    const tc = testCases[idx];
    setResults((r) => ({ ...r, [idx]: { state: "running" } }));
    setDiagPath(tc?.path ?? "");
    setDiagRunState("running");
    const start = Date.now();
    try {
      const res = await fetch("/api/test-broker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: brokerUrl, message, expectPass }),
      });
      const data = await res.json();
      const elapsed = Date.now() - start;
      if (data.ok) {
        setResults((r) => ({ ...r, [idx]: { state: "pass", responseTime: elapsed, body: data.body } }));
        setDiagRunState("pass");
      } else {
        setResults((r) => ({ ...r, [idx]: { state: "fail", responseTime: elapsed, body: data.body, error: data.error } }));
        setDiagRunState("fail");
      }
    } catch (e) {
      setResults((r) => ({ ...r, [idx]: { state: "error", error: e instanceof Error ? e.message : "Network error" } }));
      setDiagRunState("error");
    }
  };

  const runAll = async () => {
    if (!brokerUrl.trim()) return;
    setRunningAll(true);
    for (let i = 0; i < testCases.length; i++) {
      await runTest(i, testCases[i].message, testCases[i].expectPass);
    }
    setRunningAll(false);
  };

  const passCount = Object.values(results).filter((r) => r.state === "pass").length;
  const failCount = Object.values(results).filter((r) => r.state === "fail" || r.state === "error").length;
  const ranCount = passCount + failCount;

  return (
    <div className="flex flex-col gap-5">

      {/* Flow diagram modal */}
      {showDiagram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
             onClick={() => setShowDiagram(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden"
               onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Broker Flow</span>
              {diagRunState === "running" && (
                <span className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
                  <Loader size={12} className="animate-spin" /> Running…
                </span>
              )}
              <button type="button" onClick={() => setShowDiagram(false)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={16} />
              </button>
            </div>
            <BrokerDiagram activePath={diagPath} runState={diagRunState} configOverride={loadedConfig ?? undefined} />
          </div>
        </div>
      )}

      {/* Broker URL input */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Deployed broker URL
        </label>
        <p className="text-xs text-gray-400">
          Deploy your project in Anypoint Code Builder, then paste the live A2A endpoint URL here.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={brokerUrl}
            onChange={(e) => { setBrokerUrl(e.target.value); setLoadedConfig(null); setLoadedSkills([]); setLoadError(null); }}
            placeholder="https://your-broker.cloudhub.io/api/loans-broker/a2a"
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          />
          {standaloneTest && (
            <button
              type="button"
              onClick={loadAgentCard}
              disabled={!brokerUrl.trim() || loadingCard}
              title="Fetch agent card and map the broker flow"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-500 font-medium hover:text-gray-700 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              {loadingCard ? <Loader size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              {loadedConfig ? "Reload" : "Load"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowDiagram(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-500 font-medium hover:text-gray-700 hover:border-gray-300 transition-colors flex-shrink-0"
          >
            <Network size={13} />
            Flow
          </button>
          {!standaloneTest && (
            <button
              type="button"
              onClick={runAll}
              disabled={!brokerUrl.trim() || runningAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #00a0df, #0077b6)" }}
            >
              {runningAll ? <Loader size={14} className="animate-spin" /> : <Play size={14} />}
              {runningAll ? "Running…" : "Run all"}
            </button>
          )}
        </div>
        {loadError && (
          <p className="text-xs text-red-500 mt-1">{loadError}</p>
        )}
        {loadedConfig && (
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1.5">
            <CheckCircle size={12} />
            Loaded: <span className="font-semibold">{loadedConfig.name}</span>
            {loadedConfig.routing.type === "intent" && loadedConfig.routing.intents?.length
              ? ` · ${loadedConfig.routing.intents.length} skill${loadedConfig.routing.intents.length === 1 ? "" : "s"} mapped`
              : ""}
          </p>
        )}
      </div>

      {/* Freeform mode */}
      {standaloneTest && (
        <div className="flex flex-col gap-3">
          {/* Skill chips — only shown once agent card is loaded */}
          {loadedSkills.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Try a skill</p>
              <div className="flex flex-wrap gap-2">
                {loadedSkills.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFreeformMessage(buildExampleMessage(s.id, s.description))}
                    title={s.description}
                    className="flex flex-col items-start px-3 py-2 rounded-lg border border-blue-100 bg-blue-50 hover:bg-blue-100 hover:border-blue-200 transition-colors text-left max-w-[220px]"
                  >
                    <span className="text-[11px] font-bold text-blue-700 font-mono leading-tight truncate w-full">{s.id}</span>
                    {s.description && s.description !== s.id && (
                      <span className="text-[10px] text-blue-500 mt-0.5 leading-snug line-clamp-2">{s.description}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          <textarea
            value={freeformMessage}
            onChange={(e) => setFreeformMessage(e.target.value)}
            placeholder="Type your message to the broker…"
            rows={3}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={runFreeform}
              disabled={!brokerUrl.trim() || !freeformMessage.trim() || freeformResult?.state === "running"}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              style={{ background: "linear-gradient(135deg, #00a0df, #0077b6)" }}
            >
              {freeformResult?.state === "running" ? <Loader size={14} className="animate-spin" /> : <Play size={14} />}
              {freeformResult?.state === "running" ? "Running…" : "Send"}
            </button>
            <button
              type="button"
              onClick={() => copyText(buildCurl(freeformMessage), "freeform-curl")}
              disabled={!freeformMessage.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-500 font-medium hover:text-gray-700 hover:border-gray-300 disabled:opacity-40 transition-colors"
            >
              {copied === "freeform-curl" ? <Check size={12} className="text-emerald-500" /> : <Terminal size={12} />}
              {copied === "freeform-curl" ? "Copied" : "curl"}
            </button>
          </div>
          {freeformResult && freeformResult.state !== "running" && (
            <div className={`rounded-lg border overflow-hidden ${freeformResult.state === "pass" ? "border-emerald-200" : "border-red-200"}`}>
              <div className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold ${freeformResult.state === "pass" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                {freeformResult.state === "pass"
                  ? <CheckCircle size={13} />
                  : <XCircle size={13} />}
                {freeformResult.state === "pass" ? "Response received" : freeformResult.error ?? "Request failed"}
                {freeformResult.responseTime && (
                  <span className="ml-auto font-normal text-[11px] opacity-70">{freeformResult.responseTime}ms</span>
                )}
                {freeformResult.state === "pass" && !freeformResult.error && (
                  <button
                    type="button"
                    onClick={() => copyText(JSON.stringify(freeformResult.body, null, 2), "freeform-res")}
                    className="ml-1 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/70 hover:bg-white border border-emerald-200 transition-colors"
                  >
                    {copied === "freeform-res" ? <Check size={10} /> : <Copy size={10} />}
                    {copied === "freeform-res" ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              <pre className="text-[11px] font-mono text-gray-700 bg-white px-4 py-3 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                {freeformResult.error ?? JSON.stringify(freeformResult.body, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Score banner */}
      {!standaloneTest && ranCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-gray-50 border-gray-200">
          <span className="text-sm font-semibold text-gray-700">{ranCount} of {testCases.length} run</span>
          <span className="text-emerald-600 text-sm font-semibold">{passCount} passed</span>
          {failCount > 0 && <span className="text-red-500 text-sm font-semibold">{failCount} failed</span>}
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden ml-2">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: ranCount > 0 ? `${(passCount / ranCount) * 100}%` : "0%" }}
            />
          </div>
        </div>
      )}

      {/* Test cases */}
      {!standaloneTest && <div className="flex flex-col gap-2">
        {testCases.map((tc, i) => {
          const result = results[i];
          const isExpanded = expanded[i];
          const stateIcon =
            result?.state === "running" ? <Loader size={15} className="animate-spin text-blue-500" /> :
            result?.state === "pass" ? <CheckCircle size={15} className="text-emerald-500" /> :
            result?.state === "fail" || result?.state === "error" ? <XCircle size={15} className="text-red-400" /> :
            <div className="w-4 h-4 rounded-full border-2 border-gray-200" />;

          return (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-white overflow-hidden"
            >
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5 flex-shrink-0">{stateIcon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800">{tc.label}</span>
                    {tc.kind === "orchestration" ? (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">orchestration</span>
                    ) : tc.expectPass ? (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">happy path</span>
                    ) : (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">unhappy path</span>
                    )}
                    {result?.responseTime && (
                      <span className="text-[10px] text-gray-400 ml-auto">{result.responseTime}ms</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{tc.description}</p>
                  <FlowPath path={tc.path} runState={result?.state ?? "idle"} />

                  {/* Message preview */}
                  <div className="mt-2 flex items-start gap-2">
                    <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded px-2 py-1.5 flex-1 leading-relaxed">
                      "{tc.message}"
                    </p>
                    <button
                      type="button"
                      onClick={() => runTest(i, tc.message, tc.expectPass)}
                      disabled={!brokerUrl.trim() || result?.state === "running"}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 font-medium hover:text-gray-700 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Run
                    </button>
                  </div>
                </div>
              </div>

              {/* Response accordion + actions */}
              <div className="border-t border-gray-100">
                <div className="flex items-center gap-1 px-3 py-1.5">
                  {result && result.state !== "running" && result.state !== "idle" ? (
                    <button
                      type="button"
                      onClick={() => setExpanded((e) => ({ ...e, [i]: !e[i] }))}
                      className="flex items-center gap-1.5 flex-1 text-xs text-gray-400 hover:text-gray-600 transition-colors py-0.5"
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      {result.error ? `Error: ${result.error}` : "View response"}
                    </button>
                  ) : (
                    <span className="flex-1" />
                  )}
                  {/* Copy response */}
                  {result && result.state !== "running" && result.state !== "idle" && !result.error && (
                    <button
                      type="button"
                      onClick={() => copyText(JSON.stringify(result.body, null, 2), `res-${i}`)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      title="Copy response"
                    >
                      {copied === `res-${i}` ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      {copied === `res-${i}` ? "Copied" : "Copy"}
                    </button>
                  )}
                  {/* Copy curl */}
                  <button
                    type="button"
                    onClick={() => copyText(buildCurl(tc.message), `curl-${i}`)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    title="Copy curl"
                  >
                    {copied === `curl-${i}` ? <Check size={11} className="text-emerald-500" /> : <Terminal size={11} />}
                    {copied === `curl-${i}` ? "Copied" : "curl"}
                  </button>
                </div>
                {isExpanded && result && result.state !== "running" && result.state !== "idle" && (
                  <pre className="text-[11px] font-mono text-gray-700 bg-gray-50 border-t border-gray-100 px-4 py-3 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    {result.error ?? JSON.stringify(result.body, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          );
        })}
      </div>}
    </div>
  );
}
