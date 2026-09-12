"use client";

import Image from "next/image";
import { useWizardStore } from "@/store";
import MaxWizard from "@/components/MaxWizard";
import StepIndicator from "@/components/StepIndicator";
import Step1BasicInfo from "@/components/steps/Step1BasicInfo";
import Step2LLM from "@/components/steps/Step2LLM";
import Step3Agents from "@/components/steps/Step3Agents";
import Step4MCPs from "@/components/steps/Step4MCPs";
import Step5Routing from "@/components/steps/Step5Routing";
import Step6ReviewYaml from "@/components/steps/Step6ReviewYaml";
import Step7Generate from "@/components/steps/Step7Generate";
import Step8Test from "@/components/steps/Step8Test";
import Step0Templates from "@/components/Step0Templates";
import type { SimplifiedConfig } from "@/lib/types";

const STEP_META = [
  { title: "Choose a starting point", description: "Pre-built for your industry. Customise every detail in the steps that follow." },
  { title: "Name your agent network", description: "Give your Broker 2.0 project a name, description, and Anypoint organization details." },
  { title: "Choose your LLM", description: "Select the language model and supply your API key. It is stored as a secret variable." },
  { title: "Connect agents", description: "Add the A2A agents your broker can delegate to." },
  { title: "Connect MCP servers", description: "Add MCP servers that expose tools to your broker." },
  { title: "Configure routing", description: "Define how incoming requests are classified and dispatched." },
  { title: "Review configuration", description: "Review your simplified YAML. Edit or paste in a saved config." },
  { title: "Your files are ready", description: "Download your Broker 2.0 project and open it in Anypoint Code Builder." },
  { title: "Test your broker", description: "Deploy your project, paste the live endpoint URL, and run the test suite." },
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function blockReason(step: number, config: SimplifiedConfig): string {
  if (step === 1) {
    if (!config.name.trim()) return "Project name is required.";
    if (!config.description.trim()) return "Description is required.";
    if (!config.orgId.trim()) return "Organization ID is required.";
    if (!UUID_RE.test(config.orgId.trim())) return "Organization ID must be a valid UUID.";
    if (!config.businessGroupId?.trim()) return "Business Group ID is required.";
    if (!UUID_RE.test(config.businessGroupId.trim())) return "Business Group ID must be a valid UUID.";
  }
  if (step === 2) {
    if (!config.llm.model.trim()) return "LLM model is required.";
    if (!config.llm.apiKey?.trim()) return "API key is required.";
  }
  if (step === 5) {
    if (config.routing.type === "intent") {
      const intents = config.routing.intents ?? [];
      if (!intents.length) return "Add at least one intent route.";
      const bad = intents.find((i) => !i.label || !i.description || !i.handler);
      if (bad) return "Each intent needs a label, description, and handler.";
    } else {
      if (!config.routing.linearHandler) return "Select a handler for linear routing.";
    }
  }
  return "";
}

function canAdvance(step: number, config: SimplifiedConfig): boolean {
  return blockReason(step, config) === "";
}

export default function WizardShell() {
  const step = useWizardStore((s) => s.step);
  const config = useWizardStore((s) => s.config);
  const yamlError = useWizardStore((s) => s.yamlError);
  const standaloneTest = useWizardStore((s) => s.standaloneTest);
  const setStep = useWizardStore((s) => s.setStep);
  const generate = useWizardStore((s) => s.generate);
  const reset = useWizardStore((s) => s.reset);

  const isTemplate = step === 0;
  const meta = STEP_META[step];
  const isLast = step === 7 || step === 8;
  const isReview = step === 6;
  const reason = !isReview && !isTemplate ? blockReason(step, config) : "";

  const handleNext = () => {
    if (isReview) {
      generate();
    } else if (canAdvance(step, config)) {
      setStep(step + 1);
    }
  };

  const steps: Record<number, React.ReactNode> = {
    0: <Step0Templates />,
    1: <Step1BasicInfo />,
    2: <Step2LLM />,
    3: <Step3Agents />,
    4: <Step4MCPs />,
    5: <Step5Routing />,
    6: <Step6ReviewYaml />,
    7: <Step7Generate />,
    8: <Step8Test />,
  };

  return (
    <div className="min-h-screen flex flex-col pb-20" style={{ background: "var(--background)" }}>

      <MaxWizard />

      {/* ── Top nav bar ─────────────────────────────────────────────── */}
      <header style={{ background: "var(--ms-navy)" }} className="px-6 py-3 flex items-center gap-3 shadow-md">
        {/* MuleSoft logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
            <Image
              src="/mulesoft-logo.png"
              alt="MuleSoft"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <div>
            <span className="text-white font-semibold text-sm tracking-wide">MuleSoft</span>
            <span className="text-white/50 text-xs ml-1">from Salesforce</span>
          </div>
        </div>
        <div className="h-4 w-px bg-white/20 mx-1" />
        <span className="text-white/80 text-sm font-medium">Agent Fabric Wizard</span>
        <div className="ml-auto">
          <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "color-mix(in srgb, var(--ms-blue) 13%, transparent)", color: "var(--ms-blue)", border: "1px solid color-mix(in srgb, var(--ms-blue) 27%, transparent)" }}>
            Broker 2.0
          </span>
        </div>
      </header>

      {/* ── Hero band ───────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, var(--ms-navy) 0%, #0f4c8a 60%, var(--ms-blue) 100%)" }} className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 py-10 relative z-10">
          {!isTemplate && (
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
              Step {step} of 8
            </p>
          )}
          <h1 className="text-white text-2xl font-bold leading-tight mb-1">
            {meta.title}
          </h1>
          <p className="text-white/70 text-sm">{meta.description}</p>
        </div>
        {/* Subtle dot grid overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }} />
      </div>

      {/* ── Step indicator ──────────────────────────────────────────── */}
      {!isTemplate && step !== 8 && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <StepIndicator currentStep={step} />
          </div>
        </div>
      )}

      {/* ── Main card ───────────────────────────────────────────────── */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6">
            {steps[step]}
          </div>

        </div>

        {/* Footer note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Agent Fabric Wizard · MuleSoft from Salesforce · Broker 2.0
          </p>
          <p className="text-[11px] text-gray-300 mt-1 max-w-2xl mx-auto leading-loose px-4">
            This tool was built by MuleSoft Solutions Engineers for internal use and field enablement.
            It is not an official MuleSoft or Salesforce product, is provided as-is without warranty,
            and is not supported by Salesforce Technical Support.
          </p>
        </div>
      </main>

      {/* ── Sticky bottom nav ───────────────────────────────────────── */}
      {!isTemplate && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 shadow-[0_-2px_12px_0_rgba(0,0,0,0.08)]"
             style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(8px)" }}>
          <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">

            {/* Left: back + start over */}
            <div className="flex items-center gap-3">
              {step === 8 ? (
                <button
                  type="button"
                  onClick={() => standaloneTest ? setStep(0) : setStep(7)}
                  className="px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
                >
                  {standaloneTest ? "← Home" : "← Back to files"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
                >
                  ← Back
                </button>
              )}
              {step > 1 && (
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Start Over
                </button>
              )}
            </div>

            {/* Right: validation hint + primary action */}
            <div className="flex items-center gap-3">
              {step === 8 && (
                <button
                  type="button"
                  onClick={reset}
                  className="px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
                >
                  Start Over
                </button>
              )}
              {!isLast && (
                <>
                  {isReview && yamlError && (
                    <span className="text-xs text-red-500">Fix YAML errors before generating</span>
                  )}
                  {!isReview && reason && (
                    <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                      {reason}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isReview ? !!yamlError : !canAdvance(step, config)}
                    className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                    style={{ background: "linear-gradient(135deg, var(--ms-blue), var(--ms-blue-dark))" }}
                  >
                    {isReview ? "Generate Files →" : "Next →"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
