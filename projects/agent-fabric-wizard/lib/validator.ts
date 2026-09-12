import { load } from "js-yaml";
import type { GeneratedFiles } from "./types";

export type Severity = "error" | "warn";

export interface ValidationIssue {
  severity: Severity;
  message: string;
}

export interface FileValidation {
  file: string;
  issues: ValidationIssue[];
  hasError: boolean;
  hasWarn: boolean;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SEMVER_RE = /^\d+\.\d+\.\d+/;

export function validateGeneratedFiles(files: GeneratedFiles, brokerFile: string): FileValidation[] {
  return [
    validateYamlFile(files["agent-network.yaml"] ?? ""),
    validateJsonFile(files["exchange.json"] ?? ""),
    validateAgentFile(files[`brokers/${brokerFile}.agent`] ?? ""),
  ];
}

// ── agent-network.yaml ────────────────────────────────────────────────────────
function validateYamlFile(content: string): FileValidation {
  const issues: ValidationIssue[] = [];

  let doc: Record<string, unknown>;
  try {
    const parsed = load(content);
    if (!parsed || typeof parsed !== "object") {
      return finish("agent-network.yaml", [{ severity: "error", message: "Not a valid YAML object" }]);
    }
    doc = parsed as Record<string, unknown>;
  } catch (e) {
    return finish("agent-network.yaml", [{ severity: "error", message: `YAML parse error: ${(e as Error).message}` }]);
  }

  if (String(doc.agentNetwork) !== "2.0.0") {
    issues.push({ severity: "error", message: `agentNetwork must be 2.0.0, got: ${String(doc.agentNetwork ?? "(missing)")}` });
  }

  const info = doc.info as Record<string, unknown> | undefined;
  if (!info?.label) issues.push({ severity: "error", message: "Missing info.label" });

  const registry = doc.registry as Record<string, unknown> | undefined;
  if (!registry) {
    issues.push({ severity: "error", message: "Missing registry section" });
  } else {
    if (!registry.agents) issues.push({ severity: "error", message: "Missing registry.agents" });
    if (!registry.mcps)   issues.push({ severity: "warn",  message: "No MCP servers in registry" });
    if (!registry.llms)   issues.push({ severity: "error", message: "Missing registry.llms" });
  }

  const context = doc.context as Record<string, unknown> | undefined;
  if (!context?.connections || Object.keys(context.connections as object).length === 0) {
    issues.push({ severity: "error", message: "Missing or empty context.connections" });
  }

  const brokers = doc.brokers as Record<string, unknown> | undefined;
  if (!brokers || Object.keys(brokers).length === 0) {
    issues.push({ severity: "error", message: "No brokers defined" });
  } else {
    for (const [id, broker] of Object.entries(brokers)) {
      const b = broker as Record<string, unknown>;
      if (b.kind !== "AgentScript") {
        issues.push({ severity: "error", message: `Broker "${id}": kind must be "AgentScript"` });
      }
      if (!b.implementation) {
        issues.push({ severity: "error", message: `Broker "${id}": missing implementation path` });
      }
    }
  }

  if (content.includes("<ENDPOINT_URL>") || content.includes("<YOUR_ORG_ID>")) {
    issues.push({ severity: "warn", message: "Contains placeholder values that must be replaced before deployment" });
  }

  return finish("agent-network.yaml", issues);
}

// ── exchange.json ─────────────────────────────────────────────────────────────
function validateJsonFile(content: string): FileValidation {
  const issues: ValidationIssue[] = [];

  let doc: Record<string, unknown>;
  try {
    doc = JSON.parse(content) as Record<string, unknown>;
  } catch (e) {
    return finish("exchange.json", [{ severity: "error", message: `JSON parse error: ${(e as Error).message}` }]);
  }

  for (const field of ["main", "name", "classifier", "organizationId", "groupId", "assetId", "version"]) {
    if (!doc[field]) issues.push({ severity: "error", message: `Missing required field: ${field}` });
  }

  if (doc.classifier && doc.classifier !== "agentic-network") {
    issues.push({ severity: "error", message: `classifier must be "agentic-network", got: ${String(doc.classifier)}` });
  }
  if (doc.main && doc.main !== "agent-network.yaml") {
    issues.push({ severity: "warn", message: `main should be "agent-network.yaml", got: ${String(doc.main)}` });
  }
  if (doc.organizationId && !UUID_RE.test(String(doc.organizationId))) {
    issues.push({ severity: "error", message: `organizationId is not a valid UUID: ${String(doc.organizationId)}` });
  }
  if (doc.groupId && !UUID_RE.test(String(doc.groupId))) {
    issues.push({ severity: "error", message: `groupId is not a valid UUID: ${String(doc.groupId)}` });
  }
  if (doc.version && !SEMVER_RE.test(String(doc.version))) {
    issues.push({ severity: "warn", message: `version "${String(doc.version)}" does not look like semver (e.g. 1.0.0)` });
  }

  const vars = ((doc.metadata as Record<string, unknown>)?.variables as Record<string, unknown>) ?? {};
  if (!vars["MODULE_GRAPH_ERROR_SETTINGS_MAX_HANDOFF_ITERATIONS"]) {
    issues.push({ severity: "warn", message: "Missing runtime variable: MODULE_GRAPH_ERROR_SETTINGS_MAX_HANDOFF_ITERATIONS" });
  }
  if (JSON.stringify(vars).includes("<ENDPOINT_URL>")) {
    issues.push({ severity: "warn", message: "Some variables have placeholder URLs that must be set before deployment" });
  }

  return finish("exchange.json", issues);
}

// ── .agent ────────────────────────────────────────────────────────────────────
const NODE_TYPES = ["trigger", "generator", "router", "subagent", "executor", "orchestrator", "echo"] as const;

function validateAgentFile(content: string): FileValidation {
  const issues: ValidationIssue[] = [];

  if (!content.trim()) {
    return finish(".agent", [{ severity: "error", message: "File is empty" }]);
  }

  // Dialect
  if (!content.includes("# @dialect: AGENTFABRIC=1.0")) {
    issues.push({ severity: "error", message: "Missing dialect declaration: # @dialect: AGENTFABRIC=1.0" });
  }

  // Required top-level blocks
  for (const block of ["system:", "config:", "llm:", "actions:"]) {
    if (!content.includes(block)) {
      issues.push({ severity: "error", message: `Missing required block: ${block}` });
    }
  }
  if (!/^trigger\s+\w+:/m.test(content)) {
    issues.push({ severity: "error", message: "Missing trigger node" });
  }

  // Collect defined node IDs
  const definedNodes = new Set<string>();
  const nodeDefRe = new RegExp(`^(${NODE_TYPES.join("|")})\\s+(\\w+):`, "gm");
  for (const m of content.matchAll(nodeDefRe)) {
    definedNodes.add(`${m[1]}.${m[2]}`);
  }

  // Collect defined action IDs (2-space-indented keys under "actions:")
  const definedActions = parseActionKeys(content);

  // Check all @actions.X references resolve
  for (const m of content.matchAll(/@actions\.(\w+)/g)) {
    if (!definedActions.has(m[1])) {
      issues.push({ severity: "error", message: `Undefined action reference: @actions.${m[1]}` });
    }
  }

  // Check all @type.id node references resolve
  const nodeRefRe = new RegExp(`@(${NODE_TYPES.join("|")})\\.([\\w]+)`, "g");
  const seenBadRefs = new Set<string>();
  for (const m of content.matchAll(nodeRefRe)) {
    const ref = `${m[1]}.${m[2]}`;
    if (!definedNodes.has(ref) && !seenBadRefs.has(ref)) {
      seenBadRefs.add(ref);
      issues.push({ severity: "error", message: `Undefined node reference: @${ref}` });
    }
  }

  // Check every echo has TASK_STATE_COMPLETED
  for (const m of content.matchAll(/^echo\s+(\w+):/gm)) {
    const echoName = m[1];
    const echoBody = content.slice(m.index!, m.index! + 400);
    if (!echoBody.includes("TASK_STATE_COMPLETED")) {
      issues.push({ severity: "warn", message: `Echo "${echoName}" may be missing state: TASK_STATE_COMPLETED` });
    }
  }

  // At least one echo is required
  if (!/^echo\s+\w+:/m.test(content)) {
    issues.push({ severity: "error", message: "No echo nodes found. At least one echo is required." });
  }

  // Warn if any subagent has no actions in its reasoning block
  for (const m of content.matchAll(/^subagent\s+(\w+):/gm)) {
    const subName = m[1];
    const bodyStart = m.index! + m[0].length;
    // find the next top-level node definition
    const nextNodeMatch = content.slice(bodyStart).search(/^(trigger|generator|router|subagent|executor|orchestrator|echo)\s+\w+:/m);
    const body = nextNodeMatch >= 0 ? content.slice(bodyStart, bodyStart + nextNodeMatch) : content.slice(bodyStart);
    if (!body.includes("@actions.")) {
      issues.push({ severity: "warn", message: `Subagent "${subName}" has no actions. It will reason but cannot call any agents or tools.` });
    }
  }

  return finish(".agent", issues);
}

// ── helpers ───────────────────────────────────────────────────────────────────
function parseActionKeys(content: string): Set<string> {
  const keys = new Set<string>();
  const lines = content.split("\n");
  let inActions = false;
  for (const line of lines) {
    if (line.trim() === "actions:") { inActions = true; continue; }
    if (inActions) {
      // top-level key (0 indent) signals end of actions block
      if (line.length > 0 && line[0] !== " " && line[0] !== "\t" && line[0] !== "#") {
        inActions = false;
      }
      // 2-space-indented key: the action name
      const m = line.match(/^  (\w+):(?:\s|$)/);
      if (m) keys.add(m[1]);
    }
  }
  return keys;
}

function finish(file: string, issues: ValidationIssue[]): FileValidation {
  return {
    file,
    issues,
    hasError: issues.some(i => i.severity === "error"),
    hasWarn:  issues.some(i => i.severity === "warn"),
  };
}
