import { and, count, eq, gte, inArray } from "drizzle-orm";
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

/** Null when allowed, otherwise a message explaining the limit. */
export async function runBlocked(user: User, kind: RunKind): Promise<string | null> {
  if (!user.emailVerifiedAt) return "Confirm your email address first. Check your inbox for the link, or resend it from Settings.";
  const plan = effectivePlan(user);
  const limit = plan.limits[LIMIT_KEY[kind]];
  if (limit <= 0) return `${KIND_LABEL[kind][0].toUpperCase()}${KIND_LABEL[kind].slice(1)} are not included in the ${plan.name} plan. Upgrade to use them.`;
  const used = (await monthlyUsage(user.id))[kind];
  if (used >= limit) return `You have used all ${limit} ${KIND_LABEL[kind]} in your ${plan.name} plan this month. Upgrade for more, or wait until the 1st.`;
  return null;
}
