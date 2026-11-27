import type { Metadata } from "next";
import Link from "next/link";
import { config } from "@/lib/config";
import { CtaBand, FaqList, JsonLd, SectionHead } from "@/components/marketing";
import { Icon } from "@/components/icons";

const TITLE = "Technical Site Audit Tool — Crawlability, CWV, Internal Links & PR Guard | SEOKaroAI";
const DESC =
  "Find and fix technical SEO bottlenecks across your entire website: broken canonicals, Core Web Vitals, missing schema, orphan pages, and PR regressions—before they cost you organic traffic.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: {
    canonical: "/site-audit-tool",
    languages: { en: "/site-audit-tool", "x-default": "/site-audit-tool" },
  },
  openGraph: { title: TITLE, description: DESC, images: [`${config.appUrl}/opengraph-image`] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC, images: [`${config.appUrl}/opengraph-image`] },
};

const TECHNICAL_PILLARS = [
  {
    icon: "Globe" as const,
    title: "Crawlability & Indexation Control",
    points: [
      "Validates robots.txt directives, XML sitemap freshness, and HTTP 200/301/404 chains",
      "Catches accidental noindex tags, non-canonical duplicates, and JS-hidden navigation links",
      "Verifies reciprocal hreflang pairs for international and multi-locale websites",
    ],
  },
  {
    icon: "Gauge" as const,
    title: "Core Web Vitals (Mobile & Desktop)",
    points: [
      "Runs live Google PageSpeed Insights automatically during every site audit",
      "Flags slow LCP hero images, missing width/height dimensions causing CLS, and heavy JS",
      "Tracks mobile performance trends over time so regressions are caught early",
    ],
  },
  {
    icon: "Link2" as const,
    title: "Auto Internal Linking & Architecture",
    points: [
      "Maps crawled pages to find orphan pages and under-linked commercial landing pages",
      "Suggests exact contextual anchor text and target URLs without manual spreadsheet work",
      "Pushes approved internal link updates directly via WordPress, Shopify, or GitHub PRs",
    ],
  },
  {
    icon: "Shield" as const,
    title: "GitHub PR SEO Gatekeeper ($0 AI Cost)",
    points: [
      "Connects via GitHub webhook to inspect every Pull Request automatically",
      "Checks changed HTML, TSX, JSX, and Markdown files for missing titles, H1s, canonicals, and alt text",
      "Posts an instant pass/warn review comment on the PR before broken SEO merges to main",
    ],
  },
];

const SEVERITY_MATRIX = [
  { level: "Critical (P0)", examples: "Site-wide noindex, broken homepage 5xx, blocked robots.txt, missing canonical on money pages", sla: "Fix immediately (same day)" },
  { level: "High (P1)", examples: "Mobile LCP > 2.5s, thin feature pages vs SERP leaders, missing Product/Software schema, orphan commercial pages", sla: "Fix within Week 1" },
  { level: "Medium (P2)", examples: "Duplicate meta descriptions, weak contextual internal links, missing hreflang on localized routes, unoptimized images", sla: "Fix within Weeks 2–4" },
  { level: "Low (P3)", examples: "Minor heading hierarchy cleanup, additional FAQ expansion, secondary structured data enhancements", sla: "Ongoing monthly polish" },
];

const FAQS = [
  {
    q: "What is the difference between a site audit tool and a single-page SEO checker?",
    a: "A single-page checker inspects one URL in isolation. A site audit tool evaluates your website as a connected system—checking how robots.txt, XML sitemaps, canonicals, internal link equity, Core Web Vitals, and schema work together across your domain.",
  },
  {
    q: "How often should I run a technical site audit?",
    a: "Active SaaS, e-commerce, and publishing sites should run a scheduled site audit weekly or after every major deployment. With SEOKaroAI, you can schedule automated weekly or monthly audits AND enable the GitHub PR SEO Gatekeeper so every code change is checked before merge.",
  },
  {
    q: "Does SEOKaroAI support WordPress, Shopify, and custom Next.js / React sites?",
    a: "Yes. You can audit any public website regardless of stack, and connect WordPress (REST API), Shopify (Admin API), or GitHub repositories (Next.js, Astro, Remix, static sites) for 1-click Auto-Fix and PR-based workflows.",
  },
  {
    q: "How does SEOKaroAI prevent SEO regressions during deployments?",
    a: "Two ways: first, scheduled audits compare your latest 0–100 score against your previous baseline and email a clear delta summary; second, the GitHub PR SEO Gatekeeper inspects Pull Requests in real time for missing meta tags, H1s, alt attributes, or accidental noindex rules.",
  },
];

