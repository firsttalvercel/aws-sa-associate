"use client";

import { useState } from "react";
import { Play, Loader, ChevronDown, ChevronRight } from "lucide-react";

interface TryItPanelProps {
  onRun: (input: string) => Promise<{ ok: boolean; result?: unknown; error?: string }>;
  defaultInput: string;
  inputLabel?: string;
  inputPlaceholder?: string;
}

export default function TryItPanel({ onRun, defaultInput, inputLabel = "Message", inputPlaceholder }: TryItPanelProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(defaultInput);
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState<number | null>(null);

  const handleRun = async () => {
    setState("loading");
    setResult(null);
    setError("");
    const start = Date.now();
    const res = await onRun(input);
    setElapsed(Date.now() - start);
    if (res.ok) {
      setState("ok");
      setResult(res.result);
    } else {
      setState("error");
      setError(res.error ?? "Unknown error.");
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-dashed border-violet-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-violet-600 hover:text-violet-800 hover:bg-violet-50/60 transition-colors"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        Try it
      </button>

      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2 border-t border-dashed border-violet-100 bg-violet-50/30">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mt-2">
            {inputLabel}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setState("idle"); }}
              placeholder={inputPlaceholder}
              className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
            />
            <button
              type="button"
              onClick={handleRun}
              disabled={!input.trim() || state === "loading"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
            >
              {state === "loading" ? <Loader size={12} className="animate-spin" /> : <Play size={12} />}
              {state === "loading" ? "Running…" : "Run"}
            </button>
          </div>

          {(state === "ok" || state === "error") && (
            <div className={`rounded-lg border text-xs font-mono p-3 leading-relaxed whitespace-pre-wrap overflow-x-auto ${
              state === "ok" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-700"
            }`}>
              {state === "ok"
                ? JSON.stringify(result, null, 2)
                : error}
              {elapsed && state === "ok" && (
                <span className="block mt-1 text-emerald-500 text-[10px]">{elapsed}ms</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
