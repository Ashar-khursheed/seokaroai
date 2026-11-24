"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { integrations, saveIntegrations, type Integrations } from "@/lib/integrations";
import { createPaddleCatalog, createPaddleWebhook, testPaddle, webhookSecretFromId } from "@/lib/billing/paddle";
import { testDataforseo } from "@/lib/engine/ranks";
import { testSmtp } from "@/lib/email";
import type { FormState } from "@/components/client";

const s = (fd: FormData, k: string, max = 300) => String(fd.get(k) ?? "").trim().slice(0, max);

async function log(adminId: number, action: string) {
  await db().insert(schema.adminLog).values({ adminId, action, target: "integrations", createdAt: new Date() });
}

const done = (message: string): FormState => {
  revalidatePath("/admin/integrations");
  revalidatePath("/admin");
  return { ok: true, message };
};
const fail = (e: unknown): FormState => ({ error: String((e as Error)?.message ?? e).slice(0, 400) });

export async function savePaddle(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const prices: Record<string, string> = {};
  for (const k of ["starter_monthly", "starter_yearly", "pro_monthly", "pro_yearly", "agency_monthly", "agency_yearly"]) {
    const v = s(fd, `price_${k}`, 60);
    if (v && !/^pri_[a-z0-9]{10,}$/i.test(v)) return { error: `“${v}” is not a Paddle price ID (they start with pri_).` };
    prices[k] = v;
  }
  const apiKey = s(fd, "apiKey", 200), clientToken = s(fd, "clientToken", 200);
  let webhookSecret = s(fd, "webhookSecret", 200);
  const webhookId = /^ntfset_[a-z0-9]+$/i.test(webhookSecret) ? webhookSecret : "";
  if (webhookId) webhookSecret = ""; // an ID, not the secret: looked up below
  if (clientToken && !/^(test|live)_/.test(clientToken)) return { error: "The client-side token starts with test_ (sandbox) or live_ (production)." };
  await saveIntegrations({ paddle: { env: fd.get("env") === "production" ? "production" : "sandbox", apiKey, clientToken, webhookSecret, prices } });
  await log(admin.id, "save_paddle");
  if (webhookId) {
    // an ID saved earlier in the secret field is not a signing secret: drop it
    if (/^ntfset_/.test((await integrations()).paddle.webhookSecret)) await saveIntegrations({}, [{ section: "paddle", field: "webhookSecret" }]);
    await saveIntegrations({ paddle: { webhookId } });
    try { await webhookSecretFromId(webhookId); }
    catch (e) { return { error: `Saved the keys, but could not read the webhook secret for ${webhookId}: ${(e as Error).message}` }; }
  }
  const t = await testPaddle();
  return t.ok ? done(`Saved. ${t.message}`) : { error: `Saved, but the test failed: ${t.message}` };
}

export async function paddleCatalog(_: FormState): Promise<FormState> {
  const admin = await requireAdmin();
  try {
    const msg = await createPaddleCatalog();
    await log(admin.id, "paddle_catalog");
    return done(msg);
  } catch (e) { return fail(e); }
}

export async function paddleWebhook(_: FormState): Promise<FormState> {
  const admin = await requireAdmin();
  try {
    const msg = await createPaddleWebhook();
    await log(admin.id, "paddle_webhook");
    return done(msg);
  } catch (e) { return fail(e); }
}

export async function paddleTest(_: FormState): Promise<FormState> {
  await requireAdmin();
  const t = await testPaddle();
  return t.ok ? done(t.message) : { error: t.message };
}

export async function saveDataforseo(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const login = s(fd, "login", 200), password = s(fd, "password", 200);
  await saveIntegrations({ dataforseo: { login, password } });
  await log(admin.id, "save_dataforseo");
  const d = (await integrations()).dataforseo;
  if (!d.login || !d.password) return done("Saved.");
  const t = await testDataforseo(d.login, d.password);
  return t.ok ? done(`Saved. ${t.message} Live Google results and rank tracking are on.`) : { error: `Saved, but the test failed: ${t.message}` };
}

export async function saveAiKeys(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const anthropicKey = s(fd, "anthropicKey", 300), openaiKey = s(fd, "openaiKey", 300);
  if (anthropicKey && !anthropicKey.startsWith("sk-ant-")) return { error: "Anthropic keys start with sk-ant-." };
  if (openaiKey && !openaiKey.startsWith("sk-")) return { error: "OpenAI keys start with sk-." };
  await saveIntegrations({ ai: { anthropicKey, openaiKey } });
  await log(admin.id, "save_ai_keys");
  return done("Saved. New runs use these keys.");
}

export async function saveSmtp(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const port = Number(s(fd, "port", 6)) || 587;
  await saveIntegrations({ smtp: { host: s(fd, "host", 200), port, secure: fd.get("secure") === "on" || port === 465, user: s(fd, "user", 200), pass: s(fd, "pass", 300), from: s(fd, "from", 200) } });
  await log(admin.id, "save_smtp");
  if (!(await integrations()).smtp.host) return done("Saved.");
  const t = await testSmtp();
  return t.ok ? done(`Saved. ${t.message}`) : { error: `Saved, but the test failed: ${t.message}` };
}

export async function saveGoogle(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  await saveIntegrations({ google: { apiKey: s(fd, "apiKey", 200) } });
  await log(admin.id, "save_google");
  return done("Saved. Site audits now include PageSpeed scores.");
}

/** Remove one saved value so the .env value (or nothing) applies again. */
export async function clearValue(target: string, _fd?: FormData) {
  const admin = await requireAdmin();
  const [section, field] = String(target).slice(0, 70).split(":") as [keyof Integrations, string];
  if (!["paddle", "dataforseo", "ai", "smtp", "google"].includes(section) || !/^[a-zA-Z]+$/.test(field)) return;
  await saveIntegrations({}, [{ section, field }]);
  await log(admin.id, `clear_${section}_${field}`);
  revalidatePath("/admin/integrations");
}
