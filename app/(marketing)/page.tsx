import type { Metadata } from "next";
import Link from "next/link";
import { FEATURES, HOME_FAQS } from "@/lib/content/features";
import { PLANS, PAID_PLANS } from "@/lib/plans";
import { config } from "@/lib/config";
import { CtaBand, FaqList, JsonLd, SectionHead } from "@/components/marketing";
import { HomeTutorialsSection } from "@/components/tutorial-player";
import { AgentConsole, CountUp, Reveal, Spotlight } from "@/components/motion";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: { absolute: "SEOKaroAI: AI SEO Audit Tool, Rank Tracker & Auto-Fix" },
  description: "AI SEO audit tool that audits your site, tracks rankings, and ships fixes to WordPress, Shopify or GitHub. Start a free audit.",
  alternates: { canonical: "/" },
};

const CHECKS = ["Crawlability", "Indexing", "Canonicals", "Sitemaps", "robots.txt", "Core Web Vitals", "E-E-A-T", "Thin content", "Schema", "Hreflang", "Alt text", "Internal links", "AI crawlers", "llms.txt", "Security headers", "Search intent", "Competitor gaps", "Content briefs"];

const STEPS = [
  { icon: "Globe", t: "Connect your site", d: "Add a URL and your keywords. Optionally connect WordPress, Shopify or GitHub." },
  { icon: "Bot", t: "Agents audit and compare", d: "Specialist agents check every layer of SEO and measures you against the pages that outrank you." },
  { icon: "WandSparkles", t: "Review and ship fixes", d: "Approve the changes you want. CMS edits apply instantly; code arrives as a pull request." },
  { icon: "TrendingUp", t: "Watch it move", d: "Daily rank tracking, score history and a Monday report show what the work changed." },
];

