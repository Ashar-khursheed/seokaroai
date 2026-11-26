import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { OutreachItem, Project } from "@/lib/db/schema";
import { ensureAddonTables } from "@/lib/addons";
import { complete } from "@/lib/ai/complete";
import { liveTop10 } from "@/lib/engine/ranks";

interface DiscoveredThread {
  platform: "reddit" | "quora";
  title: string;
  url: string;
  community: string;
  snippet: string;
}

async function searchReddit(query: string): Promise<DiscoveredThread[]> {
  try {
    const res = await fetch(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=month&limit=10`,
      {
        headers: { "User-Agent": "SEOKaroAI-OutreachFinder/1.0 (https://seokaroai.com)" },
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    const children = (data?.data?.children ?? []) as any[];
    return children
      .map((c) => c?.data)
      .filter((d) => d && d.title && d.permalink && !d.over_18)
      .slice(0, 8)
      .map((d) => ({
        platform: "reddit" as const,
        title: String(d.title).slice(0, 290),
        url: `https://www.reddit.com${String(d.permalink)}`.slice(0, 690),
        community: d.subreddit ? `r/${d.subreddit}` : "Reddit",
        snippet: String(d.selftext ?? "").replace(/\s+/g, " ").trim().slice(0, 500),
      }));
  } catch {
    return [];
  }
}

async function searchQuora(query: string, country: string, language: string): Promise<DiscoveredThread[]> {
  try {
    const serp = await liveTop10(`site:quora.com ${query}`, country, language);
    if (serp?.results?.length) {
      return serp.results
        .filter((r) => /quora\.com/i.test(r.url))
        .slice(0, 6)
        .map((r) => ({
          platform: "quora" as const,
          title: String(r.title || r.url).replace(/\s*-\s*Quora$/i, "").slice(0, 290),
          url: r.url.slice(0, 690),
          community: "Quora",
          snippet: `Google #${r.position} Quora thread for “${query}”.`,
        }));
    }
  } catch { /* fall back to direct search link */ }

  // Fallback when DataForSEO is not enabled: create curated Quora search entry points.
  const clean = query.trim();
  if (!clean) return [];
  return [
    {
      platform: "quora",
      title: `Quora questions about “${clean}”`,
      url: `https://www.quora.com/search?q=${encodeURIComponent(clean)}&type=question`,
      community: "Quora Search",
      snippet: "Open live Quora questions for this topic, pick an active question, and use the AI draft below.",
    },
  ];
}

/**
 * Find fresh Reddit & Quora discussion opportunities for a project and save new ones to DB.
 */
export async function discoverOutreach(project: Project, userId: number, topicOverride?: string, platformFilter: "all" | "reddit" | "quora" = "all") {
  await ensureAddonTables();
  let query = (topicOverride ?? "").trim();
  if (!query) {
    const kws = await db().select().from(schema.keywords).where(eq(schema.keywords.projectId, project.id)).limit(3);
    query = kws.length ? kws[0].keyword : project.name;
  }

  const tasks: Promise<DiscoveredThread[]>[] = [];
  if (platformFilter === "all" || platformFilter === "reddit") tasks.push(searchReddit(query));
  if (platformFilter === "all" || platformFilter === "quora") tasks.push(searchQuora(query, project.country, project.language));

  const found = (await Promise.all(tasks)).flat();
  if (!found.length) return { added: 0, query };

  const existing = await db()
    .select({ url: schema.outreachItems.url })
    .from(schema.outreachItems)
    .where(and(eq(schema.outreachItems.userId, userId), eq(schema.outreachItems.projectId, project.id)));
  const seen = new Set(existing.map((e) => e.url));

  const now = new Date();
  let added = 0;
  for (const item of found) {
    if (seen.has(item.url)) continue;
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
  return { added, query };
}

/**
 * Generate a helpful, non-spammy, human-sounding reply draft for a Reddit or Quora thread.
 */
export async function draftOutreachReply(item: OutreachItem, project: Project): Promise<string> {
  const isReddit = item.platform === "reddit";
  const system = isReddit
    ? `You write helpful, authentic Reddit comments for a founder/practitioner. Rules:
- Answer the person's actual question directly with 2-4 concrete, practical tips first.
- Sound like a real human peer on Reddit (concise, no marketing buzzwords, no "Check out our amazing tool!").
- Mention ${project.name} (${project.url}) naturally at most ONCE as one option or a tool you built/use, with transparent context (e.g. "full disclosure, I work on ${project.name}").
- Keep it 90-160 words. Return plain text only.`
    : `You write clear, authoritative Quora answers for an industry practitioner. Rules:
- Start with a direct 1-2 sentence answer, then 3-4 concise bullet points with real value.
- Mention ${project.name} (${project.url}) naturally as a helpful resource where relevant (never salesy).
- Keep it 140-220 words. Return plain text only.`;

  const prompt = `Platform: ${item.platform} (${item.community})
Thread title: ${item.title}
Thread context: ${item.snippet || "(no extra body text)"}
My website/brand: ${project.name} — ${project.url} (${project.domain})

Write a genuinely helpful reply that I can review, edit, and post myself.`;

  const res = await complete({ system, prompt, maxTokens: 700 });
  const draft = res.text.trim();
  await db()
    .update(schema.outreachItems)
    .set({ draftReply: draft, status: item.status === "found" ? "drafted" : item.status, updatedAt: new Date() })
    .where(eq(schema.outreachItems.id, item.id));
  return draft;
}
