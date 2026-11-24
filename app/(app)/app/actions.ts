"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, count, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { destroyOtherSessions, hashPassword, passwordProblem, rateLimit, requireUser, verifyPassword } from "@/lib/auth";
import { config, COUNTRIES, LANGUAGES, MODELS } from "@/lib/config";
import { effectivePlan } from "@/lib/plans";
import { monthlyUsage, runBlocked } from "@/lib/usage";
import { createRun } from "@/lib/runs";
import { domainOf, normalizeUrl, publicUrlProblem } from "@/lib/url-safety";
import { ownedProject } from "@/lib/queries";
import { AUDIT_FLOW_KEYS } from "@/lib/prompts";
import { portalUrl } from "@/lib/billing/paddle";
import { sendVerification } from "@/app/(auth)/actions";
import type { FormState } from "@/components/client";

const DAY = 864e5;
const str = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);
const pick = <T extends string>(v: string, list: readonly T[], fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);

// ------------------------------------------------------------------ projects
export async function createProject(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const plan = effectivePlan(user);
  const usage = await monthlyUsage(user.id);
  if (usage.projects >= plan.limits.projects) return { error: `Your ${plan.name} plan includes ${plan.limits.projects} website${plan.limits.projects === 1 ? "" : "s"}. Upgrade to add more.` };
  const url = normalizeUrl(fd.get("url"));
  if (!url) return { error: "Enter a valid website address, like https://www.example.com" };
  const problem = await publicUrlProblem(url);
  if (problem) return { error: problem };
  const name = str(fd, "name", 120) || domainOf(url);
  const country = pick(str(fd, "country"), COUNTRIES, "United States");
  const language = pick(str(fd, "language"), LANGUAGES, "English");
  const competitors = str(fd, "competitors", 2000).split(/[\n,]+/).map((c) => c.trim()).filter(Boolean).slice(0, 10);
  const now = new Date();
  const res = await db().insert(schema.projects).values({
    userId: user.id, name, url, domain: domainOf(url), country, language, competitors: JSON.stringify(competitors),
    autoAudit: plan.autoAudits.includes("weekly") ? "weekly" : "monthly", rankFrequency: plan.rankFrequencies.includes("daily") ? "daily" : "weekly",
    nextAuditAt: new Date(Date.now() + 7 * DAY), createdAt: now, updatedAt: now,
  });
  const id = Number((res[0] as { insertId: number }).insertId);
  // first quick audit right away (if allowed)
  if (!(await runBlocked(user, "quick"))) {
    await createRun({ userId: user.id, projectId: id, kind: "quick", title: `${name} · site audit`, input: { url, competitors, flows: [], model: "", budgetUsd: 0, maxPages: plan.limits.pagesPerAudit } });
  }
  const kws = str(fd, "keywords", 5000);
  if (kws) await insertKeywords(user.id, id, kws, plan.limits.keywords);
  redirect(`/app/projects/${id}?new=1`);
}

export async function updateProject(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const p = await ownedProject(user, Number(fd.get("projectId")));
  if (!p) return { error: "Project not found." };
  const plan = effectivePlan(user);
  const autoAudit = pick(str(fd, "autoAudit"), plan.autoAudits, "off");
  const rankFrequency = pick(str(fd, "rankFrequency"), plan.rankFrequencies, "off");
  const competitors = str(fd, "competitors", 2000).split(/[\n,]+/).map((c) => c.trim()).filter(Boolean).slice(0, 10);
  await db().update(schema.projects).set({
    name: str(fd, "name", 120) || p.name,
    country: pick(str(fd, "country"), COUNTRIES, p.country as never),
    language: pick(str(fd, "language"), LANGUAGES, p.language as never),
    competitors: JSON.stringify(competitors), autoAudit, rankFrequency,
    nextAuditAt: autoAudit === "off" ? null : p.nextAuditAt ?? new Date(Date.now() + (autoAudit === "weekly" ? 7 : 30) * DAY),
  }).where(eq(schema.projects.id, p.id));
  revalidatePath(`/app/projects/${p.id}`);
  return { ok: true, message: "Saved." };
}

