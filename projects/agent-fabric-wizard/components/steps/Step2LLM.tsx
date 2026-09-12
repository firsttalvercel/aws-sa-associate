"use client";

import { useState } from "react";
import { useWizardStore } from "@/store";
import FormField from "@/components/ui/FormField";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import type { SimplifiedConfig } from "@/lib/types";

type Provider = SimplifiedConfig["llm"]["provider"];

const PROVIDERS: { value: Provider; label: string; defaultModel: string; defaultBaseUrl: string }[] = [
  { value: "openai",    label: "OpenAI",        defaultModel: "gpt-4.1-mini",                              defaultBaseUrl: "https://api.openai.com/v1" },
  { value: "anthropic", label: "Anthropic",     defaultModel: "claude-sonnet-4-5",                         defaultBaseUrl: "https://api.anthropic.com" },
  { value: "gemini",    label: "Google Gemini", defaultModel: "gemini-2.0-flash",                          defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta" },
  { value: "bedrock",   label: "AWS Bedrock",   defaultModel: "anthropic.claude-3-5-sonnet-20241022-v2:0", defaultBaseUrl: "https://bedrock.us-east-1.amazonaws.com" },
];

export default function Step2LLM() {
  const config = useWizardStore((s) => s.config);
  const updateConfig = useWizardStore((s) => s.updateConfig);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  const [testState, setTestState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");

  const handleTest = async () => {
    setTestState("loading");
    setTestMessage("");
    try {
      const res = await fetch("/api/validate-llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: config.llm.provider,
          apiKey: config.llm.apiKey,
          baseUrl: config.llm.baseUrl,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestState("ok");
        setTestMessage("Connection successful.");
      } else {
        setTestState("error");
        setTestMessage(data.error ?? "Validation failed.");
      }
    } catch {
      setTestState("error");
      setTestMessage("Network error. Could not reach the API.");
    }
  };

  const handleProviderChange = (provider: Provider) => {
    const def = PROVIDERS.find((p) => p.value === provider)!;
    const currentIsDefault = PROVIDERS.some((p) => p.defaultModel === config.llm.model);
    updateConfig({
      llm: {
        ...config.llm,
        provider,
        model: currentIsDefault ? def.defaultModel : config.llm.model,
        baseUrl: undefined,
      },
    });
  };

  const currentProvider = PROVIDERS.find((p) => p.value === config.llm.provider)!;

  const errors = {
    model:   !config.llm.model.trim() ? "Model is required." : "",
    apiKey:  !config.llm.apiKey?.trim() ? "API key is required." : "",
    baseUrl:
      config.llm.baseUrl?.trim() && !/^https?:\/\//i.test(config.llm.baseUrl.trim())
        ? "Must be a valid URL starting with http:// or https://"
        : "",
  };

  const inputClass = (field: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 transition-colors ${
      touched[field] && errors[field as keyof typeof errors]
        ? "border-red-400 focus:border-red-400 focus:ring-red-400/10"
        : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/10"
    }`;

  return (
    <div className="flex flex-col gap-5">
      <FormField label="Provider" required>
        <select
          value={config.llm.provider}
          onChange={(e) => handleProviderChange(e.target.value as Provider)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </FormField>

      <FormField label="Model" required hint={`Default: ${currentProvider.defaultModel}`}>
        <input
          type="text"
          value={config.llm.model}
          onChange={(e) => updateConfig({ llm: { ...config.llm, model: e.target.value } })}
          onBlur={() => touch("model")}
          placeholder={currentProvider.defaultModel}
          className={inputClass("model")}
        />
        {touched.model && errors.model && (
          <p className="text-[11px] text-red-500 mt-0.5">{errors.model}</p>
        )}
      </FormField>

      <FormField
        label="API Key"
        required
        hint="Written to exchange.json as a secret variable. Not included in the YAML artifact."
      >
        <input
          type="password"
          value={config.llm.apiKey ?? ""}
          onChange={(e) => { updateConfig({ llm: { ...config.llm, apiKey: e.target.value || undefined } }); setTestState("idle"); }}
          onBlur={() => touch("apiKey")}
          placeholder="sk-..."
          autoComplete="off"
          className={inputClass("apiKey")}
        />
        {touched.apiKey && errors.apiKey && (
          <p className="text-[11px] text-red-500 mt-0.5">{errors.apiKey}</p>
        )}
      </FormField>

      <FormField
        label="Base URL"
        hint={`Optional. Leave blank for ${currentProvider.defaultBaseUrl}. Use for proxies or self-hosted endpoints.`}
      >
        <input
          type="text"
          value={config.llm.baseUrl ?? ""}
          onChange={(e) => {
            updateConfig({ llm: { ...config.llm, baseUrl: e.target.value || undefined } });
            setTestState("idle");
          }}
          onBlur={() => touch("baseUrl")}
          placeholder={currentProvider.defaultBaseUrl}
          className={inputClass("baseUrl")}
        />
        {touched.baseUrl && errors.baseUrl && (
          <p className="text-[11px] text-red-500 mt-0.5">{errors.baseUrl}</p>
        )}
      </FormField>

      {/* Test connection */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleTest}
          disabled={!config.llm.apiKey?.trim() || testState === "loading" || config.llm.provider === "bedrock"}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {testState === "loading" ? (
            <Loader size={13} className="animate-spin text-blue-500" />
          ) : testState === "ok" ? (
            <CheckCircle size={13} className="text-emerald-500" />
          ) : testState === "error" ? (
            <XCircle size={13} className="text-red-500" />
          ) : (
            <span className="w-3 h-3 rounded-full border-2 border-gray-300 inline-block" />
          )}
          {testState === "loading" ? "Testing…" : "Test Connection"}
        </button>

        {testState === "ok" && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1">
            <CheckCircle size={12} /> {testMessage}
          </span>
        )}
        {testState === "error" && (
          <span className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2.5 py-1">
            <XCircle size={12} /> {testMessage}
          </span>
        )}
        {config.llm.provider === "bedrock" && (
          <span className="text-xs text-gray-400">Bedrock uses AWS credentials. Test not available.</span>
        )}
      </div>
    </div>
  );
}
