import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { config } from "@/lib/config";
import { db, schema } from "@/lib/db";
import { getPlan, PLANS, PAID_PLANS, type Cycle, type PlanCode } from "@/lib/plans";
import { paddleSettings, saveIntegrations } from "@/lib/integrations";
import { sendMail } from "@/lib/email";
import { planChangedEmail } from "@/lib/email/templates";

/**
 * Paddle Billing: overlay checkout, signed customData, verified idempotent webhooks, customer
 * portal, and one-click setup (products, prices, webhook destination) from Admin → Integrations.
 * Keys come from Admin → Integrations, falling back to PADDLE_* in .env.
 */

const API = (env: string) => (env === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com");

export const WEBHOOK_EVENTS = [
  "subscription.created", "subscription.activated", "subscription.updated", "subscription.canceled",
  "subscription.past_due", "subscription.paused", "subscription.resumed", "subscription.trialing",
];

export async function billingConfigured(): Promise<boolean> {
  const p = await paddleSettings();
  return !!(p.clientToken && p.webhookSecret && !p.webhookSecret.startsWith("ntfset_") && Object.values(p.prices).some(Boolean));
}

export async function priceIdFor(plan: PlanCode, cycle: Cycle): Promise<string> {
  return (await paddleSettings()).prices[`${plan}_${cycle}`] || "";
}

export async function planForPrice(priceId: string): Promise<{ plan: PlanCode; cycle: Cycle } | null> {
  for (const [key, id] of Object.entries((await paddleSettings()).prices)) {
    if (id && id === priceId) {
      const [plan, cycle] = key.split("_") as [PlanCode, Cycle];
      return { plan, cycle };
    }
  }
  return null;
}

const signingSecret = () => config.sessionSecret || "dev-secret";

/** customData sent with checkout; the signature stops a checkout being attached to another account. */
export function signedCustomData(userId: number) {
  const sig = crypto.createHmac("sha256", signingSecret()).update(`uid:${userId}`).digest("hex").slice(0, 32);
  return { user_id: String(userId), sig };
}

function verifyCustomData(cd: any): number | null {
  if (!cd?.user_id || !cd?.sig) return null;
  const expected = signedCustomData(Number(cd.user_id)).sig;
  const got = String(cd.sig);
  if (expected.length !== got.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(got))) return null;
  return Number(cd.user_id);
}

/** Paddle-Signature: "ts=1671552777;h1=<hex hmac of `${ts}:${body}`>". 5-minute replay window. */
export async function verifyWebhook(rawBody: string, header: string | null): Promise<boolean> {
  const secret = (await paddleSettings()).webhookSecret;
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(";").map((p) => p.split("=") as [string, string]));
  const ts = Number(parts.ts);
  if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex");
  const got = String(parts.h1 ?? "");
  return got.length === expected.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

/** Idempotent, order-tolerant handling of subscription.* events. */
export async function handleWebhook(rawBody: string): Promise<void> {
  const ev = JSON.parse(rawBody);
  const id = String(ev.event_id ?? "");
  if (!id) return;
  const [seen] = await db().select().from(schema.billingEvents).where(eq(schema.billingEvents.id, id)).limit(1);
  if (seen?.processedAt) return;
  if (!seen) {
    await db().insert(schema.billingEvents).values({ id, eventType: String(ev.event_type ?? ""), occurredAt: ev.occurred_at ? new Date(ev.occurred_at) : null, payload: rawBody, createdAt: new Date() });
  }
  let error: string | null = null;
  try {
    if (String(ev.event_type).startsWith("subscription.")) await applySubscription(ev.data, ev.occurred_at ? new Date(ev.occurred_at) : new Date());
  } catch (e) {
    error = String((e as Error).message ?? e).slice(0, 1000);
  }
  await db().update(schema.billingEvents).set({ processedAt: error ? null : new Date(), error }).where(eq(schema.billingEvents.id, id));
  if (error) throw new Error(error);
}