export default function SiteAuditToolPage() {
  const url = `${config.appUrl}/site-audit-tool`;
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${config.appUrl}/` },
              { "@type": "ListItem", position: 2, name: "Technical Site Audit Tool", item: url },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "SEOKaroAI Technical Site Audit Tool",
            url,
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Web",
            description: DESC,
            offers: {
              "@type": "AggregateOffer",
              lowPrice: "0",
              highPrice: "199",
              priceCurrency: "USD",
              offerCount: "4",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]}
      />

      <section className="hero-mesh relative overflow-hidden border-b line">
        <div className="mx-auto max-w-5xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-20">
          <nav className="muted flex items-center gap-2 text-[13px]" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[var(--ink)]">Home</Link>
            <span>/</span>
            <span className="text-[var(--ink)]">Site Audit Tool</span>
          </nav>

          <div className="mt-6 max-w-3xl">
            <span className="chip text-brand-600"><Icon name="Terminal" size={14} />Technical SEO &amp; Developer Infrastructure</span>
            <h1 className="text-gradient mt-4 text-[2.1rem] font-extrabold leading-[1.06] tracking-[-0.04em] sm:text-[3.5rem]">
              Technical Site Audit Tool Built for Modern Web Teams
            </h1>
            <p className="muted mt-5 text-base leading-relaxed sm:text-lg">
              Catch crawl traps, Core Web Vitals bottlenecks, orphan pages, and broken structured data across your entire website—then resolve them with Auto Internal Linking, 1-click CMS patches, and automated GitHub PR checks.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="btn btn-brand justify-center px-6 py-3 text-[15px]">Audit my site free <Icon name="ArrowRight" size={16} /></Link>
              <Link href="/case-studies" className="btn justify-center px-6 py-3 text-[15px]">See audit &rarr; fix case studies</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Technical Pillars */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHead
          eyebrow="End-to-end technical coverage"
          title="Everything required to keep your site fast, crawlable, and regression-free"
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {TECHNICAL_PILLARS.map((p) => (
            <div key={p.title} className="panel card-3d p-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-600">
                <Icon name={p.icon} size={18} />
              </div>
              <h2 className="mt-4 text-lg font-semibold">{p.title}</h2>
              <ul className="mt-3.5 space-y-2.5 text-[14px]">
                {p.points.map((pt) => (
                  <li key={pt} className="flex gap-2.5">
                    <Icon name="Check" size={15} className="mt-0.5 shrink-0 text-low" />
                    <span className="muted">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Priority Matrix */}
      <section className="border-y line bg-[var(--panel2)]/40 py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <SectionHead
            eyebrow="Actionable prioritization"
            title="Every technical issue ranked by real ranking impact"
            text="No more drowning in low-impact warnings. SEOKaroAI groups findings into clear P0–P3 priorities with exact URLs and recommended fixes."
          />
          <div className="panel mt-8 overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left text-[14px]">
              <thead>
                <tr className="border-b line bg-[var(--panel2)] text-xs uppercase tracking-wider muted">
                  <th className="px-5 py-3.5 font-semibold">Priority</th>
                  <th className="px-5 py-3.5 font-semibold">Typical Technical Findings</th>
                  <th className="px-5 py-3.5 font-semibold">Recommended SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y line">
                {SEVERITY_MATRIX.map((row) => (
                  <tr key={row.level}>
                    <td className="px-5 py-4 font-semibold">{row.level}</td>
                    <td className="muted px-5 py-4 leading-relaxed">{row.examples}</td>
                    <td className="px-5 py-4 font-medium text-brand-600">{row.sla}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <Link href="/seo-audit-tool" className="btn">AI SEO Audit Tool</Link>
            <Link href="/website-seo-checker" className="btn">Free Website SEO Checker</Link>
            <Link href="/integrations/github" className="btn">GitHub PR Gatekeeper</Link>
            <Link href="/security" className="btn">Security &amp; Rollback Architecture</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHead eyebrow="FAQ" title="Technical Site Audit questions" />
        <div className="mt-8">
          <FaqList faqs={FAQS} />
        </div>
      </section>

      <CtaBand
        title="Stop shipping accidental SEO regressions"
        text="Run your first technical site audit free, then schedule weekly monitoring and GitHub PR protection."
        button="Start free site audit"
      />
    </>
  );
}