export default function Home() {
  const [main, ...others] = FEATURES;
  const rest = others.filter((f) => f.slug !== "website-seo-checker"); // keeps the bento grid even (5 small tiles)

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
    image: [
      `${config.appUrl}/brand/logo-mark-512.png`,
      `${config.appUrl}/brand/logo-mark-256.png`,
      `${config.appUrl}/brand/logo-mark-128.webp`,
    ],
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${config.appUrl}/` },
    ],
  };

  return (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", "@id": `${config.appUrl}/#organization`, name: "SEOKaroAI", url: config.appUrl, logo: `${config.appUrl}/brand/logo-mark-512.png`, email: config.supportEmail },
        { "@context": "https://schema.org", "@type": "WebSite", "@id": `${config.appUrl}/#website`, name: "SEOKaroAI", url: config.appUrl, publisher: { "@id": `${config.appUrl}/#organization` } },
        appStructured,
        breadcrumb,
        faqStructured,
      ]} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="glow-top pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <Link href="/features/seo-auto-fix" className="chip animate-fade-up max-w-full flex-wrap justify-center text-center hover:border-[var(--line-strong)]">
              <span className="rounded-full bg-brand-500 px-1.5 text-[10px] font-semibold text-white">NEW</span>
              AI Auto-Fix for WordPress, Shopify and GitHub <Icon name="ArrowRight" size={13} />
            </Link>
            <h1 className="text-gradient animate-fade-up mt-7 break-words text-[2.1rem] min-[400px]:text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.045em] sm:text-6xl lg:text-[4.4rem]" style={{ animationDelay: "80ms" }}>
              SEO that finds the problem, proves it, and fixes it.
            </h1>
            <p className="muted animate-fade-up mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ animationDelay: "160ms" }}>
              A team of AI agents audits your site, measures you against the top 3 results for every keyword, and ships the fixes to your CMS or codebase, with your approval at every step.
            </p>
            <div className="animate-fade-up mt-9 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap" style={{ animationDelay: "240ms" }}>
              <Link href="/signup" className="btn btn-brand w-full justify-center px-6 py-3 text-[15px] sm:w-auto">Audit my website free <Icon name="ArrowRight" size={16} /></Link>
              <Link href="/features/keyword-battle" className="btn w-full justify-center px-6 py-3 text-[15px] sm:w-auto">See how it compares pages</Link>
            </div>
            <p className="muted animate-fade-up mt-5 text-[13px]" style={{ animationDelay: "320ms" }}>Free plan · no credit card · cancel anytime</p>
          </div>

          <Reveal className="mx-auto mt-12 grid min-w-0 max-w-full gap-4 sm:mt-16 lg:max-w-5xl lg:grid-cols-[1.25fr_1fr]">
            <AgentConsole />
            <div className="panel flex min-w-0 flex-col overflow-hidden p-4 sm:p-5">
              <div className="muted text-[12px]">Example report · yourbrand.com</div>
              <div className="mt-3 flex items-center gap-3 sm:gap-5">
                <svg width="104" height="104" viewBox="0 0 100 100" aria-hidden className="h-20 w-20 shrink-0 sm:h-[104px] sm:w-[104px]">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--panel2)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="url(#hg)" strokeWidth="8" strokeLinecap="round" className="ring-anim"
                    style={{ ["--ring-len" as string]: "264" }} strokeDasharray="264" strokeDashoffset={264 - 0.61 * 264} transform="rotate(-90 50 50)" />
                  <defs><linearGradient id="hg"><stop offset="0" stopColor="#1F86FF" /><stop offset="1" stopColor="#14B8A6" /></linearGradient></defs>
                  <text x="50" y="57" textAnchor="middle" fontSize="26" fontWeight="600" fill="currentColor">61</text>
                </svg>
                <div className="min-w-0 flex-1 space-y-2.5">
                  {[["Technical", 72], ["Content", 54], ["On-page", 68], ["Schema", 41], ["AI search", 63]].map(([l, s], i) => (
                    <div key={l as string} className="grid grid-cols-[62px_1fr_22px] sm:grid-cols-[70px_1fr_24px] items-center gap-2 text-[12px]">
                      <span className="muted">{l}</span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-[var(--panel2)]"><span className="block h-full origin-left rounded-full bg-gradient-to-r from-brand-500 to-teal-400 animate-fade-up" style={{ width: `${s}%`, animationDelay: `${300 + i * 90}ms` }} /></span>
                      <span className="text-right tabular-nums">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 space-y-2 text-[12.5px]">
                {[["crit", "17 landing pages have no internal links"], ["high", "#1 result answers pricing, setup and FAQs"], ["low", "Pull request ready: sitemap + canonicals"]].map(([t, x]) => (
                  <div key={x} className="flex items-center gap-2.5 rounded-lg border line px-3 py-2">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${t === "crit" ? "bg-crit" : t === "high" ? "bg-high" : "bg-low"}`} />{x}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Marquee of checks */}
      <section className="overflow-hidden border-y line py-5" aria-label="What we check">
        <div className="max-w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          <div className="marquee gap-3">
            {[...CHECKS, ...CHECKS].map((c, i) => <span key={i} className="chip mx-1.5 shrink-0"><Icon name="Check" size={12} className="text-low" />{c}</span>)}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="mx-4 mt-16 grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-2xl border line bg-[var(--line)] px-0 sm:mx-6 sm:mt-24 md:grid-cols-4 lg:mx-auto">
        {[[12, "+", "specialist agents in a deep audit"], [47, "", "on-page checks on every page"], [3, "", "competitors measured per keyword"], [100, "", "Google positions tracked daily"]].map(([n, s, l]) => (
          <div key={l as string} className="bg-[var(--bg)] p-4 sm:p-7">
            <div className="text-3xl sm:text-4xl font-semibold tracking-tight"><CountUp to={n as number} suffix={s as string} /></div>
            <div className="muted mt-2 text-[13px]">{l}</div>
          </div>
        ))}
      </section>

      {/* Bento features */}
      <section className="mx-auto mt-20 sm:mt-32 max-w-6xl px-4 sm:px-6">
        <Reveal><SectionHead eyebrow="Platform" title="Everything an SEO team does, run by agents you can supervise." text="From the first crawl to the merged pull request, every step is measured, explained and reversible." /></Reveal>
        <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 md:grid-cols-6">
          <Reveal className="sm:col-span-2 md:col-span-6"><Spotlight className="panel card-hover h-full p-5 sm:p-8">
              <Icon name={main.icon} size={22} className="text-brand-500" />
              <h3 className="mt-5 text-xl sm:text-2xl font-semibold tracking-tight">{main.h1}</h3>
              <p className="muted mt-3 max-w-xl leading-relaxed">{main.intro}</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">{main.bullets.map((b) => <li key={b} className="flex gap-2.5 text-[14px]"><Icon name="Check" size={16} className="mt-0.5 shrink-0 text-low" />{b}</li>)}</ul>
              <Link href={`/features/${main.slug}`} className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-brand-500">Learn about AI Auto-Fix <Icon name="ArrowRight" size={14} /></Link>
            </Spotlight></Reveal>
          {rest.map((f, i) => (
            <Reveal key={f.slug} delay={i * 60} className="sm:col-span-1 md:col-span-2">
              <Spotlight className="panel card-hover h-full">
                <Link href={`/features/${f.slug}`} className="block h-full p-6">
                  <Icon name={f.icon} size={20} className="text-brand-500" />
                  <h3 className="mt-4 font-semibold">{f.name}</h3>
                  <p className="muted mt-2 text-[14px] leading-relaxed">{f.intro.split(". ")[0]}.</p>
                </Link>
              </Spotlight>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Keyword battle */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:mt-32 sm:px-6">
        <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHead eyebrow="Keyword Battle" title="Stop guessing why competitors outrank you." text="Pick a keyword and your page. We measure the top 3 results and your page the same way, then every recommendation shows what a ranking competitor does and what you have today." />
            <ul className="mt-8 space-y-3.5">
              {['Search intent and the page type that wins', '20+ signals side by side', 'Subtopics the winners cover and you miss', 'Ready-to-paste title, meta and outline'].map((x) => (
                <li key={x} className="flex gap-3 text-[15px]"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-low/15 text-low"><Icon name="Check" size={12} /></span>{x}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120} className="min-w-0">
            <div className="panel max-w-full overflow-x-auto p-4 sm:p-5">
              <div className="muted mb-3 text-[12px]">Example comparison</div>
              <div className="table-wrap"><table className="w-full min-w-[440px] text-[13px]">
                <thead><tr className="muted text-left text-[12px]"><th className="p-2 font-medium">Signal</th><th className="p-2 font-medium text-[var(--ink)]">You</th><th className="p-2 font-medium">#1</th><th className="p-2 font-medium">#2</th><th className="p-2 font-medium">#3</th></tr></thead>
                <tbody>
                  {[['Main content words', '420', '2,100', '1,800', '1,500', true], ['FAQ section', 'No', 'Yes', 'Yes', 'No', true], ['Comparison table', 'No', 'Yes', 'Yes', 'Yes', true], ['Product schema', 'Yes', 'Yes', 'No', 'Yes', false], ['Server response', '0.2s', '0.6s', '0.9s', '0.5s', false]].map(([s, a, b, c, d, gap]) => (
                    <tr key={String(s)} className="border-t line">
                      <td className="p-2">{s}</td>
                      <td className="p-2"><span className={`rounded-md px-1.5 py-0.5 font-medium ${gap ? "bg-crit/10 text-crit" : "bg-low/10 text-low"}`}>{a}</span></td>
                      <td className="muted p-2">{b}</td><td className="muted p-2">{c}</td><td className="muted p-2">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
              <div className="mt-4 rounded-xl border line p-4 text-[13px]">
                <div className="flex items-center gap-2 font-medium"><span className="h-1.5 w-1.5 rounded-full bg-high" />Add a 6-question FAQ under the pricing section</div>
                <div className="muted mt-1.5">Evidence: #1 and #2 answer setup time, warranty and delivery in an FAQ; your page answers none.</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Auto-fix */}
      <section className="mx-auto mt-20 sm:mt-32 max-w-6xl px-4 sm:px-6">
        <Reveal><SectionHead center eyebrow="AI Auto-Fix" title="From finding to shipped fix, without the ticket queue." text="Connect your platform once. Every fix is shown side by side before it changes anything." /></Reveal>
        <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 md:grid-cols-3">
          {[
            { icon: "Globe", t: "WordPress", d: "Titles, excerpts and image alt text through the REST API with an Application Password." },
            { icon: "ShoppingBag", t: "Shopify", d: "Product titles, SEO titles, meta descriptions and image alt text through the Admin API." },
            { icon: "GitPullRequest", t: "GitHub", d: "The agent edits a copy of your code and opens a pull request with a summary of every change." },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 80}>
              <Spotlight className="panel card-hover h-full p-6">
                <Icon name={c.icon} size={20} className="text-brand-500" />
                <h3 className="mt-4 font-semibold">{c.t}</h3>
                <p className="muted mt-2 text-[14px] leading-relaxed">{c.d}</p>
              </Spotlight>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="panel mt-4 overflow-hidden font-mono text-[12.5px]">
            <div className="muted break-words border-b line px-4 py-2.5 text-[11px]">Proposed change · product “Commercial Coffee Grinder” · seo_description</div>
            <div className="break-words bg-crit/5 px-4 py-2 text-crit">- Buy now. Best price. Free shipping.</div>
            <div className="break-words bg-low/5 px-4 py-2 text-low">+ Commercial coffee grinder with 64 mm flat burrs and 1.2 kg hopper. Ships across the UAE in 48 hours with a 2-year warranty.</div>
          </div>
        </Reveal>
      </section>

      {/* Steps */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:mt-32 sm:px-6">
        <Reveal><SectionHead eyebrow="How it works" title="Four steps, one loop." /></Reveal>
        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border line bg-[var(--line)] sm:mt-12 sm:grid-cols-2 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.t} delay={i * 70} className="bg-[var(--bg)] p-5 sm:p-7">
              <div className="muted font-mono text-[12px]">0{i + 1}</div>
              <Icon name={s.icon} size={20} className="mt-5 text-brand-500" />
              <h3 className="mt-4 font-semibold">{s.t}</h3>
              <p className="muted mt-2 text-[14px] leading-relaxed">{s.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Video tutorials */}
      <section id="tutorials" className="mx-auto mt-20 max-w-6xl px-4 sm:mt-32 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHead eyebrow="Video Tutorials" title="See every feature in 20 seconds." text="Short step-by-step walkthroughs of the entire SEOKaroAI workflow — click any lesson to watch." />
          <Link href="/tutorials" className="btn w-full shrink-0 sm:w-auto">All 8 video tutorials <Icon name="ArrowRight" size={15} /></Link>
        </div>
        <HomeTutorialsSection />
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:mt-32 sm:px-6">
        <Reveal><SectionHead center eyebrow="Pricing" title="Start free. Grow when it pays." /></Reveal>
        <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 md:grid-cols-4">
          {( ["free", ...PAID_PLANS] as const).map((c, i) => {
            const p = PLANS[c];
            return (
              <Reveal key={c} delay={i * 60}>
                <div className={`panel card-hover h-full p-6 ${p.popular ? "border-brand-500/60 shadow-[0_0_0_1px_var(--color-brand-500)]" : ""}`}>
                  <div className="flex items-center justify-between"><span className="font-semibold">{p.name}</span>{p.popular && <span className="chip !py-0.5 text-brand-500">Popular</span>}</div>
                  <div className="mt-4 text-4xl font-semibold tracking-tight">${p.priceMonthly}<span className="muted text-sm font-normal">/mo</span></div>
                  <ul className="muted mt-5 space-y-2 text-[13px]">{p.highlights.slice(0, 4).map((h) => <li key={h} className="flex gap-2"><Icon name="Check" size={14} className="mt-0.5 shrink-0 text-low" />{h}</li>)}</ul>
                </div>
              </Reveal>
            );
          })}
        </div>
        <div className="mt-8 text-center"><Link href="/pricing" className="btn">Compare all plans <Icon name="ArrowRight" size={15} /></Link></div>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-20 sm:mt-32 max-w-3xl px-4 sm:px-6">
        <Reveal><SectionHead center title="Questions, answered" /></Reveal>
        <div className="mt-10"><FaqList faqs={HOME_FAQS} /></div>
      </section>

      <CtaBand />
    </>
  );
}
