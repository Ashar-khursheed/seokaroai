import { and, desc, eq, isNotNull, lte } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Post } from "@/lib/db/schema";

const published = () => and(eq(schema.posts.status, "published"), isNotNull(schema.posts.publishedAt), lte(schema.posts.publishedAt, new Date()));

/** Published posts, newest first. Returns [] when the database is unreachable (e.g. at build time). */
export async function publishedPosts(limit = 100): Promise<Post[]> {
  try {
    return await db().select().from(schema.posts).where(published()).orderBy(desc(schema.posts.publishedAt)).limit(limit);
  } catch {
    return [];
  }
}

export async function postBySlug(slug: string): Promise<Post | null> {
  if (!/^[a-z0-9-]{1,160}$/.test(slug)) return null;
  try {
    const [p] = await db().select().from(schema.posts).where(and(eq(schema.posts.slug, slug), published())).limit(1);
    return p ?? null;
  } catch {
    return null;
  }
}

export function readingMinutes(md: string) {
  return Math.max(1, Math.round(md.split(/\s+/).length / 220));
}

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 120);
}

/** Headings (h2) for a table of contents, matching the ids added by withHeadingIds. */
export function toc(md: string) {
  return [...md.matchAll(/^##\s+(.+)$/gm)].map((m) => ({ text: m[1].replace(/[*_`]/g, ""), id: slugify(m[1].replace(/[*_`]/g, "")) }));
}

export function withHeadingIds(html: string) {
  return html.replace(/<h2>(.*?)<\/h2>/g, (_, inner: string) => `<h2 id="${slugify(inner.replace(/<[^>]+>/g, ""))}">${inner}</h2>`);
}
