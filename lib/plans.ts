/**
 * Subscription plans. Display prices live here; Paddle holds the charged price (match them).
 * AI runs (deep audits, keyword battles) cost real API money per run, so each plan caps them and
 * each run has a spend cap. Review margins in Admin → Overview ("AI cost this month").
 */

export type PlanCode = "free" | "starter" | "pro" | "agency";
export type Cycle = "monthly" | "yearly";

export interface Plan {
  code: PlanCode;
  name: string;
  priceMonthly: number;
  priceYearly: number; // per year
  tagline: string;
  limits: {
    projects: number;
    quickAudits: number; // per calendar month (manual + scheduled)
    deepAudits: number; // per month, AI agent team
    battles: number; // per month, keyword battles
    keywords: number; // tracked keywords across all projects
    pagesPerAudit: number;
    fixes: number; // per month, AI auto-fix runs through a connector
    prChecks: number; // per month, GitHub PR SEO Gatekeeper checks ($0 AI cost)
  };
  rankFrequencies: ("off" | "weekly" | "daily")[];
  autoAudits: ("off" | "monthly" | "weekly")[];
  /** Spend cap per AI run, in USD. */
  deepBudgetUsd: number;
  battleBudgetUsd: number;
  /** Spend cap per AI code-fix run (connector folder, GitHub, local). */
  fixBudgetUsd: number;
  /** Monthly AI allowance in USD (AI runs + rank checks). Hard stop: guarantees the plan never loses money. */
  aiBudgetUsd: number;
  highlights: string[];
  popular?: boolean;
}

export const PLANS: Record<PlanCode, Plan> = {
  free: {
    code: "free", name: "Free", priceMonthly: 0, priceYearly: 0,
    tagline: "See where your website stands today.",
    limits: { projects: 1, quickAudits: 5, deepAudits: 0, battles: 1, keywords: 10, pagesPerAudit: 10, fixes: 1, prChecks: 0 },
    rankFrequencies: ["off", "weekly"], autoAudits: ["off", "monthly"],
    deepBudgetUsd: 0, battleBudgetUsd: 0.75, fixBudgetUsd: 0.5, aiBudgetUsd: 1.5,
    highlights: ["1 website", "5 site audits a month", "1 keyword battle a month", "10 tracked keywords, weekly", "Monthly automatic audit", "1 AI auto-fix a month", "Email alerts", "Fair-use AI allowance, live in your dashboard"],
  },
  starter: {
    code: "starter", name: "Starter", priceMonthly: 39, priceYearly: 390,
    tagline: "For a business that wants to rank its own site.",
    limits: { projects: 3, quickAudits: 40, deepAudits: 2, battles: 10, keywords: 100, pagesPerAudit: 50, fixes: 10, prChecks: 30 },
    rankFrequencies: ["off", "weekly", "daily"], autoAudits: ["off", "monthly", "weekly"],
    deepBudgetUsd: 2.5, battleBudgetUsd: 1, fixBudgetUsd: 0.75, aiBudgetUsd: 15,
    highlights: ["3 websites", "2 AI deep audits a month", "10 keyword battles a month", "100 keywords tracked daily", "40 site audits a month", "Weekly automatic audits", "10 AI auto-fixes & internal linking PRs", "GitHub PR SEO Gatekeeper (30 PRs/mo)", "Fair-use AI allowance, live in your dashboard"],
  },
  pro: {
    code: "pro", name: "Pro", priceMonthly: 99, priceYearly: 990, popular: true,
    tagline: "For teams that publish and optimise every week.",
    limits: { projects: 10, quickAudits: 200, deepAudits: 6, battles: 30, keywords: 300, pagesPerAudit: 100, fixes: 40, prChecks: 500 },
    rankFrequencies: ["off", "weekly", "daily"], autoAudits: ["off", "monthly", "weekly"],
    deepBudgetUsd: 3, battleBudgetUsd: 1, fixBudgetUsd: 1, aiBudgetUsd: 45,
    highlights: ["10 websites", "6 AI deep audits a month", "30 keyword battles a month", "300 keywords tracked daily", "200 site audits a month", "Competitor gap analysis", "40 AI auto-fixes & Auto Internal Linking", "GitHub PR SEO Gatekeeper (500 PRs/mo)", "Fair-use AI allowance, live in your dashboard"],
  },
  agency: {
    code: "agency", name: "Agency", priceMonthly: 249, priceYearly: 2490,
    tagline: "For agencies running SEO for many clients.",
    limits: { projects: 30, quickAudits: 1000, deepAudits: 15, battles: 80, keywords: 1000, pagesPerAudit: 300, fixes: 150, prChecks: 2000 },
    rankFrequencies: ["off", "weekly", "daily"], autoAudits: ["off", "monthly", "weekly"],
    deepBudgetUsd: 3, battleBudgetUsd: 1, fixBudgetUsd: 1, aiBudgetUsd: 110,
    highlights: ["30 websites", "15 AI deep audits a month", "80 keyword battles a month", "1,000 keywords tracked daily", "1,000 site audits a month", "Printable client reports", "150 AI auto-fixes & Auto Internal Linking", "GitHub PR SEO Gatekeeper (2,000 PRs/mo)", "Fair-use AI allowance, live in your dashboard"],
  },
};

export const PAID_PLANS: PlanCode[] = ["starter", "pro", "agency"];

export function getPlan(code: string | null | undefined): Plan {
  return PLANS[(code as PlanCode) in PLANS ? (code as PlanCode) : "free"];
}

/** Effective plan: a cancelled or unpaid subscription falls back to Free limits. */
export function effectivePlan(user: { plan: string; planStatus: string; planRenewsAt: Date | null }): Plan {
  const active = ["active", "trialing"].includes(user.planStatus) ||
    (user.planStatus === "canceled" && user.planRenewsAt != null && user.planRenewsAt > new Date()) ||
    (user.planStatus === "past_due" && user.planRenewsAt != null && user.planRenewsAt.getTime() + 7 * 864e5 > Date.now());
  return active ? getPlan(user.plan) : PLANS.free;
}
