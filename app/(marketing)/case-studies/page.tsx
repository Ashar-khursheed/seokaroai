import type { Metadata } from "next";
import Link from "next/link";
import { config } from "@/lib/config";
import { CtaBand, JsonLd, SectionHead } from "@/components/marketing";
import { Icon } from "@/components/icons";

const TITLE = "SEO Audit → Fix → Result Walkthroughs & Proof | SEOKaroAI";
const DESC =
  "Transparent audit-to-fix walkthroughs showing how SEOKaroAI identifies technical SEO, Core Web Vitals, schema, and internal-linking gaps—and ships verified fixes with diff proof.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: {
    canonical: "/case-studies",
    languages: { en: "/case-studies", "x-default": "/case-studies" },
  },
  openGraph: { title: TITLE, description: DESC, images: [`${config.appUrl}/opengraph-image`] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC, images: [`${config.appUrl}/opengraph-image`] },
};

const STUDIES = [
  {
    id: "seokaroai-dogfood",
    tag: "Internal Dogfooding · seokaroai.com",
    date: "2026-11",
    title: "Auditing & Fixing Our Own SaaS Site: Closing Thin Landers, Missing Offer Schema & Free-Tool Gaps",
    auditFindings: [
      "Feature lander (/features/ai-seo-audit) had ~684 words vs 2,300+ word SERP leaders.",
      "Pricing page had SoftwareApplication JSON-LD but lacked Product/AggregateOffer schema.",
      "No root /website-seo-checker no-signup funnel for high-intent free checker queries.",
      "Core Web Vitals category reported unmeasured when PSI was not automatically pre-fetched.",
    ],
    fixesShipped: [
      "Added automatic Google PageSpeed Insights pre-fetch & deterministic score backfill on every audit.",
      "Expanded feature landers and published dedicated /seo-audit-tool, /site-audit-tool, and /website-seo-checker pillar pages.",
      "Added Product + AggregateOffer JSON-LD on /pricing and reciprocal hreflang alternates across core pages.",
      "Published /security rollback architecture and linked it from all CMS & GitHub integration pages.",
    ],
    diffBefore: `// Before (/pricing): SoftwareApplication only, no Offer pricing\n{ "@type": "SoftwareApplication", "name": "SEOKaroAI" }`,
    diffAfter: `// After (/pricing): Product + AggregateOffer + per-plan Offer\n{ "@type": "Product", "offers": { "@type": "AggregateOffer", "lowPrice": "0", "highPrice": "199", "priceCurrency": "USD" } }`,
    outcome: "All 8 audit categories now measure deterministically with live PSI data, full Rich Results schema coverage, and dedicated commercial pillar routes.",
  },
  {
    id: "wordpress-autofix",
    tag: "Workflow Blueprint · WordPress & Shopify",
    date: "2026-11",
    title: "Turning 40+ Missing Meta Descriptions & Orphan Commercial Pages into Reviewed 1-Click Fixes",
    auditFindings: [
      "Blog posts ranked for informational queries but had zero contextual links pointing to core product/pricing pages.",
      "Multiple product and landing pages shared truncated or duplicate meta descriptions.",
      "Hero images lacked explicit width/height attributes, contributing to mobile CLS shifts.",
    ],
    fixesShipped: [
      "Ran Auto Internal Linking to match crawled blog topics to under-linked commercial URLs with natural anchor text.",
      "Generated tailored meta descriptions within 140–155 characters for each flagged URL.",
      "Applied approved diffs via WordPress REST / Shopify Admin API with automatic pre-change rollback snapshots.",
    ],
    diffBefore: `- <meta name="description" content="Home page">\n- Internal links to /pricing: 0 in article body`,
    diffAfter: `+ <meta name="description" content="Compare plans and start your free AI SEO audit with live Core Web Vitals and 1-click CMS Auto-Fix.">\n+ Contextual internal link added in Section 2 -> /pricing`,
    outcome: "Zero manual copy-pasting across CMS dashboards, full audit trail of every edit, and instant 1-click rollback if editorial teams want to revert.",
  },
  {
    id: "github-pr-gatekeeper",
    tag: "Developer Infrastructure · GitHub PR Gatekeeper",
    date: "2026-11",
    title: "Blocking Accidental SEO Regressions Before Merge at $0 AI Cost",
    auditFindings: [
      "Fast-moving engineering teams frequently ship refactored Next.js / React pages that accidentally drop <title>, H1, canonical, or image alt attributes.",
      "Catching regressions weeks later in a monthly crawl means organic impressions have already dropped.",
    ],
    fixesShipped: [
      "Enabled SEOKaroAI GitHub PR SEO Gatekeeper webhook on the repository.",
      "Every Pull Request triggers deterministic static checks on modified .tsx, .jsx, .html, and .md files.",
      "SEOKaroAI posts an automated pass/warn review comment directly on the GitHub PR with line-level fix hints.",
    ],
    diffBefore: `PR #142 changed app/pricing/page.tsx -> missing metadata.description & duplicate <h1>`,
    diffAfter: `SEOKaroAI PR Gatekeeper comment posted in <3s -> developer fixed before merge to main`,
    outcome: "Prevents silent ranking drops at the Pull Request stage with zero LLM token overhead.",
  },
];

