import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FEATURES, featureBySlug } from "@/lib/content/features";
import { config } from "@/lib/config";
import { CtaBand, FaqList, JsonLd, SectionHead } from "@/components/marketing";
import { Reveal, Spotlight } from "@/components/motion";
import { Icon } from "@/components/icons";

export function generateStaticParams() {
  return FEATURES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const f = featureBySlug((await params).slug);
  if (!f) return {};
  return { title: f.metaTitle, description: f.metaDescription, alternates: { canonical: `/features/${f.slug}` }, openGraph: { title: f.metaTitle, description: f.metaDescription } };
}

export default async function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const f = featureBySlug((await params).slug);
  if (!f) notFound();
  const others = FEATURES.filter((x) => x.slug !== f.slug);
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${config.appUrl}/` },
          { "@type": "ListItem", position: 2, name: "Features", item: `${config.appUrl}/features` },
          { "@type": "ListItem", position: 3, name: f.name },
        ],
      }} />
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="glow-top pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6">
          <nav className="muted flex items-center gap-2 text-[13px]" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[var(--ink)]">Home</Link><span>/</span><Link href="/features" className="hover:text-[var(--ink)]">Product</Link><span>/</span><span className="text-[var(--ink)]">{f.name}</span>
          </nav>
          <div className="mt-10 grid items-start gap-12 lg:grid-cols-[1.25fr_1fr]">
            <div className="animate-fade-up">
              <span className="chip text-brand-500"><Icon name={f.icon} size={14} />{f.name}</span>
              <h1 className="text-gradient mt-5 text-4xl font-semibold leading-[1.06] tracking-[-0.04em] sm:text-[3.4rem]">{f.h1}</h1>
              <p className="muted mt-6 text-lg leading-relaxed">{f.intro}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/signup" className="btn btn-brand px-5 py-3 text-[15px]">{f.cta} <Icon name="ArrowRight" size={16} /></Link>
                <Link href="/pricing" className="btn px-5 py-3 text-[15px]">Pricing</Link>
              </div>
            </div>
            <div className="panel animate-fade-up p-6" style={{ animationDelay: "120ms" }}>
              <div className="muted text-[12px] font-medium uppercase tracking-wider">What you get</div>
              <ul className="mt-5 space-y-4">{f.bullets.map((b) => (
                <li key={b} className="flex gap-3 text-[15px]"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-low/15 text-low"><Icon name="Check" size={12} /></span>{b}</li>
              ))}</ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-3xl space-y-14 px-4 sm:px-6">
        {f.sections.map((s, i) => (
          <Reveal key={s.h2} delay={i * 40}>
            <h2 className="text-2xl font-semibold tracking-[-0.025em]">{s.h2}</h2>
            <p className="muted mt-3 text-[17px] leading-relaxed">{s.body}</p>
            {s.points && <ul className="mt-5 space-y-3">{s.points.map((p) => <li key={p} className="flex gap-3 text-[15px]"><Icon name="ArrowRight" size={15} className="mt-1 shrink-0 text-brand-500" />{p}</li>)}</ul>}
          </Reveal>
        ))}
        <Reveal>
          <h2 className="mb-6 text-2xl font-semibold tracking-[-0.025em]">{f.name}: common questions</h2>
          <FaqList faqs={f.faqs} />
        </Reveal>
      </section>

      <section className="mx-auto mt-28 max-w-6xl px-4 sm:px-6">
        <SectionHead title="Works together with" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((o) => (
            <Spotlight key={o.slug} className="panel card-hover">
              <Link href={`/features/${o.slug}`} className="flex items-start gap-3 p-5">
                <Icon name={o.icon} size={18} className="mt-0.5 text-brand-500" />
                <span><span className="block font-medium">{o.name}</span><span className="muted mt-1 block text-[13px] leading-snug">{o.metaDescription.split(". ")[0]}.</span></span>
              </Link>
            </Spotlight>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
