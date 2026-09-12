import type { SimplifiedConfig, GeneratedFiles } from "./types";
import { registryKey, connectionName, toKebab, toSnake } from "./utils";

// Quote a scalar value for inline YAML if it contains characters that would
// break bare (unquoted) scalars: colon-space, leading special chars, etc.
function yamlStr(s: string): string {
  if (/[:#\[\]{},&*?|<>=!%@`]/.test(s) || /^\s|\s$/.test(s) || s.includes(": ")) {
    return `'${s.replace(/'/g, "''")}'`;
  }
  return s;
}

export function compile(cfg: SimplifiedConfig): GeneratedFiles {
  const brokerId = toSnake(cfg.name);
  const brokerFile = toKebab(cfg.name);
  // Unique per-broker LLM key avoids "belongs to another project" error when
  // multiple agent networks in the same BG share the same provider (e.g. openai).
  const llmKey = registryKey(cfg.name) + cfg.llm.provider.charAt(0).toUpperCase() + cfg.llm.provider.slice(1);
  // Connection name and alias stay provider-based so the .agent file is readable.
  const llmConnName = connectionName(cfg.llm.provider);
  const llmAlias = cfg.llm.provider + "_llm";

  // ── agent-network.yaml ──────────────────────────────────────────────────

  // LLM URL: use custom baseUrl if provided, otherwise fall back to the ${provider.url} variable
  const llmUrlInYaml = cfg.llm.baseUrl
    ? `\${${llmKey}.url}`
    : llmBaseUrl(cfg.llm.provider);

  // Only external A2A agents go into the registry
  const a2aAgents = cfg.agents.filter((a) => (a.agentType ?? "a2a") === "a2a");
  const inlineSubagents = cfg.agents.filter((a) => a.agentType === "subagent");

  const agentRegistryLines: string[] = [];
  for (const a of a2aAgents) {
    const key = registryKey(a.name);
    const skillsBlock = a.skills?.length
      ? `\n                            skills:\n` +
        a.skills.map((s) => `                              - id: ${s.id}${s.description ? `\n                                description: ${yamlStr(s.description)}` : ""}`).join("\n")
      : "";
    agentRegistryLines.push(`        ${key}:
            info:
                label: ${yamlStr(a.name)}
            metadata:
                platform: Custom
                interfaces:
                    a2a:
                        card:
                            name: ${yamlStr(a.name)}
                            description: ${yamlStr(a.name + " agent")}
                            version: 1.0.0
                            capabilities:
                                streaming: false
                                pushNotifications: false
                            defaultInputModes:
                                - application/json
                                - text/plain
                            defaultOutputModes:
                                - application/json
                                - text/plain${skillsBlock}`);
  }

  const mcpRegistryLines: string[] = [];
  for (const m of cfg.mcps) {
    const key = registryKey(m.name);
    mcpRegistryLines.push(`        ${key}:
            info:
                label: ${yamlStr(m.name)}
            metadata:
                transport:
                    kind: streamableHttp
                    path: /`);
  }

  const agentConnectionLines: string[] = [];
  for (const a of a2aAgents) {
    const key = registryKey(a.name);
    const conn = connectionName(a.name);
    agentConnectionLines.push(`        ${conn}:
            kind: a2a
            ref:
                name: ${key}
            url: \${${key}.url}`);
  }

  const mcpConnectionLines: string[] = [];
  for (const m of cfg.mcps) {
    const key = registryKey(m.name);
    const conn = connectionName(m.name);
    mcpConnectionLines.push(`        ${conn}:
            kind: mcp
            ref:
                name: ${key}
            url: \${${key}.url}`);
  }

  const brokerSkills =
    cfg.routing.type === "intent" && cfg.routing.intents?.length
      ? cfg.routing.intents
          .map(
            (r, i) =>
              `                        - id: ${toKebab(r.label)}-skill\n                          name: ${yamlStr(r.label)}\n                          description: ${yamlStr(r.description)}`
          )
          .join("\n")
      : `                        - id: ${brokerFile}-skill\n                          name: ${yamlStr(cfg.name)}\n                          description: ${yamlStr(cfg.description)}`;

  const networkYaml = `agentNetwork: 2.0.0
info:
    label: ${yamlStr(cfg.name)}
    version: v1
registry:
    agents:
${agentRegistryLines.join("\n")}
    mcps:
${mcpRegistryLines.join("\n")}
    llms:
        ${llmKey}:
            info:
                label: ${cfg.llm.provider.charAt(0).toUpperCase() + cfg.llm.provider.slice(1)} LLM
            metadata:
                platform: ${cfg.llm.provider.charAt(0).toUpperCase() + cfg.llm.provider.slice(1)}
context:
    connections:
${agentConnectionLines.join("\n")}
${mcpConnectionLines.join("\n")}
        ${llmConnName}:
            kind: llm
            ref:
                name: ${llmKey}
            url: ${llmUrlInYaml}
            authentication:
                kind: apiKey
                apiKey: \${${llmKey}.apiKey}
brokers:
    ${brokerId}:
        kind: AgentScript
        implementation: ./brokers/${brokerFile}.agent
        interfaces:
            a2a:
                card:
                    name: ${yamlStr(cfg.name)}
                    description: ${yamlStr(cfg.description)}
                    version: 1.0.0
                    capabilities:
                        streaming: false
                        pushNotifications: true
                    defaultInputModes:
                        - text/plain
                    defaultOutputModes:
                        - text/plain
                    skills:
${brokerSkills}
                    supportedInterfaces:
                        - url: http://localhost:8001/${brokerFile}/
                          protocolVersion: "1.0"
                          protocolBinding: HTTP+JSON
                        - url: http://localhost:8001/${brokerFile}/
                          protocolVersion: "1.0"
                          protocolBinding: JSONRPC
`;

  // ── exchange.json ───────────────────────────────────────────────────────

  const orgId = cfg.orgId.trim() || "<YOUR_ORG_ID>";
  const groupId = cfg.businessGroupId?.trim() || orgId;
  const assetVersion = cfg.version?.trim() || "0.0.0";

  const variables: Record<string, unknown> = {};
  for (const a of a2aAgents) {
    const key = registryKey(a.name);
    const agentUrl = a.url.trim() || "<ENDPOINT_URL>";
    variables[key] = {
      url: { description: `${a.name} URL`, default: agentUrl, secret: false },
    };
  }
  for (const m of cfg.mcps) {
    const key = registryKey(m.name);
    const mcpUrl = m.url.trim() ? (m.url.trim().endsWith("/") ? m.url.trim() : m.url.trim() + "/") : "<ENDPOINT_URL>/";
    variables[key] = {
      url: { description: `${m.name} URL`, default: mcpUrl, secret: false },
    };
  }
  // LLM: always emit apiKey (as secret); also emit url if user supplied a custom base URL
  const llmVarEntry: Record<string, unknown> = {
    apiKey: {
      description: `${cfg.llm.provider} API key`,
      ...(cfg.llm.apiKey?.trim() ? { default: cfg.llm.apiKey.trim() } : {}),
      secret: true,
    },
  };
  if (cfg.llm.baseUrl?.trim()) {
    llmVarEntry.url = { description: `${cfg.llm.provider} base URL`, default: cfg.llm.baseUrl.trim(), secret: false };
  }
  variables[llmKey] = llmVarEntry;

  // ACB runtime limit variables — required for Anypoint Code Builder compatibility
  const runtimeVariables: Record<string, unknown> = {
    MODULE_GRAPH_ERROR_SETTINGS_MAX_HANDOFF_ITERATIONS: { default: "30", secret: false },
    MODULE_GRAPH_ERROR_SETTINGS_MAX_REASONING_ITERATIONS: { default: "20", secret: false },
    MODULE_GRAPH_ERROR_SETTINGS_MAX_SUBGRAPH_DEPTH: { default: "10", secret: false },
    MODULE_GRAPH_ERROR_SETTINGS_MAX_NODE_TOOL_CALL_ITERATIONS: { default: "20", secret: false },
    MODULE_GRAPH_ERROR_SETTINGS_MAX_TURN_TOOL_CALL_COUNTS: { default: "50", secret: false },
    MODULE_GRAPH_ERROR_SETTINGS_MAX_STATE_SIZE_BYTES: { default: "10485760", secret: false },
    OBJECT_STORE_DEFAULT_TTL_MS: { default: "2592000000", secret: false },
  };

  const exchangeJson = JSON.stringify(
    {
      main: "agent-network.yaml",
      name: cfg.name,
      classifier: "agentic-network",
      organizationId: orgId,
      descriptorVersion: "1.0.0",
      apiVersion: "v1",
      tags: cfg.tags?.length ? cfg.tags : [],
      groupId: groupId,
      assetId: brokerFile,
      version: assetVersion,
      dependencies: [],
      metadata: { variables: { ...variables, ...runtimeVariables } },
    },
    null,
    2
  );

  // ── .agent file ─────────────────────────────────────────────────────────

  const agentFile = buildAgentFile(cfg, brokerId, brokerFile, llmAlias, llmConnName);

  return {
    "agent-network.yaml": networkYaml,
    "exchange.json": exchangeJson,
    [`brokers/${brokerFile}.agent`]: agentFile,
  };
}

function llmBaseUrl(provider: string): string {
  switch (provider) {
    case "openai": return "https://api.openai.com/v1";
    case "anthropic": return "https://api.anthropic.com";
    case "gemini": return "https://generativelanguage.googleapis.com/v1beta";
    default: return "https://api.openai.com/v1";
  }
}

function buildAgentFile(
  cfg: SimplifiedConfig,
  brokerId: string,
  brokerFile: string,
  llmAlias: string,
  llmConnName: string
): string {
  const lines: string[] = [];
  const sep = (label: string) =>
    `# -- ${label} ${"-".repeat(Math.max(0, 72 - label.length - 5))}`;

  const cfgA2aAgents = cfg.agents.filter((a) => (a.agentType ?? "a2a") === "a2a");
  const cfgInlineSubagents = cfg.agents.filter((a) => a.agentType === "subagent");

  // ── Header ──────────────────────────────────────────────────────────────────
  lines.push(`# @dialect: AGENTFABRIC=1.0`);
  lines.push(``);
  lines.push(`system:`);
  lines.push(`  instructions: "You are ${cfg.name}. ${cfg.description}"`);
  lines.push(``);
  lines.push(`config:`);
  lines.push(`  agent_name: "${brokerFile}"`);
  lines.push(`  label: "${cfg.name}"`);
  lines.push(`  default_llm: @llm.${llmAlias}`);
  lines.push(``);
  lines.push(`llm:`);
  lines.push(`  ${llmAlias}:`);
  lines.push(`    target: "llm://${llmConnName}"`);
  lines.push(`    kind: "${llmKind(cfg.llm.provider)}"`);
  lines.push(`    model: "${cfg.llm.model}"`);
  lines.push(``);

  // ── Actions ─────────────────────────────────────────────────────────────────
  lines.push(sep("ACTION DEFINITIONS"));
  lines.push(``);
  lines.push(`actions:`);
  for (const a of cfgA2aAgents) {
    const conn = connectionName(a.name);
    const actionName = registryKey(a.name);
    lines.push(`  ${actionName}:`);
    lines.push(`    target: "a2a://${conn}"`);
    lines.push(`    kind: "a2a:send_message"`);
  }
  for (const m of cfg.mcps) {
    for (const tool of m.tools ?? []) {
      const actionName = registryKey(tool);
      const conn = connectionName(m.name);
      lines.push(`  ${actionName}:`);
      lines.push(`    target: "mcp://${conn}"`);
      lines.push(`    kind: "mcp:tool"`);
      lines.push(`    tool_name: "${tool}"`);
    }
  }
  lines.push(``);

  // ── Trigger ─────────────────────────────────────────────────────────────────
  lines.push(sep("TRIGGER"));
  lines.push(``);
  lines.push(`trigger entry:`);
  lines.push(`  kind: "a2a"`);
  lines.push(`  target: "brokers://${brokerId}/a2a"`);
  lines.push(`  on_message: ->`);

  if (cfg.routing.type === "intent" && cfg.routing.intents?.length) {
    lines.push(`    transition to @generator.classifyIntent`);
    lines.push(``);

    // ── Intent Classification ──────────────────────────────────────────────────
    lines.push(sep("INTENT CLASSIFICATION"));
    lines.push(``);
    const intentEnumValues = [
      ...cfg.routing.intents.map((r) => `"${toKebab(r.label)}"`),
      `"multi"`,
    ];
    lines.push(`generator classifyIntent:`);
    lines.push(`  description: "Classify the user's primary intent"`);
    lines.push(`  label: "Classify Intent"`);
    lines.push(`  llm: @llm.${llmAlias}`);
    lines.push(`  system:`);
    lines.push(`    instructions: |`);
    lines.push(`      You are an intent classifier for ${cfg.name}. Classify the user's request as exactly ONE of:`);
    for (const r of cfg.routing.intents) {
      lines.push(`      - "${toKebab(r.label)}": ${r.description}`);
    }
    lines.push(`      - "multi": the request clearly spans two or more of the above intents`);
    lines.push(`      Always pick one label. Do NOT ask questions or explain your reasoning.`);
    lines.push(`  prompt: ->`);
    lines.push(`    | {!@request.payload.message.parts[0].text}`);
    lines.push(`  outputs:`);
    lines.push(`    properties:`);
    lines.push(`      intent:`);
    lines.push(`        type: "string"`);
    lines.push(`        enum: [${intentEnumValues.join(", ")}]`);
    lines.push(`  on_exit: ->`);
    lines.push(`    transition to @router.intentRouter`);
    lines.push(``);

    // ── Intent Routing ─────────────────────────────────────────────────────────
    lines.push(sep("INTENT ROUTING"));
    lines.push(``);
    lines.push(`router intentRouter:`);
    lines.push(`  description: "Route to the correct handler based on classified intent"`);
    lines.push(`  label: "Intent Router"`);
    lines.push(`  routes:`);
    for (const route of cfg.routing.intents) {
      const handlerAgent = cfg.agents.find((a) => a.name === route.handler);
      const nodeType = handlerAgent ? "subagent" : "executor";
      const nodeId = registryKey(route.label) + (handlerAgent ? "Subagent" : "Executor");
      lines.push(`    - target: @${nodeType}.${nodeId}`);
      lines.push(`      when: @generator.classifyIntent.output.intent == "${toKebab(route.label)}"`);
      lines.push(`      label: "${route.label}"`);
    }
    lines.push(`    - target: @orchestrator.generalOrchestrator`);
    lines.push(`      when: @generator.classifyIntent.output.intent == "multi"`);
    lines.push(`      label: "Multi-Intent"`);
    lines.push(`  otherwise:`);
    lines.push(`    target: @orchestrator.generalOrchestrator`);
    lines.push(``);

    // ── Per-intent paths ───────────────────────────────────────────────────────
    for (const route of cfg.routing.intents) {
      const handlerAgent = cfg.agents.find((a) => a.name === route.handler);
      const echoId = registryKey(route.label) + "Response";
      const genId = registryKey(route.label) + "Summary";

      lines.push(sep(`${route.label.toUpperCase()} PATH`));
      lines.push(``);

      if (handlerAgent) {
        const nodeId = registryKey(route.label) + "Subagent";
        const isInlineSubagent = handlerAgent.agentType === "subagent";

        lines.push(`subagent ${nodeId}:`);
        lines.push(`  description: "Handle ${route.label} requests via ${handlerAgent.name}"`);
        lines.push(`  label: "${route.label} Subagent"`);
        lines.push(`  llm: @llm.${llmAlias}`);
        lines.push(`  system:`);
        lines.push(`    instructions: "${isInlineSubagent && handlerAgent.systemPrompt ? handlerAgent.systemPrompt : route.description}"`);
        lines.push(`  reasoning:`);
        lines.push(`    instructions: ->`);
        lines.push(`      | {!@request.payload.message.parts[0].text}`);
        lines.push(`    actions:`);

        if (isInlineSubagent) {
          // Inline subagent: use its declared subagentActions
          for (const actionName of handlerAgent.subagentActions ?? []) {
            const refAgent = cfg.agents.find(ag => ag.name === actionName && (ag.agentType ?? "a2a") === "a2a");
            const refTool  = !refAgent && cfg.mcps.flatMap(m => m.tools ?? []).includes(actionName);
            if (refAgent || refTool) {
              lines.push(`      ${registryKey(actionName)}: @actions.${registryKey(actionName)}`);
            }
          }
        } else {
          // A2A agent: single action reference
          lines.push(`      ${registryKey(handlerAgent.name)}: @actions.${registryKey(handlerAgent.name)}`);
        }

        lines.push(`    max_number_of_loops: 5`);
        lines.push(`    task_timeout_secs: 30`);
        lines.push(`    outputs:`);
        lines.push(`      properties:`);
        lines.push(`        response:`);
        lines.push(`          type: "string"`);
        lines.push(`  on_exit: ->`);
        lines.push(`    transition to @generator.${genId}`);
        lines.push(``);
        lines.push(`generator ${genId}:`);
        lines.push(`  description: "Craft the ${route.label} response from agent output"`);
        lines.push(`  label: "${route.label} Response"`);
        lines.push(`  llm: @llm.${llmAlias}`);
        lines.push(`  system:`);
        lines.push(`    instructions: "You are ${cfg.name}. ${cfg.description}. Craft a clear, professional response based on the result."`);
        lines.push(`  prompt: ->`);
        lines.push(`    | Original request: {!@request.payload.message.parts[0].text}. Agent result: {!@subagent.${nodeId}.output.response}`);
        lines.push(`  on_exit: ->`);
        lines.push(`    transition to @echo.${echoId}`);
      } else {
        const nodeId = registryKey(route.label) + "Executor";
        const actionName = registryKey(route.handler);
        lines.push(`executor ${nodeId}:`);
        lines.push(`  description: "Execute ${route.label} via MCP tool"`);
        lines.push(`  label: "${route.label} Executor"`);
        lines.push(`  do: ->`);
        lines.push(`    run @actions.${actionName}`);
        lines.push(`      with input = @request.payload.message.parts[0].text`);
        lines.push(`  on_exit: ->`);
        lines.push(`    transition to @generator.${genId}`);
        lines.push(``);
        lines.push(`generator ${genId}:`);
        lines.push(`  description: "Craft the ${route.label} response from tool output"`);
        lines.push(`  label: "${route.label} Response"`);
        lines.push(`  llm: @llm.${llmAlias}`);
        lines.push(`  system:`);
        lines.push(`    instructions: "You are ${cfg.name}. ${cfg.description}. Craft a clear, professional response based on the result."`);
        lines.push(`  prompt: ->`);
        lines.push(`    | Original request: {!@request.payload.message.parts[0].text}. Tool result: {!@executor.${nodeId}.output}`);
        lines.push(`  on_exit: ->`);
        lines.push(`    transition to @echo.${echoId}`);
      }
      lines.push(``);
      lines.push(`echo ${echoId}:`);
      lines.push(`  kind: "a2a:status_update_event"`);
      lines.push(`  state: "TASK_STATE_COMPLETED"`);
      lines.push(`  message: a2a.message({`);
      lines.push(`    messageId: uuid(),`);
      lines.push(`    parts: [a2a.textPart(@generator.${genId}.output)]`);
      lines.push(`  })`);
      lines.push(``);
    }

    // ── General Orchestrator (multi-intent + fallback) ─────────────────────────
    lines.push(sep("GENERAL ORCHESTRATOR (MULTI-INTENT + FALLBACK)"));
    lines.push(``);
    const allIntentActions = [
      ...cfgA2aAgents.map((a) => `      ${registryKey(a.name)}: @actions.${registryKey(a.name)}`),
      ...cfg.mcps.flatMap((m) =>
        (m.tools ?? []).map((t) => `      ${registryKey(t)}: @actions.${registryKey(t)}`)
      ),
    ];
    lines.push(`orchestrator generalOrchestrator:`);
    lines.push(`  description: "Handle multi-intent and unclassified requests using all available actions"`);
    lines.push(`  label: "General Orchestrator"`);
    lines.push(`  llm: @llm.${llmAlias}`);
    lines.push(`  system:`);
    lines.push(`    instructions: |`);
    lines.push(`      You are ${cfg.name}. ${cfg.description}`);
    lines.push(`      Use available actions to fully answer the user's request.`);
    lines.push(`  reasoning:`);
    lines.push(`    instructions: ->`);
    lines.push(`      | {!@request.payload.message.parts[0].text}`);
    lines.push(`    actions:`);
    lines.push(allIntentActions.join("\n"));
    lines.push(`    max_number_of_loops: 8`);
    lines.push(`    task_timeout_secs: 120`);
    lines.push(`    outputs:`);
    lines.push(`      properties:`);
    lines.push(`        response:`);
    lines.push(`          type: "string"`);
    lines.push(`  on_exit: ->`);
    lines.push(`    transition to @generator.generalSummary`);
    lines.push(``);
    lines.push(`generator generalSummary:`);
    lines.push(`  description: "Craft the general response from orchestrator output"`);
    lines.push(`  label: "General Response"`);
    lines.push(`  llm: @llm.${llmAlias}`);
    lines.push(`  system:`);
    lines.push(`    instructions: "You are ${cfg.name}. ${cfg.description}. Craft a clear, professional response based on the result."`);
    lines.push(`  prompt: ->`);
    lines.push(`    | Original request: {!@request.payload.message.parts[0].text}. Result: {!@orchestrator.generalOrchestrator.output.response}`);
    lines.push(`  on_exit: ->`);
    lines.push(`    transition to @echo.generalResponse`);
    lines.push(``);
    lines.push(`echo generalResponse:`);
    lines.push(`  kind: "a2a:status_update_event"`);
    lines.push(`  state: "TASK_STATE_COMPLETED"`);
    lines.push(`  message: a2a.message({`);
    lines.push(`    messageId: uuid(),`);
    lines.push(`    parts: [a2a.textPart(@generator.generalSummary.output)]`);
    lines.push(`  })`);

  } else {
    // ── Linear: single orchestrator ────────────────────────────────────────────
    lines.push(`    transition to @orchestrator.mainOrchestrator`);
    lines.push(``);
    lines.push(sep("MAIN ORCHESTRATOR"));
    lines.push(``);
    const allLinearActions = [
      ...cfgA2aAgents.map((a) => `      ${registryKey(a.name)}: @actions.${registryKey(a.name)}`),
      ...cfg.mcps.flatMap((m) =>
        (m.tools ?? []).map((t) => `      ${registryKey(t)}: @actions.${registryKey(t)}`)
      ),
    ];
    lines.push(`orchestrator mainOrchestrator:`);
    lines.push(`  description: "Main request handler"`);
    lines.push(`  label: "${cfg.name}"`);
    lines.push(`  llm: @llm.${llmAlias}`);
    lines.push(`  system:`);
    lines.push(`    instructions: |`);
    lines.push(`      You are ${cfg.name}. ${cfg.description}`);
    lines.push(`      Use available actions to fully answer the user's request.`);
    lines.push(`  reasoning:`);
    lines.push(`    instructions: ->`);
    lines.push(`      | {!@request.payload.message.parts[0].text}`);
    lines.push(`    actions:`);
    lines.push(allLinearActions.join("\n"));
    lines.push(`    max_number_of_loops: 8`);
    lines.push(`    task_timeout_secs: 120`);
    lines.push(`    outputs:`);
    lines.push(`      properties:`);
    lines.push(`        response:`);
    lines.push(`          type: "string"`);
    lines.push(`  on_exit: ->`);
    lines.push(`    transition to @generator.mainSummary`);
    lines.push(``);
    lines.push(`generator mainSummary:`);
    lines.push(`  description: "Craft the final response from orchestrator output"`);
    lines.push(`  label: "Final Response"`);
    lines.push(`  llm: @llm.${llmAlias}`);
    lines.push(`  system:`);
    lines.push(`    instructions: "You are ${cfg.name}. ${cfg.description}. Craft a clear, professional response based on the result."`);
    lines.push(`  prompt: ->`);
    lines.push(`    | Original request: {!@request.payload.message.parts[0].text}. Result: {!@orchestrator.mainOrchestrator.output.response}`);
    lines.push(`  on_exit: ->`);
    lines.push(`    transition to @echo.finalResponse`);
    lines.push(``);
    lines.push(`echo finalResponse:`);
    lines.push(`  kind: "a2a:status_update_event"`);
    lines.push(`  state: "TASK_STATE_COMPLETED"`);
    lines.push(`  message: a2a.message({`);
    lines.push(`    messageId: uuid(),`);
    lines.push(`    parts: [a2a.textPart(@generator.mainSummary.output)]`);
    lines.push(`  })`);
  }

  // ── Inline subagent nodes (only those not already rendered as route handlers) ──
  // Track by agent name — a subagent used as a route handler is already emitted above
  const renderedAsRouteHandler = new Set(
    cfg.routing.type === "intent"
      ? (cfg.routing.intents ?? [])
          .filter(r => cfg.agents.find(a => a.name === r.handler && a.agentType === "subagent"))
          .map(r => r.handler)
      : []
  );
  for (const a of cfgInlineSubagents) {
    const nodeId = registryKey(a.name) + "Subagent";
    if (renderedAsRouteHandler.has(a.name)) continue; // already emitted as a route path
    const prompt = a.systemPrompt || a.name;

    // Build actions block from subagentActions
    const actionRefs: string[] = [];
    for (const actionName of a.subagentActions ?? []) {
      const refAgent = cfg.agents.find(ag => ag.name === actionName && (ag.agentType ?? "a2a") === "a2a");
      const refTool  = !refAgent && cfg.mcps.flatMap(m => m.tools ?? []).includes(actionName);
      if (refAgent || refTool) actionRefs.push(`      ${registryKey(actionName)}: @actions.${registryKey(actionName)}`);
    }

    lines.push(``);
    lines.push(sep(`${a.name.toUpperCase()} (SUBAGENT)`));
    lines.push(``);
    lines.push(`subagent ${nodeId}:`);
    lines.push(`  description: "${a.name}"`);
    lines.push(`  label: "${a.name}"`);
    lines.push(`  llm: @llm.${llmAlias}`);
    lines.push(`  system:`);
    lines.push(`    instructions: "${prompt}"`);
    lines.push(`  reasoning:`);
    lines.push(`    instructions: ->`);
    lines.push(`      | {!@request.payload.message.parts[0].text}`);
    if (actionRefs.length) {
      lines.push(`    actions:`);
      lines.push(actionRefs.join("\n"));
    }
    lines.push(`    max_number_of_loops: 5`);
    lines.push(`    task_timeout_secs: 30`);
    lines.push(`    outputs:`);
    lines.push(`      properties:`);
    lines.push(`        response:`);
    lines.push(`          type: "string"`);
    lines.push(`  on_exit: ->`);
    lines.push(`    transition to @echo.${registryKey(a.name)}Response`);
    lines.push(``);
    lines.push(`echo ${registryKey(a.name)}Response:`);
    lines.push(`  kind: "a2a:status_update_event"`);
    lines.push(`  state: "TASK_STATE_COMPLETED"`);
    lines.push(`  message: a2a.message({`);
    lines.push(`    messageId: uuid(),`);
    lines.push(`    parts: [a2a.textPart(@subagent.${nodeId}.output.response)]`);
    lines.push(`  })`);
  }

  return lines.join("\n");
}

function llmKind(provider: string): string {
  switch (provider) {
    case "openai": return "OpenAI";
    case "anthropic": return "Anthropic";
    case "gemini": return "Gemini";
    case "bedrock": return "Bedrock";
    default: return "OpenAI";
  }
}
