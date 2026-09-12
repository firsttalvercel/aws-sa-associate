"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useWizardStore } from "@/store";
import type { SimplifiedConfig } from "@/lib/types";

// ── layout ────────────────────────────────────────────────────────────
const NW = 156;
const NH = 64;
const ROUTER_HEAD = 50;
const ROUTE_ROW   = 30;
const CG = 204;
const RG = 82;
const PAD = 24;

// ── colours ───────────────────────────────────────────────────────────
const CANVAS_BG     = "#eef3fb";
const DOT_COLOR     = "#c0d0ea";
const CARD_BG       = "#ffffff";
const CARD_BORDER   = "#c8d9f2";
const CARD_SHADOW   = "#b8cde8";
const CONN          = "#5b9fe5";
const CONN_FALLBACK = "#f59e0b";
const CONN_CALL     = "#059669";

const TYPE_LABEL: Record<string, string> = {
  trigger:      "Trigger",
  generator:    "Generator",
  router:       "Router",
  subagent:     "Subagent",
  executor:     "Executor",
  orchestrator: "Orchestrator",
  echo:         "Echo",
  mcp:          "MCP Tool",
};

const TYPE_COLOR: Record<string, string> = {
  trigger:      "#2563eb",
  generator:    "#0077b6",
  router:       "#7c3aed",
  subagent:     "#059669",
  executor:     "#d97706",
  orchestrator: "#0284c7",
  echo:         "#94a3b8",
  mcp:          "#6d28d9",
};

type RouteType = "A2A" | "LLM" | "MCP" | "orch";

