export interface TestCase {
  label: string;
  description: string;
  message: string;
  path: string;
  expectPass: boolean;
  kind?: "happy" | "unhappy" | "orchestration";
}

export function buildTestCases(templateId: string): TestCase[] {
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
        message: "Process loan application for applicant ID APP-9912. Fraud screening returned HIGH RISK: three synthetic identity matches detected and device fingerprint collision flagged. Do not run further checks. Submit a declined decision immediately.",
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
      {
        label: "Happy path: rewards balance",
        description: "Check available reward points for a customer account",
        message: "What is the rewards balance for customer account ACC-8812?",
        path: "classifyIntent → multi → General Orchestrator → generator → echo",
        expectPass: true,
        kind: "happy",
      },
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
      { label: "Book appointment", description: "Schedule a patient appointment", message: "Book an appointment for patient Maria Garcia next Tuesday with Dr. Smith", path: "classifyIntent → Book Appointment → Appointment Scheduler → echo", expectPass: true, kind: "happy" },
      { label: "Patient records", description: "Retrieve patient health records", message: "Retrieve the health records and history for patient ID PAT-2291", path: "classifyIntent → Patient Records → EHR Lookup Agent → echo", expectPass: true, kind: "happy" },
      { label: "Triage", description: "Assess patient symptoms", message: "Patient reports chest tightness, shortness of breath and dizziness for 2 hours", path: "classifyIntent → Triage → Triage Advisor (inline subagent) → echo", expectPass: true, kind: "happy" },
      { label: "Available slots", description: "Check available appointment slots", message: "What appointment slots are available this week for a GP consultation?", path: "classifyIntent → Available Slots → get_available_slots MCP → echo", expectPass: true, kind: "happy" },
    ];
  }

  if (templateId === "retail") {
    return [
      { label: "Product recommendations", description: "Get personalised product recommendations", message: "Recommend products for customer Sarah Jones based on her purchase history", path: "classifyIntent → Recommendations → Product Recommendations Agent → echo", expectPass: true, kind: "happy" },
      { label: "Loyalty check", description: "Check customer loyalty points and tier", message: "What are the loyalty points and rewards available for customer ID CUST-8821?", path: "classifyIntent → Loyalty → Loyalty Agent → echo", expectPass: true, kind: "happy" },
      { label: "Stock check", description: "Check product availability", message: "Is the black leather jacket SKU-4421 available in size M?", path: "classifyIntent → Check Stock → check_stock MCP → echo", expectPass: true, kind: "happy" },
      { label: "Place order", description: "Place a new order", message: "Place an order for product SKU-4421 size M for customer CUST-8821", path: "classifyIntent → Place Order → place_order MCP → echo", expectPass: true, kind: "happy" },
    ];
  }

  return [];
}
