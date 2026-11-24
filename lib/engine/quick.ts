import fs from "node:fs";
import path from "node:path";
import { config } from "@/lib/config";
import { runScript } from "./script";

/**
 * Quick site audit: the bundled deterministic scripts, no AI. Fast and cheap, used for the
 * free plan and for scheduled monitoring. A category whose script could not run is reported as
 * "not measured" and left out of the overall score, never guessed.
 */

export const SEVERITIES = ["Critical", "High", "Medium", "Low", "Info"] as const;
const SEV_WEIGHT: Record<string, number> = { Critical: 25, High: 12, Medium: 5, Low: 2, Info: 0 };
export const CATEGORY_WEIGHTS: Record<string, number> = { onpage: 0.35, performance: 0.2, security: 0.15, indexing: 0.15, ai_readiness: 0.15 };
export const CATEGORY_LABELS: Record<string, string> = {
  onpage: "On-page SEO", performance: "Performance", security: "Security & HTTPS", indexing: "Crawling & indexing", ai_readiness: "AI search readiness",
};

export interface Issue {
  category: string;
  id: string;
  severity: string;
  title: string;
  detail: string;
  evidence: string;
  urls?: string[];
  affected_pages?: number;
}
export interface Category { key: string; label: string; score: number | null; issues: Issue[]; facts: Record<string, unknown>; note?: string }
export interface PageRow { url: string; status: number | null; score: number | null; title?: string; word_count?: number | null; error?: string; findings: { id: string; severity: string; message: string; evidence: string }[] }
export interface QuickReport { url: string; score: number | null; generated_at: string; categories: Category[]; pages: PageRow[]; homepage?: Record<string, unknown> }

const UTILITY = /\/(cart|basket|checkout|wishlist|account|my-account|login|signin|sign-in|register|signup|sign-up|logout|track-order|compare|search)(\/|$)/i;
const SKIP_EXT = /\.(jpe?g|png|gif|webp|avif|svg|ico|pdf|zip|rar|gz|mp4|mp3|webm|mov|css|js|json|xml|txt|docx?|xlsx?|pptx?)$/i;

function scoreFrom(issues: { severity?: string }[]) {
  return Math.max(0, Math.min(100, 100 - issues.reduce((a, f) => a + (SEV_WEIGHT[f.severity ?? "Low"] ?? 2), 0)));
}

function titleFromId(id: string) {
  const t = (id || "").replace(/[-_:]+/g, " ").trim();
  return t ? t[0].toUpperCase() + t.slice(1) : "Issue";
}

function headline(message: string, id: string): [string, string] {
  const m = (message || "").trim();
  if (!m) return [titleFromId(id), ""];
  const match = m.match(/^(.+?[.!?])(\s+|$)([\s\S]*)$/);
  if (!match || match[1].length > 140) return m.length > 140 ? [m.slice(0, 137) + "...", m] : [m, ""];
  return [match[1].replace(/\.$/, ""), match[3].trim()];
}

// --------------------------------------------------------------- interpreters
export function interpretSecurity(d: any): Category {
  const issues: Issue[] = [];
  for (const f of d?.findings ?? []) {
    if (f.severity === "Info") continue;
    const [title, detail] = headline(f.message, f.id);
    issues.push({ category: "security", id: f.id ?? "transport", severity: f.severity ?? "Low", title, detail, evidence: String(f.evidence ?? "") });
  }
  const h = d?.headers ?? {};
  const present = [h.hsts?.present, h.csp?.present, h.x_content_type_options?.ok, h.framing?.ok, h.referrer_policy?.present].filter(Boolean).length;
  return {
    key: "security", label: CATEGORY_LABELS.security, score: scoreFrom(issues), issues,
    facts: { tls_days_until_expiry: d?.tls?.days_until_expiry, tls_protocol: d?.tls?.protocol, https_redirect: d?.redirects?.http_to_https?.redirects_to_https, security_headers_present: `${present}/5` },
  };
}

