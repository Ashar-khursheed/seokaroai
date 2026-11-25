import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";

/**
 * Third-party keys and settings, editable in Admin → Integrations. Stored encrypted (AES-256-GCM)
 * in app_kv under "integrations"; any field left empty falls back to the matching .env variable.
 * Cached for 15 seconds per process; saving clears the cache.
 */

export interface Integrations {
  paddle: {
    env: "sandbox" | "production";
    apiKey: string;
    clientToken: string;
    webhookSecret: string;
    webhookId: string;
    prices: Record<string, string>; // starter_monthly, starter_yearly, pro_..., agency_...
    products: Record<string, string>; // starter, pro, agency
  };
  dataforseo: { login: string; password: string };
  ai: { anthropicKey: string; openaiKey: string };
  smtp: { host: string; port: number; secure: boolean; user: string; pass: string; from: string };
  google: { apiKey: string };
}

const e = process.env;

function fromEnv(): Integrations {
  return {
    paddle: {
      env: e.PADDLE_ENV === "sandbox" ? "sandbox" : "production",
      apiKey: (e.PADDLE_API_KEY || "").trim(),
      clientToken: (e.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || e.PADDLE_CLIENT_TOKEN || "").trim(),
      webhookSecret: (e.PADDLE_WEBHOOK_SECRET || "").trim(),
      webhookId: "",
      prices: {
        starter_monthly: (e.PADDLE_PRICE_STARTER_MONTHLY || "").trim(), starter_yearly: (e.PADDLE_PRICE_STARTER_YEARLY || "").trim(),
        pro_monthly: (e.PADDLE_PRICE_PRO_MONTHLY || "").trim(), pro_yearly: (e.PADDLE_PRICE_PRO_YEARLY || "").trim(),
        agency_monthly: (e.PADDLE_PRICE_AGENCY_MONTHLY || "").trim(), agency_yearly: (e.PADDLE_PRICE_AGENCY_YEARLY || "").trim(),
      },
      products: {},
    },
    dataforseo: { login: e.DATAFORSEO_LOGIN || "", password: e.DATAFORSEO_PASSWORD || "" },
    ai: { anthropicKey: e.ANTHROPIC_API_KEY || "", openaiKey: e.OPENAI_API_KEY || "" },
    smtp: {
      host: e.SMTP_HOST || "", port: Number(e.SMTP_PORT || 587), secure: e.SMTP_SECURE === "1" || Number(e.SMTP_PORT) === 465,
      user: e.SMTP_USER || "", pass: e.SMTP_PASSWORD || "", from: e.MAIL_FROM || "SEOKaroAI <no-reply@seokaroai.com>",
    },
    google: { apiKey: e.GOOGLE_API_KEY || "" },
  };
}

type Stored = { [K in keyof Integrations]?: Partial<Integrations[K]> };

/** Non-empty stored values win over env values, section by section (prices/products merged per key). */
function merge(base: Integrations, s: Stored): Integrations {
  const out = structuredClone(base) as Integrations;
  for (const sec of Object.keys(s) as (keyof Integrations)[]) {
    const src = (s[sec] ?? {}) as Record<string, unknown>;
    const dst = out[sec] as unknown as Record<string, unknown>;
    for (const [k, v] of Object.entries(src)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        dst[k] = { ...(dst[k] as object), ...Object.fromEntries(Object.entries(v).filter(([, x]) => x !== "" && x != null)) };
      } else if (v !== "" && v != null) dst[k] = v;
    }
  }
  return out;
}

const g = globalThis as unknown as { __skInteg?: { at: number; v: Integrations; stored: Stored } };

async function readStored(): Promise<Stored> {
  try {
    const [row] = await db().select().from(schema.appKv).where(eq(schema.appKv.k, "integrations")).limit(1);
    return row ? (JSON.parse(decrypt(row.v)) as Stored) : {};
  } catch {
    return {};
  }
}

export async function integrations(): Promise<Integrations> {
  if (g.__skInteg && Date.now() - g.__skInteg.at < 15_000) return g.__skInteg.v;
  const stored = await readStored();
  const v = merge(fromEnv(), stored);
  g.__skInteg = { at: Date.now(), v, stored };
  return v;
}

/** Save a partial update. Empty strings mean "keep the current value"; use clearField to remove one. */
export async function saveIntegrations(patch: Stored, clear: { section: keyof Integrations; field: string }[] = []) {
  const stored = await readStored();
  for (const sec of Object.keys(patch) as (keyof Integrations)[]) {
    const cur = { ...((stored[sec] ?? {}) as Record<string, unknown>) };
    for (const [k, v] of Object.entries(patch[sec] ?? {})) {
      if (v && typeof v === "object" && !Array.isArray(v)) cur[k] = { ...((cur[k] as object) ?? {}), ...Object.fromEntries(Object.entries(v).filter(([, x]) => x !== "")) };
      else if (v !== "" && v != null) cur[k] = v;
    }
    (stored as Record<string, unknown>)[sec] = cur;
  }
  for (const c of clear) {
    const sec = (stored[c.section] ?? {}) as Record<string, unknown>;
    delete sec[c.field];
  }
  const v = encrypt(JSON.stringify(stored));
  await db().insert(schema.appKv).values({ k: "integrations", v, updatedAt: new Date() }).onDuplicateKeyUpdate({ set: { v, updatedAt: new Date() } });
  g.__skInteg = undefined;
}

/** Where a value comes from, for the admin UI. */
export async function sourceOf(section: keyof Integrations, field: string): Promise<"saved" | "env" | "none"> {
  await integrations();
  const stored = (g.__skInteg?.stored[section] ?? {}) as Record<string, unknown>;
  if (stored[field]) return "saved";
  const env = (fromEnv()[section] as unknown as Record<string, unknown>)[field];
  return env ? "env" : "none";
}

export const mask = (s: string) => (!s ? "" : s.length <= 10 ? "••••••" : `${s.slice(0, 6)}••••${s.slice(-4)}`);

// convenience readers
export async function paddleSettings() { return (await integrations()).paddle; }
export async function dataforseoCreds() { const d = (await integrations()).dataforseo; return d.login && d.password ? d : null; }
export async function anthropicKey() { return (await integrations()).ai.anthropicKey; }
export async function openaiKey() { return (await integrations()).ai.openaiKey; }
export async function googleApiKey() { return (await integrations()).google.apiKey; }
