"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PLANS, type PlanCode } from "@/lib/plans";
import { ADDONS, setUserAddon, type AddonCode } from "@/lib/addons";
import { slugify } from "@/lib/blog";
import { runRankChecksNow, runScheduledAuditsNow } from "@/lib/worker";
import type { FormState } from "@/components/client";

async function log(adminId: number, action: string, target: string, detail?: string) {
  await db().insert(schema.adminLog).values({ adminId, action, target, detail: detail ?? null, createdAt: new Date() });
}

export async function setUserPlan(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("userId"));
  const plan = String(fd.get("plan")) as PlanCode;
  if (!(plan in PLANS)) return;
  await db().update(schema.users).set({ plan, planStatus: "active", planRenewsAt: plan === "free" ? null : new Date(Date.now() + 31 * 864e5) }).where(eq(schema.users.id, id));
  await log(admin.id, "set_plan", `user:${id}`, plan);
  revalidatePath("/admin/users");
}

export async function toggleSuspend(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("userId"));
  if (id === admin.id) return;
  const [u] = await db().select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  if (!u) return;
  await db().update(schema.users).set({ suspendedAt: u.suspendedAt ? null : new Date() }).where(eq(schema.users.id, id));
  if (!u.suspendedAt) await db().delete(schema.sessions).where(eq(schema.sessions.userId, id));
  await log(admin.id, u.suspendedAt ? "reactivate" : "suspend", `user:${id}`);
  revalidatePath("/admin/users");
}

export async function verifyUserEmail(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("userId"));
  await db().update(schema.users).set({ emailVerifiedAt: new Date() }).where(eq(schema.users.id, id));
  await log(admin.id, "verify_email", `user:${id}`);
  revalidatePath("/admin/users");
}

export async function toggleUserAddon(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("userId"));
  const code = String(fd.get("addonCode")) as AddonCode;
  const enable = fd.get("enable") === "1";
  if (!(code in ADDONS)) return;
  await setUserAddon({
    userId: id,
    code,
    status: enable ? "active" : "inactive",
    renewsAt: enable ? new Date(Date.now() + 31 * 864e5) : null,
  });
  await log(admin.id, enable ? "grant_addon" : "revoke_addon", `user:${id}`, code);
  revalidatePath("/admin/users");
}

export async function savePost(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = Number(fd.get("id")) || null;
  const title = String(fd.get("title") ?? "").trim().slice(0, 200);
  const content = String(fd.get("content") ?? "");
  if (!title || content.trim().length < 50) return { error: "A post needs a title and at least a paragraph of content." };
  const slug = slugify(String(fd.get("slug") ?? "") || title);
  const status = fd.get("status") === "published" ? "published" : "draft";
  const publishedAtRaw = String(fd.get("publishedAt") ?? "");
  const values = {
    title, slug, content,
    excerpt: String(fd.get("excerpt") ?? "").trim().slice(0, 400),
    coverImage: String(fd.get("coverImage") ?? "").trim().slice(0, 500) || null,
    metaTitle: String(fd.get("metaTitle") ?? "").trim().slice(0, 200) || null,
    metaDescription: String(fd.get("metaDescription") ?? "").trim().slice(0, 300) || null,
    focusKeyword: String(fd.get("focusKeyword") ?? "").trim().slice(0, 120) || null,
    tags: String(fd.get("tags") ?? "").trim().slice(0, 300) || null,
    authorName: String(fd.get("authorName") ?? "").trim().slice(0, 120) || "SEOKaroAI Team",
    status,
  };
  try {
    if (id) {
      const [existing] = await db().select().from(schema.posts).where(eq(schema.posts.id, id)).limit(1);
      const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : status === "published" ? existing?.publishedAt ?? new Date() : existing?.publishedAt ?? null;
      await db().update(schema.posts).set({ ...values, publishedAt }).where(eq(schema.posts.id, id));
      await log(admin.id, "update_post", `post:${id}`, status);
    } else {
      const now = new Date();
      const res = await db().insert(schema.posts).values({ ...values, publishedAt: publishedAtRaw ? new Date(publishedAtRaw) : status === "published" ? now : null, createdAt: now, updatedAt: now });
      const newId = Number((res[0] as { insertId: number }).insertId);
      await log(admin.id, "create_post", `post:${newId}`, status);
      revalidatePath("/blog");
      redirect(`/admin/posts/${newId}?saved=1`);
    }
  } catch (e) {
    if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
    if (String((e as Error).message).includes("Duplicate")) return { error: "Another post already uses this URL slug." };
    throw e;
  }
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  return { ok: true, message: status === "published" ? "Published." : "Draft saved." };
}

export async function deletePost(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("id"));
  await db().delete(schema.posts).where(eq(schema.posts.id, id));
  await log(admin.id, "delete_post", `post:${id}`);
  redirect("/admin/posts");
}

export async function markHandled(fd: FormData) {
  await requireAdmin();
  await db().update(schema.contactMessages).set({ handledAt: new Date() }).where(eq(schema.contactMessages.id, Number(fd.get("id"))));
  revalidatePath("/admin/messages");
}

export async function runAutomationsNow() {
  const admin = await requireAdmin();
  await runScheduledAuditsNow();
  await runRankChecksNow();
  await log(admin.id, "run_automations", "worker");
  revalidatePath("/admin");
}

export async function saveAi(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const { saveAiSettings, CLAUDE_MODELS } = await import("@/lib/ai/settings");
  const provider = fd.get("provider") === "openai" ? "openai" : "claude";
  const claudeModel = String(fd.get("claudeModel") ?? "");
  const openaiModel = String(fd.get("openaiModel") ?? "").trim().slice(0, 80);
  if (!CLAUDE_MODELS.includes(claudeModel)) return { error: "Choose a Claude model." };
  if (!/^[\w.:-]{2,80}$/.test(openaiModel)) return { error: "Enter a valid OpenAI model name." };
  const num = (k: string) => { const n = Number(fd.get(k)); return Number.isFinite(n) && n > 0 && n < 1000 ? n : undefined; };
  const openaiPrice = { input: num("priceInput"), cachedInput: num("priceCached"), output: num("priceOutput") };
  const openaiStrategyModel = String(fd.get("openaiStrategyModel") ?? "").trim().slice(0, 80);
  if (openaiStrategyModel && !/^[\w.:-]{2,80}$/.test(openaiStrategyModel)) return { error: "Enter a valid strategy model name, or leave it empty." };
  await saveAiSettings({ provider, claudeModel, openaiModel, openaiStrategyModel, openaiPrice });
  await log(admin.id, "ai_settings", provider, `${claudeModel} / ${openaiModel}`);
  revalidatePath("/admin/settings");
  return { ok: true, message: `Saved. New runs use ${provider === "openai" ? `OpenAI (${openaiModel})` : `Claude (${claudeModel})`}.` };
}