async function applySubscription(sub: any, occurredAt: Date) {
  let userId = verifyCustomData(sub.custom_data);
  if (!userId && sub.id) {
    const [u] = await db().select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.paddleSubscriptionId, sub.id)).limit(1);
    userId = u?.id ?? null;
  }
  if (!userId) throw new Error(`No user for subscription ${sub.id}`);
  const [user] = await db().select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) throw new Error(`User ${userId} not found`);
  if (user.paddleSubscriptionId === sub.id && user.updatedAt > new Date(occurredAt.getTime() + 60_000) && sub.status === user.planStatus) return;

  const priceId = sub.items?.[0]?.price?.id ?? sub.items?.[0]?.price_id ?? "";
  const mapped = await planForPrice(priceId);
  const status: string = sub.status ?? "active";
  const renews = sub.current_billing_period?.ends_at ?? sub.next_billed_at ?? sub.scheduled_change?.effective_at ?? null;
  const plan = status === "canceled" && !renews ? "free" : mapped?.plan ?? user.plan;
  await db().update(schema.users).set({
    plan, billingCycle: mapped?.cycle ?? user.billingCycle, planStatus: status, planRenewsAt: renews ? new Date(renews) : null,
    paddleSubscriptionId: sub.id ?? user.paddleSubscriptionId, paddleCustomerId: sub.customer_id ?? user.paddleCustomerId,
  }).where(eq(schema.users.id, userId));
  if (plan !== user.plan || status !== user.planStatus) {
    const mail = planChangedEmail(getPlan(plan).name, status);
    await sendMail({ to: user.email, userId, kind: "plan_changed", ...mail });
  }
}

