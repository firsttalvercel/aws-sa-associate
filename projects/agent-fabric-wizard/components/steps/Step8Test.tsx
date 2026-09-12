"use client";

import { useState, useEffect, Fragment } from "react";
import { useWizardStore } from "@/store";
import { Play, Loader, CheckCircle, XCircle, ChevronDown, ChevronRight, Network, X, Copy, Check, Terminal } from "lucide-react";
import BrokerDiagram from "@/components/BrokerDiagram";

interface TestCase {
  label: string;
  description: string;
  message: string;
  path: string;
  expectPass: boolean;
  kind?: "happy" | "unhappy" | "orchestration";
}

function buildTestCases(templateId: string): TestCase[] {
  if (templateId === "loans") {
    return [
      {
        label: "Happy path: credit check",
        description: "Standard credit check for a well-qualified applicant",
        message: "Run a credit check for applicant John Smith",
        path: "classifyIntent → Credit Check → Credit Scoring Agent → generator → echo",
        expectPass: true,
        kind: "happy",
      },
      {
        label: "Happy path: document verify",
        description: "All documents valid. Identity confirmed, income matches.",
        message: "Please verify the documents for this loan application",
        path: "classifyIntent → Document Verify → Document Verification Agent → generator → echo",
        expectPass: true,
        kind: "happy",
      },
      {
        label: "Happy path: fraud check",
        description: "No fraud indicators, application cleared for processing",
        message: "Run a fraud check on this loan application",
        path: "classifyIntent → Fraud Check → Fraud Detection Agent → generator → echo",
        expectPass: true,
        kind: "happy",
      },
      {
        label: "Happy path: KYC compliance",
        description: "KYC check passes with high identity score",
        message: "Run a KYC check for applicant ID APP-5521",
        path: "classifyIntent → KYC Check → run_kyc_check MCP → generator → echo",
        expectPass: true,
        kind: "happy",
      },
      {
        label: "Happy path: AML screening",
        description: "AML screening returns clear, no sanctions matches",
        message: "Run AML screening for applicant John Smith, country UK",
        path: "classifyIntent → AML Screening → run_aml_screening MCP → generator → echo",
        expectPass: true,
        kind: "happy",
      },
      {
        label: "Happy path: loan products",
        description: "Retrieve available loan products",
        message: "What loan products are available and what are the interest rates?",
        path: "classifyIntent → Loan Products → get_loan_products MCP → generator → echo",
        expectPass: true,
        kind: "happy",
      },
      {
        label: "Unhappy path: expired document",
        description: "Applicant submits an expired identity document",
        message: "Verify documents for applicant, the passport is expired",
        path: "classifyIntent → Document Verify → Document Verification Agent (FAIL) → generator → echo",
        expectPass: false,
        kind: "unhappy",
      },
      {
        label: "Unhappy path: income mismatch",
        description: "Declared income does not match bank statement",
        message: "Check the documents, there is an income mismatch on the bank statement",
        path: "classifyIntent → Document Verify → Document Verification Agent (FAIL) → generator → echo",
        expectPass: false,
        kind: "unhappy",
      },
      {
        label: "Unhappy path: velocity fraud",
        description: "Multiple applications detected from same device in 48 hours",
        message: "Check this application for velocity fraud indicators",
        path: "classifyIntent → Fraud Check → Fraud Detection Agent (HIGH) → generator → echo",
        expectPass: false,
        kind: "unhappy",
      },
      {
        label: "Unhappy path: synthetic identity",
        description: "Synthetic identity signals detected on the application",
        message: "Screen for synthetic identity fraud on this application",
        path: "classifyIntent → Fraud Check → Fraud Detection Agent (HIGH) → generator → echo",
        expectPass: false,
        kind: "unhappy",
      },
      {
        label: "Multi-intent fallback",
        description: "Message spans multiple intents. Routed to general orchestrator.",
        message: "Check the credit score and run a fraud check and show me available loan products for this applicant",
        path: "classifyIntent → multi → General Orchestrator → generator → echo",
        expectPass: true,
        kind: "happy",
      },
      {
        label: "Submit decision",
        description: "Record a loan approval decision",
        message: "Approve the loan for applicant 12345, recommended amount 20000, strong credit and clean compliance",
        path: "classifyIntent → Submit Decision → submit_loan_decision MCP → generator → echo",
        expectPass: true,
        kind: "happy",
      },
      {
        label: "Orchestration: clean applicant approved",
        description: "Full flow: fraud clean → documents verified → credit strong → loan approved",
        message: "Process a full loan application for applicant Maria Costa, income 4500/month, requesting 15000 personal loan. Run fraud check first, then verify her documents, then credit score, and give me a final decision.",
        path: "classifyIntent → multi → General Orchestrator → Fraud Check (CLEAN) → Document Verify (PASS) → Credit Check (STRONG) → submitLoanDecision (APPROVED) → echo",
        expectPass: true,
        kind: "orchestration",
      },
      {
        label: "Orchestration: fraud block — stops early",
        description: "Fraud detected at first step. Broker halts and declines without running further checks.",
        message: "Process loan application for applicant ID APP-9912. Start with fraud screening — if anything suspicious, stop immediately and decline. Otherwise continue with document and credit checks.",
        path: "classifyIntent → multi → General Orchestrator → Fraud Check (HIGH RISK) → submitLoanDecision (DECLINED) → echo",
        expectPass: true,
        kind: "orchestration",
      },
      {
        label: "Orchestration: compliance gate then credit",
        description: "KYC and AML must both pass before credit check is run",
        message: "Before doing anything else, run KYC and AML checks for applicant John Okafor. If both pass, then run a credit check. If either compliance check fails, do not proceed to credit.",
        path: "classifyIntent → multi → General Orchestrator → KYC (PASS) → AML (PASS) → Credit Check → echo",
        expectPass: true,
        kind: "orchestration",
      },
      {
        label: "Orchestration: refer to underwriter",
        description: "Credit score is borderline — broker refers to underwriter instead of approving or declining",
        message: "Run a full risk assessment for applicant Petra Novak. Credit score is 610, debt-to-income is 42%. Fraud check is clean. Make a recommendation — approve, refer, or decline.",
        path: "classifyIntent → risk-assessment → Risk Assessment Subagent → Credit Scoring Agent + Fraud Detection Agent → submitLoanDecision (REFERRED) → echo",
        expectPass: true,
        kind: "orchestration",
      },
    ];
  }

  if (templateId === "energy") {
    return [
      // Happy paths — grid operations
      {
        label: "Happy path: grid status",
        description: "Check current grid load and active outages across the network",
        message: "What is the current grid status and are there any active outages?",
        path: "classifyIntent → Grid Operations → Grid Operations Agent → generator → echo",
        expectPass: true,
        kind: "happy",
      },
      {
        label: "Happy path: submit outage",
        description: "Report a new power failure at a field site",
        message: "Submit an outage report for site SITE-007, power failure since 14:30 today",
        path: "classifyIntent → Grid Operations → Grid Operations Agent → generator → echo",
        expectPass: true,
        kind: "happy",
      },
      {
        label: "Happy path: tariff rates",
        description: "Retrieve current tariff rates for a customer account",
        message: "What are the current tariff rates for account ACC-1002?",
        path: "classifyIntent → Grid Operations → Grid Operations Agent → generator → echo",
        expectPass: true,
        kind: "happy",
      },
      // Happy paths — consumption
      {
        label: "Happy path: meter reading",
        description: "Retrieve latest meter reading for an account",
        message: "Get the latest meter reading for account ACC-4521",
        path: "classifyIntent → Consumption → Consumption Analyst → Meter Reading Agent → generator → echo",
        expectPass: true,
        kind: "happy",
      },
      {
        label: "Happy path: demand forecast",
        description: "Forecast energy demand for a site over the next 7 days",
        message: "Forecast energy demand for site SITE-001 over the next 7 days",
        path: "classifyIntent → Consumption → Consumption Analyst → Demand Forecasting Agent → generator → echo",
        expectPass: true,
        kind: "happy",
      },
      // Happy paths — customer portal (orchestrator)
      {
        label: "Happy path: rewards balance",
        description: "Check available reward points for a customer account",
        message: "What is the rewards balance for customer account ACC-8812?",
        path: "classifyIntent → multi → General Orchestrator → generator → echo",
        expectPass: true,
        kind: "happy",
      },
      // Unhappy paths
      {
        label: "Unhappy path: site not found",
        description: "Outage report submitted for an unknown site ID",
        message: "Submit an outage report for site SITE-99999, unknown location",
        path: "classifyIntent → Grid Operations → Grid Operations Agent → generator → echo",
        expectPass: false,
        kind: "unhappy",
      },
      {
        label: "Unhappy path: meter offline",
        description: "Meter reading request for a device with no signal",
        message: "Get the meter reading for account ACC-0000, meter has been offline for 3 days",
        path: "classifyIntent → Consumption → Consumption Analyst → Meter Reading Agent → generator → echo",
        expectPass: false,
        kind: "unhappy",
      },
      // Orchestration
      {
        label: "Orchestration: consumption anomaly",
        description: "Compare current meter reading against forecast baseline and flag any anomaly",
        message: "For account ACC-4521, get the latest meter reading and compare it against the 7-day demand forecast. Flag any anomaly.",
        path: "classifyIntent → multi → General Orchestrator → Meter Reading Agent → Demand Forecasting Agent → echo",
        expectPass: true,
        kind: "orchestration",
      },
      {
        label: "Orchestration: outage then dispatch",
        description: "Detect an outage and immediately dispatch a field crew to the affected site",
        message: "There is a fault reported at substation SUB-14. Check the grid status, confirm the outage, and dispatch a field crew.",
        path: "classifyIntent → multi → General Orchestrator → Grid Operations Agent → dispatch_field_crew → echo",
        expectPass: true,
        kind: "orchestration",
      },
      {
        label: "Orchestration: billing dispute",
        description: "Retrieve invoice, cross-check with meter reading, and submit dispute if mismatch",
        message: "My bill for account ACC-4521 looks too high. Get my latest invoice and meter reading, check if there is a discrepancy, and submit a billing dispute if so.",
        path: "classifyIntent → multi → General Orchestrator → Meter Reading Agent → get_invoice → submit_billing_dispute → echo",
        expectPass: true,
        kind: "orchestration",
      },
      {
        label: "Orchestration: EV reward redemption",
        description: "Check EV charging tariff, verify reward balance, and redeem points for a bill credit",
        message: "I charge my EV at home. Check my current EV tariff rate, show my rewards balance, and redeem 500 points as a bill credit for account ACC-8812.",
        path: "classifyIntent → multi → General Orchestrator → get_tariff_rates → get_rewards_balance → redeem_reward → echo",
        expectPass: true,
        kind: "orchestration",
      },
    ];
  }

  if (templateId === "healthcare") {
    return [
      { label: "Book appointment", description: "Schedule a patient appointment", message: "Book an appointment for patient Maria Garcia next Tuesday with Dr. Smith", path: "classifyIntent → Book Appointment → Appointment Scheduler → echo", expectPass: true },
      { label: "Patient records", description: "Retrieve patient health records", message: "Retrieve the health records and history for patient ID PAT-2291", path: "classifyIntent → Patient Records → EHR Lookup Agent → echo", expectPass: true },
      { label: "Triage", description: "Assess patient symptoms", message: "Patient reports chest tightness, shortness of breath and dizziness for 2 hours", path: "classifyIntent → Triage → Triage Advisor (inline subagent) → echo", expectPass: true },
      { label: "Available slots", description: "Check available appointment slots", message: "What appointment slots are available this week for a GP consultation?", path: "classifyIntent → Available Slots → get_available_slots MCP → echo", expectPass: true },
    ];
  }

  if (templateId === "retail") {
    return [
      { label: "Product recommendations", description: "Get personalised product recommendations", message: "Recommend products for customer Sarah Jones based on her purchase history", path: "classifyIntent → Recommendations → Product Recommendations Agent → echo", expectPass: true },
      { label: "Loyalty check", description: "Check customer loyalty points and tier", message: "What are the loyalty points and rewards available for customer ID CUST-8821?", path: "classifyIntent → Loyalty → Loyalty Agent → echo", expectPass: true },
      { label: "Stock check", description: "Check product availability", message: "Is the black leather jacket SKU-4421 available in size M?", path: "classifyIntent → Check Stock → check_stock MCP → echo", expectPass: true },
      { label: "Place order", description: "Place a new order", message: "Place an order for product SKU-4421 size M for customer CUST-8821", path: "classifyIntent → Place Order → place_order MCP → echo", expectPass: true },
    ];
  }

  return [];
}