export function interpretIndexing(sitemap: any, agentic: any): Category {
  const issues: Issue[] = [];
  const facts: Record<string, unknown> = {};
  if (sitemap) {
    const found = sitemap.found ?? [];
    const totals = sitemap.expanded?.totals ?? {};
    facts.sitemaps_found = found.length;
    facts.sitemap_urls = totals.unique_urls;
    if (!found.length) {
      issues.push({ category: "indexing", id: "no-sitemap", severity: "High", title: "No XML sitemap found",
        detail: "No sitemap was declared in robots.txt or found at the common locations. A sitemap helps search engines discover every important page.",
        evidence: (sitemap.checked ?? []).slice(0, 4).map((c: any) => c.url).join(", ") });
    }
    if (totals.invalid_locs) issues.push({ category: "indexing", id: "sitemap-invalid-urls", severity: "Medium", title: "Sitemap contains invalid URLs", detail: "Some <loc> entries are not valid absolute URLs.", evidence: `${totals.invalid_locs} invalid entries` });
    const dupes = (totals.duplicates_within_files ?? 0) + (totals.duplicates_across_files ?? 0);
    if (dupes) issues.push({ category: "indexing", id: "sitemap-duplicates", severity: "Low", title: "Duplicate URLs in sitemaps", detail: "The same URL is listed more than once.", evidence: `${dupes} duplicate entries` });
    const known: Record<string, [string, string, string]> = {
      over_50000_urls: ["High", "A sitemap file lists more than 50,000 URLs", "Search engines ignore URLs past the 50,000 limit. Split the file."],
      over_50mib_uncompressed: ["High", "A sitemap file is larger than 50 MB", "Search engines stop reading past 50 MB uncompressed. Split the file."],
      nested_sitemap_index: ["Medium", "A sitemap index points to another sitemap index", "Google does not follow nested sitemap indexes."],
    };
    const seen = new Set<string>();
    for (const f of sitemap.expanded?.files ?? []) {
      for (const code of f.findings ?? []) {
        if (seen.has(code)) continue;
        seen.add(code);
        const [sev, title, detail] = known[code] ?? ["Low", `Sitemap problem: ${String(code).replace(/_/g, " ")}`, ""];
        issues.push({ category: "indexing", id: `sitemap-${code}`, severity: sev, title, detail, evidence: f.url ?? "" });
      }
    }
  }
  if (agentic) {
    const status = agentic.data?.robots?.status;
    facts.robots_status = status;
    if (status === 404) issues.push({ category: "indexing", id: "no-robots-txt", severity: "Medium", title: "No robots.txt file", detail: "Crawlers then allow everything and cannot find your sitemap from it.", evidence: "HTTP 404" });
    else if (status >= 500) issues.push({ category: "indexing", id: "robots-server-error", severity: "Critical", title: "robots.txt returns a server error", detail: "Google treats a 5xx robots.txt as 'do not crawl' for the whole site.", evidence: `HTTP ${status}` });
  }
  return { key: "indexing", label: CATEGORY_LABELS.indexing, score: sitemap ? scoreFrom(issues) : null, issues, facts, note: sitemap ? undefined : "Sitemap check could not run" };
}

const AGENTIC_SEV: Record<string, string> = { "fail:P0": "High", "fail:P1": "Medium", "fail:P2": "Low", "fail:P3": "Low", "warn:P0": "Medium", "warn:P1": "Low", "warn:P2": "Low", "warn:P3": "Low" };

export function interpretAi(d: any): Category {
  const issues: Issue[] = [];
  let passed = 0;
  for (const c of d?.checks ?? []) {
    if (c.status === "pass") passed++;
    const sev = AGENTIC_SEV[`${c.status}:${c.priority}`];
    const id = String(c.id ?? "");
    if (!sev || id === "robots-reachable" || /^(well-known:|ard-catalog|webmcp)/.test(id)) continue;
    issues.push({ category: "ai_readiness", id, severity: sev, title: `Needs work: ${c.title ?? titleFromId(id)}`, detail: c.fix ?? "", evidence: String(c.evidence ?? "").slice(0, 400) });
  }
  return { key: "ai_readiness", label: CATEGORY_LABELS.ai_readiness, score: scoreFrom(issues), issues, facts: { agent_checks_passed: passed, llms_txt_status: d?.data?.llms?.status } };
}

