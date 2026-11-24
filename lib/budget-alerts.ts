import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { config } from "@/lib/config";
import { sendMail } from "@/lib/email";
import { aiAllowanceEmail } from "@/lib/email/templates";
import { effectivePlan } from "@/lib/plans";
import { aiAllowance, fmtReset } from "@/lib/usage";

/**
 * Email a customer once when they pass 80% of the month's AI allowance and once when it runs out.
 * The level already sent is kept in app_kv per user and month, so each email goes out at most once.
 */
export async function budgetAlerts(userId: number): Promise<void> {
  const [user] = await db().select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user || user.role === "admin" || !user.emailVerifiedAt || user.suspendedAt) return;
  const a = await aiAllowance(user);
  const level = a.remainingUsd < 0.1 ? 100 : a.pct >= 80 ? 80 : 0;
  if (!level) return;
  const now = new Date();
  const k = `aialert:${userId}:${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;
  const [row] = await db().select().from(schema.appKv).where(eq(schema.appKv.k, k)).limit(1);
  if (Number(row?.v ?? 0) >= level) return;
  await db().insert(schema.appKv).values({ k, v: String(level), updatedAt: now }).onDuplicateKeyUpdate({ set: { v: String(level), updatedAt: now } });
  const plan = effectivePlan(user);
  const mail = aiAllowanceEmail({ pct: level === 100 ? 100 : a.pct, planName: plan.name, resets: fmtReset(a.resetsAt), url: `${config.appUrl}/app/billing`, topPlan: plan.code === "agency" });
  await sendMail({ to: user.email, userId, kind: "ai_allowance", ...mail });
}
