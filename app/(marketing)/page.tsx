import type { Metadata } from "next";
import Link from "next/link";
import { FEATURES, HOME_FAQS } from "@/lib/content/features";
import { PLANS, PAID_PLANS } from "@/lib/plans";
import { config } from "@/lib/config";
import { CtaBand, FaqList, JsonLd, SectionHead } from "@/components/marketing";
import { HomeTutorialsSection } from "@/components/tutorial-player";
import { CountUp, Reveal } from "@/components/motion";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: { absolute: "SEOKaroAI: AI SEO Audit Tool, Rank Tracker & Auto-Fix" },
  description: "AI SEO audit tool that audits your site, tracks rankings, and ships fixes to WordPress, Shopify or GitHub. Start a free audit.",
  alternates: { canonical: "/", languages: { en: "/", "x-default": "/" } },
};

const CHECKS = [
  "47 On-Page Checks", "Core Web Vitals", "AI Overviews (GEO)", "WordPress Auto-Fix",
  "Shopify Auto-Fix", "GitHub PR Gatekeeper", "Keyword Battle vs Top 3", "Daily Rank Tracking",
  "JSON-LD Schema", "Auto Internal Linking", "llms.txt & AI Crawlers", "Client PDF Exports",
];

export default function Home() {
  const [main, ...others] = FEATURES;
  const rest = others.filter((f) => f.slug !== "website-seo-checker");

  const faqStructured = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const appStructured = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "SEOKaroAI",
    url: config.appUrl,
    description: "AI SEO audits, rank tracking, competitor analysis and fixes that ship, in one place.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "All",
    image: [`${config.appUrl}/brand/app-icon-512.png`, `${config.appUrl}/opengraph-image`],
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: `${config.appUrl}/` }],
  };

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${config.appUrl}/#organization`,
            name: "SEOKaroAI",
            alternateName: ["SEO Karo AI", "seokaroai", "seokaroai.com"],
            url: config.appUrl,
            description: "SEOKaroAI (seokaroai.com) is an AI SEO platform offering multi-agent website audits, daily Google rank tracking, Keyword Battle competitor analysis, and automated SEO fixes for WordPress, Shopify, and GitHub.",
            logo: { "@type": "ImageObject", url: `${config.appUrl}/brand/app-icon-512.png`, width: 512, height: 512 },
            email: config.supportEmail,
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${config.appUrl}/#website`,
            name: "SEOKaroAI",
            alternateName: ["SEO Karo AI", "seokaroai"],
            url: config.appUrl,
            publisher: { "@id": `${config.appUrl}/#organization` },
          },
          appStructured,
          breadcrumb,
          faqStructured,
        ]}
      />

      {/* ===================== HERO (Mint-to-Lavender Flagship Mesh) ===================== */}
      <section className="hero-mesh relative overflow-hidden border-b border-black/[0.06] pb-16 pt-12 sm:pb-24 sm:pt-16 lg:pt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Link
              href="/features/seo-auto-fix"
              className="animate-fade-up inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-violet-200 bg-white/85 px-3.5 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-sm backdrop-blur transition hover:border-violet-300"
            >
              <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">New</span>
              <span>AI Auto-Fix + GitHub PR SEO Gatekeeper</span>
              <Icon name="ArrowRight" size={13} className="text-violet-600" />
            </Link>

            <h1 className="animate-fade-up mt-6 break-words text-[2.25rem] font-bold leading-[1.06] tracking-[-0.04em] text-[#0f1117] sm:text-5xl lg:text-[3.9rem]" style={{ animationDelay: "70ms" }}>
              Be found and chosen everywhere search happens.
            </h1>

            <p className="muted animate-fade-up mx-auto mt-5 max-w-2xl text-[15.5px] leading-relaxed sm:text-[18px]" style={{ animationDelay: "140ms" }}>
              Audit your site with 12+ specialist AI agents, beat the top 3 on Google, track daily rankings, and ship approved SEO fixes straight to WordPress, Shopify, or GitHub PRs.
            </p>

            {/* Instant Interactive URL Audit Bar */}
            <form
              action="/features/website-seo-checker"
              method="GET"
              className="animate-fade-up mx-auto mt-8 flex max-w-xl flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-[0_18px_50px_-18px_rgba(15,17,23,0.18)] sm:flex-row sm:rounded-full"
              style={{ animationDelay: "200ms" }}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3">
                <Icon name="Globe" size={17} className="shrink-0 text-slate-400" />
                <input
                  type="text"
                  name="url"
                  placeholder="Enter your website URL (e.g. yourstore.com)"
                  aria-label="Website URL for instant SEO check"
                  className="w-full bg-transparent py-2 text-[14.5px] text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                className="btn btn-brand !rounded-xl px-6 py-2.5 text-[14.5px] font-semibold sm:!rounded-full"
              >
                Check SEO Free <Icon name="ArrowRight" size={15} />
              </button>
            </form>
            <div className="muted mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12.5px]">
              <span>No signup required for instant check</span>
              <span>·</span>
              <Link href="/signup" className="font-medium text-violet-700 hover:underline">Start free account (1 website + 5 audits/mo) →</Link>
            </div>
          </div>

          {/* 2-Card 3D Hero Showcase Bento */}
          <div className="mt-12 grid gap-5 lg:grid-cols-12">
            {/* Left Vibrant Violet 3D Card */}
            <div className="violet-card card-3d relative overflow-hidden rounded-3xl p-6 text-white sm:p-8 lg:col-span-7">
              <div className="grid items-center gap-6 md:grid-cols-12">
                <div className="flex flex-col justify-between md:col-span-5">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
                      <Icon name="BrainCircuit" size={13} />AI Deep Audit + GEO
                    </span>
                    <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight sm:text-[1.7rem]">
                      Get found in Google &amp; AI Overviews
                    </h2>
                    <p className="mt-3 text-[13.5px] leading-relaxed text-white/85">
                      12+ specialist agents audit technical SEO, E-E-A-T content, Core Web Vitals, schema, and AI citability with exact URL evidence.
                    </p>
                  </div>
                  <div className="mt-6">
                    <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-slate-900 shadow-md transition hover:bg-slate-50">
                      Run free audit <Icon name="ArrowRight" size={14} />
                    </Link>
                  </div>
                </div>

                {/* Floating 3D White Dashboard Widget */}
                <div className="rounded-2xl bg-white p-4 text-slate-900 shadow-2xl shadow-violet-950/35 md:col-span-7">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-violet-600">SEO Health Score</div>
                      <div className="text-sm font-bold text-slate-900">yourstore.com</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">+14 pts</span>
                      <span className="grid h-11 w-11 place-items-center rounded-full border-4 border-emerald-500 text-sm font-extrabold text-slate-900">88</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs">
                    <div className="rounded-xl bg-slate-50 p-2.5">
                      <div className="text-[11px] text-slate-500">AI Visibility (GEO)</div>
                      <div className="mt-1 flex items-baseline gap-1.5"><span className="text-lg font-bold text-slate-900">92</span><span className="text-[11px] font-semibold text-emerald-600">GPTBot ✓</span></div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2.5">
                      <div className="text-[11px] text-slate-500">Core Web Vitals</div>
                      <div className="mt-1 flex items-baseline gap-1.5"><span className="text-lg font-bold text-slate-900">94</span><span className="text-[11px] font-semibold text-violet-600">LCP 1.4s</span></div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-[11.5px]">
                    {[
                      ["Technical SEO", 91, "bg-emerald-500"],
                      ["Content & E-E-A-T", 84, "bg-violet-500"],
                      ["Schema & Entities", 89, "bg-blue-500"],
                    ].map(([label, score, bar]) => (
                      <div key={String(label)} className="grid grid-cols-[110px_1fr_28px] items-center gap-2">
                        <span className="truncate font-medium text-slate-700">{label}</span>
                        <span className="h-2 overflow-hidden rounded-full bg-slate-100"><span className={`block h-full rounded-full ${bar}`} style={{ width: `${score}%` }} /></span>
                        <span className="text-right font-bold tabular-nums text-slate-800">{score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Clean Elevated Auto-Fix Card */}
            <div className="card-3d relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-5">
              <div className="diagonal-accent pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-3xl opacity-80" />
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <Icon name="WandSparkles" size={13} />AI Auto-Fix · 1-Click Ship
                </span>
                <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-slate-900">
                  Ship fixes, not CSV spreadsheets.
                </h2>
                <p className="muted mt-2.5 text-[14px] leading-relaxed">
                  Connect WordPress, Shopify, or GitHub. Review every side-by-side diff before approving — PRs never push directly to main, and CMS edits undo in one click.
                </p>
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 font-mono text-[11.5px]">
                  <div className="border-b border-slate-200 bg-white px-3 py-1.5 text-[10.5px] font-semibold text-slate-500">Pull Request #12 · Meta &amp; Schema Fix</div>
                  <div className="bg-rose-50/80 px-3 py-1.5 text-rose-700">- description: &quot;Welcome to our store.&quot;</div>
                  <div className="bg-emerald-50/80 px-3 py-1.5 text-emerald-700">+ description: &quot;Commercial grinders · 48h delivery &amp; 2-yr warranty.&quot;</div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link href="/features/seo-auto-fix" className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 hover:underline">
                  Explore AI Auto-Fix <Icon name="ArrowRight" size={14} />
                </Link>
                <Link href="/integrations/github" className="muted text-xs font-medium hover:text-slate-900">GitHub PR Gatekeeper →</Link>
              </div>
            </div>
          </div>

          {/* Marquee Capabilities Strip */}
          <div className="mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
            <div className="marquee gap-3">
              {[...CHECKS, ...CHECKS].map((c, i) => (
                <span key={i} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3.5 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-xs">
                  <Icon name="Check" size={12} className="text-emerald-600" />{c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== OBSIDIAN DARK 3D SHOWCASE BAND ===================== */}
      <section className="mx-auto mt-16 max-w-6xl px-4 sm:mt-24 sm:px-6">
        <div className="obsidian-band overflow-hidden rounded-3xl p-6 text-white shadow-2xl sm:p-10 lg:p-14">
          <div className="grid items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">Developer-Grade SEO Infrastructure</div>
              <h2 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.03em] sm:text-4xl">
                Bigger scale. Bigger advantage.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-300">
                Manage 1 to 30 websites with automated weekly audits, daily Google rank tracking, Auto Internal Linking, and our zero-latency GitHub PR SEO Gatekeeper that blocks regressions before merge.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                  Start free <Icon name="ArrowRight" size={15} />
                </Link>
                <Link href="/tutorials" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                  Watch how it works
                </Link>
              </div>
            </div>

            {/* Crisp White Floating Product Mockup */}
            <div className="card-3d rounded-2xl bg-white p-4 text-slate-900 sm:p-6 lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-sm font-bold">Ranking &amp; Auto-Fix Overview</span>
                </div>
                <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">Live Sync</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  ["Keywords Top 10", "38", "+11 this mo", "text-emerald-600"],
                  ["PR Gatekeeper", "Passed", "0 regressions", "text-violet-600"],
                  ["Auto-Fixes Shipped", "24", "3 PRs merged", "text-blue-600"],
                ].map(([lbl, val, sub, cls]) => (
                  <div key={lbl} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <div className="text-[11px] font-medium text-slate-500">{lbl}</div>
                    <div className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{val}</div>
                    <div className={`mt-0.5 text-[11px] font-semibold ${cls}`}>{sub}</div>
                  </div>
                ))}
              </div>
              {/* Clean Bar Visualization */}
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Organic Visibility Score (Last 8 Weeks)</span>
                  <span className="text-emerald-600">61 → 88 (+44%)</span>
                </div>
                <div className="flex h-20 items-end gap-2">
                  {[42, 48, 53, 61, 68, 76, 82, 92].map((h, idx) => (
                    <div
                      key={idx}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-violet-600 via-indigo-500 to-emerald-400"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== KEYWORD BATTLE SPLIT SECTION ===================== */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:mt-28 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="text-xs font-bold uppercase tracking-widest text-violet-600">Keyword Battle</div>
            <h2 className="mt-2.5 text-3xl font-bold leading-tight tracking-[-0.03em] text-slate-900 sm:text-[2.5rem]">
              Get seen. Get cited. Beat the top 3.
            </h2>
            <p className="muted mt-4 text-[16px] leading-relaxed">
              Pick any target keyword and your page. SEOKaroAI measures the live Google top 3 results and your page side by side across 20+ signals — every fix comes with competitor receipts.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Search intent & winning page-type classification",
                "20+ signals compared side by side against #1, #2 and #3",
                "Missing subtopics, FAQ schemas & comparison tables exposed",
                "Ready-to-paste title, meta description, H1 & content brief",
              ].map((x) => (
                <li key={x} className="flex gap-2.5 text-[14.5px] text-slate-700">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Icon name="Check" size={12} /></span>
                  {x}
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <Link href="/features/keyword-battle" className="btn btn-primary !rounded-full px-5">Explore Keyword Battle <Icon name="ArrowRight" size={15} /></Link>
            </div>
          </Reveal>

          <Reveal delay={100} className="min-w-0">
            <div className="card-3d rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Side-by-side SERP Comparison</span>
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 font-semibold text-amber-700">Live Google Top 3</span>
              </div>
              <div className="table-wrap">
                <table className="w-full min-w-[440px] text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-[12px] text-slate-500">
                      <th className="p-2.5 font-semibold">Signal</th>
                      <th className="p-2.5 font-bold text-slate-900">Your page</th>
                      <th className="p-2.5 font-semibold">#1</th>
                      <th className="p-2.5 font-semibold">#2</th>
                      <th className="p-2.5 font-semibold">#3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Main content words", "480", "2,100", "1,850", "1,520", true],
                      ["FAQ schema", "No", "Yes", "Yes", "No", true],
                      ["Comparison table", "No", "Yes", "Yes", "Yes", true],
                      ["Product/Offer JSON-LD", "Yes", "Yes", "No", "Yes", false],
                      ["Mobile LCP", "1.4s", "2.1s", "2.4s", "1.9s", false],
                    ].map(([s, a, b, c, d, gap]) => (
                      <tr key={String(s)} className="border-b border-slate-100 last:border-0">
                        <td className="p-2.5 font-medium text-slate-700">{s}</td>
                        <td className="p-2.5">
                          <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${gap ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{a}</span>
                        </td>
                        <td className="p-2.5 text-slate-500">{b}</td>
                        <td className="p-2.5 text-slate-500">{c}</td>
                        <td className="p-2.5 text-slate-500">{d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/70 p-3.5 text-[13px]">
                <div className="font-semibold text-violet-950">Recommended Fix · Add a 6-question FAQ + Comparison Table</div>
                <div className="mt-1 text-violet-800/80">Evidence: #1 and #2 answer pricing, setup &amp; rollback in FAQPage schema; your page has none.</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===================== EDITORIAL DATA METRICS STACK (Semrush-style bold numbers) ===================== */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:mt-28 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-6">
            <div className="text-xs font-bold uppercase tracking-widest text-violet-600">Built for Real Rankings</div>
            <h2 className="text-3xl font-bold leading-tight tracking-[-0.03em] text-slate-900 sm:text-4xl">
              The data and automation you need to outrank the competition.
            </h2>
            <div className="space-y-3 pt-2">
              {[
                { num: 47, suffix: "+", label: "Deterministic on-page, technical & CWV checks per audit", grad: "from-emerald-400 to-violet-500" },
                { num: 12, suffix: "+", label: "Specialist AI agents running in parallel on Deep Audits", grad: "from-violet-500 to-indigo-500" },
                { num: 100, suffix: "", label: "Live Google positions tracked daily by country & language", grad: "from-teal-400 to-blue-500" },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-4">
                  <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${m.grad} text-white shadow-md`}>
                    <Icon name="TrendingUp" size={22} />
                  </div>
                  <div className="flex min-w-0 flex-1 items-baseline gap-3 rounded-2xl bg-[#0f1117] px-5 py-3 text-white shadow-md">
                    <span className="text-3xl font-extrabold tracking-tight sm:text-4xl"><CountUp to={m.num} suffix={m.suffix} /></span>
                    <span className="text-xs leading-snug text-slate-300 sm:text-[13px]">{m.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Complete Platform Bento Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-6">
            {[main, ...rest.slice(0, 3)].map((f) => (
              <Link key={f.slug} href={`/features/${f.slug}`} className="panel card-hover flex flex-col p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600">
                  <Icon name={f.icon} size={19} />
                </span>
                <h3 className="mt-4 font-bold text-slate-900">{f.name}</h3>
                <p className="muted mt-1.5 text-[13.5px] leading-relaxed">{f.intro.split(". ")[0]}.</p>
                <span className="mt-auto pt-4 inline-flex items-center gap-1 text-xs font-semibold text-violet-700">
                  Explore <Icon name="ArrowRight" size={13} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== AI VISIBILITY / GEO SPECTRUM SPOTLIGHT ===================== */}
      <section className="spectrum-band mt-20 py-16 text-white sm:mt-28 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-emerald-300 backdrop-blur">
              <Icon name="Sparkles" size={20} />
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] sm:text-5xl">AI VISIBILITY &amp; GEO</h2>
            <p className="mt-3 text-[15.5px] text-slate-300 sm:text-[17px]">
              Make sure Google AI Overviews, ChatGPT, and Perplexity can crawl, trust, and cite your brand.
            </p>
            <div className="mt-6">
              <Link href="/features/ai-search-optimization" className="btn btn-brand !rounded-full px-6">
                Check AI Search Readiness <Icon name="ArrowRight" size={15} />
              </Link>
            </div>
          </div>

          <div className="card-3d mx-auto mt-10 max-w-3xl rounded-2xl bg-white p-5 text-slate-900 sm:p-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <span className="text-sm font-bold">AI Crawler &amp; Entity Citability Check</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">All 5 AI Bots Allowed</span>
            </div>
            <div className="space-y-3 text-xs sm:text-[13px]">
              {[
                ["GPTBot & OAI-SearchBot (ChatGPT)", 96, "from-emerald-400 to-teal-500"],
                ["ClaudeBot & Claude-SearchBot", 94, "from-violet-500 to-indigo-500"],
                ["PerplexityBot & Google-Extended", 92, "from-blue-500 to-cyan-400"],
                ["llms.txt + Organization JSON-LD", 90, "from-fuchsia-500 to-violet-500"],
              ].map(([name, val, grad]) => (
                <div key={String(name)} className="grid grid-cols-[160px_1fr_42px] items-center gap-3 sm:grid-cols-[240px_1fr_48px]">
                  <span className="truncate font-semibold text-slate-700">{name}</span>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full bg-gradient-to-r ${grad}`} style={{ width: `${val}%` }} />
                  </div>
                  <span className="text-right font-bold tabular-nums text-slate-900">{val}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== VIDEO TUTORIALS & INTERNAL LINKS HUB ===================== */}
      <section id="tutorials" className="mx-auto mt-20 max-w-6xl px-4 sm:mt-28 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHead eyebrow="Interactive Guides" title="See how every feature works in 20 seconds." text="Click-by-click walkthroughs showing exactly where to click and what ships." />
          <Link href="/tutorials" className="btn w-full shrink-0 !rounded-full sm:w-auto">All 8 interactive guides <Icon name="ArrowRight" size={15} /></Link>
        </div>
        <HomeTutorialsSection />

        {/* Contextual Pillar & Cluster Links */}
        <div className="panel mt-8 grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-violet-600">Core SEO Tools</div>
            <ul className="mt-2.5 space-y-1.5 text-[13.5px]">
              <li><Link href="/features/ai-seo-audit" className="hover:text-violet-600">AI SEO Audit (12+ Agents)</Link></li>
              <li><Link href="/features/website-seo-checker" className="hover:text-violet-600">Free Instant SEO Checker</Link></li>
              <li><Link href="/features/rank-tracker" className="hover:text-violet-600">Daily Google Rank Tracker</Link></li>
              <li><Link href="/features/keyword-battle" className="hover:text-violet-600">Keyword Battle vs Top 3</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-violet-600">Auto-Fix &amp; Integrations</div>
            <ul className="mt-2.5 space-y-1.5 text-[13.5px]">
              <li><Link href="/features/seo-auto-fix" className="hover:text-violet-600">AI Auto-Fix Overview</Link></li>
              <li><Link href="/integrations/wordpress" className="hover:text-violet-600">WordPress SEO Auto-Fix</Link></li>
              <li><Link href="/integrations/shopify" className="hover:text-violet-600">Shopify Product SEO Fix</Link></li>
              <li><Link href="/integrations/github" className="hover:text-violet-600">GitHub PR Auto-Fix &amp; Gatekeeper</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-violet-600">Comparisons</div>
            <ul className="mt-2.5 space-y-1.5 text-[13.5px]">
              <li><Link href="/compare/seokaroai-vs-semrush" className="hover:text-violet-600">SEOKaroAI vs Semrush</Link></li>
              <li><Link href="/compare/seokaroai-vs-ahrefs" className="hover:text-violet-600">SEOKaroAI vs Ahrefs</Link></li>
              <li><Link href="/compare/semrush-alternatives" className="hover:text-violet-600">Best Semrush Alternatives</Link></li>
              <li><Link href="/pricing" className="hover:text-violet-600">Transparent Plan Pricing</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-violet-600">AI Search &amp; Guides</div>
            <ul className="mt-2.5 space-y-1.5 text-[13.5px]">
              <li><Link href="/features/ai-search-optimization" className="hover:text-violet-600">AI Search Optimization (GEO)</Link></li>
              <li><Link href="/features/seo-reports" className="hover:text-violet-600">Automated PDF &amp; HTML Reports</Link></li>
              <li><Link href="/tutorials" className="hover:text-violet-600">Interactive Video Tutorials</Link></li>
              <li><Link href="/blog" className="hover:text-violet-600">SEO Guides &amp; Playbooks</Link></li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===================== PRICING + PAID ADD-ON ===================== */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:mt-28 sm:px-6">
        <Reveal><SectionHead center eyebrow="Pricing" title="Start free. Grow when it pays." text="Transparent pricing with zero seat fees — plus optional paid add-ons sold separately." /></Reveal>
        <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 md:grid-cols-4">
          {(["free", ...PAID_PLANS] as const).map((c, i) => {
            const p = PLANS[c];
            return (
              <Reveal key={c} delay={i * 50}>
                <div className={`panel card-hover flex h-full flex-col p-6 ${p.popular ? "border-violet-500 ring-2 ring-violet-500/20" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{p.name}</span>
                    {p.popular && <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-violet-700">Popular</span>}
                  </div>
                  <div className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900">${p.priceMonthly}<span className="muted text-sm font-normal">/mo</span></div>
                  <ul className="muted mt-5 flex-1 space-y-2 text-[13px]">
                    {p.highlights.slice(0, 5).map((h) => (
                      <li key={h} className="flex gap-2"><Icon name="Check" size={14} className="mt-0.5 shrink-0 text-emerald-600" />{h}</li>
                    ))}
                  </ul>
                  <Link href={c === "free" ? "/signup" : `/signup?plan=${c}`} className={`btn mt-6 w-full !rounded-full ${p.popular ? "btn-brand" : ""}`}>
                    {c === "free" ? "Start free" : `Choose ${p.name}`}
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Reddit & Quora Paid Add-on Banner */}
        <div className="panel mt-6 flex flex-col items-start justify-between gap-4 border-violet-200 bg-gradient-to-r from-violet-50/70 via-white to-emerald-50/60 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-violet-600 px-2.5 py-0.5 text-[11px] font-bold text-white">Paid Add-on · $29/mo</span>
              <span className="font-bold text-slate-900">Reddit &amp; Quora Outreach</span>
            </div>
            <p className="muted mt-1.5 text-[14px]">Sold separately on any plan: discover high-intent Reddit threads &amp; Quora questions for your keywords, draft natural value-first replies with AI, and track brand mentions safely.</p>
          </div>
          <Link href="/pricing" className="btn btn-brand w-full shrink-0 !rounded-full sm:w-auto">See add-on <Icon name="ArrowRight" size={15} /></Link>
        </div>
      </section>

      {/* ===================== FAQS ===================== */}
      <section className="mx-auto mt-20 max-w-3xl px-4 sm:mt-28 sm:px-6">
        <Reveal><SectionHead center eyebrow="FAQ" title="Questions before you start" /></Reveal>
        <div className="mt-8"><FaqList faqs={HOME_FAQS} /></div>
      </section>

      <CtaBand />
    </>
  );
}