export function interpretPerformance(d: any, hasKey = true): Category {
  const psi = d?.psi?.mobile ?? {};
  const perf = psi.lighthouse_scores?.performance;
  if (perf == null) return { key: "performance", label: CATEGORY_LABELS.performance, score: null, issues: [], facts: {}, note: hasKey ? String(psi.error ?? d?.error ?? "No Lighthouse data") : "Not measured (no Google API key configured)" };
  const lab = psi.lab_metrics ?? {};
  const v = (k: string) => (lab[k]?.value != null ? Math.round(Number(lab[k].value) * 1000) / 1000 : null);
  const lcp = v("largest-contentful-paint"), cls = v("cumulative-layout-shift"), tbt = v("total-blocking-time");
  const issues: Issue[] = [];
  if (lcp != null && lcp > 2500) issues.push({ category: "performance", id: "slow-lcp", severity: lcp > 4000 ? "High" : "Medium", title: "Largest Contentful Paint is slow", detail: "Google's 'good' threshold for LCP is 2.5 seconds on mobile.", evidence: `${(lcp / 1000).toFixed(1)} s (lab, mobile)` });
  if (cls != null && cls > 0.1) issues.push({ category: "performance", id: "layout-shift", severity: cls > 0.25 ? "High" : "Medium", title: "Layout shifts while loading", detail: "Google's 'good' threshold for CLS is 0.1.", evidence: `CLS ${cls.toFixed(2)}` });
  if (tbt != null && tbt > 200) issues.push({ category: "performance", id: "blocking-time", severity: tbt > 600 ? "High" : "Medium", title: "Main thread is blocked by scripts", detail: "Total Blocking Time above 200 ms usually means slow interaction (INP).", evidence: `${Math.round(tbt)} ms (lab, mobile)` });
  return { key: "performance", label: CATEGORY_LABELS.performance, score: Math.round(perf), issues, facts: { performance_score: perf, seo_score: psi.lighthouse_scores?.seo, lcp_ms: lcp, cls, tbt_ms: tbt } };
}

export function interpretPages(results: { url: string; data: any; error?: string }[]): { cat: Category; rows: PageRow[] } {
  const rows: PageRow[] = [];
  const grouped = new Map<string, Issue>();
  const scores: number[] = [];
  const words: number[] = [];
  let missingAlt = 0;
  for (const r of results) {
    const d = r.data;
    if (!d) {
      rows.push({ url: r.url, status: null, score: null, error: r.error ?? "Not checked", findings: [] });
      continue;
    }
    const findings = (d.findings ?? []).filter((f: any) => f.severity !== "Info");
    const score = scoreFrom(findings);
    scores.push(score);
    const facts = d.facts ?? {};
    if (typeof facts.word_count === "number") words.push(facts.word_count);
    missingAlt += Number(facts.images?.missing_alt ?? 0);
    const url = d.url ?? r.url;
    rows.push({ url, status: d.status_code ?? null, score, title: facts.title ?? "", word_count: facts.word_count ?? null,
      findings: findings.map((f: any) => ({ id: f.id, severity: f.severity, message: f.message ?? "", evidence: String(f.evidence ?? "") })) });
    for (const f of findings) {
      const id = f.id ?? "page-issue";
      let g = grouped.get(id);
      if (!g) {
        const [title, detail] = headline(f.message, id);
        g = { category: "onpage", id, severity: f.severity ?? "Low", title, detail, evidence: String(f.evidence ?? ""), urls: [] };
        grouped.set(id, g);
      }
      if (SEVERITIES.indexOf(f.severity) < SEVERITIES.indexOf(g.severity as never)) g.severity = f.severity;
      g.urls!.push(url);
    }
  }
  const issues = [...grouped.values()].sort((a, b) => SEVERITIES.indexOf(a.severity as never) - SEVERITIES.indexOf(b.severity as never) || b.urls!.length - a.urls!.length);
  for (const g of issues) { g.affected_pages = g.urls!.length; g.urls = g.urls!.slice(0, 50); }
  const withId = (id: string) => grouped.get(id)?.urls?.length ?? 0;
  return {
    rows,
    cat: {
      key: "onpage", label: CATEGORY_LABELS.onpage, issues,
      score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      facts: {
        pages_checked: scores.length, avg_word_count: words.length ? Math.round(words.reduce((a, b) => a + b, 0) / words.length) : null,
        images_missing_alt: missingAlt, pages_missing_title: withId("missing-title"), pages_missing_meta_description: withId("missing-meta-description"),
        pages_missing_h1: withId("missing-h1"), pages_thin_content: withId("thin-content"),
      },
    },
  };
}

export function combine(cats: Category[]): number | null {
  let acc = 0, w = 0;
  for (const c of cats) {
    if (c.score == null) continue;
    const weight = CATEGORY_WEIGHTS[c.key] ?? 0;
    acc += c.score * weight;
    w += weight;
  }
  return w ? Math.round(acc / w) : null;
}

// --------------------------------------------------------------- page discovery
function sameSite(a: string, b: string) {
  return a.toLowerCase().replace(/^www\./, "") === b.toLowerCase().replace(/^www\./, "");
}

function linksFromHtml(html: string, base: string): string[] {
  const out: string[] = [];
  const re = /<a\b[^>]*?\bhref\s*=\s*["']([^"'#][^"']*)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < 400) {
    try {
      const u = new URL(m[1].trim(), base);
      u.hash = "";
      out.push(u.toString());
    } catch { /* ignore */ }
  }
  return out;
}