function FlowPath({ path, runState }: { path: string; runState: RunState }) {
  const nodes = path.split(" → ");
  const [activeIdx, setActiveIdx] = useState(-1);

  useEffect(() => {
    if (runState !== "running") {
      setActiveIdx(-1);
      return;
    }
    setActiveIdx(0);
    let idx = 0;
    const interval = setInterval(() => {
      idx += 1;
      if (idx >= nodes.length) {
        clearInterval(interval);
        return;
      }
      setActiveIdx(idx);
    }, Math.max(300, Math.floor(2800 / nodes.length)));
    return () => clearInterval(interval);
  }, [runState, nodes.length]);

  const nodeBg = (i: number) => {
    if (runState === "pass") return "bg-emerald-50 border-emerald-300 text-emerald-700";
    if (runState === "fail" || runState === "error") return "bg-red-50 border-red-300 text-red-600";
    if (runState === "running" && i === activeIdx) return "bg-blue-500 border-blue-500 text-white shadow-md scale-105";
    if (runState === "running" && i < activeIdx) return "bg-emerald-50 border-emerald-300 text-emerald-700";
    return "bg-gray-50 border-gray-200 text-gray-500";
  };

  return (
    <div className="flex items-center flex-wrap gap-y-1 mt-1.5">
      {nodes.map((node, i) => (
        <Fragment key={i}>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded border transition-all duration-300 ${nodeBg(i)}`}
          >
            {node}
          </span>
          {i < nodes.length - 1 && (
            <span className="text-gray-300 text-xs mx-0.5">→</span>
          )}
        </Fragment>
      ))}
    </div>
  );
}

type RunState = "idle" | "running" | "pass" | "fail" | "error";

interface TestResult {
  state: RunState;
  responseTime?: number;
  body?: unknown;
  error?: string;
}

export default function Step8Test() {
  const config = useWizardStore((s) => s.config);
  const templateId = useWizardStore((s) => s.templateId);
  const standaloneTest = useWizardStore((s) => s.standaloneTest);

  const [brokerUrl, setBrokerUrl] = useState("");
  const [results, setResults] = useState<Record<number, TestResult>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [diagPath, setDiagPath] = useState<string>("");
  const [diagRunState, setDiagRunState] = useState<"idle" | "running" | "pass" | "fail" | "error">("idle");
  const [showDiagram, setShowDiagram] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [freeformMessage, setFreeformMessage] = useState("");
  const [freeformResult, setFreeformResult] = useState<TestResult | null>(null);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const buildCurl = (message: string) => {
    const url = brokerUrl.trim() || "<broker-url>";
    return `curl -s -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -H "A2A-Version: 1.0" \\
  -d '${JSON.stringify({
    jsonrpc: "2.0",
    id: "test-1",
    method: "SendMessage",
    params: {
      message: {
        messageId: "test-1",
        role: "ROLE_USER",
        parts: [{ text: message, mediaType: "text/plain" }],
      },
    },
  })}'`;
  };

  const runFreeform = async () => {
    if (!brokerUrl.trim() || !freeformMessage.trim()) return;
    setFreeformResult({ state: "running" });
    setDiagPath("");
    setDiagRunState("running");
    setShowDiagram(true);
    const start = Date.now();
    try {
      const res = await fetch("/api/test-broker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: brokerUrl, message: freeformMessage }),
      });
      const data = await res.json();
      const elapsed = Date.now() - start;
      if (data.ok) {
        setFreeformResult({ state: "pass", responseTime: elapsed, body: data.body });
        setDiagRunState("pass");
      } else {
        setFreeformResult({ state: "fail", responseTime: elapsed, body: data.body, error: data.error });
        setDiagRunState("fail");
      }
    } catch (e) {
      setFreeformResult({ state: "error", error: e instanceof Error ? e.message : "Network error" });
      setDiagRunState("error");
    }
  };

  const testCases = buildTestCases(standaloneTest ? "" : templateId);

  const runTest = async (idx: number, message: string, expectPass?: boolean) => {
    const tc = testCases[idx];
    setResults((r) => ({ ...r, [idx]: { state: "running" } }));
    setDiagPath(tc?.path ?? "");
    setDiagRunState("running");
    setShowDiagram(true);
    const start = Date.now();
    try {
      const res = await fetch("/api/test-broker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: brokerUrl, message, expectPass }),
      });
      const data = await res.json();
      const elapsed = Date.now() - start;
      if (data.ok) {
        setResults((r) => ({ ...r, [idx]: { state: "pass", responseTime: elapsed, body: data.body } }));
        setDiagRunState("pass");
      } else {
        setResults((r) => ({ ...r, [idx]: { state: "fail", responseTime: elapsed, body: data.body, error: data.error } }));
        setDiagRunState("fail");
      }
    } catch (e) {
      setResults((r) => ({ ...r, [idx]: { state: "error", error: e instanceof Error ? e.message : "Network error" } }));
      setDiagRunState("error");
    }
  };

  const runAll = async () => {
    if (!brokerUrl.trim()) return;
    setRunningAll(true);
    for (let i = 0; i < testCases.length; i++) {
      await runTest(i, testCases[i].message, testCases[i].expectPass);
    }
    setRunningAll(false);
  };

  const passCount = Object.values(results).filter((r) => r.state === "pass").length;
  const failCount = Object.values(results).filter((r) => r.state === "fail" || r.state === "error").length;
  const ranCount = passCount + failCount;

  return (
    <div className="flex flex-col gap-5">

      {/* Flow diagram modal */}
      {showDiagram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
             onClick={() => setShowDiagram(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden"
               onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Broker Flow</span>
              {diagRunState === "running" && (
                <span className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
                  <Loader size={12} className="animate-spin" /> Running…
                </span>
              )}
              <button type="button" onClick={() => setShowDiagram(false)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={16} />
              </button>
            </div>
            <BrokerDiagram activePath={diagPath} runState={diagRunState} />
          </div>
        </div>
      )}

      {/* Broker URL input */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Deployed broker URL
        </label>
        <p className="text-xs text-gray-400">
          Deploy your project in Anypoint Code Builder, then paste the live A2A endpoint URL here.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={brokerUrl}
            onChange={(e) => setBrokerUrl(e.target.value)}
            placeholder="https://your-broker.cloudhub.io/api/loans-broker/a2a"
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          />
          <button
            type="button"
            onClick={() => setShowDiagram(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-500 font-medium hover:text-gray-700 hover:border-gray-300 transition-colors flex-shrink-0"
          >
            <Network size={13} />
            Flow
          </button>
          {!standaloneTest && (
            <button
              type="button"
              onClick={runAll}
              disabled={!brokerUrl.trim() || runningAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #00a0df, #0077b6)" }}
            >
              {runningAll ? <Loader size={14} className="animate-spin" /> : <Play size={14} />}
              {runningAll ? "Running…" : "Run all"}
            </button>
          )}
        </div>
      </div>

      {/* Freeform mode */}
      {standaloneTest && (
        <div className="flex flex-col gap-3">
          <textarea
            value={freeformMessage}
            onChange={(e) => setFreeformMessage(e.target.value)}
            placeholder="Type your message to the broker…"
            rows={3}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={runFreeform}
              disabled={!brokerUrl.trim() || !freeformMessage.trim() || freeformResult?.state === "running"}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              style={{ background: "linear-gradient(135deg, #00a0df, #0077b6)" }}
            >
              {freeformResult?.state === "running" ? <Loader size={14} className="animate-spin" /> : <Play size={14} />}
              {freeformResult?.state === "running" ? "Running…" : "Send"}
            </button>
            <button
              type="button"
              onClick={() => copyText(buildCurl(freeformMessage), "freeform-curl")}
              disabled={!freeformMessage.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-500 font-medium hover:text-gray-700 hover:border-gray-300 disabled:opacity-40 transition-colors"
            >
              {copied === "freeform-curl" ? <Check size={12} className="text-emerald-500" /> : <Terminal size={12} />}
              {copied === "freeform-curl" ? "Copied" : "curl"}
            </button>
          </div>
          {freeformResult && freeformResult.state !== "running" && (
            <div className={`rounded-lg border overflow-hidden ${freeformResult.state === "pass" ? "border-emerald-200" : "border-red-200"}`}>
              <div className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold ${freeformResult.state === "pass" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                {freeformResult.state === "pass"
                  ? <CheckCircle size={13} />
                  : <XCircle size={13} />}
                {freeformResult.state === "pass" ? "Response received" : freeformResult.error ?? "Request failed"}
                {freeformResult.responseTime && (
                  <span className="ml-auto font-normal text-[11px] opacity-70">{freeformResult.responseTime}ms</span>
                )}
                {freeformResult.state === "pass" && !freeformResult.error && (
                  <button
                    type="button"
                    onClick={() => copyText(JSON.stringify(freeformResult.body, null, 2), "freeform-res")}
                    className="ml-1 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/70 hover:bg-white border border-emerald-200 transition-colors"
                  >
                    {copied === "freeform-res" ? <Check size={10} /> : <Copy size={10} />}
                    {copied === "freeform-res" ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              <pre className="text-[11px] font-mono text-gray-700 bg-white px-4 py-3 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                {freeformResult.error ?? JSON.stringify(freeformResult.body, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Score banner */}
      {!standaloneTest && ranCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-gray-50 border-gray-200">
          <span className="text-sm font-semibold text-gray-700">{ranCount} of {testCases.length} run</span>
          <span className="text-emerald-600 text-sm font-semibold">{passCount} passed</span>
          {failCount > 0 && <span className="text-red-500 text-sm font-semibold">{failCount} failed</span>}
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden ml-2">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: ranCount > 0 ? `${(passCount / ranCount) * 100}%` : "0%" }}
            />
          </div>
        </div>
      )}

      {/* Test cases */}
      {!standaloneTest && <div className="flex flex-col gap-2">
        {testCases.map((tc, i) => {
          const result = results[i];
          const isExpanded = expanded[i];
          const stateIcon =
            result?.state === "running" ? <Loader size={15} className="animate-spin text-blue-500" /> :
            result?.state === "pass" ? <CheckCircle size={15} className="text-emerald-500" /> :
            result?.state === "fail" || result?.state === "error" ? <XCircle size={15} className="text-red-400" /> :
            <div className="w-4 h-4 rounded-full border-2 border-gray-200" />;

          return (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-white overflow-hidden"
            >
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5 flex-shrink-0">{stateIcon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800">{tc.label}</span>
                    {tc.kind === "orchestration" ? (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">orchestration</span>
                    ) : tc.expectPass ? (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">happy path</span>
                    ) : (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">unhappy path</span>
                    )}
                    {result?.responseTime && (
                      <span className="text-[10px] text-gray-400 ml-auto">{result.responseTime}ms</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{tc.description}</p>
                  <FlowPath path={tc.path} runState={result?.state ?? "idle"} />

                  {/* Message preview */}
                  <div className="mt-2 flex items-start gap-2">
                    <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded px-2 py-1.5 flex-1 leading-relaxed">
                      "{tc.message}"
                    </p>
                    <button
                      type="button"
                      onClick={() => runTest(i, tc.message, tc.expectPass)}
                      disabled={!brokerUrl.trim() || result?.state === "running"}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 font-medium hover:text-gray-700 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Run
                    </button>
                  </div>
                </div>
              </div>

              {/* Response accordion + actions */}
              <div className="border-t border-gray-100">
                <div className="flex items-center gap-1 px-3 py-1.5">
                  {result && result.state !== "running" && result.state !== "idle" ? (
                    <button
                      type="button"
                      onClick={() => setExpanded((e) => ({ ...e, [i]: !e[i] }))}
                      className="flex items-center gap-1.5 flex-1 text-xs text-gray-400 hover:text-gray-600 transition-colors py-0.5"
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      {result.error ? `Error: ${result.error}` : "View response"}
                    </button>
                  ) : (
                    <span className="flex-1" />
                  )}
                  {/* Copy response */}
                  {result && result.state !== "running" && result.state !== "idle" && !result.error && (
                    <button
                      type="button"
                      onClick={() => copyText(JSON.stringify(result.body, null, 2), `res-${i}`)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      title="Copy response"
                    >
                      {copied === `res-${i}` ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      {copied === `res-${i}` ? "Copied" : "Copy"}
                    </button>
                  )}
                  {/* Copy curl */}
                  <button
                    type="button"
                    onClick={() => copyText(buildCurl(tc.message), `curl-${i}`)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    title="Copy curl"
                  >
                    {copied === `curl-${i}` ? <Check size={11} className="text-emerald-500" /> : <Terminal size={11} />}
                    {copied === `curl-${i}` ? "Copied" : "curl"}
                  </button>
                </div>
                {isExpanded && result && result.state !== "running" && result.state !== "idle" && (
                  <pre className="text-[11px] font-mono text-gray-700 bg-gray-50 border-t border-gray-100 px-4 py-3 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    {result.error ?? JSON.stringify(result.body, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          );
        })}
      </div>}
    </div>
  );
}
