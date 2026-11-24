import { eq } from "drizzle-orm";
import { db, parseJson, schema } from "@/lib/db";

export type Provider = "claude" | "openai";

export interface AiSettings {
  provider: Provider;
  claudeModel: string;
  openaiModel: string;
  /** Hybrid: this stronger model writes the strategy and reports after openaiModel collects data. Empty = one model. */
  openaiStrategyModel?: string;
  /** Optional USD-per-1M-token prices for the OpenAI model, overriding lib/ai/pricing.ts. */
  openaiPrice?: { input?: number; cachedInput?: number; output?: number } | null;
}

export const CLAUDE_MODELS = ["claude-sonnet-5-5", "claude-opus-5-5", "claude-haiku-5-5"];

export function defaults(): AiSettings {
  return {
    provider: process.env.AI_PROVIDER === "openai" ? "openai" : "claude",
    claudeModel: process.env.SEO_MODEL || "claude-sonnet-5-5",
    openaiModel: process.env.OPENAI_MODEL || "gpt-5-mini",
    openaiStrategyModel: process.env.OPENAI_STRATEGY_MODEL ?? "gpt-5",
  };
}

export async function providerReady(p: Provider): Promise<boolean> {
  const { anthropicKey, openaiKey } = await import("@/lib/integrations");
  return p === "claude" ? !!(await anthropicKey()) : !!(await openaiKey());
}

/** Platform AI settings (admin-editable, stored in app_kv), falling back to env defaults. */
export async function getAiSettings(): Promise<AiSettings> {
  try {
    const [row] = await db().select().from(schema.appKv).where(eq(schema.appKv.k, "ai")).limit(1);
    return { ...defaults(), ...parseJson<Partial<AiSettings>>(row?.v, {}) };
  } catch {
    return defaults();
  }
}

export async function saveAiSettings(s: AiSettings) {
  const v = JSON.stringify(s);
  await db().insert(schema.appKv).values({ k: "ai", v, updatedAt: new Date() }).onDuplicateKeyUpdate({ set: { v, updatedAt: new Date() } });
}