export function pickPages(home: string, candidates: string[], limit: number): string[] {
  const homeHost = new URL(home).hostname;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of [home, ...candidates]) {
    let u: URL;
    try { u = new URL(c); } catch { continue; }
    if (!/^https?:$/.test(u.protocol) || !sameSite(u.hostname, homeHost)) continue;
    if (u.search || SKIP_EXT.test(u.pathname) || UTILITY.test(u.pathname)) continue;
    const key = u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(u.toString());
    if (out.length >= limit) break;
  }
  return out;
}

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

// --------------------------------------------------------------- orchestration
export async function runQuickAudit(url: string, dir: string, maxPages: number, progress: (msg: string) => void): Promise<QuickReport> {
  const raw = path.join(dir, "raw");
  fs.mkdirSync(raw, { recursive: true });
  const save = (name: string, data: unknown) => { if (data != null) fs.writeFileSync(path.join(raw, name), JSON.stringify(data, null, 2)); };

  const gkey = await (await import("@/lib/integrations")).googleApiKey();
  progress("Checking HTTPS, certificate, security headers, sitemaps, robots.txt and AI readiness");
  const homeFile = path.join(dir, "homepage.html");
  const [transport, sitemap, agentic, , psi] = await Promise.all([
    runScript("transport_check.py", [url, "--json"], 90),
    runScript("sitemap_discovery.py", [url, "--json", "--expand", "--max-children", "8", "--sample", "15"], 180),
    runScript("agentic_check.py", [url, "--json"], 120),
    runScript("fetch_page.py", [url, "-o", homeFile], 90),
    gkey ? runScript("pagespeed_check.py", [url, "--strategy", "mobile", "--psi-only", "--json", "--api-key", gkey], 180) : Promise.resolve(null),
  ]);
  save("transport.json", transport.json); save("sitemap.json", sitemap.json); save("agentic.json", agentic.json); save("pagespeed.json", psi?.json);

  // pages: sitemap samples (interleaved by file) + homepage links
  const lists: string[][] = (sitemap.json?.expanded?.files ?? []).map((f: any) => [...(f.sample_urls ?? [])]);
  const samples: string[] = [];
  while (lists.some((l) => l.length)) for (const l of lists) if (l.length) samples.push(l.shift()!);
  let homeLinks: string[] = [];
  try { homeLinks = linksFromHtml(fs.readFileSync(homeFile, "utf8").slice(0, 3_000_000), url); } catch { /* homepage fetch failed */ }
  const pages = pickPages(url, [...samples, ...homeLinks], maxPages);

  progress(`Running 47 on-page checks on ${pages.length} pages`);
  let done = 0;
  const results = await pool(pages, 4, async (p) => {
    const r = await runScript("page_checks.py", ["--url", p, "--json"], 90);
    done++;
    if (done % 5 === 0 || done === pages.length) progress(`Checked ${done}/${pages.length} pages`);
    return { url: p, data: r.json, error: r.json ? undefined : (r.timedOut ? "Timed out" : r.stderr.split("\n").filter(Boolean).pop()?.slice(0, 200) ?? "Failed") };
  });
  save("pages.json", results);

  const { cat: onpage, rows } = interpretPages(results);
  const cats: Category[] = [
    onpage,
    psi ? interpretPerformance(psi.json, true) : interpretPerformance(null, !!gkey),
    transport.json ? interpretSecurity(transport.json) : { key: "security", label: CATEGORY_LABELS.security, score: null, issues: [], facts: {}, note: "Security check could not run" },
    interpretIndexing(sitemap.json, agentic.json),
    agentic.json ? interpretAi(agentic.json) : { key: "ai_readiness", label: CATEGORY_LABELS.ai_readiness, score: null, issues: [], facts: {}, note: "AI readiness check could not run" },
  ];
  const report: QuickReport = { url, score: combine(cats), generated_at: new Date().toISOString(), categories: cats, pages: rows };
  fs.writeFileSync(path.join(dir, "quick-report.json"), JSON.stringify(report, null, 2));
  return report;
}

/** Compact summary stored on the run row for dashboards and emails. */
export function summarizeQuick(r: QuickReport) {
  const all = r.categories.flatMap((c) => c.issues);
  const sorted = all.sort((a, b) => SEVERITIES.indexOf(a.severity as never) - SEVERITIES.indexOf(b.severity as never));
  const counts: Record<string, number> = {};
  for (const i of all) counts[i.severity] = (counts[i.severity] ?? 0) + 1;
  return {
    score: r.score,
    categories: r.categories.map((c) => ({ key: c.key, label: c.label, score: c.score })),
    top_issues: sorted.slice(0, 6).map((i) => ({ severity: i.severity, title: i.title })),
    counts,
    pages: r.pages.length,
  };
}
