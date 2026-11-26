"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { rateLimit, requireUser } from "@/lib/auth";
import { hasAddon } from "@/lib/addons";
import { ownedProject } from "@/lib/queries";
import { discoverOutreach, draftOutreachReply } from "@/lib/outreach";
import type { FormState } from "@/components/client";

const s = (fd: FormData, k: string, max = 4000) => String(fd.get(k) ?? "").trim().slice(0, max);

export async function findOutreachOpportunities(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!(await hasAddon(user, "community_outreach"))) {
    return { error: "This feature requires the Reddit & Quora Outreach add-on ($29/mo). Activate it in Billing." };
  }
  const project = await ownedProject(user, Number(fd.get("projectId")));
  if (!project) return { error: "Choose a website first." };
  if (!rateLimit(`outreach-find:${user.id}`, 12, 600)) {
    return { error: "Please wait a few minutes before searching again." };
  }
  const topic = s(fd, "topic", 200);
  const platformRaw = s(fd, "platform", 20);
  const platform = platformRaw === "reddit" || platformRaw === "quora" ? platformRaw : "all";
  try {
    const r = await discoverOutreach(project, user.id, topic, platform);
    revalidatePath("/app/outreach");
    return r.added > 0
      ? { ok: true, message: `Found ${r.added} new discussion${r.added === 1 ? "" : "s"} for “${r.query}”.` }
      : { ok: true, message: `No brand-new threads found for “${r.query}” right now. Try another keyword.` };
  } catch (e) {
    return { error: String((e as Error)?.message ?? e).slice(0, 300) };
  }
}

export async function generateDraftAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!(await hasAddon(user, "community_outreach"))) {
    return { error: "Requires the Reddit & Quora Outreach add-on." };
  }
  if (!rateLimit(`outreach-draft:${user.id}`, 30, 600)) {
    return { error: "Too many draft requests. Wait a few minutes." };
  }
  const id = Number(fd.get("itemId"));
  const [item] = await db()
    .select()
    .from(schema.outreachItems)
    .where(and(eq(schema.outreachItems.id, id), eq(schema.outreachItems.userId, user.id)))
    .limit(1);
  if (!item) return { error: "Thread not found." };
  const project = await ownedProject(user, item.projectId);
  if (!project) return { error: "Website not found." };
  try {
    await draftOutreachReply(item, project);
    revalidatePath("/app/outreach");
    return { ok: true, message: "AI draft ready. Review, edit if needed, then copy & post." };
  } catch (e) {
    return { error: String((e as Error)?.message ?? e).slice(0, 300) };
  }
}

export async function saveOutreachDraft(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!(await hasAddon(user, "community_outreach"))) return { error: "Requires the Reddit & Quora Outreach add-on." };
  const id = Number(fd.get("itemId"));
  const draftReply = s(fd, "draftReply", 8000);
  await db()
    .update(schema.outreachItems)
    .set({ draftReply, status: draftReply ? "drafted" : "found", updatedAt: new Date() })
    .where(and(eq(schema.outreachItems.id, id), eq(schema.outreachItems.userId, user.id)));
  revalidatePath("/app/outreach");
  return { ok: true, message: "Draft saved." };
}

export async function updateOutreachStatus(fd: FormData) {
  const user = await requireUser();
  if (!(await hasAddon(user, "community_outreach"))) return;
  const id = Number(fd.get("itemId"));
  const status = s(fd, "status", 20);
  if (!["found", "drafted", "posted", "skipped"].includes(status)) return;
  await db()
    .update(schema.outreachItems)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(schema.outreachItems.id, id), eq(schema.outreachItems.userId, user.id)));
  revalidatePath("/app/outreach");
}

export async function deleteOutreachItem(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("itemId"));
  await db()
    .delete(schema.outreachItems)
    .where(and(eq(schema.outreachItems.id, id), eq(schema.outreachItems.userId, user.id)));
  revalidatePath("/app/outreach");
}