export async function deleteProject(fd: FormData) {
  const user = await requireUser();
  const p = await ownedProject(user, Number(fd.get("projectId")));
  if (p && p.userId === user.id) await db().delete(schema.projects).where(eq(schema.projects.id, p.id));
  redirect("/app");
}

// ------------------------------------------------------------------ runs
export async function startQuickAudit(fd: FormData) {
  const user = await requireUser();
  const p = await ownedProject(user, Number(fd.get("projectId")));
  if (!p) redirect("/app");
  const blocked = await runBlocked(user, "quick");
  if (blocked) redirect(`/app/projects/${p.id}?error=${encodeURIComponent(blocked)}`);
  const id = await createRun({
    userId: user.id, projectId: p.id, kind: "quick", title: `${p.name} · site audit`,
    input: { url: p.url, competitors: [], flows: [], model: "", budgetUsd: 0, maxPages: effectivePlan(user).limits.pagesPerAudit },
  });
  redirect(`/app/runs/${encodeURIComponent(id)}`);
}

export async function startDeepAudit(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const p = await ownedProject(user, Number(fd.get("projectId")));
  if (!p) return { error: "Project not found." };
  const blocked = await runBlocked(user, "deep");
  if (blocked) return { error: blocked };
  if (!rateLimit(`deep:${user.id}`, 3, 600)) return { error: "Please wait a few minutes before starting another deep audit." };
  const plan = effectivePlan(user);
  const flows = fd.getAll("flows").map(String).filter((f) => AUDIT_FLOW_KEYS.includes(f));
  const competitors = str(fd, "competitors", 2000).split(/[\n,]+/).map((c) => c.trim()).filter(Boolean).slice(0, 10);
  const model = MODELS.some((m) => m.id === fd.get("model")) && user.role === "admin" ? String(fd.get("model")) : config.model;
  const id = await createRun({
    userId: user.id, projectId: p.id, kind: "deep", title: `${p.name} · AI deep audit`,
    input: { url: p.url, competitors, flows: flows.length ? flows : AUDIT_FLOW_KEYS, notes: str(fd, "notes", 2000), model, budgetUsd: plan.deepBudgetUsd, maxPages: plan.limits.pagesPerAudit },
  });
  redirect(`/app/runs/${encodeURIComponent(id)}`);
}

export async function startBattle(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const keyword = str(fd, "keyword", 200);
  if (!keyword) return { error: "Enter a keyword." };
  const targetUrl = normalizeUrl(fd.get("targetUrl"));
  if (!targetUrl) return { error: "Enter the full URL of your page." };
  const problem = await publicUrlProblem(targetUrl);
  if (problem) return { error: problem };
  const blocked = await runBlocked(user, "keyword");
  if (blocked) return { error: blocked };
  if (!rateLimit(`battle:${user.id}`, 6, 600)) return { error: "Please wait a few minutes before starting another battle." };
  let projectId: number | null = Number(fd.get("projectId")) || null;
  if (projectId && !(await ownedProject(user, projectId))) projectId = null;
  const plan = effectivePlan(user);
  const id = await createRun({
    userId: user.id, projectId, kind: "keyword", title: `“${keyword}” · keyword battle`,
    input: {
      keyword, targetUrl, notes: str(fd, "notes", 2000), model: config.model, budgetUsd: plan.battleBudgetUsd,
      country: pick(str(fd, "country"), COUNTRIES, "United States"), language: pick(str(fd, "language"), LANGUAGES, "English"),
    },
  });
  redirect(`/app/runs/${encodeURIComponent(id)}`);
}

// ------------------------------------------------------------------ keywords
async function insertKeywords(userId: number, projectId: number, text: string, limit: number): Promise<{ added: number; skipped: number }> {
  const [{ n }] = await db().select({ n: count() }).from(schema.keywords).where(eq(schema.keywords.userId, userId));
  let room = limit - Number(n);
  const list = [...new Set(text.split(/[\n,]+/).map((k) => k.trim().toLowerCase().replace(/\s+/g, " ")).filter((k) => k && k.length <= 200))];
  let added = 0;
  for (const keyword of list) {
    if (room <= 0) break;
    try {
      await db().insert(schema.keywords).values({ userId, projectId, keyword, createdAt: new Date(), nextCheckAt: new Date() });
      added++;
      room--;
    } catch { /* duplicate */ }
  }
  return { added, skipped: list.length - added };
}