const PILL: Record<RouteType, { bg: string; text: string; border: string; label: string }> = {
  "A2A":  { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe", label: "A2A" },
  "LLM":  { bg: "#f0fdf4", text: "#059669", border: "#bbf7d0", label: "Subagent" },
  "MCP":  { bg: "#faf5ff", text: "#7c3aed", border: "#e9d5ff", label: "MCP" },
  "orch": { bg: "#fff7ed", text: "#92400e", border: "#fde68a", label: "Fallback" },
};

const TOOLTIPS: Record<string, string> = {
  trigger:      "Entry point of the broker. Receives the incoming A2A message and starts the flow.",
  generator:    "An LLM call that produces structured output. Used here to classify the user's intent into one of the defined routes.",
  router:       "Reads the classified intent and dispatches the request to the matching handler. Falls back to the Orchestrator if no route matches.",
  executor:     "Calls an external A2A agent and returns its result directly. No reasoning, pure delegation.",
  subagent:     "An inline LLM reasoning node you define. It can call multiple agents and tools in a loop, then synthesise a single answer. Use this when no single agent can answer on its own.",
  mcp:          "Calls a specific MCP tool and returns its output. Direct function call, no LLM involved.",
  orchestrator: "Handles requests that don't match any intent route. Has access to all agents and tools and reasons freely across them.",
  echo:         "Sends the final response back to the caller as a completed A2A task.",
};

function handlerType(handler: string, cfg: SimplifiedConfig): RouteType {
  const agent = cfg.agents.find(a => a.name === handler);
  if (agent) return agent.agentType === "subagent" ? "LLM" : "A2A";
  return "MCP";
}

// ── internal types ────────────────────────────────────────────────────
interface DiagNode {
  id: string; label: string; sublabel?: string; type: string;
  cx: number; cy: number; height: number;
  routeLabels?: string[];
  routeTypes?: RouteType[];
  indentedIndices?: number[]; // router row indices that should be indented
}
interface DiagEdge {
  from: string; to: string;
  fromY?: number; toY?: number;
  fallback?: boolean;
  call?: boolean; // subagent → called agent
}

// ── helpers ───────────────────────────────────────────────────────────
const col     = (c: number) => PAD + NW / 2 + c * CG;
const row     = (r: number) => PAD + NH / 2 + r * RG;
const trunc   = (s: string, max: number) => s.length > max ? s.slice(0, max - 1) + "…" : s;
const routerH = (n: number) => ROUTER_HEAD + n * ROUTE_ROW;

// ── graph builder ─────────────────────────────────────────────────────
function buildGraph(cfg: SimplifiedConfig): { nodes: DiagNode[]; edges: DiagEdge[]; w: number; h: number } {
  const nodes: DiagNode[] = [];
  const edges: DiagEdge[] = [];

  if (cfg.routing.type !== "intent") {
    nodes.push({ id: "trigger", label: "BrokerTrigger", type: "trigger",      cx: col(0), cy: row(0), height: NH });
    nodes.push({ id: "orch",    label: "Orchestrator",  type: "orchestrator", cx: col(1), cy: row(0), height: NH });
    nodes.push({ id: "echo",    label: "Echo",          type: "echo",         cx: col(2), cy: row(0), height: NH });
    edges.push({ from: "trigger", to: "orch" });
    edges.push({ from: "orch",    to: "echo" });
    return { nodes, edges, w: col(2) + NW / 2 + PAD, h: row(0) + NH / 2 + PAD };
  }

  const intents  = cfg.routing.intents ?? [];
  const nIntents = intents.length;

  // Each intent takes N slots where N = number of called actions (min 1)
  const intentSlots = intents.map(intent => {
    const agentDef = cfg.agents.find(a => a.name === intent.handler && a.agentType === "subagent");
    const actions  = agentDef?.subagentActions ?? [];
    return Math.max(1, actions.length);
  });
  const slotStarts       = intentSlots.map((_, i) => intentSlots.slice(0, i).reduce((s, n) => s + n, 0));
  const totalIntentSlots = intentSlots.reduce((s, n) => s + n, 0);
  const totalSlots       = totalIntentSlots + 1; // + otherwise

  // Router has one row per intent + otherwise (not slots)
  const nBranches = nIntents + 1;
  const rH        = routerH(nBranches);
  const midSlot   = (totalSlots - 1) / 2;
  const routerCy  = row(midSlot);
  const routerTop = routerCy - rH / 2;

  const allLabels: string[]    = [...intents.map(i => i.label), "otherwise"];
  const allTypes:  RouteType[] = [...intents.map(i => handlerType(i.handler, cfg)), "orch"];

  // Which router rows are subagents (for indentation)
  const indentedIndices = intents
    .map((intent, i) => handlerType(intent.handler, cfg) === "LLM" ? i : -1)
    .filter(i => i >= 0);

  nodes.push({ id: "trigger",  label: "BrokerTrigger",  type: "trigger",   cx: col(0), cy: row(midSlot), height: NH });
  nodes.push({ id: "classify", label: "Classify Intent", type: "generator", cx: col(1), cy: row(midSlot), height: NH });
  nodes.push({
    id: "router", label: "Intent Router", type: "router",
    cx: col(2), cy: routerCy, height: rH,
    routeLabels: allLabels, routeTypes: allTypes,
    indentedIndices,
  });
  edges.push({ from: "trigger",  to: "classify" });
  edges.push({ from: "classify", to: "router" });

  let hasSubagentWithActions = false;

  intents.forEach((intent, i) => {
    const rtype = allTypes[i];
    let nodeType: string;
    if      (rtype === "LLM") nodeType = "subagent";
    else if (rtype === "MCP") nodeType = "mcp";
    else                      nodeType = "executor";

    const startSlot = slotStarts[i];
    const slotCount = intentSlots[i];
    const handlerSlot = startSlot + (slotCount - 1) / 2;
    const handlerCy   = row(handlerSlot);
    const fromY = routerTop + ROUTER_HEAD + (i + 0.5) * ROUTE_ROW;

    const agentDef = cfg.agents.find(a => a.name === intent.handler && a.agentType === "subagent");
    const actions  = agentDef?.subagentActions ?? [];

    if (nodeType === "subagent" && actions.length > 0) {
      hasSubagentWithActions = true;

      // Subagent node at col 3, centered on its action slots
      nodes.push({ id: `h${i}`, label: intent.handler, sublabel: intent.label, type: "subagent", cx: col(3), cy: handlerCy, height: NH });
      edges.push({ from: "router", to: `h${i}`, fromY });

      // Called-agent nodes at col 4 — tool steps, NO echo (intermediate reasoning calls)
      actions.forEach((actionName, ai) => {
        const actionCy   = row(startSlot + ai);
        const isA2A      = cfg.agents.find(ag => ag.name === actionName && ag.agentType !== "subagent");
        const actionType = isA2A ? "executor" : "mcp";
        const callId     = `sa${i}_c${ai}`;
        nodes.push({ id: callId, label: actionName, type: actionType, cx: col(4), cy: actionCy, height: NH });
        edges.push({ from: `h${i}`, to: callId, call: true });
      });

      // Single Echo after the subagent itself, centered on its slot range
      const echoId = `sa${i}_echo`;
      nodes.push({ id: echoId, label: "Echo", type: "echo", cx: col(5), cy: handlerCy, height: NH });
      edges.push({ from: `h${i}`, to: echoId });
    } else {
      // Regular handler at col 3, echo at col 4
      nodes.push({ id: `h${i}`, label: intent.handler, sublabel: intent.label, type: nodeType, cx: col(3), cy: handlerCy, height: NH });
      nodes.push({ id: `e${i}`, label: "Echo", type: "echo", cx: col(4), cy: handlerCy, height: NH });
      edges.push({ from: "router", to: `h${i}`, fromY });
      edges.push({ from: `h${i}`, to: `e${i}` });
    }
  });

  // Orchestrator (fallback)
  const orchFromY = routerTop + ROUTER_HEAD + (nIntents + 0.5) * ROUTE_ROW;
  const orchCy    = row(totalIntentSlots);
  nodes.push({ id: "orch",     label: "Orchestrator", sublabel: "fallback", type: "orchestrator", cx: col(3), cy: orchCy, height: NH });
  nodes.push({ id: "orchEcho", label: "Echo",                               type: "echo",         cx: col(4), cy: orchCy, height: NH });
  edges.push({ from: "router", to: "orch",     fromY: orchFromY, fallback: true });
  edges.push({ from: "orch",   to: "orchEcho" });

  const maxCol = hasSubagentWithActions ? 5 : 4;
  return {
    nodes, edges,
    w: col(maxCol) + NW / 2 + PAD,
    h: Math.max(row(totalSlots - 1) + NH / 2 + PAD, routerTop + rH + PAD),
  };
}

// ── bezier path ───────────────────────────────────────────────────────
function bezier(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
}

// ── node card ─────────────────────────────────────────────────────────
interface TooltipState { x: number; y: number; type: string; label: string }

function NodeCard({ n, onHover, onLeave, highlight, pulse }: {
  n: DiagNode;
  onHover: (e: React.MouseEvent<SVGGElement>, type: string, label: string) => void;
  onLeave: () => void;
  highlight?: boolean;
  pulse?: boolean;
}) {
  const x  = n.cx - NW / 2;
  const y  = n.cy - n.height / 2;
  const tc = TYPE_COLOR[n.type] ?? "#64748b";
  const tl = TYPE_LABEL[n.type] ?? n.type;
  const rx = 10;

  // ── router card ───────────────────────────────────────────────────
  if (n.routeLabels && n.routeTypes) {
    const clipId   = `clip_${n.id}`;
    const indented = new Set(n.indentedIndices ?? []);
    return (
      <g onMouseEnter={e => onHover(e, n.type, n.label)} onMouseLeave={onLeave} style={{ cursor: "default" }}>
        {highlight && <rect x={x - 3} y={y - 3} width={NW + 6} height={n.height + 6} rx={rx + 2} fill={pulse ? "#3b82f6" : "#10b981"} opacity={0.18} />}
        <rect x={x + 2} y={y + 3} width={NW} height={n.height} rx={rx} fill={CARD_SHADOW} opacity={0.4} />
        <rect x={x} y={y} width={NW} height={n.height} rx={rx} fill={CARD_BG} stroke={CARD_BORDER} strokeWidth={1.5} />
        <clipPath id={`${clipId}_head`}>
          <rect x={x} y={y} width={NW} height={ROUTER_HEAD} rx={rx} />
          <rect x={x} y={y + rx} width={NW} height={ROUTER_HEAD - rx} />
        </clipPath>
        <rect x={x} y={y} width={NW} height={ROUTER_HEAD} fill={tc} opacity={0.07} clipPath={`url(#${clipId}_head)`} />
        <text x={n.cx} y={y + 17} textAnchor="middle" fontSize={9} fill={tc} fontFamily="system-ui, sans-serif" fontWeight="700">
          {tl.toUpperCase()}
        </text>
        <text x={n.cx} y={y + 34} textAnchor="middle" fontSize={12} fill="#0f172a" fontFamily="system-ui, sans-serif" fontWeight="700">
          {trunc(n.label, 17)}
        </text>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={NW} height={n.height} rx={rx} />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
          {n.routeLabels.map((lbl, i) => {
            const rtype       = n.routeTypes![i];
            const ry          = y + ROUTER_HEAD + i * ROUTE_ROW;
            const isFallback  = rtype === "orch";
            const isIndented  = indented.has(i);
            const rowBg       = isFallback ? "#fff7ed" : isIndented ? "#f0fdf4" : (i % 2 === 0 ? "#f8faff" : "#f1f5fd");
            const textX       = isIndented ? x + 20 : x + 10;
            const textC       = isFallback ? "#92400e" : isIndented ? "#059669" : "#374151";
            const pill        = PILL[rtype];
            const pillW = 44; const pillH = 14;
            const pillX = x + NW - pillW - 6;
            const pillY = ry + (ROUTE_ROW - pillH) / 2;
            return (
              <g key={i}>
                <rect x={x + 1} y={ry} width={NW - 2} height={ROUTE_ROW} fill={rowBg} />
                <line x1={x + 1} y1={ry} x2={x + NW - 1} y2={ry} stroke={isIndented ? "#d1fae5" : CARD_BORDER} strokeWidth={0.75} />
                {/* indent indicator for subagent rows */}
                {isIndented && (
                  <text x={x + 10} y={ry + ROUTE_ROW / 2 + 4} fontSize={8} fill="#059669" fontFamily="system-ui, sans-serif">▸</text>
                )}
                <text x={textX} y={ry + ROUTE_ROW / 2 + 4} fontSize={10} fill={textC} fontFamily="system-ui, sans-serif"
                      fontStyle={isFallback ? "italic" : "normal"}>
                  {trunc(lbl, isFallback ? 13 : 11)}
                </text>
                <rect x={pillX} y={pillY} width={pillW} height={pillH} rx={3} fill={pill.bg} stroke={pill.border} strokeWidth={0.75} />
                <text x={pillX + pillW / 2} y={pillY + 10} textAnchor="middle" fontSize={8}
                      fill={pill.text} fontFamily="system-ui, sans-serif" fontWeight="700">
                  {pill.label}
                </text>
              </g>
            );
          })}
        </g>
        <rect x={x} y={y} width={NW} height={n.height} rx={rx} fill="none" stroke={CARD_BORDER} strokeWidth={1.5} />
      </g>
    );
  }

  // ── standard card ─────────────────────────────────────────────────
  const isFallback = n.sublabel === "fallback";
  const isSubagent = n.type === "subagent";
  const borderColor = highlight
    ? (pulse ? "#3b82f6" : "#10b981")
    : isFallback ? "#fcd34d" : isSubagent ? "#86efac" : CARD_BORDER;
  const borderWidth = highlight ? 2.5 : isFallback || isSubagent ? 2 : 1.5;

  return (
    <g onMouseEnter={e => onHover(e, n.type, n.label)} onMouseLeave={onLeave} style={{ cursor: "default" }}>
      {highlight && <rect x={x - 3} y={y - 3} width={NW + 6} height={n.height + 6} rx={rx + 2} fill={pulse ? "#3b82f6" : "#10b981"} opacity={0.15} />}
      <rect x={x + 2} y={y + 3} width={NW} height={n.height} rx={rx} fill={CARD_SHADOW} opacity={0.38} />
      <rect x={x} y={y} width={NW} height={n.height} rx={rx} fill={CARD_BG} stroke={borderColor} strokeWidth={borderWidth} />
      {isSubagent && (
        <rect x={x} y={y} width={NW} height={n.height} rx={rx} fill="#059669" opacity={0.04} />
      )}
      <text x={n.cx} y={y + 19} textAnchor="middle" fontSize={9} fill={tc} fontFamily="system-ui, sans-serif" fontWeight="700">
        {tl.toUpperCase()}
      </text>
      <text x={n.cx} y={y + 37} textAnchor="middle" fontSize={12} fill="#0f172a" fontFamily="system-ui, sans-serif" fontWeight="700">
        {trunc(n.label, 17)}
      </text>
      {n.sublabel && (
        <text x={n.cx} y={y + 52} textAnchor="middle" fontSize={9}
              fill={isFallback ? "#d97706" : "#94a3b8"}
              fontFamily="system-ui, sans-serif"
              fontStyle={isFallback ? "italic" : "normal"}
              fontWeight={isFallback ? "600" : "400"}>
          {trunc(n.sublabel, 18)}
        </text>
      )}
    </g>
  );
}

// ── path → node matching ──────────────────────────────────────────────
// Returns node ids that match any segment in the path string
function matchPathToNodes(pathStr: string, nodes: DiagNode[]): string[] {
  if (!pathStr) return [];
  const segments = pathStr.split(" → ").map(s => s.trim().toLowerCase());

  // Nodes always in every request path
  const always = new Set(["trigger", "classify", "router"]);
  const usesOrch = segments.some(s => s === "multi" || s.includes("orchestrator") || s.includes("general"));

  const matched: string[] = [];
  const matchedHandlerIds: string[] = [];

  for (const n of nodes) {
    if (always.has(n.id)) { matched.push(n.id); continue; }
    if (n.type === "echo") continue; // handle echo after the handler pass

    const label = (n.label ?? "").toLowerCase();
    const sublabel = (n.sublabel ?? "").toLowerCase();

    if ((n.id === "orch") && usesOrch) {
      matched.push(n.id);
      matchedHandlerIds.push(n.id);
      continue;
    }

    const matchesLabel = segments.some(s => {
      if (!s || s.length < 3) return false;
      const clean = s.replace(/\s*\([^)]*\)/, "").trim();
      return (
        label === clean || label.includes(clean) || clean.includes(label) ||
        (sublabel && (sublabel === clean || sublabel.includes(clean) || clean.includes(sublabel)))
      );
    });

    if (matchesLabel) {
      matched.push(n.id);
      matchedHandlerIds.push(n.id);
    }
  }

  // Include only the echo node(s) that are siblings of matched handlers
  // Node ID patterns: handler h0 → echo e0 or sa0_echo; orch → orchEcho
  for (const hid of matchedHandlerIds) {
    if (hid === "orch") {
      matched.push("orchEcho");
    } else if (hid.startsWith("h")) {
      const idx = hid.slice(1);
      // subagent echo: sa{idx}_echo; regular echo: e{idx}
      const echoIds = [`sa${idx}_echo`, `e${idx}`];
      for (const eid of echoIds) {
        if (nodes.some(n => n.id === eid)) matched.push(eid);
      }
    }
  }

  return [...new Set(matched)];
}

