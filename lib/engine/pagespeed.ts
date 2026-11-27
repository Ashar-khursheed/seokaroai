import fs from "node:fs";
import path from "node:path";

export interface PsiStrategySummary {
  performance: number | null;
  seo: number | null;
  accessibility: number | null;
  best_practices: number | null;
  lcp_ms: number | null;
  fcp_ms: number | null;
  tbt_ms: number | null;
  cls: number | null;
  inp_ms: number | null;
  error?: string;
}

export interface PageSpeedSummary {
  url: string;
  fetched_at: string;
  mobile: PsiStrategySummary;
  desktop: PsiStrategySummary;
}

async function fetchStrategy(url: string, strategy: "mobile" | "desktop", key: string): Promise<PsiStrategySummary> {
  try {
    const endpoint =
      `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed` +
      `?url=${encodeURIComponent(url)}&strategy=${strategy}` +
      `&category=performance&category=seo&category=accessibility&category=best-practices` +
      `&key=${encodeURIComponent(key)}`;
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(55_000) });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        performance: null, seo: null, accessibility: null, best_practices: null,
        lcp_ms: null, fcp_ms: null, tbt_ms: null, cls: null, inp_ms: null,
        error: `PSI ${strategy} HTTP ${res.status}: ${data?.error?.message ?? "failed"}`,
      };
    }
    const cats = data?.lighthouseResult?.categories ?? {};
    const audits = data?.lighthouseResult?.audits ?? {};
    const pct = (v: unknown) => (typeof v === "number" ? Math.round(v * 100) : null);
    const num = (k: string) => (typeof audits[k]?.numericValue === "number" ? Math.round(audits[k].numericValue) : null);
    const clsVal = typeof audits["cumulative-layout-shift"]?.numericValue === "number"
      ? Number(audits["cumulative-layout-shift"].numericValue.toFixed(3))
      : null;
    const inpVal = typeof data?.loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile === "number"
      ? data.loadingExperience.metrics.INTERACTION_TO_NEXT_PAINT.percentile
      : null;
    return {
      performance: pct(cats.performance?.score),
      seo: pct(cats.seo?.score),
      accessibility: pct(cats.accessibility?.score),
      best_practices: pct(cats["best-practices"]?.score),
      lcp_ms: num("largest-contentful-paint"),
      fcp_ms: num("first-contentful-paint"),
      tbt_ms: num("total-blocking-time"),
      cls: clsVal,
      inp_ms: inpVal,
    };
  } catch (e) {
    return {
      performance: null, seo: null, accessibility: null, best_practices: null,
      lcp_ms: null, fcp_ms: null, tbt_ms: null, cls: null, inp_ms: null,
      error: String((e as Error)?.message ?? e).slice(0, 200),
    };
  }
}

/**
 * Fetch real Google PageSpeed Insights (mobile + desktop) directly via Node fetch
 * and save pagespeed-summary.json inside the run folder so AI agents always have real CWV data.
 */
export async function prefetchPageSpeed(url: string, dir: string): Promise<PageSpeedSummary | null> {
  const key = (await (await import("@/lib/integrations")).googleApiKey()) || process.env.GOOGLE_API_KEY || "";
  if (!key) return null;
  const [mobile, desktop] = await Promise.all([
    fetchStrategy(url, "mobile", key),
    fetchStrategy(url, "desktop", key),
  ]);
  const summary: PageSpeedSummary = { url, fetched_at: new Date().toISOString(), mobile, desktop };
  try {
    fs.writeFileSync(path.join(dir, "pagespeed-summary.json"), JSON.stringify(summary, null, 2));
  } catch { /* ignore */ }
  return summary;
}
