"use client";

import { useWizardStore } from "@/store";
import { CheckCircle, AlertCircle } from "lucide-react";
import BrokerDiagram from "@/components/BrokerDiagram";

export default function Step6ReviewYaml() {
  const yamlText = useWizardStore((s) => s.yamlText);
  const yamlError = useWizardStore((s) => s.yamlError);
  const setYaml = useWizardStore((s) => s.setYaml);

  return (
    <div className="flex flex-col gap-4">
      <BrokerDiagram />

      <p className="text-sm text-gray-500">
        Review your configuration below. You can edit the YAML directly or paste in a previously saved configuration to pre-fill the wizard.
      </p>
      <textarea
        value={yamlText}
        onChange={(e) => setYaml(e.target.value)}
        spellCheck={false}
        className="font-mono text-xs leading-relaxed bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[380px] w-full focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 resize-y"
      />
      {yamlError ? (
        <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{yamlError}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs">
          <CheckCircle size={14} className="flex-shrink-0" />
          <span>Valid configuration</span>
        </div>
      )}
    </div>
  );
}
