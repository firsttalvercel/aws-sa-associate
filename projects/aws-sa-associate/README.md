# AWS SAA-C03 Practice Site

A self-hosted exam practice site for the AWS Solutions Architect Associate (SAA-C03) certification.

**Live site:** https://aws-sa-associate.vercel.app

---

## Features

| Feature | Description |
|---------|-------------|
| **Quick Test** | Configure domain, count, and feedback mode. Targeted drill links from weak domains. |
| **Sim Exam** | 65 questions, 130-minute timer, domain-weighted — mirrors the real exam experience. |
| **Topics** | Cheat sheets, comparison tables, decision trees, and exam traps per service. |
| **Scenarios** | Browse all questions by domain. Filter by unattempted. |
| **Mistakes** | Review every question you got wrong with full explanation and distractor breakdown. |
| **Cheat Sheet** | All domains, service comparisons, key numbers, and exam traps in one scrollable page. |
| **Podcast** | AI-generated audio study guide (~25 min) covering all four domains and top traps. |
| **Dashboard** | Overall accuracy, domain progress bars, session sparkline, and weak-domain drill CTA. |

---

## Question Bank

- **1,032 questions** across all four SAA-C03 domains
- Options shuffled deterministically per question (seeded by question ID) — no position bias
- Each question includes explanation + per-distractor reasoning for wrong answers
- Domains: Secure (30%), Resilient (26%), High-Performing (24%), Cost-Optimized (20%)

---

## Tech Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4**
- **Vercel** — production deployment
- Progress stored in `localStorage` — no backend, no auth

---

## Local Development

```bash
cd site
npm install
npm run dev
# → http://localhost:3000
```

---

## Podcast

The audio study guide was generated via [NotebookLM](https://notebooklm.google.com) from a structured study document covering all exam domains, service comparisons, exam traps, and key numbers.

Download: [GitHub Releases](https://github.com/firsttalvercel/aws-sa-associate/releases/tag/v1.0-podcast)