type DiagRunState = "idle" | "running" | "pass" | "fail" | "error";

// ── main component ────────────────────────────────────────────────────
export default function BrokerDiagram({ activePath, runState, configOverride }: {
  activePath?: string;
  runState?: DiagRunState;
  configOverride?: SimplifiedConfig;
} = {}) {
  const storeConfig = useWizardStore(s => s.config);
  const config = configOverride ?? storeConfig;
  const { nodes, edges, w, h } = useMemo(() => buildGraph(config), [config]);
  const nodeMap  = Object.fromEntries(nodes.map(n => [n.id, n]));
  const svgH     = Math.max(h, NH + PAD * 2);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Animated active node index when running
  const pathNodes = useMemo(
    () => (activePath && runState && runState !== "idle") ? matchPathToNodes(activePath, nodes) : [],
    [activePath, runState, nodes]
  );
  const [pulseIdx, setPulseIdx] = useState(-1);
  useEffect(() => {
    if (runState !== "running" || pathNodes.length === 0) {
      setPulseIdx(-1);
      return;
    }
    setPulseIdx(0);
    let idx = 0;
    const interval = setInterval(() => {
      idx += 1;
      if (idx >= pathNodes.length) { clearInterval(interval); return; }
      setPulseIdx(idx);
    }, Math.max(400, Math.floor(3000 / pathNodes.length)));
    return () => clearInterval(interval);
  }, [runState, pathNodes.length]);

  const handleHover = (e: React.MouseEvent<SVGGElement>, type: string, label: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setTooltip({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 8, type, label });
  };
  const handleLeave = () => setTooltip(null);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-white flex items-center gap-3">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Broker Flow</span>
        <span className="text-[11px] text-gray-500">{config.name}</span>
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          {(["A2A", "LLM", "MCP"] as RouteType[]).map(rt => {
            const p = PILL[rt];
            return (
              <div key={rt} className="flex items-center gap-1">
                <span className="rounded px-1 py-px text-[9px] font-bold"
                      style={{ background: p.bg, color: p.text, border: `1px solid ${p.border}` }}>
                  {p.label}
                </span>
                <span className="text-[10px] text-gray-400">
                  {rt === "A2A" ? "External agent" : rt === "LLM" ? "Built-in subagent" : "MCP tool"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto relative" style={{ background: CANVAS_BG }} ref={canvasRef}
           onMouseLeave={handleLeave}>
        <svg width={w} height={svgH} viewBox={`0 0 ${w} ${svgH}`} style={{ minWidth: w, display: "block" }}>
          <defs>
            <pattern id="bgDots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.9" fill={DOT_COLOR} />
            </pattern>
            <marker id="connArr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={CONN} />
            </marker>
            <marker id="connArrFb" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={CONN_FALLBACK} />
            </marker>
            <marker id="connArrCall" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={CONN_CALL} />
            </marker>
          </defs>

          <rect width={w} height={svgH} fill="url(#bgDots)" />

          {edges.map((e, i) => {
            const fn = nodeMap[e.from];
            const tn = nodeMap[e.to];
            if (!fn || !tn) return null;
            const x1    = fn.cx + NW / 2;
            const y1    = e.fromY ?? fn.cy;
            const x2    = tn.cx - NW / 2 - 5;
            const y2    = e.toY ?? tn.cy;
            const color = e.fallback ? CONN_FALLBACK : e.call ? CONN_CALL : CONN;
            const dash  = e.fallback ? "5 3" : undefined;
            const arr   = e.fallback ? "url(#connArrFb)" : e.call ? "url(#connArrCall)" : "url(#connArr)";
            return (
              <g key={i}>
                <path d={bezier(x1, y1, x2, y2)}
                  fill="none" stroke={color} strokeWidth={1.75}
                  strokeDasharray={dash} markerEnd={arr} strokeLinecap="round" />
                <circle cx={x1} cy={y1} r={3} fill={color} />
              </g>
            );
          })}

          {nodes.map(n => {
            const nodePathIdx = pathNodes.indexOf(n.id);
            const isInPath = nodePathIdx >= 0;
            const isPulsing = runState === "running" && nodePathIdx === pulseIdx;
            const isLit = isInPath && runState !== "idle" && runState !== "running";
            return (
              <NodeCard
                key={n.id} n={n} onHover={handleHover} onLeave={handleLeave}
                highlight={isPulsing || isLit}
                pulse={isPulsing}
              />
            );
          })}
        </svg>

        {tooltip && TOOLTIPS[tooltip.type] && (
          <div
            className="pointer-events-none absolute z-50 max-w-[220px] rounded-lg border border-gray-200 bg-white shadow-lg px-3 py-2.5"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
               style={{ color: TYPE_COLOR[tooltip.type] ?? "#64748b" }}>
              {TYPE_LABEL[tooltip.type] ?? tooltip.type}
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">{TOOLTIPS[tooltip.type]}</p>
          </div>
        )}
      </div>
    </div>
  );
}