/** One-time link to Paddle's customer portal (update card, cancel, invoices). */
export async function portalUrl(customerId: string, subscriptionId?: string | null): Promise<string | null> {
  const p = await paddleSettings();
  if (!p.apiKey || !customerId) return null;
  const res = await fetch(`${API(p.env)}/customers/${encodeURIComponent(customerId)}/portal-sessions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${p.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(subscriptionId ? { subscription_ids: [subscriptionId] } : {}),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data?.urls?.general?.overview ?? null;
}

// ------------------------------------------------------------------ admin: test + one-click setup
async function paddleApi(env: string, apiKey: string, path: string, init: RequestInit = {}) {
  const res = await fetch(API(env) + path, {
    ...init,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(30_000),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const base = `Paddle ${res.status}: ${data?.error?.detail ?? data?.error?.code ?? "request failed"}`;
    if (res.status === 403) throw new Error(`${base} This API key is missing a permission: ${permissionFor(path, init.method)}. In Paddle → Developer tools → Authentication, edit the key (or create a new one) and allow it.`);
    if (res.status === 401) throw new Error(`${base} The API key is wrong, revoked, or from the other environment (sandbox keys contain _sdbx_).`);
    throw new Error(base);
  }
  return data;
}

function permissionFor(path: string, method = "GET"): string {
  const w = method !== "GET" ? "write" : "read";
  if (path.startsWith("/products")) return `Products (${w})`;
  if (path.startsWith("/prices")) return `Prices (${w})`;
  if (path.startsWith("/notification-settings")) return `Notification settings (${w})`;
  if (path.includes("portal-sessions")) return "Customer portal sessions (write)";
  return "the one this request needs";
}

/** Required permissions, shown in Admin → Integrations. */
export const PADDLE_PERMISSIONS = ["Products: read & write", "Prices: read & write", "Notification settings: read & write", "Customers: read", "Subscriptions: read", "Customer portal sessions: write"];

/** Turn a notification destination ID (ntfset_…) into its signing secret and save both. */
export async function webhookSecretFromId(id: string): Promise<void> {
  const p = await paddleSettings();
  if (!p.apiKey) throw new Error("Add the Paddle API key first.");
  const d = await paddleApi(p.env, p.apiKey, `/notification-settings/${encodeURIComponent(id)}`);
  const secret = d?.data?.endpoint_secret_key;
  if (!secret) throw new Error("Paddle did not return a secret for that notification destination.");
  await saveIntegrations({ paddle: { webhookId: id, webhookSecret: secret } });
}

export async function testPaddle(): Promise<{ ok: boolean; message: string }> {
  const p = await paddleSettings();
  if (!p.apiKey) return { ok: false, message: "Add the Paddle API key first." };
  try {
    if (p.webhookId && (!p.webhookSecret || p.webhookSecret.startsWith("ntfset_"))) await webhookSecretFromId(p.webhookId);
    const d = await paddleApi(p.env, p.apiKey, "/products?per_page=1&status=active");
    const missing = [!p.clientToken && "client-side token", !p.webhookSecret && "webhook", !Object.values(p.prices).some(Boolean) && "prices"].filter(Boolean);
    return { ok: true, message: `Connected to Paddle ${p.env}. ${d?.meta?.pagination?.estimated_total ?? 0} active products.${missing.length ? ` Still needed: ${missing.join(", ")}.` : " Ready to take payments."}` };
  } catch (e) {
    return { ok: false, message: String((e as Error).message) };
  }
}

/** Create any missing products and monthly/yearly prices for the paid plans, then save their IDs. */
export async function createPaddleCatalog(): Promise<string> {
  const p = await paddleSettings();
  if (!p.apiKey) throw new Error("Add the Paddle API key first.");
  const products = { ...p.products };
  const prices = { ...p.prices };
  const made: string[] = [];
  for (const code of PAID_PLANS) {
    const plan = PLANS[code];
    if (products[code]) {
      // Verify the saved product ID actually exists in the current Paddle env (sandbox vs production).
      try { await paddleApi(p.env, p.apiKey, `/products/${encodeURIComponent(products[code])}`); }
      catch { delete products[code]; }
    }
    if (!products[code]) {
      const d = await paddleApi(p.env, p.apiKey, "/products", {
        method: "POST",
        body: JSON.stringify({ name: `SEOKaroAI ${plan.name}`, tax_category: "standard", description: plan.tagline, custom_data: { plan: code } }),
      });
      products[code] = d.data.id;
      made.push(`${plan.name} product`);
    }
    for (const cycle of ["monthly", "yearly"] as const) {
      const key = `${code}_${cycle}`;
      if (prices[key]) {
        try { await paddleApi(p.env, p.apiKey, `/prices/${encodeURIComponent(prices[key])}`); continue; }
        catch { delete prices[key]; }
      }
      const amount = cycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
      const d = await paddleApi(p.env, p.apiKey, "/prices", {
        method: "POST",
        body: JSON.stringify({
          product_id: products[code], name: `${plan.name} ${cycle}`, description: `SEOKaroAI ${plan.name}, billed ${cycle}`,
          unit_price: { amount: String(amount * 100), currency_code: "USD" },
          billing_cycle: { interval: cycle === "monthly" ? "month" : "year", frequency: 1 },
          custom_data: { plan: code, cycle },
        }),
      });
      prices[key] = d.data.id;
      made.push(`${plan.name} ${cycle} price`);
    }
  }
  await saveIntegrations({ paddle: { products, prices } });
  return made.length ? `Created ${made.join(", ")}.` : "All plans and prices already exist in Paddle.";
}

/** Create (or recreate) the webhook destination pointing at this app and store its secret. */
export async function createPaddleWebhook(): Promise<string> {
  const p = await paddleSettings();
  if (!p.apiKey) throw new Error("Add the Paddle API key first.");
  const url = `${config.appUrl}/api/webhooks/paddle`;
  if (!/^https:\/\//.test(url) || /localhost|127\.0\.0\.1/.test(url)) {
    throw new Error(`Paddle needs a public https address. APP_URL is ${config.appUrl}; set it to https://seokaroai.com on the live server, then try again.`);
  }
  const d = await paddleApi(p.env, p.apiKey, "/notification-settings", {
    method: "POST",
    body: JSON.stringify({ description: "SEOKaroAI subscriptions", destination: url, type: "url", subscribed_events: WEBHOOK_EVENTS, api_version: 1 }),
  });
  await saveIntegrations({ paddle: { webhookId: d.data.id, webhookSecret: d.data.endpoint_secret_key } });
  return `Webhook created for ${url}.`;
}
