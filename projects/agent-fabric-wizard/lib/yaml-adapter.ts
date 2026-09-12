import { load, dump } from "js-yaml";
import type { SimplifiedConfig } from "./types";

const VALID_PROVIDERS = ["openai", "anthropic", "gemini", "bedrock"] as const;
const VALID_ROUTING = ["intent", "linear"] as const;

export function configToYaml(cfg: SimplifiedConfig): string {
  // Strip sensitive values from the portable YAML artifact
  const safe: SimplifiedConfig = {
    ...cfg,
    llm: { provider: cfg.llm.provider, model: cfg.llm.model, baseUrl: cfg.llm.baseUrl },
  };
  return dump(safe, { indent: 2, lineWidth: -1 });
}

export function yamlToConfig(yaml: string): SimplifiedConfig {
  const parsed = load(yaml) as Record<string, unknown>;

  if (!parsed || typeof parsed !== "object") throw new Error("Invalid YAML: not an object");
  if (!parsed.name || typeof parsed.name !== "string") throw new Error("Missing required field: name");
  if (!parsed.description || typeof parsed.description !== "string") throw new Error("Missing required field: description");

  const llm = parsed.llm as Record<string, unknown> | undefined;
  if (!llm) throw new Error("Missing required field: llm");
  if (!VALID_PROVIDERS.includes(llm.provider as never))
    throw new Error(`Invalid llm.provider: must be one of ${VALID_PROVIDERS.join(", ")}`);
  if (!llm.model || typeof llm.model !== "string") throw new Error("Missing required field: llm.model");

  const routing = parsed.routing as Record<string, unknown> | undefined;
  if (!routing) throw new Error("Missing required field: routing");
  if (!VALID_ROUTING.includes(routing.type as never))
    throw new Error(`Invalid routing.type: must be "intent" or "linear"`);

  return {
    name: parsed.name as string,
    description: parsed.description as string,
    orgId: (parsed.orgId as string) ?? "",
    businessGroupId: (parsed.businessGroupId as string) ?? undefined,
    version: (parsed.version as string) ?? "0.0.0",
    tags: (parsed.tags as string[]) ?? [],
    llm: {
      provider: llm.provider as SimplifiedConfig["llm"]["provider"],
      model: llm.model as string,
      baseUrl: llm.baseUrl as string | undefined,
      // apiKey is intentionally not round-tripped through YAML
    },
    agents: (parsed.agents as SimplifiedConfig["agents"]) ?? [],
    mcps: (parsed.mcps as SimplifiedConfig["mcps"]) ?? [],
    routing: {
      type: routing.type as "intent" | "linear",
      intents: (routing.intents as SimplifiedConfig["routing"]["intents"]) ?? [],
      linearHandler: routing.linearHandler as string | undefined,
    },
  };
}
