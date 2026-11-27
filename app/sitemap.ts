import type { MetadataRoute } from "next";
import { config } from "@/lib/config";
import { FEATURES } from "@/lib/content/features";
import { COMPARE_PAGES } from "@/lib/content/compare";
import { INTEGRATION_PAGES } from "@/lib/content/integrations-pages";
import { LEGAL } from "@/lib/content/legal";
import { publishedPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const u = (p: string) => `${config.appUrl}${p}`;
  const posts = await publishedPosts(1000);
  const newest = posts[0]?.updatedAt;
  const now = new Date().toISOString();
  return [
    { url: u("/"), lastModified: newest ?? now },
    { url: u("/website-seo-checker"), lastModified: now },
    { url: u("/seo-audit-tool"), lastModified: now },
    { url: u("/site-audit-tool"), lastModified: now },
    { url: u("/case-studies"), lastModified: now },
    { url: u("/security"), lastModified: now },
    { url: u("/pricing"), lastModified: now },
    { url: u("/tutorials"), lastModified: now },
    { url: u("/features"), lastModified: now },
    ...FEATURES.map((f) => ({ url: u(`/features/${f.slug}`), lastModified: now })),
    ...COMPARE_PAGES.map((c) => ({ url: u(`/compare/${c.slug}`), lastModified: now })),
    ...INTEGRATION_PAGES.map((i) => ({ url: u(`/integrations/${i.slug}`), lastModified: now })),
    { url: u("/blog"), lastModified: newest ?? now },
    ...posts.map((p) => ({ url: u(`/blog/${p.slug}`), lastModified: p.updatedAt })),
    { url: u("/about"), lastModified: now },
    { url: u("/contact"), lastModified: now },
    ...Object.keys(LEGAL).map((k) => ({ url: u(`/legal/${k}`), lastModified: now })),
  ];
}
