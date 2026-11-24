import type { MetadataRoute } from "next";
import { config } from "@/lib/config";
import { FEATURES } from "@/lib/content/features";
import { LEGAL } from "@/lib/content/legal";
import { publishedPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const u = (p: string) => `${config.appUrl}${p}`;
  const posts = await publishedPosts(1000);
  const newest = posts[0]?.updatedAt;
  return [
    { url: u("/"), lastModified: newest },
    { url: u("/pricing") },
    { url: u("/features") },
    ...FEATURES.map((f) => ({ url: u(`/features/${f.slug}`) })),
    { url: u("/blog"), lastModified: newest },
    ...posts.map((p) => ({ url: u(`/blog/${p.slug}`), lastModified: p.updatedAt })),
    { url: u("/about") },
    { url: u("/contact") },
    ...Object.keys(LEGAL).map((k) => ({ url: u(`/legal/${k}`) })),
  ];
}
