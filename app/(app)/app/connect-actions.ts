"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { rateLimit, requireUser } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { normalizeUrl, publicUrlProblem } from "@/lib/url-safety";
import { ownedProject } from "@/lib/queries";
import { ownedConnector, testConnector } from "@/lib/connectors";
import { validShop } from "@/lib/connectors/shopify";
import { localFoldersAllowed } from "@/lib/connectors/folder";
import { runBlocked } from "@/lib/usage";
import { createRun } from "@/lib/runs";
import { applyChanges, revertChange } from "@/lib/fixes";
import type { FormState } from "@/components/client";

const s = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);

export async function saveConnector(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const p = await ownedProject(user, Number(fd.get("projectId")));
  if (!p) return { error: "Website not found." };
  if (!rateLimit(`conn:${user.id}`, 20, 600)) return { error: "Too many attempts. Wait a few minutes." };
  const kind = s(fd, "kind");
  let config: Record<string, string>;
  let secret = "";
  let name = "";
  if (kind === "wordpress") {
    const siteUrl = normalizeUrl(fd.get("siteUrl"));
    if (!siteUrl) return { error: "Enter your WordPress site URL." };
    const bad = await publicUrlProblem(siteUrl);
    if (bad) return { error: bad };
    config = { siteUrl: siteUrl.replace(/\/$/, ""), username: s(fd, "username", 120) };
    secret = s(fd, "secret", 200);
    if (!config.username || !secret) return { error: "Enter the WordPress username and an Application Password." };
    name = `WordPress · ${new URL(siteUrl).hostname}`;
  } else if (kind === "shopify") {
    const shop = s(fd, "shop", 120).toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!validShop(shop)) return { error: "Enter your store's myshopify.com domain, like your-store.myshopify.com" };
    config = { shop };
    secret = s(fd, "secret", 200);
    if (!secret) return { error: "Enter the Admin API access token." };
    name = `Shopify · ${shop}`;
  } else if (kind === "github") {
    const repo = s(fd, "repo", 200).replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/$/, "");
    const [owner, name2] = repo.split("/");
    if (!owner || !name2) return { error: "Enter the repository as owner/name, for example acme/website." };
    config = { owner, repo: name2, branch: s(fd, "branch", 120) };
    secret = s(fd, "secret", 300);
    if (!secret) return { error: "Enter a GitHub fine-grained token." };
    name = `GitHub · ${owner}/${name2}`;
  } else if (kind === "folder") {
    if (!localFoldersAllowed() || user.role !== "admin") return { error: "Server folders are only available to admins on self-hosted installs (ALLOW_LOCAL_FOLDERS=1)." };
    config = { path: s(fd, "path", 500) };
    name = `Folder · ${config.path}`;
  } else {
    return { error: "Choose a connector type." };
  }
  const finalName = name.slice(0, 120);
  const encrypted = secret ? encrypt(secret) : null;
  const [existing] = await db()
    .select()
    .from(schema.connectors)
    .where(and(eq(schema.connectors.projectId, p.id), eq(schema.connectors.kind, kind), eq(schema.connectors.name, finalName)))
    .limit(1);
  let id: number;
  if (existing) {
    id = existing.id;
    await db()
      .update(schema.connectors)
      .set({ config: JSON.stringify(config), secret: encrypted, status: "untested", lastError: null })
      .where(eq(schema.connectors.id, id));
  } else {
    const res = await db().insert(schema.connectors).values({
      userId: user.id, projectId: p.id, kind, name: finalName, config: JSON.stringify(config),
      secret: encrypted, createdAt: new Date(),
    });
    id = Number((res[0] as { insertId: number }).insertId);
  }
  const [c] = await db().select().from(schema.connectors).where(eq(schema.connectors.id, id)).limit(1);
  const t = await testConnector(c);
  revalidatePath(`/app/projects/${p.id}`);
  return t.ok ? { ok: true, message: `Connected. ${t.message}` } : { error: `Saved, but the connection test failed: ${t.message}` };
}

export async function retestConnector(fd: FormData) {
  const user = await requireUser();
  const c = await ownedConnector(user, Number(fd.get("connectorId")));
  if (c) await testConnector(c);
  revalidatePath(`/app/projects/${c?.projectId ?? ""}`);
}

export async function deleteConnector(fd: FormData) {
  const user = await requireUser();
  const c = await ownedConnector(user, Number(fd.get("connectorId")));
  if (c) await db().delete(schema.connectors).where(eq(schema.connectors.id, c.id));
  revalidatePath(`/app/projects/${c?.projectId ?? ""}`);
}

export async function startFix(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const p = await ownedProject(user, Number(fd.get("projectId")));
  if (!p) return { error: "Website not found." };
  const c = await ownedConnector(user, Number(fd.get("connectorId")));
  if (!c || c.projectId !== p.id) return { error: "Choose a connector for this website." };
  if (c.status !== "ok") return { error: "This connector's last test failed. Fix it and press Test again first." };
  const blocked = await runBlocked(user, "fix");
  if (blocked) return { error: blocked };
  if (!rateLimit(`fix:${user.id}`, 4, 600)) return { error: "Please wait a few minutes before starting another fix." };
  const id = await createRun({
    userId: user.id, projectId: p.id, kind: "fix", title: `${p.name} · auto-fix via ${c.name}`,
    input: { projectId: p.id, connectorId: c.id, sourceRunId: s(fd, "sourceRunId", 100) || null, instructions: s(fd, "instructions", 2000) },
  });
  redirect(`/app/runs/${encodeURIComponent(id)}`);
}

export async function applyFixChanges(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const runId = s(fd, "runId", 100);
  const ids = fd.getAll("change").map(Number).filter((n) => Number.isInteger(n));
  try {
    const r = await applyChanges(user, runId, ids);
    revalidatePath(`/app/runs/${runId}`);
    if (r.error) return { error: r.error };
    if (r.prUrl) return { ok: true, message: `Pull request opened: ${r.prUrl}` };
    return r.failed ? { error: `${r.applied} applied, ${r.failed} failed. See the errors on each row.` } : { ok: true, message: `${r.applied} change${r.applied === 1 ? "" : "s"} applied.` };
  } catch (e) {
    return { error: String((e as Error).message).slice(0, 400) };
  }
}

export async function undoFixChange(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const err = await revertChange(user, Number(fd.get("changeId")));
  revalidatePath(`/app/runs/${s(fd, "runId", 100)}`);
  return err ? { error: err } : { ok: true, message: "Change undone." };
}

/** Undo one applied change (used as a button formAction inside the review form). */
export async function undoFix(changeId: number, runId: string, _fd?: FormData) {
  const user = await requireUser();
  await revertChange(user, Number(changeId));
  revalidatePath(`/app/runs/${String(runId).slice(0, 100)}`);
}
