import { and, count, eq, gte, inArray, sum } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { effectivePlan, type Plan } from "@/lib/plans";
import type { User } from "@/lib/db/schema";

export type RunKind = "quick" | "deep" | "keyword" | "fix";

export function monthStart(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/** Runs that count against the monthly allowance (failed and cancelled runs do not count). */
export async function monthlyUsage(userId: number) {
  const rows = await db()
    .select({ kind: schema.runs.kind, n: count() })
    .from(schema.runs)
    .where(and(eq(schema.runs.userId, userId), gte(schema.runs.createdAt, monthStart()), inArray(schema.runs.status, ["queued", "running", "done"])))
    .groupBy(schema.runs.kind);
  const by = Object.fromEntries(rows.map((r) => [r.kind, Number(r.n)])) as Record<string, number>;
  const [p] = await db().select({ n: count() }).from(schema.projects).where(eq(schema.projects.userId, userId));
  const [k] = await db().select({ n: count() }).from(schema.keywords).where(eq(schema.keywords.userId, userId));
  return { quick: by.quick ?? 0, deep: by.deep ?? 0, keyword: by.keyword ?? 0, fix: by.fix ?? 0, projects: Number(p.n), keywords: Number(k.n) };
}

export const LIMIT_KEY: Record<RunKind, keyof Plan["limits"]> = { quick: "quickAudits", deep: "deepAudits", keyword: "battles", fix: "fixes" };
export const KIND_LABEL: Record<RunKind, string> = { quick: "site audits", deep: "AI deep audits", keyword: "keyword battles", fix: "AI auto-fixes" };

// ------------------------------------------------------------------ monthly AI allowance
/**
 * Real money spent on a user this month: AI run costs (every status, a failed run still cost us)
 * plus paid rank checks. Compared with the plan's aiBudgetUsd, it is a hard stop, so no plan can
 * cost more than it earns. Customers see a percentage, never dollars.
 */
export async function monthlyAiSpend(userId: number): Promise<number> {
  const since = monthStart();
  const [r] = await db().select({ s: sum(schema.runs.costUsd) }).from(schema.runs)
    .where(and(eq(schema.runs.userId, userId), gte(schema.runs.createdAt, since)));
  const [k] = await db().select({ s: sum(schema.rankChecks.costUsd) }).from(schema.rankChecks)
    .innerJoin(schema.keywords, eq(schema.keywords.id, schema.rankChecks.keywordId))
    .where(and(eq(schema.keywords.userId, userId), gte(schema.rankChecks.checkedAt, since)));
  return Number(r?.s ?? 0) + Number(k?.s ?? 0);
}

export interface Allowance { limitUsd: number; usedUsd: number; remainingUsd: number; pct: number; resetsAt: Date }

export async function aiAllowance(user: User): Promise<Allowance> {
  const limitUsd = effectivePlan(user).aiBudgetUsd;
  const usedUsd = await monthlyAiSpend(user.id);
  const now = new Date();
  return {
    limitUsd, usedUsd, remainingUsd: Math.max(0, limitUsd - usedUsd),
    pct: limitUsd > 0 ? Math.min(100, Math.round((usedUsd / limitUsd) * 100)) : 100,
    resetsAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  };
}

export const fmtReset = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** Smallest allowance left that still lets this kind of AI run start. */
const MIN_LEFT: Partial<Record<RunKind, number>> = { deep: 0.5, keyword: 0.2, fix: 0.1 };

/** Null when allowed, otherwise a message explaining the limit. */
export async function runBlocked(user: User, kind: RunKind): Promise<string | null> {
  if (!user.emailVerifiedAt) return "Confirm your email address first. Check your inbox for the link, or resend it from Settings.";
  const plan = effectivePlan(user);
  const limit = plan.limits[LIMIT_KEY[kind]];
  if (limit <= 0) return `${KIND_LABEL[kind][0].toUpperCase()}${KIND_LABEL[kind].slice(1)} are not included in the ${plan.name} plan. Upgrade to use them.`;
  const used = (await monthlyUsage(user.id))[kind];
  if (used >= limit) return `You have used all ${limit} ${KIND_LABEL[kind]} in your ${plan.name} plan this month. Upgrade for more, or wait until the 1st.`;
  const min = MIN_LEFT[kind];
  if (min != null) {
    const a = await aiAllowance(user);
    if (a.remainingUsd < min) return `You have used ${a.pct}% of this month's AI allowance on the ${plan.name} plan, so new AI runs are paused until ${fmtReset(a.resetsAt)}. Site audits still work. Upgrade for a bigger allowance.`;
  }
  return null;
}
