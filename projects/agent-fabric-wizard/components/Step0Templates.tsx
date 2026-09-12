"use client";

import { useWizardStore, TEMPLATES } from "@/store";

const INDUSTRY_ICON: Record<string, string> = {
  Finance:    "🏦",
  Energy:     "⚡",
  Healthcare: "🏥",
  Retail:     "🛍️",
};

export default function Step0Templates() {
  const templateId = useWizardStore((s) => s.templateId);
  const loadTemplate = useWizardStore((s) => s.loadTemplate);
  const setStep = useWizardStore((s) => s.setStep);
  const setConfig = useWizardStore((s) => s.setConfig);
  const goToTestStandalone = useWizardStore((s) => s.goToTestStandalone);

  const handleStart = () => {
    loadTemplate(templateId);
    setStep(1);
  };

  const handleScratch = () => {
    setConfig({
      name: "",
      description: "",
      orgId: "",
      businessGroupId: "",
      version: "1.0.0",
      tags: [],
      llm: { provider: "openai", model: "" },
      agents: [],
      mcps: [],
      routing: { type: "intent", intents: [] },
    });
    setStep(1);
  };

  const selected = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];

  return (
    <div className="py-4 flex flex-col gap-6 max-w-md mx-auto">
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Industry template
        </label>

        {/* Custom template picker */}
        <div className="flex flex-col gap-1.5">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => loadTemplate(t.id)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border text-left transition-all ${
                templateId === t.id
                  ? "border-blue-400 bg-blue-50 ring-1 ring-blue-300"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span className="text-xl leading-none">{INDUSTRY_ICON[t.industry] ?? "🔧"}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-tight ${templateId === t.id ? "text-blue-700" : "text-gray-800"}`}>
                  {t.label}
                </p>
                <p className="text-[11px] text-gray-400 leading-snug mt-0.5 truncate">{t.description}</p>
              </div>
              {templateId === t.id && (
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleStart}
          className="w-full py-2.5 rounded-lg text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md"
          style={{ background: "linear-gradient(135deg, #00a0df, #0077b6)" }}
        >
          Load template →
        </button>
        <button
          type="button"
          onClick={handleScratch}
          className="w-full py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-500 font-medium hover:text-gray-700 hover:border-gray-300 transition-colors"
        >
          Start from scratch
        </button>
        <button
          type="button"
          onClick={goToTestStandalone}
          className="w-full py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-500 font-medium hover:text-gray-700 hover:border-gray-300 transition-colors"
        >
          Test your broker
        </button>
      </div>
    </div>
  );
}
