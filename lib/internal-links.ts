import path from "node:path";
import { readJson, runFolder } from "@/lib/files";
import { ensureRunFiles } from "@/lib/run-files";
import type { QuickReport } from "@/lib/engine/quick";

export interface InternalLinkSuggestion {
  fromUrl: string;
  toUrl: string;
  anchor: string;
  reason: string;
}

const STOP = new Set([
  "the", "and", "for", "with", "that", "this", "from", "your", "have", "more", "about", "what",
  "into", "how", "why", "best", "guide", "home", "page", "free", "online", "tool", "tools",
]);

function pathOf(u: string) {
  try { return new URL(u).pathname || "/"; } catch { return u; }
}

function tokensOf(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/[\s-]+/)
      .filter((w) => w.length >= 3 && !STOP.has(w)),
  );
}

/**
 * Zero-AI-cost internal linking opportunity analyzer.
 * Uses the latest completed site audit's crawled pages + tracked keywords to suggest
 * high-value contextual internal links that can be shipped via Auto-Fix (GitHub PR / CMS).
 */
export async function analyzeInternalLinks(
  latestQuickRunId: string | null,
  trackedKeywords: string[],
): Promise<{ pagesAnalyzed: number; suggestions: InternalLinkSuggestion[]; instructions: string }> {
  if (!latestQuickRunId) return { pagesAnalyzed: 0, suggestions: [], instructions: "" };
  await ensureRunFiles(latestQuickRunId, { onlyPath: "quick-report.json" });
  const report = readJson<QuickReport>(path.join(runFolder(latestQuickRunId), "quick-report.json"));
  if (!report?.pages?.length) return { pagesAnalyzed: 0, suggestions: [], instructions: "" };

  const okPages = report.pages.filter((p) => p.status && p.status >= 200 && p.status < 300 && p.url);
  if (okPages.length < 2) return { pagesAnalyzed: okPages.length, suggestions: [], instructions: "" };

  // Prioritize deep/commercial pages (non-root) as link targets, and content-rich pages as sources.
  const enriched = okPages.map((p) => {
    const pathname = pathOf(p.url);
    const title = (p.title || pathname).trim();
    const toks = tokensOf(`${title} ${pathname.replace(/\//g, " ")}`);
    const isContent = /\/(blog|guide|docs|learn|resources|tutorials)\b/i.test(pathname) || (p.word_count ?? 0) >= 600;
    const isCommercial = /\/(features|pricing|solutions|integrations|compare|product|services)\b/i.test(pathname);
    return { ...p, pathname, title, toks, isContent, isCommercial };
  });

  const kwSet = new Set(trackedKeywords.map((k) => k.toLowerCase().trim()).filter(Boolean));
  const suggestions: InternalLinkSuggestion[] = [];
  const seenPairs = new Set<string>();

  for (const target of enriched) {
    if (target.pathname === "/") continue;
    // Choose anchor: matching tracked keyword or clean title phrase
    let anchor = target.title.split(/[|–—:]/)[0].trim().slice(0, 60);
    for (const kw of kwSet) {
      const kwToks = tokensOf(kw);
      let overlap = 0;
      for (const t of kwToks) if (target.toks.has(t)) overlap++;
      if (overlap >= Math.max(1, Math.ceil(kwToks.size * 0.6))) {
        anchor = kw;
        break;
      }
    }

    // Find best source pages with topic overlap or strong content depth
    const candidates = enriched
      .filter((src) => src.url !== target.url)
      .map((src) => {
        let overlap = 0;
        for (const t of target.toks) if (src.toks.has(t)) overlap++;
        const score = overlap * 3 + (src.isContent ? 2 : 0) + (target.isCommercial ? 2 : 0);
        return { src, overlap, score };
      })
      .sort((a, b) => b.score - a.score);

    const best = candidates[0];
    if (!best || best.score <= 0) continue;
    const pairKey = `${best.src.pathname}->${target.pathname}`;
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);

    suggestions.push({
      fromUrl: best.src.pathname,
      toUrl: target.pathname,
      anchor: anchor || target.pathname,
      reason: target.isCommercial
        ? `Boost commercial page (${target.pathname}) from ${best.src.isContent ? "content" : "related"} page`
        : `Contextual topic overlap (${best.overlap} shared terms)`,
    });
    if (suggestions.length >= 10) break;
  }

  const instructions = suggestions.length
    ? [
        "AUTO INTERNAL LINKING TASK: Add contextual internal links inside the existing body copy (never spam footers or navs; max 1-2 natural links per source page):",
        ...suggestions.map((s, i) => `${i + 1}. On ${s.fromUrl} -> link to ${s.toUrl} using descriptive anchor text "${s.anchor}" (${s.reason}).`),
      ].join("\n")
    : "";

  return { pagesAnalyzed: okPages.length, suggestions, instructions };
}
