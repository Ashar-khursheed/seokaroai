import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { config } from "@/lib/config";
import { INTEGRATION_PAGES, integrationBySlug } from "@/lib/content/integrations-pages";
import { CtaBand, FaqList, JsonLd } from "@/components/marketing";
import { Icon } from "@/components/icons";

export function generateStaticParams() {
  return INTEGRATION_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = integrationBySlug((await params).slug);
  if (!p) return {};
  const og = `${config.appUrl}/opengraph-image`;
  return {
    title: p.metaTitle,
    description: p.metaDescription,
    alternates: { canonical: `/integrations/${p.slug}` },
    openGraph: { title: p.metaTitle, description: p.metaDescription, images: [og] },
    twitter: { card: "summary_large_image", title: p.metaTitle, description: p.metaDescription, images: [og] },
  };
}

export default async function IntegrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = integrationBySlug((await params).slug);
  if (!p) notFound();
  const others = INTEGRATION_PAGES.filter((x) => x.slug !== p.slug);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${config.appUrl}/` },
              { "@type": "ListItem", position: 2, name: "Auto-Fix", item: `${config.appUrl}/features/seo-auto-fix` },
              { "@type": "ListItem", position: 3, name: `${p.name} Integration` },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: p.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]}
      />

      <article className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 sm:pt-16">
        <nav className="muted flex flex-wrap items-center gap-2 text-[13px]" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--ink)]">Home</Link>
          <span>/</span>
          <Link href="/features/seo-auto-fix" className="hover:text-[var(--ink)]">AI Auto-Fix</Link>
          <span>/</span>
          <span className="text-[var(--ink)]">{p.name}</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <span className="chip text-brand-500"><Icon name={p.icon} size={14} />{p.name} Integration</span>
          <h1 className="text-gradient mt-4 break-words text-[2rem] font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">{p.h1}</h1>
          <p className="muted mt-4 text-base leading-relaxed sm:text-lg">{p.tldr}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="btn btn-brand justify-center">Connect {p.name} free <Icon name="ArrowRight" size={15} /></Link>
            <Link href="/tutorials?video=seo-auto-fix" className="btn justify-center">Watch 24s Auto-Fix walkthrough</Link>
          </div>
        </header>

        {/* Diff preview */}
        <section className="panel mt-10 overflow-hidden font-mono text-[12.5px]">
          <div className="muted break-words border-b line px-4 py-2.5 text-[11px]">{p.diffLabel}</div>
          <div className="break-words bg-crit/5 px-4 py-2.5 text-crit">{p.diffOld}</div>
          <div className="break-words bg-low/5 px-4 py-2.5 text-low">{p.diffNew}</div>
        </section>

        {/* What it fixes + Setup steps */}
        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="panel p-5 sm:p-6">
            <h2 className="text-lg font-semibold">What SEOKaroAI fixes on {p.name}</h2>
            <ul className="mt-4 space-y-3 text-[14.5px]">
              {p.whatItFixes.map((x) => (
                <li key={x} className="flex gap-2.5"><Icon name="Check" size={16} className="mt-0.5 shrink-0 text-low" /><span>{x}</span></li>
              ))}
            </ul>
          </div>
          <div className="panel p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Security, Encryption &amp; Rollback</h2>
            <ul className="mt-4 space-y-3 text-[14.5px]">
              {p.securityPoints.map((x) => (
                <li key={x} className="flex gap-2.5"><Icon name="ShieldCheck" size={16} className="mt-0.5 shrink-0 text-brand-500" /><span>{x}</span></li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4-step workflow */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">How it works in 4 steps</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {p.steps.map((s, idx) => (
              <div key={s.title} className="panel p-5">
                <div className="font-mono text-xs font-semibold text-brand-500">0{idx + 1}</div>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="muted mt-1.5 text-[14px] leading-relaxed">{s.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="mt-14 max-w-3xl">
          <h2 className="mb-5 text-xl font-semibold tracking-tight sm:text-2xl">{p.name} Auto-Fix FAQs</h2>
          <FaqList faqs={p.faqs} />
        </section>

        {/* Other integrations */}
        <section className="mt-14 border-t line pt-10">
          <h2 className="text-lg font-semibold">Other Auto-Fix integrations</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {others.map((o) => (
              <Link key={o.slug} href={`/integrations/${o.slug}`} className="panel card-hover flex items-start gap-3 p-4">
                <Icon name={o.icon} size={18} className="mt-0.5 text-brand-500" />
                <div>
                  <div className="font-semibold">{o.name} Auto-Fix</div>
                  <div className="muted mt-1 text-xs">{o.metaDescription}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </article>

      <CtaBand title={`Ship SEO fixes to ${p.name} today`} text="Free plan includes 1 AI Auto-Fix run so you can test the full review & rollback flow." />
    </>
  );
}