export async function addKeywords(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const p = await ownedProject(user, Number(fd.get("projectId")));
  if (!p) return { error: "Project not found." };
  const plan = effectivePlan(user);
  const { added, skipped } = await insertKeywords(user.id, p.id, str(fd, "keywords", 20000), plan.limits.keywords);
  revalidatePath(`/app/projects/${p.id}`);
  if (!added && skipped) return { error: `No keywords added. They already exist, or you reached the ${plan.limits.keywords}-keyword limit of the ${plan.name} plan.` };
  return { ok: true, message: `Added ${added} keyword${added === 1 ? "" : "s"}${skipped ? ` (${skipped} skipped: duplicates or over your limit)` : ""}. First positions appear within a few minutes.` };
}

export async function deleteKeyword(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("keywordId"));
  const [k] = await db().select().from(schema.keywords).where(eq(schema.keywords.id, id)).limit(1);
  if (k && (k.userId === user.id || user.role === "admin")) await db().delete(schema.keywords).where(eq(schema.keywords.id, id));
  revalidatePath(`/app/projects/${k?.projectId ?? ""}`);
}

export async function setKeywordTarget(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("keywordId"));
  const target = normalizeUrl(fd.get("targetUrl"));
  await db().update(schema.keywords).set({ targetUrl: target }).where(and(eq(schema.keywords.id, id), eq(schema.keywords.userId, user.id)));
  revalidatePath("/app/projects");
}

// ------------------------------------------------------------------ settings
export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  await db().update(schema.users).set({
    name: str(fd, "name", 120) || user.name,
    emailWeekly: fd.get("emailWeekly") ? 1 : 0, emailAlerts: fd.get("emailAlerts") ? 1 : 0, emailRuns: fd.get("emailRuns") ? 1 : 0,
  }).where(eq(schema.users.id, user.id));
  revalidatePath("/app/settings");
  return { ok: true, message: "Settings saved." };
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!rateLimit(`pw:${user.id}`, 5, 900)) return { error: "Too many attempts. Try again later." };
  if (!(await verifyPassword(String(fd.get("current") ?? ""), user.passwordHash))) return { error: "Your current password is not correct." };
  const next = String(fd.get("password") ?? "");
  const problem = passwordProblem(next);
  if (problem) return { error: problem };
  await db().update(schema.users).set({ passwordHash: await hashPassword(next) }).where(eq(schema.users.id, user.id));
  await destroyOtherSessions(user.id);
  return { ok: true, message: "Password changed. Other devices were signed out." };
}

export async function resendVerification(_: FormState): Promise<FormState> {
  const user = await requireUser();
  if (user.emailVerifiedAt) return { ok: true, message: "Your email is already confirmed." };
  if (!rateLimit(`verify:${user.id}`, 3, 3600)) return { error: "We sent a few emails already. Check your spam folder, or try again in an hour." };
  await sendVerification(user.id, user.email, user.name);
  return { ok: true, message: `Confirmation email sent to ${user.email}.` };
}

export async function deleteAccount(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!(await verifyPassword(String(fd.get("password") ?? ""), user.passwordHash))) return { error: "Password is not correct." };
  if (user.paddleSubscriptionId && ["active", "trialing", "past_due"].includes(user.planStatus)) {
    return { error: "Cancel your subscription on the Billing page first, then delete the account." };
  }
  await db().delete(schema.users).where(eq(schema.users.id, user.id));
  redirect("/?deleted=1");
}

export async function openBillingPortal() {
  const user = await requireUser();
  const url = user.paddleCustomerId ? await portalUrl(user.paddleCustomerId, user.paddleSubscriptionId) : null;
  redirect(url ?? "/app/billing?portal=unavailable");
}
