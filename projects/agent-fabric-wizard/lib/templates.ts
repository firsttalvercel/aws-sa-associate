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
          name: "Applicant Subagent",
          agentType: "subagent",
          url: "",
          systemPrompt:
            "You are an applicant services specialist. Run credit scoring, document verification, fraud detection, KYC, and AML checks as needed. Always complete with a concise summary. Never ask for more information.",
          subagentActions: ["Credit Scoring Agent", "Document Verification Agent", "Fraud Detection Agent", "run_kyc_check", "run_aml_screening"],
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
          { label: "Applicant Services", description: "Credit scoring, document verification, fraud detection, KYC, and AML screening", handler: "Applicant Subagent" },
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
    description: "Clinical intelligence broker coordinating patient records, clinical decision support, care coordination, and insurance authorization",
    industryColor: "emerald",
    config: {
      name: "Healthcare Broker",
      description: "Clinical intelligence broker coordinating patient records, clinical decision support, care coordination, and insurance authorization for healthcare providers",
      orgId: "9a5bbced-4ad9-45ff-8353-8386cd29f9a1",
      businessGroupId: "63d813c9-ab7a-446a-b832-429bfdb076ef",
      version: "1.0.0",
      tags: ["agentscript", "healthcare"],
      llm: { provider: "openai", model: "gpt-4.1-mini" },
      agents: [
        {
          name: "Patient Records Agent",
          agentType: "a2a",
          url: "https://www.a2d-ai.com/api/platform/2fb341d9-3efc-4ec2-a67b-9bf1fac00e36/a2a",
          skills: [
            { id: "patient-summary-retrieval", description: "Retrieve comprehensive FHIR-compliant patient summaries from EHR systems" },
            { id: "medication-list-retrieval", description: "Retrieve complete medication lists including dosages and interaction flags" },
          ],
        },
        {
          name: "Clinical Decision Support Agent",
          agentType: "a2a",
          url: "https://www.a2d-ai.com/api/platform/3e6241c1-0cb0-4dfe-830a-4b57aa09b0e6/a2a",
          skills: [
            { id: "drug-interaction-check", description: "Evaluate drug-drug and drug-allergy interactions against clinical databases" },
            { id: "treatment-protocol-recommendation", description: "Provide evidence-based treatment protocol recommendations by diagnosis" },
          ],
        },
        {
          name: "Care Coordination Agent",
          agentType: "a2a",
          url: "https://www.a2d-ai.com/api/platform/c6bd5371-7c4d-40ba-9692-1c35a86a4819/a2a",
          skills: [
            { id: "manage-referrals", description: "Create and track specialist referrals with payer compliance" },
            { id: "track-care-gaps", description: "Identify and track open care gaps for preventive care compliance" },
            { id: "coordinate-transitions", description: "Manage patient transitions between care settings to prevent readmissions" },
          ],
        },
        {
          name: "Insurance Authorization Agent",
          agentType: "a2a",
          url: "https://www.a2d-ai.com/api/platform/d2f20f42-8d53-4215-a455-4af0ba7521cd/a2a",
          skills: [
            { id: "check-eligibility", description: "Verify real-time patient insurance eligibility and benefits" },
            { id: "submit-authorization", description: "Submit and track prior authorization requests to payers" },
            { id: "track-claims-status", description: "Retrieve real-time status of submitted claims with denial reasons" },
          ],
        },
        {
          name: "Clinical Subagent",
          agentType: "subagent",
          url: "",
          systemPrompt:
            "You are a clinical intelligence agent. Handle patient records, lab results, medications, drug interactions, and treatment protocols. Always complete with a concise summary. Never ask for more information.",
          subagentActions: ["Patient Records Agent", "Clinical Decision Support Agent"],
        },
        {
          name: "Administrative Subagent",
          agentType: "subagent",
          url: "",
          systemPrompt:
            "You are a healthcare administrative specialist. Handle eligibility checks, prior authorizations, claims status, PHI access logging, and HIPAA compliance. Always complete with a concise summary. Never ask for more information.",
          subagentActions: ["Insurance Authorization Agent", "check_eligibility", "submit_prior_auth"],
        },
      ],
      mcps: [
        {
          name: "FHIR EHR MCP",
          url: "https://www.a2d-ai.com/api/platform/fa28cfc8-1aff-4713-9006-27ff55e0d26a/mcp",
          tools: ["Patient Summary Retrieval", "Lab Results Retrieval", "Medication List Retrieval", "Care Gaps Retrieval", "Allergy Records Retrieval", "Appointment Scheduling", "Referral Creation"],
        },
        {
          name: "Insurance MCP",
          url: "https://www.a2d-ai.com/api/platform/69c9fe32-df63-40ea-8c30-a4a3e474145c/mcp",
          tools: ["Eligibility Checker", "Prior Authorization Request", "Claim Status Retrieval", "Authorization Appeal Submission"],
        },
        {
          name: "Healthcare Compliance MCP",
          url: "https://www.a2d-ai.com/api/platform/6a1687e8-45fd-4dfa-b150-307c5da6c2cb/mcp",
          tools: ["PHI Access Logger", "Patient Consent Status Retriever", "HIPAA Violation Flagger", "Audit Trail Generator"],
        },
      ],
      routing: {
        type: "intent",
        intents: [
          { label: "Clinical", description: "Patient records, lab results, medications, drug interactions, and treatment protocols", handler: "Clinical Subagent" },
          { label: "Care Coordination", description: "Specialist referrals, care gaps, transitions of care, and appointment scheduling", handler: "Care Coordination Agent" },
          { label: "Administrative", description: "Eligibility checks, prior authorization, claims status, PHI logging, and HIPAA compliance", handler: "Administrative Subagent" },
        ],
      },
    },
  },
  {
    id: "retail",
    label: "Retail",
    industry: "Retail",
    description: "Intelligent retail broker coordinating product discovery, loyalty management, inventory checks, and order operations",
    industryColor: "violet",
    config: {
      name: "Retail Broker",
      description: "Intelligent retail broker coordinating product discovery, loyalty management, inventory checks, and order operations for personalised customer experiences",
      orgId: "9a5bbced-4ad9-45ff-8353-8386cd29f9a1",
      businessGroupId: "63d813c9-ab7a-446a-b832-429bfdb076ef",
      version: "1.0.0",
      tags: ["agentscript", "retail"],
      llm: { provider: "openai", model: "gpt-4.1-mini" },
      agents: [
        {
          name: "Product Recommendations Agent",
          agentType: "a2a",
          url: "https://www.a2d-ai.com/api/platform/1e88a95b-86c6-4128-9bd5-29005794ea93/a2a",
          skills: [
            { id: "personalised-recommendations", description: "Recommend products tailored to a customer's tier, preferences, and purchase history" },
            { id: "cross-sell-upsell", description: "Identify cross-sell and upsell opportunities based on basket contents" },
          ],
        },
        {
          name: "Loyalty Agent",
          agentType: "a2a",
          url: "https://www.a2d-ai.com/api/platform/9756acce-b960-419a-9e06-1bf2b1567ffc/a2a",
          skills: [
            { id: "points-balance", description: "Retrieve current loyalty points balance and tier progress" },
            { id: "rewards-redemption", description: "Redeem loyalty points for discount vouchers or rewards" },
          ],
        },
        {
          name: "Inventory Agent",
          agentType: "a2a",
          url: "https://www.a2d-ai.com/api/platform/14e17096-aa52-4e4d-bbe8-bf64c42d2ed1/a2a",
          skills: [
            { id: "stock-check", description: "Check real-time stock levels by SKU across all warehouse locations" },
            { id: "reserve-stock", description: "Reserve inventory for a confirmed order to prevent oversell" },
          ],
        },
        {
          name: "Order Management Agent",
          agentType: "a2a",
          url: "https://www.a2d-ai.com/api/platform/b61485a3-9981-4b18-9c8b-c8f267c579f0/a2a",
          skills: [
            { id: "order-status", description: "Retrieve real-time order status with courier tracking information" },
            { id: "returns-processing", description: "Process return requests and track refund status" },
          ],
        },
        {
          name: "Orders Router",
          agentType: "router",
          url: "",
          subagentActions: ["Dispatched", "Tracking Update", "Otherwise"],
        },
        {
          name: "Aftercare Orchestrator",
          agentType: "subagent",
          url: "",
          subagentActions: ["Order Management Agent", "Product Recommendations Agent", "Loyalty Agent", "get_customer_profile", "get_purchase_history", "get_delivery_status", "get_active_promotions"],
        },
      ],
      mcps: [
        {
          name: "Product Catalog MCP",
          url: "https://www.a2d-ai.com/api/platform/db9468d0-ad31-4d9b-ba86-760a10b5923a/mcp/",
          tools: ["search_products", "get_product_details", "get_active_promotions"],
        },
        {
          name: "Customer Profile MCP",
          url: "https://www.a2d-ai.com/api/platform/ea8c9204-5530-4593-afce-d0f4b433c4fc/mcp/",
          tools: ["get_customer_profile", "get_purchase_history", "update_customer_preferences"],
        },
        {
          name: "Fulfillment MCP",
          url: "https://www.a2d-ai.com/api/platform/3fa50cad-f837-4559-8bf4-db3041f148f6/mcp/",
          tools: ["get_shipping_options", "dispatch_order", "get_delivery_status"],
        },
      ],
      routing: {
        type: "intent",
        intents: [
          { label: "Discovery", description: "Product searches, recommendations, and promotions", handler: "Product Recommendations Agent" },
          { label: "Loyalty", description: "Points balance, tier status, and rewards redemption", handler: "Loyalty Agent" },
          { label: "Orders", description: "Order status, tracking, returns, and shipping", handler: "Orders Router" },
          { label: "Aftercare", description: "Returns, refunds, re-purchase suggestions, and post-purchase care", handler: "Aftercare Orchestrator" },
        ],
      },
    },
  },
  {
    id: "it-help",
    label: "IT Help Desk",
    industry: "IT",
    description: "IT support broker that triages employee requests, investigates routine issues, and escalates high-severity incidents",
    industryColor: "slate",
    config: {
      name: "IT Help Investigation",
      description: "IT support broker that triages employee requests, investigates routine issues using available services, keeps Jira updated, and escalates cases that cannot be handled automatically",
      orgId: "9a5bbced-4ad9-45ff-8353-8386cd29f9a1",
      businessGroupId: "63d813c9-ab7a-446a-b832-429bfdb076ef",
      version: "1.0.0",
      tags: ["agentscript", "it-help"],
      llm: { provider: "openai", model: "gpt-5-mini" },
      agents: [
        {
          name: "Help Center Agent",
          agentType: "a2a",
          url: "",
          skills: [
            { id: "search-help-center", description: "Search the internal help center knowledge base for solutions" },
          ],
        },
        {
          name: "License Procurement Agent",
          agentType: "a2a",
          url: "",
          skills: [
            { id: "procure-license", description: "Provision software licenses and access for employees" },
          ],
        },
        {
          name: "Resolution Router",
          agentType: "router",
          url: "",
          subagentActions: ["Help Provided", "License Provided", "Otherwise"],
        },
      ],
      mcps: [
        {
          name: "Jira MCP",
          url: "",
          tools: ["update_issue"],
        },
        {
          name: "Escalation MCP",
          url: "",
          tools: ["escalate"],
        },
      ],
      routing: {
        type: "intent",
        intents: [
          { label: "Needs Clarification", description: "Request is too vague to classify — ask for more detail", handler: "clarification_echo" },
          { label: "High Severity", description: "Outage, security incident, or business-critical issue — escalate immediately", handler: "escalate" },
          { label: "Low Severity", description: "Single-user issue, password reset, license request, or how-to query", handler: "Resolution Router" },
        ],
      },
    },
  },
];
