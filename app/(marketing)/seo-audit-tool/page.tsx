import type { Metadata } from "next";
import Link from "next/link";
import { config } from "@/lib/config";
import { CtaBand, FaqList, JsonLd, SectionHead } from "@/components/marketing";
import { Icon } from "@/components/icons";

const TITLE = "AI SEO Audit Tool — Technical, Content, Core Web Vitals & Auto-Fix | SEOKaroAI";
const DESC =
  "Run a comprehensive AI SEO audit across 8 ranking categories—technical SEO, Core Web Vitals, E-E-A-T content, schema, images, competitors, and AI Overviews—then ship verified fixes automatically.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: {
    canonical: "/seo-audit-tool",
    languages: { en: "/seo-audit-tool", "x-default": "/seo-audit-tool" },
  },
  openGraph: { title: TITLE, description: DESC, images: [`${config.appUrl}/opengraph-image`] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC, images: [`${config.appUrl}/opengraph-image`] },
};

const CATEGORIES = [
  { name: "Technical SEO & Crawlability", weight: "20%", checks: "robots.txt, XML sitemaps, canonicals, redirect chains, HTTP status codes, hreflang, SSR link discovery" },
  { name: "Content Quality & E-E-A-T", weight: "18%", checks: "Search intent alignment, thin content vs top SERP leaders, topical depth, author/trust signals, answer-first structure" },
  { name: "On-Page SEO", weight: "15%", checks: "Title tags, meta descriptions, H1–H3 hierarchy, internal linking to commercial pages, keyword placement" },
  { name: "Performance & Core Web Vitals", weight: "14%", checks: "Live Google PageSpeed Insights mobile/desktop scores, LCP, CLS, INP, render-blocking CSS/JS" },
  { name: "Schema & Structured Data", weight: "10%", checks: "JSON-LD validation for Organization, WebSite, Product/Offer, SoftwareApplication, FAQPage, BreadcrumbList" },
  { name: "AI Search Readiness (GEO)", weight: "10%", checks: "llms.txt availability, extractable answer blocks, factual tables, AI Overview and ChatGPT citability" },
  { name: "Images & Media SEO", weight: "7%", checks: "Descriptive alt text, explicit width/height for CLS prevention, AVIF/WebP formats, LCP eager loading" },
  { name: "Competitor & SERP Gaps", weight: "6%", checks: "Live Google Top-10 comparison, missing free tools or comparison hubs, proof artifacts and content depth gaps" },
];

const COMPARE_ROWS = [
  { capability: "8-category deterministic 0–100 score with evidence", seokaroai: "Included on Free & Paid", legacy: "Fragmented across multiple modules" },
  { capability: "Live Google PageSpeed Insights (CWV) in audit", seokaroai: "Automatic per audit", legacy: "Often requires manual export" },
  { capability: "AI Search / GEO readiness & llms.txt audit", seokaroai: "Built-in core category", legacy: "Paid add-on or unavailable" },
  { capability: "1-click Auto-Fix to WordPress, Shopify & GitHub", seokaroai: "Yes — with before/after diff & rollback", legacy: "Audit-only (exports CSVs)" },
  { capability: "GitHub PR SEO Gatekeeper on every pull request", seokaroai: "Included ($0 AI cost)", legacy: "Not available" },
  { capability: "Branded Agency PDF & HTML client reports", seokaroai: "Included", legacy: "Enterprise tier only" },
  { capability: "Starting paid price", seokaroai: "$29 / month", legacy: "$129 – $139 / month" },
];

const FAQS = [
  {
    q: "What makes an AI SEO audit tool better than a traditional crawler?",
    a: "Traditional crawlers flag hundreds of raw technical warnings without telling you which ones actually move rankings or how to fix them. SEOKaroAI combines deterministic live crawls and Google PageSpeed Insights data with specialized AI agents that compare your pages against live SERP leaders, prioritize fixes by revenue impact, and generate exact ready-to-ship patches.",
  },
  {
    q: "How is the 0–100 SEOKaroAI SEO score calculated?",
    a: "Every audit uses a deterministic weighted formula across 8 categories: Technical SEO, Content Quality, On-Page SEO, Core Web Vitals, Schema, AI Search Readiness, Images, and Competitors. Every finding cites the exact URL and metric measured—never a hallucinated number—and tracks score deltas against your previous audit.",
  },
  {
    q: "How long does a full website SEO audit take?",
    a: "An instant single-page check on our Free Website SEO Checker finishes in under 15 seconds. A full multi-agent site audit including live PageSpeed Insights, schema inspection, and prioritized action plan typically completes in 2 to 4 minutes.",
  },
  {
    q: "Can I export audit reports for clients or leadership?",
    a: "Yes. Every completed audit includes a clean, light-mode branded PDF and standalone HTML report exporter designed for agency client delivery and executive reviews.",
  },
  {
    q: "Is Auto-Fix safe for production WordPress, Shopify, or GitHub sites?",
    a: "Yes. SEOKaroAI never pushes blind changes. Every fix shows a clear before/after diff for your approval, stores a snapshot for 1-click rollback on WordPress/Shopify, and opens a reviewable Pull Request branch on GitHub. See our Security & Rollback architecture for full details.",
  },
];

