import { publishedPosts } from "@/lib/blog";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

const ENT: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" };
const x = (s: string) => s.replace(/[<>&'"]/g, (c) => ENT[c]);

export async function GET() {
  const posts = await publishedPosts(50);
  const items = posts
    .map((p) => `<item><title>${x(p.title)}</title><link>${config.appUrl}/blog/${p.slug}</link><guid>${config.appUrl}/blog/${p.slug}</guid><pubDate>${p.publishedAt?.toUTCString()}</pubDate><description>${x(p.excerpt)}</description></item>`)
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>SEOKaroAI Blog</title><link>${config.appUrl}/blog</link><description>Practical, evidence-first SEO guides.</description><language>en</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600" } });
}
