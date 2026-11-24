import Link from "next/link";
import { Logo } from "./logo";
import { Icon } from "./icons";
import { FEATURES } from "@/lib/content/features";
import { config } from "@/lib/config";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b line backdrop-blur-xl" style={{ background: "color-mix(in oklab, var(--bg) 78%, transparent)" }}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="SEOKaroAI home"><Logo size={26} /></Link>
        <nav className="hidden items-center gap-1 text-[14px] md:flex" aria-label="Main">
          <div className="group relative">
            <Link href="/features" className="muted flex items-center gap-1 rounded-lg px-3 py-2 transition hover:text-[var(--ink)]">
              Product <Icon name="ArrowRight" size={13} className="rotate-90 transition group-hover:-rotate-90" />
            </Link>
            <div className="invisible absolute left-0 top-full w-[620px] translate-y-1 pt-3 opacity-0 transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="panel grid grid-cols-2 gap-1 p-2 shadow-2xl shadow-black/20">
                {FEATURES.map((f) => (
                  <Link key={f.slug} href={`/features/${f.slug}`} className="flex gap-3 rounded-xl p-3 transition hover:bg-[var(--panel2)]">
                    <span className="mt-0.5 text-brand-500"><Icon name={f.icon} size={18} /></span>
                    <span><span className="block text-sm font-semibold">{f.name}</span><span className="muted block text-xs leading-snug">{f.metaTitle.split(":")[1]?.trim() ?? f.metaTitle}</span></span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {[["Pricing", "/pricing"], ["Blog", "/blog"], ["About", "/about"]].map(([l, h]) => (
            <Link key={h} href={h} className="muted rounded-lg px-3 py-2 transition hover:text-[var(--ink)]">{l}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className="btn btn-ghost hidden sm:inline-flex">Log in</Link>
          <Link href="/signup" className="btn btn-primary">Start free <Icon name="ArrowRight" size={15} /></Link>
          <details className="relative md:hidden">
            <summary className="btn btn-ghost list-none !px-2.5" aria-label="Open menu"><Icon name="Menu" size={18} /></summary>
            <div className="panel absolute right-0 mt-2 w-64 p-2 shadow-2xl">
              {[["Product", "/features"], ["Pricing", "/pricing"], ["Blog", "/blog"], ["About", "/about"], ["Log in", "/login"]].map(([l, h]) => (
                <Link key={h} href={h} className="block rounded-lg px-3 py-2 text-sm hover:bg-[var(--panel2)]">{l}</Link>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="mt-32 border-t line">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo size={24} />
          <p className="muted mt-4 max-w-xs text-sm leading-relaxed">AI SEO audits, rank tracking, competitor analysis and fixes that ship, in one place.</p>
          <a className="muted mt-4 inline-flex items-center gap-2 text-sm hover:text-[var(--ink)]" href={`mailto:${config.supportEmail}`}><Icon name="Mail" size={15} />{config.supportEmail}</a>
        </div>
        <FooterCol title="Product" links={[...FEATURES.map((f) => [f.name, `/features/${f.slug}`] as [string, string]), ["Pricing", "/pricing"]]} />
        <FooterCol title="Resources" links={[["Blog", "/blog"], ["RSS", "/blog/rss.xml"], ["llms.txt", "/llms.txt"], ["Sitemap", "/sitemap.xml"]]} />
        <FooterCol title="Company" links={[["About", "/about"], ["Contact", "/contact"], ["Privacy", "/legal/privacy"], ["Terms", "/legal/terms"], ["Refunds", "/legal/refund"]]} />
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t line px-4 py-6 text-xs sm:px-6">
        <span className="muted">© {new Date().getFullYear()} SEOKaroAI</span>
        <span className="muted flex items-center gap-2"><span className="live-dot h-1.5 w-1.5 rounded-full bg-low" />All systems normal</span>
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
      <h2 className="text-gradient text-3xl font-semibold tracking-[-0.03em] sm:text-[2.6rem] sm:leading-[1.1]">{title}</h2>
      {text && <p className="muted mt-4 text-[17px] leading-relaxed">{text}</p>}
    </div>
  );
}

export function CtaBand({ title = "See what is holding your website back", text = "Free plan, no card. Your first audit takes a couple of minutes.", button = "Start free" }: { title?: string; text?: string; button?: string }) {
  return (
    <section className="mx-auto mt-32 max-w-6xl px-4 sm:px-6">
      <div className="panel relative overflow-hidden px-6 py-16 text-center sm:px-16">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="glow-top pointer-events-none absolute inset-0" />
        <div className="relative">
          <h2 className="text-gradient mx-auto max-w-2xl text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">{title}</h2>
          <p className="muted mx-auto mt-4 max-w-lg text-[17px]">{text}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
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
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16px] font-medium">
            {f.q}
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border line transition group-open:rotate-45"><Icon name="Plus" size={14} /></span>
          </summary>
          <p className="muted mt-3 max-w-2xl text-[15px] leading-relaxed">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
