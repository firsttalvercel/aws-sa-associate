"use client";

import { useState } from "react";
import { useWizardStore } from "@/store";
import FormField from "@/components/ui/FormField";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function Step1BasicInfo() {
  const config = useWizardStore((s) => s.config);
  const updateConfig = useWizardStore((s) => s.updateConfig);

  // track which fields have been touched (blurred at least once)
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  const errors = {
    name: !config.name.trim() ? "Project name is required." : "",
    description: !config.description.trim() ? "Description is required." : "",
    orgId: !config.orgId.trim()
      ? "Organization ID is required."
      : !UUID_RE.test(config.orgId.trim())
      ? "Must be a valid UUID (e.g. bccd0bcd-fc44-4188-b06e-59aeb98a7a1d)."
      : "",
    businessGroupId: !config.businessGroupId?.trim()
      ? "Business Group ID is required."
      : !UUID_RE.test(config.businessGroupId.trim())
      ? "Must be a valid UUID."
      : "",
    version:
      config.version?.trim() && !/^\d+\.\d+\.\d+/.test(config.version.trim())
        ? "Use semver format: 1.0.0"
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
      <FormField label="Project Name" required>
        <input
          type="text"
          value={config.name}
          onChange={(e) => updateConfig({ name: e.target.value })}
          onBlur={() => touch("name")}
          placeholder="e.g. Loans Broker"
          className={inputClass("name")}
        />
        {touched.name && errors.name && (
          <p className="text-[11px] text-red-500 mt-0.5">{errors.name}</p>
        )}
      </FormField>

      <FormField label="Description" required>
        <textarea
          value={config.description}
          onChange={(e) => updateConfig({ description: e.target.value })}
          onBlur={() => touch("description")}
          placeholder="e.g. Loan broker that coordinates credit scoring, compliance checks, and document processing"
          rows={3}
          className={inputClass("description") + " resize-none"}
        />
        {touched.description && errors.description && (
          <p className="text-[11px] text-red-500 mt-0.5">{errors.description}</p>
        )}
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Organization ID"
          required
          hint="Anypoint Access Management → Organization → ID"
        >
          <input
            type="text"
            value={config.orgId}
            onChange={(e) => updateConfig({ orgId: e.target.value })}
            onBlur={() => touch("orgId")}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className={inputClass("orgId") + " font-mono"}
          />
          {touched.orgId && errors.orgId && (
            <p className="text-[11px] text-red-500 mt-0.5">{errors.orgId}</p>
          )}
        </FormField>

        <FormField
          label="Business Group ID"
          required
          hint="Usually the same as Org ID. Found in Access Management."
        >
          <input
            type="text"
            value={config.businessGroupId ?? ""}
            onChange={(e) => updateConfig({ businessGroupId: e.target.value || undefined })}
            onBlur={() => touch("businessGroupId")}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className={inputClass("businessGroupId") + " font-mono"}
          />
          {touched.businessGroupId && errors.businessGroupId && (
            <p className="text-[11px] text-red-500 mt-0.5">{errors.businessGroupId}</p>
          )}
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Asset Version" hint="Semantic version, e.g. 1.0.0">
          <input
            type="text"
            value={config.version ?? ""}
            onChange={(e) => updateConfig({ version: e.target.value })}
            onBlur={() => touch("version")}
            placeholder="0.0.0"
            className={inputClass("version")}
          />
          {touched.version && errors.version && (
            <p className="text-[11px] text-red-500 mt-0.5">{errors.version}</p>
          )}
        </FormField>

        <FormField label="Tags" hint="Comma-separated">
          <input
            type="text"
            value={(config.tags ?? []).join(", ")}
            onChange={(e) =>
              updateConfig({
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            placeholder="e.g. agentscript, loans"
            className={inputClass("tags")}
          />
        </FormField>
      </div>
    </div>
  );
}
