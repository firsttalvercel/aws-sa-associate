// Simplified single-file format — the wizard's internal state and portable artifact

export interface AgentDef {
  name: string;
  agentType?: "a2a" | "subagent"; // "a2a" = external registered agent; "subagent" = inline LLM node (no URL)
  url: string;
  systemPrompt?: string;          // for inline subagents only
  subagentActions?: string[];     // for subagents: agent names + MCP tool names this node can call
  skills?: { id: string; description?: string }[];
}

export interface McpToolSchema {
  name: string;
  description?: string;
  inputSchema?: {
    type?: string;
    properties?: Record<string, { type?: string; description?: string }>;
    required?: string[];
  };
}

export interface McpDef {
  name: string;
  url: string;
  tools?: string[];
  toolSchemas?: McpToolSchema[];
}

export interface LlmDef {
  provider: "openai" | "anthropic" | "gemini" | "bedrock";
  model: string;
  baseUrl?: string; // override provider default; stored as exchange variable
  apiKey?: string;  // stored in exchange.json as secret: true; not written to YAML output
}

export interface IntentRoute {
  label: string;
  description: string;
  handler: string; // agent name or mcp tool name
}

export interface Routing {
  type: "intent" | "linear";
  intents?: IntentRoute[];
  linearHandler?: string; // for linear: single agent or mcp
}

export interface SimplifiedConfig {
  name: string;
  description: string;
  orgId: string;             // Anypoint organizationId
  businessGroupId?: string;  // groupId — defaults to orgId when blank
  version?: string;          // semver asset version, default "0.0.0"
  tags?: string[];
  llm: LlmDef;
  agents: AgentDef[];
  mcps: McpDef[];
  routing: Routing;
}

export interface GeneratedFiles {
  "agent-network.yaml": string;
  "exchange.json": string;
  [agentFile: string]: string; // brokers/<name>.agent
}
