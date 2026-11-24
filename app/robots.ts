import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

/** Public marketing pages are open to search engines and AI crawlers; the app and APIs are not. */
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/app/", "/admin/", "/api/", "/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended"], allow: "/", disallow },
    ],
    sitemap: `${config.appUrl}/sitemap.xml`,
    host: config.appUrl,
  };
}
