import { dataforseoCreds } from "@/lib/integrations";

export interface SerpItem { position: number; url: string; domain: string; title: string }
export interface RankResult { position: number | null; url: string | null; top: SerpItem[]; costUsd: number | null; source: "dataforseo" }

/** True when DataForSEO credentials are set (Admin → Integrations or .env). */
export const rankTrackingAvailable = async () => !!(await dataforseoCreds());

const bare = (h: string) => h.toLowerCase().replace(/^www\./, "");

/**
 * Google organic position of `domain` for `keyword` in the top 100, via DataForSEO Live.
 * Throws when DataForSEO is not configured or the API fails (the caller records the error).
 */
export async function checkRank(keyword: string, domain: string, country: string, language: string): Promise<RankResult> {
  const creds = await dataforseoCreds();
  if (!creds) throw new Error("Rank tracking needs DataForSEO credentials (Admin → Integrations).");
  const auth = Buffer.from(`${creds.login}:${creds.password}`).toString("base64");
  const res = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/regular", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify([{ keyword, location_name: country, language_name: language, depth: 100 }]),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`DataForSEO HTTP ${res.status}`);
  const data = await res.json();
  const task = data?.tasks?.[0];
  if (!task || task.status_code !== 20000) throw new Error(`DataForSEO: ${task?.status_message ?? data?.status_message ?? "no result"}`);
  const items: any[] = task.result?.[0]?.items ?? [];
  const organic = items.filter((i) => i.type === "organic").map((i) => ({
    position: Number(i.rank_group), url: String(i.url ?? ""), domain: String(i.domain ?? ""), title: String(i.title ?? ""),
  }));
  const target = bare(domain);
  const hit = organic.find((i) => bare(i.domain) === target || bare(i.domain).endsWith(`.${target}`));
  return { position: hit?.position ?? null, url: hit?.url ?? null, top: organic.slice(0, 10), costUsd: typeof task.cost === "number" ? task.cost : null, source: "dataforseo" };
}

/** Live top 10 for Keyword Battle (null when DataForSEO is not configured or fails). */
export async function liveTop10(keyword: string, country: string, language: string) {
  if (!(await dataforseoCreds())) return null;
  try {
    const r = await checkRank(keyword, "invalid.invalid", country, language);
    return r.top.length ? { results: r.top, note: `Live Google organic results from DataForSEO (${country}, ${language}).` } : null;
  } catch {
    return null;
  }
}

/** Account check for Admin → Integrations: returns the balance in USD. */
export async function testDataforseo(login: string, password: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch("https://api.dataforseo.com/v3/appendix/user_data", {
      headers: { Authorization: `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}` }, signal: AbortSignal.timeout(20_000),
    });
    const d = await res.json().catch(() => null);
    if (!res.ok || d?.status_code !== 20000) return { ok: false, message: `DataForSEO: ${d?.status_message ?? `HTTP ${res.status}`}` };
    const bal = d?.tasks?.[0]?.result?.[0]?.money?.balance;
    return { ok: true, message: `Connected${typeof bal === "number" ? ` · balance $${bal.toFixed(2)}` : ""}.` };
  } catch (e) {
    return { ok: false, message: String((e as Error).message) };
  }
}
