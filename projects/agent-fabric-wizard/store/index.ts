"use client";

import { create } from "zustand";
import { compile } from "@/lib/compiler";
import { configToYaml, yamlToConfig } from "@/lib/yaml-adapter";
import type { SimplifiedConfig, GeneratedFiles } from "@/lib/types";
import { TEMPLATES } from "@/lib/templates";

export type { WizardTemplate } from "@/lib/templates";
export { TEMPLATES } from "@/lib/templates";

const DEFAULT_CONFIG = TEMPLATES[0].config;
const STORAGE_KEY = "agent-fabric-wizard-config";

function loadPersistedState(): { config: SimplifiedConfig; templateId: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.config && parsed?.templateId) return parsed;
  } catch { /* ignore */ }
  return null;
}

function persistState(templateId: string, config: SimplifiedConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ templateId, config }));
  } catch { /* ignore */ }
}

interface WizardState {
  step: number;
  templateId: string;
  config: SimplifiedConfig;
  yamlText: string;
  yamlError: string | null;
  generatedFiles: GeneratedFiles | null;
  standaloneTest: boolean;

  setStep: (n: number) => void;
  setConfig: (cfg: SimplifiedConfig) => void;
  updateConfig: (partial: Partial<SimplifiedConfig>) => void;
  setYaml: (text: string) => void;
  generate: () => void;
  reset: () => void;
  loadTemplate: (id: string) => void;
  goToTestStandalone: () => void;
}

const _persisted = loadPersistedState();

export const useWizardStore = create<WizardState>((set, get) => ({
  step: 0,
  templateId: _persisted?.templateId ?? "loans",
  config: _persisted?.config ?? DEFAULT_CONFIG,
  yamlText: "",
  yamlError: null,
  generatedFiles: null,
  standaloneTest: false,

  setStep: (n) =>
    set((state) => {
      const updates: Partial<WizardState> = { step: n };
      if (n === 6) {
        updates.yamlText = configToYaml(state.config);
        updates.yamlError = null;
      }
      return updates;
    }),

  setConfig: (cfg) => {
    set({ config: cfg });
    persistState(get().templateId, cfg);
  },

  updateConfig: (partial) => {
    set((state) => ({ config: { ...state.config, ...partial } }));
    const { templateId, config } = get();
    persistState(templateId, config);
  },

  setYaml: (text) => {
    set({ yamlText: text });
    try {
      const parsed = yamlToConfig(text);
      set({ config: parsed, yamlError: null });
      persistState(get().templateId, parsed);
    } catch (e) {
      set({ yamlError: (e as Error).message });
    }
  },

  generate: () => {
    const { yamlText } = get();
    try {
      const parsed = yamlToConfig(yamlText);
      const files = compile(parsed);
      set({ config: parsed, generatedFiles: files, yamlError: null, step: 7 });
      persistState(get().templateId, parsed);
    } catch (e) {
      set({ yamlError: (e as Error).message });
    }
  },

  reset: () => {
    const { templateId } = get();
    const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
    set({
      step: 0,
      config: template.config,
      yamlText: "",
      yamlError: null,
      generatedFiles: null,
      standaloneTest: false,
    });
    persistState(templateId, template.config);
  },

  goToTestStandalone: () => set({ step: 8, standaloneTest: true }),

  loadTemplate: (id) => {
    const template = TEMPLATES.find((t) => t.id === id);
    if (!template) return;
    set({
      config: template.config,
      templateId: id,
      yamlText: "",
      generatedFiles: null,
      yamlError: null,
    });
    persistState(id, template.config);
  },
}));
