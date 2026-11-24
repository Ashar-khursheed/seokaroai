/**
 * Token prices in USD per 1M tokens, used to meter OpenAI runs (Claude runs are metered by the
 * Agent SDK itself). These are defaults for budgeting only: check openai.com/api/pricing and set
 * exact numbers in Admin → Settings, which override this table.
 */
export interface Price { input: number; cachedInput: number; output: number }

export const OPENAI_PRICES: Record<string, Price> = {
  "gpt-5": { input: 1.25, cachedInput: 0.125, output: 10 },
  "gpt-5-mini": { input: 0.25, cachedInput: 0.025, output: 2 },
  "gpt-5-nano": { input: 0.05, cachedInput: 0.005, output: 0.4 },
};

export function priceFor(model: string, override?: Partial<Price> | null): Price {
  const base = OPENAI_PRICES[model] ?? Object.entries(OPENAI_PRICES).find(([k]) => model.startsWith(k))?.[1] ?? OPENAI_PRICES["gpt-5"];
  return { ...base, ...Object.fromEntries(Object.entries(override ?? {}).filter(([, v]) => typeof v === "number" && v > 0)) } as Price;
}

export interface Usage { input: number; cached: number; output: number }

export function costOf(u: Usage, p: Price): number {
  const fresh = Math.max(0, u.input - u.cached);
  return (fresh * p.input + u.cached * p.cachedInput + u.output * p.output) / 1_000_000;
}