export default function CaseStudiesPage() {
  const url = `${config.appUrl}/case-studies`;
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${config.appUrl}/` },
              { "@type": "ListItem", position: 2, name: "Case Studies & Proof", item: url },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: TITLE,
            url,
            description: DESC,
          },
        ]}
      />

      <section className="hero-mesh relative overflow-hidden border-b line">
        <div className="mx-auto max-w-5xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-20">
          <nav className="muted flex items-center gap-2 text-[13px]" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[var(--ink)]">Home</Link>
            <span>/</span>
            <span className="text-[var(--ink)]">Case Studies</span>
          </nav>

          <div className="mt-6 max-w-3xl">
            <span className="chip text-brand-600"><Icon name="BarChart3" size={14} />Transparent Audit &rarr; Fix Proof</span>
            <h1 className="text-gradient mt-4 text-[2.1rem] font-extrabold leading-[1.06] tracking-[-0.04em] sm:text-[3.4rem]">
              Real Audit Findings, Exact Diffs &amp; Shipped Fixes
            </h1>
            <p className="muted mt-5 text-base leading-relaxed sm:text-lg">
              No inflated &ldquo;+900% overnight traffic&rdquo; claims. Below are concrete audit-to-fix walkthroughs—starting with how we dogfood SEOKaroAI on our own production site—showing the exact issues caught and patches shipped.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-10 px-4 py-14 sm:px-6 sm:py-20">
        {STUDIES.map((s) => (
          <article key={s.id} className="panel overflow-hidden p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="chip text-brand-600">{s.tag}</span>
              <span className="muted font-mono">{s.date}</span>
            </div>
            <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">{s.title}</h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border line bg-[var(--panel2)]/50 p-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-rose-700">1. What the Audit Caught</div>
                <ul className="mt-3 space-y-2 text-[14px]">
                  {s.auditFindings.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                      <span className="muted">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border line bg-emerald-500/[0.04] p-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">2. Fixes Shipped</div>
                <ul className="mt-3 space-y-2 text-[14px]">
                  {s.fixesShipped.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Icon name="Check" size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                      <span className="muted">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border line font-mono text-[12.5px]">
              <div className="border-b line bg-rose-500/[0.06] px-4 py-3 text-rose-800 whitespace-pre-wrap">{s.diffBefore}</div>
              <div className="bg-emerald-500/[0.06] px-4 py-3 text-emerald-800 whitespace-pre-wrap">{s.diffAfter}</div>
            </div>

            <div className="mt-5 rounded-xl border line bg-[var(--panel2)]/40 px-4 py-3.5 text-[14px]">
              <strong className="text-[var(--ink)]">Verified Result: </strong>
              <span className="muted">{s.outcome}</span>
            </div>
          </article>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap gap-3">
            <Link href="/seo-audit-tool" className="btn">Explore AI SEO Audit Tool</Link>
            <Link href="/website-seo-checker" className="btn">Try Free Website SEO Checker</Link>
            <Link href="/security" className="btn">Read Security &amp; Rollback Doc</Link>
          </div>
        </div>
      </section>

      <CtaBand
        title="See what SEOKaroAI finds on your own website"
        text="Run a free instant check or full multi-agent audit and inspect every diff before applying."
        button="Start free audit"
      />
    </>
  );
}
