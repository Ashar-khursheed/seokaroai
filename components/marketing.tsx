import Link from "next/link";
import { Logo } from "./logo";
import { Icon } from "./icons";
import { MobileDrawer } from "./mobile-drawer";
import { FEATURES } from "@/lib/content/features";
import { config } from "@/lib/config";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:gap-6 sm:px-6">
        <Link href="/" aria-label="SEOKaroAI home" className="shrink-0"><Logo size={24} /></Link>
        <nav className="hidden items-center gap-1 text-[14px] md:flex" aria-label="Main">
          <div className="group relative">
            <Link href="/features" className="muted flex items-center gap-1 rounded-full px-3.5 py-2 font-medium transition hover:bg-[var(--panel2)] hover:text-[var(--ink)]">
              Product <Icon name="ArrowRight" size={13} className="rotate-90 transition group-hover:-rotate-90" />
            </Link>
            <div className="invisible absolute left-0 top-full w-[640px] translate-y-1 pt-3 opacity-0 transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="panel grid grid-cols-2 gap-1 p-2.5 shadow-2xl shadow-slate-900/10">
                {FEATURES.map((f) => (
                  <Link key={f.slug} href={`/features/${f.slug}`} className="flex gap-3 rounded-xl p-3 transition hover:bg-[var(--panel2)]">
                    <span className="mt-0.5 text-violet-600"><Icon name={f.icon} size={18} /></span>
                    <span><span className="block text-sm font-semibold">{f.name}</span><span className="muted block text-xs leading-snug">{f.metaTitle.split(":")[1]?.trim() ?? f.metaTitle}</span></span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {[["Free Checker", "/website-seo-checker"], ["Pricing", "/pricing"], ["Tutorials", "/tutorials"], ["Blog", "/blog"]].map(([l, h]) => (
            <Link key={h} href={h} className="muted rounded-full px-3.5 py-2 font-medium transition hover:bg-[var(--panel2)] hover:text-[var(--ink)]">{l}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link href="/login" className="btn btn-ghost hidden !rounded-full sm:inline-flex">Log in</Link>
          <Link href="/signup" className="btn btn-primary !rounded-full !px-4">Start free <Icon name="ArrowRight" size={15} className="hidden min-[380px]:block" /></Link>
          <div className="md:hidden">
            <MobileDrawer title={<Logo size={22} />}>
              <div className="p-3">
                <div className="muted px-3 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wider">Product</div>
                {FEATURES.map((f) => (
                  <Link key={f.slug} href={`/features/${f.slug}`} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14.5px] hover:bg-[var(--panel2)]">
                    <Icon name={f.icon} size={17} className="text-brand-500" />{f.name}
                  </Link>
                ))}
                <div className="hairline my-3" />
                {[["All features", "/features"], ["Video Tutorials", "/tutorials"], ["Pricing", "/pricing"], ["Blog", "/blog"], ["About", "/about"], ["Contact", "/contact"]].map(([l, h]) => (
                  <Link key={h} href={h} className="block rounded-lg px-3 py-2.5 text-[15px] font-medium hover:bg-[var(--panel2)]">{l}</Link>
                ))}
              </div>
              <div className="mt-auto grid gap-2 border-t line p-4">
                <Link href="/signup" className="btn btn-brand w-full py-3">Start free <Icon name="ArrowRight" size={15} /></Link>
                <Link href="/login" className="btn w-full py-3">Log in</Link>
              </div>
            </MobileDrawer>
          </div>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="mt-20 border-t line sm:mt-32">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-12 sm:px-6 sm:py-14 md:grid-cols-5">
        <div className="col-span-2">
          <Logo size={24} />
          <p className="muted mt-4 max-w-xs text-sm leading-relaxed">AI SEO audits, rank tracking, competitor analysis and fixes that ship, in one place.</p>
          <a className="muted mt-4 inline-flex items-center gap-2 break-all text-sm hover:text-[var(--ink)]" href={`mailto:${config.supportEmail}`}><Icon name="Mail" size={15} />{config.supportEmail}</a>
        </div>
        <FooterCol title="Product" links={[["AI SEO Audit Tool", "/seo-audit-tool"], ["Site Audit Tool", "/site-audit-tool"], ["Free SEO Checker", "/website-seo-checker"], ...FEATURES.map((f) => [f.name, `/features/${f.slug}`] as [string, string]), ["Pricing", "/pricing"]]} />
        <FooterCol title="Resources" links={[["Case Studies", "/case-studies"], ["Video Tutorials", "/tutorials"], ["vs Semrush", "/compare/seokaroai-vs-semrush"], ["vs Ahrefs", "/compare/seokaroai-vs-ahrefs"], ["Semrush Alternatives", "/compare/semrush-alternatives"], ["WordPress Auto-Fix", "/integrations/wordpress"], ["Shopify Auto-Fix", "/integrations/shopify"], ["GitHub Auto-Fix", "/integrations/github"], ["Blog", "/blog"]]} />
        <FooterCol title="Company" links={[["About", "/about"], ["Security & Rollback", "/security"], ["Contact", "/contact"], ["Privacy", "/legal/privacy"], ["Terms", "/legal/terms"], ["Refunds", "/legal/refund"]]} />
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t line px-4 py-6 text-xs sm:px-6">
        <span className="muted">© {new Date().getFullYear()} SEOKaroAI · All rights reserved</span>
        <span className="muted flex items-center gap-2"><span className="live-dot h-1.5 w-1.5 rounded-full bg-low" />All systems operational</span>
      </div>
      <div className="footer-wordmark-bg overflow-hidden border-t line pt-8 sm:pt-12">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <div className="select-none text-[clamp(3.2rem,14vw,10.5rem)] font-extrabold leading-[0.84] tracking-[-0.06em] text-[#0f1117]">
            SEOKAROAI
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="mb-4 text-[13px] font-semibold">{title}</h3>
      <ul className="space-y-2.5 text-[13px]">{links.map(([l, h]) => <li key={h}><Link href={h} className="muted transition hover:text-[var(--ink)]">{l}</Link></li>)}</ul>
    </div>
  );
}

/** JSON-LD script. Data is ours (never user input), serialised safely. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function SectionHead({ eyebrow, title, text, center = false }: { eyebrow?: string; title: string; text?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <div className="mb-3 text-[13px] font-semibold text-brand-500">{eyebrow}</div>}
      <h2 className="text-gradient text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[2.6rem] sm:leading-[1.1]">{title}</h2>
      {text && <p className="muted mt-4 text-[15.5px] leading-relaxed sm:text-[17px]">{text}</p>}
    </div>
  );
}

export function CtaBand({ title = "See what is holding your website back", text = "Free plan, no card. Your first audit takes a couple of minutes.", button = "Start free" }: { title?: string; text?: string; button?: string }) {
  return (
    <section className="mx-auto mt-20 max-w-6xl px-4 sm:mt-32 sm:px-6">
      <div className="panel relative overflow-hidden px-5 py-12 text-center sm:px-16 sm:py-16">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="glow-top pointer-events-none absolute inset-0" />
        <div className="relative">
          <h2 className="text-gradient mx-auto max-w-2xl text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">{title}</h2>
          <p className="muted mx-auto mt-4 max-w-lg text-[15.5px] sm:text-[17px]">{text}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/signup" className="btn btn-brand px-5 py-3 text-[15px]">{button} <Icon name="ArrowRight" size={16} /></Link>
            <Link href="/pricing" className="btn px-5 py-3 text-[15px]">See pricing</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FaqList({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <div className="divide-y line border-y line">
      {faqs.map((f) => (
        <details key={f.q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium sm:gap-6 sm:text-[16px]">
            {f.q}
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border line transition group-open:rotate-45"><Icon name="Plus" size={14} /></span>
          </summary>
          <p className="muted mt-3 max-w-2xl text-[15px] leading-relaxed">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
