"use client";

import { useState, useMemo } from "react";
import { useWizardStore } from "@/store";
import { Copy, Check, Download, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import JSZip from "jszip";
import { toKebab } from "@/lib/utils";
import { validateGeneratedFiles } from "@/lib/validator";
import type { FileValidation } from "@/lib/validator";
import BrokerDiagram from "@/components/BrokerDiagram";

function ValidationPanel({ results }: { results: FileValidation[] }) {
  const [open, setOpen] = useState(true);
  const hasAnyError = results.some(r => r.hasError);
  const hasAnyWarn  = results.some(r => r.hasWarn);
  if (!hasAnyError && !hasAnyWarn) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
        <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
        All 3 files passed validation
      </div>
    );
  }
  return (
    <div className="rounded-lg border overflow-hidden"
         style={{ borderColor: hasAnyError ? "#fca5a5" : "#fde68a" }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold transition-colors"
        style={{ background: hasAnyError ? "#fef2f2" : "#fffbeb", color: hasAnyError ? "#991b1b" : "#92400e" }}>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <AlertTriangle size={12} />
        {hasAnyError ? "Validation errors" : "Warnings"}
        <span className="ml-auto font-normal text-[11px]">{results.reduce((n, r) => n + r.issues.length, 0)} issue{results.reduce((n, r) => n + r.issues.length, 0) === 1 ? "" : "s"}</span>
      </button>
      {open && (
        <div className="bg-white border-t" style={{ borderColor: hasAnyError ? "#fca5a5" : "#fde68a" }}>
          {results.map(r => {
            if (!r.issues.length) return null;
            return (
              <div key={r.file} className="px-3 py-2 border-b border-gray-100 last:border-0">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">{r.file}</p>
                <ul className="flex flex-col gap-1">
                  {r.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      {issue.severity === "error"
                        ? <XCircle size={12} className="text-red-500 flex-shrink-0 mt-px" />
                        : <AlertTriangle size={12} className="text-amber-500 flex-shrink-0 mt-px" />}
                      <span className={issue.severity === "error" ? "text-red-700" : "text-amber-700"}>{issue.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Step7Generate() {
  const generatedFiles = useWizardStore((s) => s.generatedFiles);
  const config = useWizardStore((s) => s.config);
  const reset = useWizardStore((s) => s.reset);
  const brokerFile = toKebab(config.name);

  const tabs = generatedFiles
    ? [
        { key: "agent-network.yaml", label: "agent-network.yaml" },
        { key: "exchange.json", label: "exchange.json" },
        { key: `brokers/${brokerFile}.agent`, label: `brokers/${brokerFile}.agent` },
      ]
    : [];

  const [activeTab, setActiveTab] = useState(0);
  const [copiedTab, setCopiedTab] = useState<number | null>(null);

  const validation = useMemo(
    () => generatedFiles ? validateGeneratedFiles(generatedFiles, brokerFile) : [],
    [generatedFiles, brokerFile]
  );

  const handleCopy = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedTab(idx);
    setTimeout(() => setCopiedTab(null), 1500);
  };

  const handleDownload = async () => {
    if (!generatedFiles) return;
    const zip = new JSZip();
    zip.file("agent-network.yaml", generatedFiles["agent-network.yaml"]);
    zip.file("exchange.json", generatedFiles["exchange.json"]);
    const agentKey = Object.keys(generatedFiles).find((k) => k.startsWith("brokers/"))!;
    zip.file(agentKey, generatedFiles[agentKey]);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${brokerFile}-agent-network.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!generatedFiles) return null;

  return (
    <div className="flex flex-col gap-4">

      {/* Broker architecture diagram */}
      <BrokerDiagram />

      {/* Validation */}
      <ValidationPanel results={validation} />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1">
        {tabs.map((tab, i) => {
          const tabValidation = validation.find(v => tab.key.endsWith(v.file));
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(i)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium font-mono transition-colors border-b-2 -mb-px"
              style={{
                color: activeTab === i ? "var(--ms-blue)" : undefined,
                borderColor: activeTab === i ? "var(--ms-blue)" : "transparent",
              }}
            >
              {tab.label}
              {tabValidation?.hasError && <XCircle size={10} className="text-red-500" />}
              {!tabValidation?.hasError && tabValidation?.hasWarn && <AlertTriangle size={10} className="text-amber-400" />}
            </button>
          );
        })}
      </div>

      {/* File content */}
      {tabs.map((tab, i) => {
        const content = generatedFiles[tab.key] ?? "";
        return (
          <div key={tab.key} className={i === activeTab ? "block" : "hidden"}>
            <div className="relative">
              <textarea
                readOnly
                value={content}
                className="font-mono text-xs leading-relaxed bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[380px] w-full resize-y text-gray-800"
              />
              <button
                type="button"
                onClick={() => handleCopy(content, i)}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors shadow-sm"
              >
                {copiedTab === i ? (
                  <><Check size={12} className="text-emerald-500" /> Copied</>
                ) : (
                  <><Copy size={12} /> Copy</>
                )}
              </button>
            </div>
          </div>
        );
      })}

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 w-full rounded-lg text-white text-sm font-semibold px-4 py-3 transition-all shadow-sm hover:shadow-md"
          style={{ background: "linear-gradient(135deg, #00a0df, #0077b6)" }}
        >
          <Download size={15} />
          Download ZIP: {brokerFile}-agent-network.zip
        </button>
        <button
          type="button"
          onClick={() => useWizardStore.getState().setStep(8)}
          className="flex items-center justify-center gap-2 w-full rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold px-4 py-2.5 transition-colors hover:bg-blue-100"
        >
          Test your broker
        </button>
        <button
          type="button"
          onClick={reset}
          className="w-full rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 text-sm font-medium px-4 py-2.5 transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
