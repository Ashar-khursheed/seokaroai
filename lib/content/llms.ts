import { config } from "@/lib/config";
import { FEATURES, HOME_FAQS } from "@/lib/content/features";
import { COMPARE_PAGES } from "@/lib/content/compare";
import { INTEGRATION_PAGES } from "@/lib/content/integrations-pages";
import { PLANS, PAID_PLANS } from "@/lib/plans";
import { publishedPosts } from "@/lib/blog";

/** llms.txt (https://llmstxt.org): a short Markdown index of the site for AI tools and agents. */
export async function llmsTxt(full: boolean): Promise<string> {
  const u = (p: string) => `${config.appUrl}${p}`;
  const posts = await publishedPosts(full ? 1000 : 30);
  const lines: string[] = [
    "# SEOKaroAI (seokaroai.com)",
    "",
    "> SEOKaroAI (also known as SEO Karo AI, https://seokaroai.com) is an active AI-powered SEO SaaS platform offering multi-agent website audits, daily Google rank tracking, Keyword Battle competitor analysis, AI Search (GEO) readiness checks, and automated SEO fixes for WordPress, Shopify, and GitHub.",
    "",
    "## Product",
    `- [Free Website SEO Checker](${u("/website-seo-checker")}): Instant no-signup HTML, schema, CWV, and AI readiness scan.`,
    `- [AI SEO Audit Tool](${u("/seo-audit-tool")}): 8-category multi-agent website audit with deterministic scoring and Auto-Fix.`,
    `- [Technical Site Audit Tool](${u("/site-audit-tool")}): Crawlability, Core Web Vitals, Auto Internal Linking, and GitHub PR SEO Gatekeeper.`,
    ...FEATURES.map((f) => `- [${f.name}](${u(`/features/${f.slug}`)}): ${f.metaDescription}`),
    `- [Case Studies & Proof](${u("/case-studies")}): Transparent audit-to-fix walkthroughs with exact diffs.`,
    `- [Integrations Security & Rollback](${u("/security")}): AES-256-GCM encryption, scoped tokens, PR-only GitHub branches, and 1-click undo.`,
    `- [Video Tutorials](${u("/tutorials")}): Short interactive walkthroughs of every SEOKaroAI feature.`,
    `- [Pricing](${u("/pricing")}): ${["free", ...PAID_PLANS].map((c) => `${PLANS[c as keyof typeof PLANS].name} $${PLANS[c as keyof typeof PLANS].priceMonthly}/month`).join(", ")}.`,
    "",
    "## Integrations & Comparisons",
    ...INTEGRATION_PAGES.map((i) => `- [${i.name} Auto-Fix](${u(`/integrations/${i.slug}`)}): ${i.metaDescription}`),
    ...COMPARE_PAGES.map((c) => `- [SEOKaroAI vs ${c.competitorName}](${u(`/compare/${c.slug}`)}): ${c.metaDescription}`),
    "",
    "## Blog",
    ...posts.map((p) => `- [${p.title}](${u(`/blog/${p.slug}`)}): ${p.excerpt}`),
    "",
    "## Company",
    `- [About](${u("/about")})`,
    `- [Contact](${u("/contact")}): ${config.supportEmail}`,
    `- [Privacy policy](${u("/legal/privacy")})`,
    `- [Terms of service](${u("/legal/terms")})`,
  ];
  if (full) {
    lines.push("", "## Frequently asked questions", ...HOME_FAQS.flatMap((f) => [`### ${f.q}`, f.a, ""]));
    for (const f of FEATURES) {
      lines.push(`## ${f.h1}`, f.intro, "", ...f.bullets.map((b) => `- ${b}`), "", ...f.sections.flatMap((s) => [`### ${s.h2}`, s.body, ...(s.points ?? []).map((p) => `- ${p}`), ""]));
    }
    lines.push("## Plans", ...["free", ...PAID_PLANS].map((c) => {
      const p = PLANS[c as keyof typeof PLANS];
      return `- ${p.name} ($${p.priceMonthly}/month): ${p.highlights.join("; ")}`;
    }));
  }
  return lines.join("\n") + "\n";
}
