"use client";

import { Check } from "lucide-react";

const STEPS = ["Basic Info", "LLM", "Agents", "MCPs", "Routing", "Review", "Generate"];

export default function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center w-full">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < currentStep;
        const active = n === currentStep;
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
                style={{
                  background: done || active ? "#00a0df" : "white",
                  color: done || active ? "white" : "#9ca3af",
                  border: done || active ? "2px solid #00a0df" : "2px solid #e5e7eb",
                  boxShadow: active ? "0 0 0 4px #00a0df22" : "none",
                }}
              >
                {done ? <Check size={13} /> : n}
              </div>
              <span
                className="text-[10px] font-medium whitespace-nowrap"
                style={{
                  color: active ? "#00a0df" : done ? "#6b7280" : "#d1d5db",
                }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-px mx-1 mb-4 transition-colors"
                style={{ background: n < currentStep ? "#00a0df" : "#e5e7eb" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
