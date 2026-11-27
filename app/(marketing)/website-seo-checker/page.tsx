import type { Metadata } from "next";
import Link from "next/link";
import { config } from "@/lib/config";
import { CtaBand, FaqList, JsonLd, SectionHead } from "@/components/marketing";
import { Icon } from "@/components/icons";
import InstantChecker from "@/components/instant-checker";

const TITLE = "Free Website SEO Checker — Instant On-Page, Technical & AI Readiness Scan";
const DESC =
  "Run a free website SEO check in seconds with no signup required. Inspect title tags, meta descriptions, H1 structure, canonicals, JSON-LD schema, Core Web Vitals, and AI search readiness.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: {
    canonical: "/website-seo-checker",
    languages: { en: "/website-seo-checker", "x-default": "/website-seo-checker" },
  },
  openGraph: { title: TITLE, description: DESC, images: [`${config.appUrl}/opengraph-image`] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC, images: [`${config.appUrl}/opengraph-image`] },
};

const CHECKS = [
  { icon: "FileText" as const, title: "Title, Meta & SERP Snippets", text: "Verifies character length, truncation risk, missing descriptions, and duplicate H1/title alignment." },
  { icon: "Code2" as const, title: "Canonical & Indexability", text: "Checks self-referencing canonicals, robots directives, HTTP status codes, and redirect chains." },
  { icon: "Gauge" as const, title: "Core Web Vitals & Speed", text: "Surfaces LCP, CLS, and mobile rendering hints so you catch slow hero assets before rankings drop." },
  { icon: "Network" as const, title: "Structured Data (JSON-LD)", text: "Detects Organization, WebSite, Product, FAQPage, and BreadcrumbList schema blocks on the page." },
  { icon: "Bot" as const, title: "AI Search (GEO) Signals", text: "Evaluates answer-first formatting, semantic headings, and citability for Google AI Overviews and ChatGPT." },
  { icon: "Link2" as const, title: "Internal & External Links", text: "Measures anchor distribution, broken link risk, and crawl depth to your commercial pages." },
];

const FAQS = [
  {
    q: "Is the Website SEO Checker really free without signing up?",
    a: "Yes. Enter any public URL above to run an instant live HTML inspection with zero login or credit card required. When you want a full multi-page audit, live Google PageSpeed Insights, rank tracking, and 1-click CMS Auto-Fix, you can upgrade to a free SEOKaroAI account in one click.",
  },
  {
    q: "How is this different from a full SEOKaroAI site audit?",
    a: "The instant checker analyzes a single URL in seconds for immediate on-page and technical diagnostics. A full SEOKaroAI audit runs specialized agents across crawlability, Core Web Vitals, E-E-A-T content quality, competitor SERPs, structured data, and AI Overviews—and generates ready-to-apply fixes for WordPress, Shopify, and GitHub.",
  },
  {
    q: "Does the checker work on JavaScript frameworks like Next.js, React, or Shopify?",
    a: "Yes. It fetches the live server-rendered HTML response just as search engine crawlers first see it, which immediately reveals if critical navigation links, H1s, or meta tags are missing from SSR output.",
  },
  {
    q: "Can SEOKaroAI automatically fix the issues found by the checker?",
    a: "Yes. Once you create a free account and connect WordPress, Shopify, or GitHub, SEOKaroAI proposes exact before/after diffs with 1-click rollback so you can ship fixes safely instead of copying spreadsheets.",
  },
];

export default function WebsiteSeoCheckerPage() {
  const url = `${config.appUrl}/website-seo-checker`;
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${config.appUrl}/` },
              { "@type": "ListItem", position: 2, name: "Free Website SEO Checker", item: url },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "SEOKaroAI Free Website SEO Checker",
            url,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description: DESC,
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          },
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "How to run a free website SEO check",
            description: "Inspect any web page for technical, on-page, schema, and AI search issues in under 15 seconds.",
            step: [
              { "@type": "HowToStep", position: 1, name: "Enter your page URL", text: "Paste any public https:// URL into the SEOKaroAI Website SEO Checker." },
              { "@type": "HowToStep", position: 2, name: "Review live HTML diagnostics", text: "Inspect your score, title/meta tags, heading hierarchy, canonical tag, schema blocks, and link counts." },
              { "@type": "HowToStep", position: 3, name: "Fix prioritized issues automatically", text: "Launch a full multi-agent audit or connect WordPress, Shopify, or GitHub to apply verified fixes with 1-click rollback." },
            ],
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
            <span className="text-[var(--ink)]">Website SEO Checker</span>
          </nav>

          <div className="mt-6 max-w-3xl">
            <span className="chip text-brand-600"><Icon name="SearchCheck" size={14} />100% Free · No Signup Required</span>
            <h1 className="text-gradient mt-4 text-[2.1rem] font-extrabold leading-[1.06] tracking-[-0.04em] sm:text-[3.4rem]">
              Free Website SEO Checker
            </h1>
            <p className="muted mt-4 text-base leading-relaxed sm:text-lg">
              Test any URL right now. SEOKaroAI fetches live server-rendered HTML to inspect on-page SEO, technical tags, structured data, image attributes, and AI search readiness in seconds.
            </p>
          </div>

          <div className="mt-8">
            <InstantChecker />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHead
          eyebrow="What gets checked"
          title="Every ranking signal Google and AI engines read first"
          text="Most free checkers stop at word count and meta length. SEOKaroAI inspects crawlability, structured data, and AI citability in one clean report."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CHECKS.map((c) => (
            <div key={c.title} className="panel card-3d p-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-600">
                <Icon name={c.icon} size={18} />
              </div>
              <h3 className="mt-4 text-[16px] font-semibold">{c.title}</h3>
              <p className="muted mt-2 text-[14px] leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>

        <div className="panel mt-12 flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="max-w-xl">
            <h2 className="text-xl font-semibold">Need a full multi-page SEO &amp; technical audit?</h2>
            <p className="muted mt-1.5 text-[14.5px]">
              Explore our complete <Link href="/seo-audit-tool" className="text-brand-600 underline underline-offset-4">AI SEO Audit Tool</Link> or <Link href="/site-audit-tool" className="text-brand-600 underline underline-offset-4">Technical Site Audit Tool</Link> for Core Web Vitals, competitor SERP gaps, and 1-click WordPress, Shopify, and GitHub Auto-Fix.
            </p>
          </div>
          <Link href="/signup" className="btn btn-brand shrink-0">Start free full audit <Icon name="ArrowRight" size={15} /></Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-6 sm:px-6">
        <SectionHead eyebrow="FAQ" title="Website SEO Checker questions" />
        <div className="mt-8">
          <FaqList faqs={FAQS} />
        </div>
      </section>

      <CtaBand
        title="Go beyond checking — ship verified SEO fixes automatically"
        text="Run a full multi-agent audit, track daily Google rankings, and push safe fixes to WordPress, Shopify, or GitHub."
        button="Create free account"
      />
    </>
  );
}