export default function SeoAuditToolPage() {
  const url = `${config.appUrl}/seo-audit-tool`;
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${config.appUrl}/` },
              { "@type": "ListItem", position: 2, name: "AI SEO Audit Tool", item: url },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "SEOKaroAI — AI SEO Audit Tool",
            url,
            applicationCategory: "BusinessApplication",
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

      {/* Hero */}
      <section className="hero-mesh relative overflow-hidden border-b line">
        <div className="mx-auto max-w-5xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-20">
          <nav className="muted flex items-center gap-2 text-[13px]" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[var(--ink)]">Home</Link>
            <span>/</span>
            <span className="text-[var(--ink)]">SEO Audit Tool</span>
          </nav>

          <div className="mt-6 max-w-3xl">
            <span className="chip text-brand-600"><Icon name="Sparkles" size={14} />Multi-Agent AI SEO Audit + Auto-Fix</span>
            <h1 className="text-gradient mt-4 text-[2.1rem] font-extrabold leading-[1.06] tracking-[-0.04em] sm:text-[3.5rem]">
              The AI SEO Audit Tool That Doesn’t Stop at a Spreadsheet
            </h1>
            <p className="muted mt-5 text-base leading-relaxed sm:text-lg">
              SEOKaroAI crawls your live pages, pulls real Google PageSpeed Insights Core Web Vitals, benchmarks your content against Top-10 SERP competitors, evaluates AI Overview citability, and ships verified fixes straight to WordPress, Shopify, and GitHub.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="btn btn-brand justify-center px-6 py-3 text-[15px]">Run a free full SEO audit <Icon name="ArrowRight" size={16} /></Link>
              <Link href="/website-seo-checker" className="btn justify-center px-6 py-3 text-[15px]">Try instant no-signup checker</Link>
            </div>
          </div>

          {/* TL;DR Answer Block (GEO-optimized) */}
          <div className="panel mt-10 border-l-4 border-l-violet-600 p-5 sm:p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-violet-600">Quick Answer · What SEOKaroAI Audits</div>
            <p className="mt-2 text-[15px] leading-relaxed">
              An effective <strong>SEO audit tool</strong> must verify three layers simultaneously: (1) <strong>crawl &amp; technical health</strong> (status codes, canonicals, sitemaps, Core Web Vitals), (2) <strong>search &amp; AI relevance</strong> (E-E-A-T depth, structured data, internal links, and GEO citability), and (3) <strong>execution velocity</strong>. SEOKaroAI scores all 8 categories on a deterministic 0–100 scale with URL-level evidence and converts findings into 1-click CMS patches and GitHub Pull Requests.
            </p>
          </div>
        </div>
      </section>

      {/* 8-Category Breakdown Table */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHead
          eyebrow="Transparent scoring methodology"
          title="8 weighted categories, zero black-box guesses"
          text="Every SEOKaroAI audit assigns an evidence-backed score per category and tracks improvements automatically across runs."
        />
        <div className="panel mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b line bg-[var(--panel2)] text-xs uppercase tracking-wider muted">
                <th className="px-5 py-3.5 font-semibold">Audit Category</th>
                <th className="px-4 py-3.5 font-semibold">Weight</th>
                <th className="px-5 py-3.5 font-semibold">Exact Signals Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y line">
              {CATEGORIES.map((c) => (
                <tr key={c.name} className="hover:bg-[var(--panel2)]/50">
                  <td className="px-5 py-4 font-semibold">{c.name}</td>
                  <td className="px-4 py-4 font-mono text-brand-600">{c.weight}</td>
                  <td className="muted px-5 py-4 leading-relaxed">{c.checks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Deep editorial walkthrough (Content Quality pillar) */}
      <section className="border-y line bg-[var(--panel2)]/40 py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <SectionHead
            eyebrow="How the audit workflow works"
            title="From live crawl to merged fix in 4 steps"
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article className="panel p-6">
              <div className="font-mono text-xs font-semibold text-violet-600">STEP 01 · LIVE DISCOVERY &amp; CRAWL</div>
              <h3 className="mt-2 text-lg font-semibold">Server-rendered HTML + Google PageSpeed Insights</h3>
              <p className="muted mt-2.5 text-[14.5px] leading-relaxed">
                SEOKaroAI fetches your homepage, key landing pages, <code className="text-[var(--ink)]">robots.txt</code>, and <code className="text-[var(--ink)]">sitemap.xml</code> directly, then automatically queries Google PageSpeed Insights for real mobile and desktop Core Web Vitals (LCP, CLS, INP). You immediately see whether JavaScript hydration is hiding navigation links or hero images from Googlebot.
              </p>
            </article>
            <article className="panel p-6">
              <div className="font-mono text-xs font-semibold text-violet-600">STEP 02 · COMPETITOR &amp; E-E-A-T BENCHMARK</div>
              <h3 className="mt-2 text-lg font-semibold">Compare depth against the pages actually ranking #1–#5</h3>
              <p className="muted mt-2.5 text-[14.5px] leading-relaxed">
                Instead of generic &ldquo;add more words&rdquo; advice, our content and competitor agents inspect live Google Top-10 pages for your commercial keywords. You see exact word-count gaps, missing comparison tables, missing <code className="text-[var(--ink)]">Product</code>/<code className="text-[var(--ink)]">FAQPage</code> schema, and missing free-tool funnels that competitors use to capture organic traffic.
              </p>
            </article>
            <article className="panel p-6">
              <div className="font-mono text-xs font-semibold text-violet-600">STEP 03 · AI SEARCH (GEO) CITABILITY CHECK</div>
              <h3 className="mt-2 text-lg font-semibold">Optimize for Google AI Overviews, ChatGPT &amp; Perplexity</h3>
              <p className="muted mt-2.5 text-[14.5px] leading-relaxed">
                Search is no longer just ten blue links. SEOKaroAI audits your <Link href="/features/ai-search-geo" className="text-brand-600 underline underline-offset-4">AI Search (GEO) readiness</Link>—checking <code className="text-[var(--ink)]">llms.txt</code>, crisp 40–60 word answer blocks, structured comparison tables, and verifiable citations so generative engines quote your brand instead of competitors.
              </p>
            </article>
            <article className="panel p-6">
              <div className="font-mono text-xs font-semibold text-violet-600">STEP 04 · SAFE AUTO-FIX &amp; REGRESSION GUARD</div>
              <h3 className="mt-2 text-lg font-semibold">Ship fixes to WordPress, Shopify or GitHub with rollback</h3>
              <p className="muted mt-2.5 text-[14.5px] leading-relaxed">
                Connect <Link href="/integrations/wordpress" className="text-brand-600 underline underline-offset-4">WordPress</Link>, <Link href="/integrations/shopify" className="text-brand-600 underline underline-offset-4">Shopify</Link>, or <Link href="/integrations/github" className="text-brand-600 underline underline-offset-4">GitHub</Link> to turn audit issues into reviewable diffs. Turn on the <strong>GitHub PR SEO Gatekeeper</strong> to automatically block broken meta tags or missing H1s before new code ever reaches production.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHead
          eyebrow="SEOKaroAI vs legacy suites"
          title="Built for teams that want fixes shipped, not 400-row CSVs"
        />
        <div className="panel mt-8 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b line bg-[var(--panel2)] text-xs uppercase tracking-wider muted">
                <th className="px-5 py-3.5 font-semibold">Capability</th>
                <th className="px-5 py-3.5 font-semibold text-brand-600">SEOKaroAI</th>
                <th className="px-5 py-3.5 font-semibold">Legacy SEO Suites</th>
              </tr>
            </thead>
            <tbody className="divide-y line">
              {COMPARE_ROWS.map((r) => (
                <tr key={r.capability}>
                  <td className="px-5 py-3.5 font-medium">{r.capability}</td>
                  <td className="px-5 py-3.5 font-semibold text-emerald-700">{r.seokaroai}</td>
                  <td className="muted px-5 py-3.5">{r.legacy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Related cluster links */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Link href="/site-audit-tool" className="panel card-3d p-5 transition hover:border-brand-500/40">
            <div className="text-xs font-semibold uppercase text-brand-600">Technical Deep-Dive</div>
            <div className="mt-1 font-semibold">Technical Site Audit Tool &rarr;</div>
            <p className="muted mt-1 text-xs leading-relaxed">Crawlability, CWV, schema, and PR Gatekeeper workflows.</p>
          </Link>
          <Link href="/compare/seokaroai-vs-semrush" className="panel card-3d p-5 transition hover:border-brand-500/40">
            <div className="text-xs font-semibold uppercase text-brand-600">Comparison</div>
            <div className="mt-1 font-semibold">SEOKaroAI vs Semrush &rarr;</div>
            <p className="muted mt-1 text-xs leading-relaxed">Feature-by-feature pricing and Auto-Fix comparison.</p>
          </Link>
          <Link href="/security" className="panel card-3d p-5 transition hover:border-brand-500/40">
            <div className="text-xs font-semibold uppercase text-brand-600">Trust &amp; Rollback</div>
            <div className="mt-1 font-semibold">Integrations Security Doc &rarr;</div>
            <p className="muted mt-1 text-xs leading-relaxed">AES-256-GCM encryption, scoped tokens, and 1-click undo.</p>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-6 sm:px-6">
        <SectionHead eyebrow="FAQ" title="AI SEO Audit Tool questions" />
        <div className="mt-8">
          <FaqList faqs={FAQS} />
        </div>
      </section>

      <CtaBand
        title="Audit your site in minutes and fix what actually moves rankings"
        text="Start free—no credit card required. Upgrade anytime for scheduled audits, rank tracking, and 1-click Auto-Fix."
        button="Start free audit"
      />
    </>
  );
}
