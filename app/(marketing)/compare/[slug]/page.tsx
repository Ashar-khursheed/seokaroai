import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { config } from "@/lib/config";
import { COMPARE_PAGES, compareBySlug } from "@/lib/content/compare";
import { CtaBand, FaqList, JsonLd } from "@/components/marketing";
import { Icon } from "@/components/icons";

export function generateStaticParams() {
  return COMPARE_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = compareBySlug((await params).slug);
  if (!p) return {};
  const og = `${config.appUrl}/opengraph-image`;
  return {
    title: p.metaTitle,
    description: p.metaDescription,
    alternates: { canonical: `/compare/${p.slug}` },
    openGraph: { title: p.metaTitle, description: p.metaDescription, images: [og] },
    twitter: { card: "summary_large_image", title: p.metaTitle, description: p.metaDescription, images: [og] },
  };
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const p = compareBySlug((await params).slug);
  if (!p) notFound();
  const others = COMPARE_PAGES.filter((x) => x.slug !== p.slug);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${config.appUrl}/` },
              { "@type": "ListItem", position: 2, name: "Compare", item: `${config.appUrl}/compare/${p.slug}` },
              { "@type": "ListItem", position: 3, name: `SEOKaroAI vs ${p.competitorName}` },
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
          <Link href="/pricing" className="hover:text-[var(--ink)]">Pricing</Link>
          <span>/</span>
          <span className="text-[var(--ink)]">SEOKaroAI vs {p.competitorName}</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <span className="chip text-brand-500"><Icon name="Swords" size={14} />Comparison</span>
          <h1 className="text-gradient mt-4 break-words text-[2rem] font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">{p.h1}</h1>
          <p className="muted mt-4 text-base leading-relaxed sm:text-lg">{p.intro}</p>
        </header>

        {/* TL;DR box for humans & AI Overviews */}
        <section className="panel mt-8 border-l-4 border-l-brand-500 p-5 sm:p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">TL;DR Verdict</div>
          <p className="mt-2 text-[15px] leading-relaxed">{p.tldr}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="btn btn-brand justify-center">Start free on SEOKaroAI <Icon name="ArrowRight" size={15} /></Link>
            <Link href="/features/website-seo-checker" className="btn justify-center">Try free instant SEO checker</Link>
          </div>
        </section>

        {/* Feature comparison table */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Feature-by-feature comparison</h2>
          <div className="panel table-wrap mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b line text-left">
                  <th className="p-3.5 sm:p-4">Capability</th>
                  <th className="p-3.5 text-brand-500 sm:p-4">SEOKaroAI</th>
                  <th className="muted p-3.5 sm:p-4">{p.competitorName}</th>
                </tr>
              </thead>
              <tbody>
                {p.rows.map((r) => (
                  <tr key={r.feature} className="border-b line last:border-0">
                    <td className="wrap p-3.5 font-medium sm:p-4">{r.feature}</td>
                    <td className="wrap p-3.5 font-medium sm:p-4">{r.seokaroai}</td>
                    <td className="wrap muted p-3.5 sm:p-4">{r.competitor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Who should choose which */}
        <section className="mt-12 grid gap-5 md:grid-cols-2">
          <div className="panel p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-low">Choose SEOKaroAI if…</h2>
            <ul className="mt-4 space-y-2.5 text-[14.5px]">
              {p.chooseUs.map((x) => (
                <li key={x} className="flex gap-2.5"><Icon name="Check" size={16} className="mt-0.5 shrink-0 text-low" /><span>{x}</span></li>
              ))}
            </ul>
          </div>
          <div className="panel p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Choose {p.competitorName} if…</h2>
            <ul className="muted mt-4 space-y-2.5 text-[14.5px]">
              {p.chooseThem.map((x) => (
                <li key={x} className="flex gap-2.5"><Icon name="ArrowRight" size={15} className="mt-0.5 shrink-0" /><span>{x}</span></li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQs */}
        <section className="mt-14 max-w-3xl">
          <h2 className="mb-5 text-xl font-semibold tracking-tight sm:text-2xl">Frequently asked questions</h2>
          <FaqList faqs={p.faqs} />
        </section>

        {/* More comparisons */}
        <section className="mt-14 border-t line pt-10">
          <h2 className="text-lg font-semibold">More comparisons</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {others.map((o) => (
              <Link key={o.slug} href={`/compare/${o.slug}`} className="panel card-hover p-4">
                <div className="font-semibold">SEOKaroAI vs {o.competitorName}</div>
                <div className="muted mt-1 text-xs">{o.metaDescription}</div>
              </Link>
            ))}
          </div>
        </section>
      </article>

      <CtaBand title="See what SEOKaroAI finds on your site" text="Free plan, no credit card. Run your first audit and review real fixes in minutes." />
    </>
  );
}
