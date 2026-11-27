import { and, eq, like, or } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { OutreachItem, Project } from "@/lib/db/schema";
import { ensureAddonTables } from "@/lib/addons";
import { complete } from "@/lib/ai/complete";
import { serpSearch } from "@/lib/engine/ranks";

interface DiscoveredThread {
  platform: "reddit" | "quora";
  title: string;
  url: string;
  community: string;
  snippet: string;
}

const REAL_REDDIT_POST_RE = /reddit\.com\/r\/([^/?#]+)\/comments\/([a-z0-9]+)/i;
const BAD_QUORA_PATH_RE = /quora\.com\/(search|topic|profile|spaces|about|careers|terms|privacy)\b/i;

function extractSubreddit(url: string): string {
  const m = url.match(/reddit\.com\/r\/([^/?#]+)/i);
  return m ? `r/${m[1]}` : "Reddit";
}

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 1. Real Reddit posts via DataForSEO Google SERP (never IP-blocked on Hostinger). */
async function searchRedditViaSerp(query: string, country: string, language: string): Promise<DiscoveredThread[]> {
  const items = await serpSearch(`site:reddit.com/r/ "${query}"`, country, language, 20);
  let hits = items.filter((r) => REAL_REDDIT_POST_RE.test(r.url));
  if (hits.length < 3) {
    const broader = await serpSearch(`site:reddit.com/r/ ${query}`, country, language, 20);
    const seen = new Set(hits.map((h) => h.url));
    for (const r of broader) {
      if (REAL_REDDIT_POST_RE.test(r.url) && !seen.has(r.url)) {
        seen.add(r.url);
        hits.push(r);
      }
    }
  }
  return hits.slice(0, 8).map((r) => ({
    platform: "reddit" as const,
    title: String(r.title || r.url)
      .replace(/\s*:\s*r\/[a-z0-9_]+\s*$/i, "")
      .replace(/\s*-\s*Reddit$/i, "")
      .trim()
      .slice(0, 290),
    url: r.url.slice(0, 690),
    community: extractSubreddit(r.url),
    snippet: (r.description || `Google #${r.position} Reddit thread for “${query}”.`).slice(0, 500),
  }));
}

/** 2. Real Reddit posts via PullPush public Reddit submission index (works from datacenter IPs). */
async function searchRedditViaPullPush(query: string): Promise<DiscoveredThread[]> {
  try {
    const res = await fetch(
      `https://api.pullpush.io/reddit/search/submission/?q=${encodeURIComponent(query)}&size=10&sort=desc&sort_type=created_utc`,
      {
        headers: { "User-Agent": "SEOKaroAI/2.0 (+https://seokaroai.com)" },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    const rows = (data?.data ?? []) as any[];
    return rows
      .filter((d) => d && d.title && d.permalink && !d.over_18 && !d.removed_by_category)
      .slice(0, 8)
      .map((d) => {
        const body = String(d.selftext ?? "").replace(/\s+/g, " ").trim();
        const stats = [
          typeof d.score === "number" ? `${d.score} upvotes` : "",
          typeof d.num_comments === "number" ? `${d.num_comments} comments` : "",
        ].filter(Boolean).join(" · ");
        return {
          platform: "reddit" as const,
          title: String(d.title).slice(0, 290),
          url: `https://www.reddit.com${String(d.permalink)}`.slice(0, 690),
          community: d.subreddit ? `r/${d.subreddit}` : "Reddit",
          snippet: [stats ? `[${stats}]` : "", body.slice(0, 420)].filter(Boolean).join(" "),
        };
      });
  } catch {
    return [];
  }
}

/** 3. Real Reddit posts via Atom/RSS + JSON fallback. */
async function searchRedditDirect(query: string): Promise<DiscoveredThread[]> {
  try {
    const res = await fetch(
      `https://www.reddit.com/search.rss?q=${encodeURIComponent(query)}&sort=relevance&t=month&limit=10`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SEOKaroAI/2.0; +https://seokaroai.com)",
          Accept: "application/atom+xml, application/xml, text/xml",
        },
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (res.ok) {
      const xml = await res.text();
      const entries = xml.match(/<entry>[\s\S]*?<\/entry>/gi) ?? [];
      const out: DiscoveredThread[] = [];
      for (const entry of entries.slice(0, 8)) {
        const titleM = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const linkM = entry.match(/<link[^>]+href="([^"]+)"/i);
        const contentM = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/i);
        if (!titleM || !linkM) continue;
        const url = decodeXml(linkM[1]).slice(0, 690);
        if (!REAL_REDDIT_POST_RE.test(url)) continue;
        out.push({
          platform: "reddit",
          title: decodeXml(titleM[1]).slice(0, 290),
          url,
          community: extractSubreddit(url),
          snippet: contentM ? decodeXml(contentM[1]).slice(0, 420) : "",
        });
      }
      if (out.length) return out;
    }
  } catch { /* ignore */ }
  return [];
}

async function searchReddit(query: string, country: string, language: string): Promise<DiscoveredThread[]> {
  const [serp, pullpush] = await Promise.all([
    searchRedditViaSerp(query, country, language),
    searchRedditViaPullPush(query),
  ]);
  const combined: DiscoveredThread[] = [];
  const seen = new Set<string>();
  for (const item of [...serp, ...pullpush]) {
    if (!REAL_REDDIT_POST_RE.test(item.url) || seen.has(item.url)) continue;
    seen.add(item.url);
    combined.push(item);
  }
  if (combined.length) return combined.slice(0, 8);
  return searchRedditDirect(query);
}

/** Real Quora question threads via DataForSEO Google SERP — never fake search-page links. */
async function searchQuora(query: string, country: string, language: string): Promise<DiscoveredThread[]> {
  const items = await serpSearch(`site:quora.com ${query}`, country, language, 20);
  const hits = items.filter((r) => /quora\.com\/[^/?#]+/i.test(r.url) && !BAD_QUORA_PATH_RE.test(r.url));
  return hits.slice(0, 6).map((r) => ({
    platform: "quora" as const,
    title: String(r.title || r.url).replace(/\s*-\s*Quora$/i, "").trim().slice(0, 290),
    url: r.url.slice(0, 690),
    community: "Quora",
    snippet: (r.description || `Google #${r.position} Quora question for “${query}”.`).slice(0, 500),
  }));
}

/**
 * Find real Reddit posts & Quora questions for a keyword and save new ones to DB.
 * Never inserts fake search-page links.
 */
export async function discoverOutreach(
  project: Project,
  userId: number,
  topicOverride?: string,
  platformFilter: "all" | "reddit" | "quora" = "all",
) {
  await ensureAddonTables();

  // Clean up any legacy generic /search?q= placeholder rows for this user
  await db()
    .delete(schema.outreachItems)
    .where(
      and(
        eq(schema.outreachItems.userId, userId),
        or(
          like(schema.outreachItems.url, "%reddit.com/search/%"),
          like(schema.outreachItems.url, "%quora.com/search?%"),
        ),
      ),
    );

  let query = (topicOverride ?? "").trim();
  if (!query) {
    const kws = await db().select().from(schema.keywords).where(eq(schema.keywords.projectId, project.id)).limit(3);
    query = kws.length ? kws[0].keyword : "";
  }
  if (!query) {
    return { added: 0, alreadySaved: 0, query: "", needsKeyword: true };
  }

  const tasks: Promise<DiscoveredThread[]>[] = [];
  if (platformFilter === "all" || platformFilter === "reddit") {
    tasks.push(searchReddit(query, project.country, project.language));
  }
  if (platformFilter === "all" || platformFilter === "quora") {
    tasks.push(searchQuora(query, project.country, project.language));
  }

  const found = (await Promise.all(tasks)).flat();
  if (!found.length) return { added: 0, alreadySaved: 0, query, needsKeyword: false };

  const existing = await db()
    .select({ url: schema.outreachItems.url })
    .from(schema.outreachItems)
    .where(and(eq(schema.outreachItems.userId, userId), eq(schema.outreachItems.projectId, project.id)));
  const seen = new Set(existing.map((e) => e.url));

  const now = new Date();
  let added = 0;
  let alreadySaved = 0;
  for (const item of found) {
    if (seen.has(item.url)) {
      alreadySaved++;
      continue;
    }
    seen.add(item.url);
    await db().insert(schema.outreachItems).values({
      userId,
      projectId: project.id,
      platform: item.platform,
      title: item.title,
      url: item.url,
      community: item.community,
      snippet: item.snippet || null,
      status: "found",
      createdAt: now,
      updatedAt: now,
    });
    added++;
  }
  return { added, alreadySaved, query, needsKeyword: false };
}

/**
 * Generate a helpful, non-spammy, human-sounding reply draft tailored to the actual Reddit post or Quora question.
 */
export async function draftOutreachReply(item: OutreachItem, project: Project): Promise<string> {
  const isReddit = item.platform === "reddit";
  const system = isReddit
    ? `You write helpful, authentic Reddit comments replying directly to a specific Reddit post. Rules:
- Address the OP's exact question or pain point first with 2-4 concrete, practical tips.
- Sound like a real human peer on Reddit (concise, zero marketing hype, no "Check out our amazing tool!").
- Mention ${project.name} (${project.url}) naturally at most ONCE as one relevant option with transparent disclosure (e.g. "full disclosure, I built/work on ${project.name}").
- Keep it 90-160 words. Return plain text only.`
    : `You write clear, authoritative Quora answers replying directly to a specific Quora question. Rules:
- Start with a direct 1-2 sentence answer, then 3-4 concise bullet points with real value.
- Mention ${project.name} (${project.url}) naturally as a helpful resource where relevant (never salesy).
- Keep it 140-220 words. Return plain text only.`;

  const prompt = `Platform: ${item.platform} (${item.community})
Post/Question title: ${item.title}
Post URL: ${item.url}
Post context/snippet: ${item.snippet || "(no extra body text)"}
My website/brand: ${project.name} — ${project.url} (${project.domain})

Write a genuinely helpful reply directly answering this post so I can review, edit, and post it myself.`;

  const res = await complete({ system, prompt, maxTokens: 700 });
  const draft = res.text.trim();
  await db()
    .update(schema.outreachItems)
    .set({ draftReply: draft, status: item.status === "found" ? "drafted" : item.status, updatedAt: new Date() })
    .where(eq(schema.outreachItems.id, item.id));
  return draft;
}
