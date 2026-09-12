import type { SimplifiedConfig } from "./types";

export interface WizardTemplate {
  id: string;
  label: string;
  industry: string;
  description: string;
  industryColor: string;
  config: SimplifiedConfig;
}

export const TEMPLATES: WizardTemplate[] = [
  {
    id: "loans",
    label: "Loans & Finance",
    industry: "Finance",
    description: "Loan broker that coordinates credit scoring, document verification, and application processing",
    industryColor: "blue",
    config: {
      name: "Loans Broker",
      description: "Loan broker that coordinates credit scoring, document verification, and application processing",
      orgId: "9a5bbced-4ad9-45ff-8353-8386cd29f9a1",
      businessGroupId: "63d813c9-ab7a-446a-b832-429bfdb076ef",
      version: "1.0.0",
      tags: ["agentscript", "loans"],
      llm: { provider: "openai", model: "gpt-4.1-mini" },
      agents: [
        {
          name: "Credit Scoring Agent",
          agentType: "a2a",
          url: "https://www.a2d-ai.com/api/platform/ccd85e19-5808-46f6-bcd4-60b0a8ce71f5/a2a",
          skills: [
            { id: "credit-score-evaluation", description: "Evaluate applicant creditworthiness. Returns score, tier, DTI, and max loan amount." },
          ],
        },
        {
          name: "Document Verification Agent",
          agentType: "a2a",
          url: "https://www.a2d-ai.com/api/platform/4d35f88a-f158-4914-b8ab-77d807da9474/a2a",
          skills: [
            { id: "document-extraction", description: "Extract structured data from identity and financial documents" },
            { id: "identity-verification", description: "Verify identity document authenticity and match against application" },
            { id: "income-verification", description: "Verify income documents against declared income" },
          ],
        },
        {
          name: "Fraud Detection Agent",
          agentType: "a2a",
          url: "https://www.a2d-ai.com/api/platform/1d27b709-3613-4171-ba3c-fa101328703d/a2a",
          skills: [
            { id: "velocity-check", description: "Detect multiple applications from the same device or applicant in a short window" },
            { id: "identity-anomaly-detection", description: "Cross-check applicant identity against known fraud patterns and synthetic identity signals" },
            { id: "behavioral-risk-assessment", description: "Assess behavioral signals: unusual loan amount, inconsistent employment, high-risk geography." },
          ],
        },
        {
          name: "Risk Assessor",
          agentType: "subagent",
          url: "",
          systemPrompt:
            "You are a risk assessor for loan applications. Given credit score data, document verification results, and fraud detection output, synthesize a final risk assessment: LOW, MEDIUM, or HIGH risk. Provide a clear rationale and recommended action (approve / refer to underwriter / decline).",
          subagentActions: ["Credit Scoring Agent", "Document Verification Agent", "Fraud Detection Agent", "submit_loan_decision"],
        },
      ],
      mcps: [
        {
          name: "Loan Application MCP",
          url: "https://www.a2d-ai.com/api/platform/b4628468-10e5-4ade-b03e-bfc042fb82d8/mcp",
          tools: ["get_applicant_profile", "submit_loan_decision", "get_loan_products"],
        },
        {
          name: "Compliance MCP",
          url: "https://www.a2d-ai.com/api/platform/ec4c4808-4446-448c-a01d-bf65cd4366c4/mcp",
          tools: ["run_kyc_check", "run_aml_screening"],
        },
      ],
      routing: {
        type: "intent",
        intents: [
          { label: "Credit Check", description: "Evaluate applicant creditworthiness, score, and maximum loan eligibility", handler: "Credit Scoring Agent" },
          { label: "Document Verify", description: "Verify applicant identity and income documents against the application", handler: "Document Verification Agent" },
          { label: "Fraud Check", description: "Screen the application for fraud indicators, velocity anomalies, and synthetic identity signals", handler: "Fraud Detection Agent" },
          { label: "KYC Check", description: "Run a Know Your Customer compliance check for the applicant", handler: "run_kyc_check" },
          { label: "AML Screening", description: "Run Anti-Money Laundering screening against sanctions lists and PEP databases", handler: "run_aml_screening" },
          { label: "Loan Products", description: "Retrieve available loan products with interest rates and eligibility requirements", handler: "get_loan_products" },
          { label: "Submit Decision", description: "Record the final loan decision (approved, referred, or declined) with rationale.", handler: "submit_loan_decision" },
          { label: "Risk Assessment", description: "Synthesise credit, document, and fraud results into a final risk verdict and loan recommendation", handler: "Risk Assessor" },
        ],
      },
    },
  },
  {
    id: "energy",
    label: "Energy & Utility",
    industry: "Energy",
    description: "Energy utility broker that coordinates grid operations, consumption analysis, and customer services",
    industryColor: "amber",
    config: {
      name: "Energy Broker",
      description: "Energy utility broker that coordinates grid operations, consumption analysis, and customer services",
      orgId: "9a5bbced-4ad9-45ff-8353-8386cd29f9a1",
      businessGroupId: "63d813c9-ab7a-446a-b832-429bfdb076ef",
      version: "1.0.0",
      tags: ["agentscript", "energy"],
      llm: { provider: "openai", model: "gpt-4.1-mini" },
      agents: [
        {
          name: "Grid Operations Agent",
          agentType: "a2a",
          url: "https://www.a2d-ai.com/api/platform/8e0de92f-e116-4fe4-aa7c-f84314ac614d/a2a",
          skills: [
            { id: "outage-detection", description: "Detect and report grid outages and equipment faults" },
            { id: "grid-monitoring", description: "Monitor grid status, load levels, and asset health" },
          ],
        },
        {
          name: "Meter Reading Agent",
          agentType: "a2a",
          url: "https://www.a2d-ai.com/api/platform/6556531f-955e-4a81-891c-217ee01a7004/a2a",
          skills: [
            { id: "read-meter", description: "Retrieve meter readings and validate consumption data" },
            { id: "consumption-history", description: "Retrieve historical consumption data for an account" },
          ],
        },
        {
          name: "Demand Forecasting Agent",
          agentType: "a2a",
          url: "https://www.a2d-ai.com/api/platform/60a5c43a-0c3a-4ada-9e6f-4101795743cb/a2a",
          skills: [
            { id: "demand-forecast", description: "Forecast energy demand for a site or region over a time window" },
            { id: "anomaly-detection", description: "Detect unusual consumption patterns against forecast baseline" },
          ],
        },
        {
          name: "Consumption Analyst",
          agentType: "subagent",
          url: "",
          systemPrompt:
            "You are a consumption analyst for an energy utility. Given meter readings and demand forecasts, identify anomalies, flag unusual consumption, and provide actionable recommendations. Always complete with a concise summary. Never ask for more information.",
          subagentActions: ["Meter Reading Agent", "Demand Forecasting Agent"],
        },
      ],
      mcps: [
        {
          name: "Grid Operations MCP",
          url: "https://www.a2d-ai.com/api/platform/cb2cfe3a-187a-40be-8339-c365f31921bc/mcp",
          tools: ["get_grid_status", "submit_outage_report", "get_tariff_rates", "dispatch_field_crew"],
        },
        {
          name: "Customer Portal MCP",
          url: "https://www.a2d-ai.com/api/platform/2dc1fef6-7a4f-4b6a-b2d8-734149bb3564/mcp",
          tools: ["get_rewards_balance", "redeem_reward", "get_invoice", "submit_billing_dispute"],
        },
      ],
      routing: {
        type: "intent",
        intents: [
          { label: "Grid Operations", description: "Grid status checks, outage reports, tariff rates, and field crew dispatch", handler: "Grid Operations Agent" },
          { label: "Consumption", description: "Meter readings, demand forecasting, and consumption anomaly analysis", handler: "Consumption Analyst" },
        ],
      },
    },
  },
  {
    id: "healthcare",
    label: "Healthcare",
    industry: "Healthcare",
    description: "Healthcare broker that coordinates appointment scheduling, patient records, and clinical triage",
    industryColor: "emerald",
    config: {
      name: "Healthcare Broker",
      description: "Healthcare broker that coordinates appointment scheduling, patient records, and clinical triage",
      orgId: "9a5bbced-4ad9-45ff-8353-8386cd29f9a1",
      businessGroupId: "63d813c9-ab7a-446a-b832-429bfdb076ef",
      version: "1.0.0",
      tags: ["agentscript", "healthcare"],
      llm: { provider: "openai", model: "gpt-4.1-mini" },
      agents: [
        {
          name: "Appointment Scheduler",
          agentType: "a2a",
          url: "<APPOINTMENT_SCHEDULER_URL>",
          skills: [
            { id: "schedule-appointment", description: "Book, reschedule, or cancel patient appointments" },
          ],
        },
        {
          name: "EHR Lookup Agent",
          agentType: "a2a",
          url: "<EHR_LOOKUP_URL>",
          skills: [
            { id: "ehr-lookup", description: "Retrieve patient electronic health records and history" },
          ],
        },
        {
          name: "Triage Advisor",
          agentType: "subagent",
          url: "",
          systemPrompt:
            "You are a clinical triage advisor. Based on patient symptoms and medical history, recommend the appropriate care level: self-care, GP appointment, urgent care, or emergency. Always include a disclaimer that this is AI assistance and not a medical diagnosis.",
        },
      ],
      mcps: [
        {
          name: "Patient Records MCP",
          url: "<PATIENT_RECORDS_MCP_URL>",
          tools: ["get_patient_profile", "update_care_plan", "get_available_slots"],
        },
      ],
      routing: {
        type: "intent",
        intents: [
          { label: "Book Appointment", description: "Schedule or manage a patient appointment", handler: "Appointment Scheduler" },
          { label: "Patient Records", description: "Retrieve patient history and health records", handler: "EHR Lookup Agent" },
          { label: "Triage", description: "Assess patient symptoms and recommend care level", handler: "Triage Advisor" },
          { label: "Available Slots", description: "Check available appointment slots", handler: "get_available_slots" },
        ],
      },
    },
  },
  {
    id: "retail",
    label: "Retail",
    industry: "Retail",
    description: "Retail broker that coordinates product recommendations, loyalty rewards, and order management",
    industryColor: "violet",
    config: {
      name: "Retail Broker",
      description: "Retail broker that coordinates product recommendations, loyalty rewards, and order management",
      orgId: "9a5bbced-4ad9-45ff-8353-8386cd29f9a1",
      businessGroupId: "63d813c9-ab7a-446a-b832-429bfdb076ef",
      version: "1.0.0",
      tags: ["agentscript", "retail"],
      llm: { provider: "openai", model: "gpt-4.1-mini" },
      agents: [
        {
          name: "Product Recommendations Agent",
          agentType: "a2a",
          url: "<PRODUCT_RECOMMENDATIONS_URL>",
          skills: [
            { id: "recommend-products", description: "Generate personalised product recommendations based on customer profile and history" },
          ],
        },
        {
          name: "Loyalty Agent",
          agentType: "a2a",
          url: "<LOYALTY_AGENT_URL>",
          skills: [
            { id: "loyalty-lookup", description: "Retrieve customer loyalty points, tier, and available rewards" },
          ],
        },
        {
          name: "Pricing Analyst",
          agentType: "subagent",
          url: "",
          systemPrompt:
            "You are a pricing analyst for a retail platform. Given a product and customer loyalty tier, calculate the applicable discount, final price, and any active promotions. Flag margin risk if the discount exceeds 30%.",
        },
      ],
      mcps: [
        {
          name: "Inventory & Orders MCP",
          url: "<INVENTORY_ORDERS_MCP_URL>",
          tools: ["check_stock", "place_order", "get_order_status"],
        },
      ],
      routing: {
        type: "intent",
        intents: [
          { label: "Recommendations", description: "Get personalised product recommendations for a customer", handler: "Product Recommendations Agent" },
          { label: "Loyalty", description: "Check customer loyalty points, tier, and rewards", handler: "Loyalty Agent" },
          { label: "Check Stock", description: "Check product availability and stock levels", handler: "check_stock" },
          { label: "Place Order", description: "Place a new customer order", handler: "place_order" },
        ],
      },
    },
  },
];
