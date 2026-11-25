import type { Metadata } from "next";
import Link from "next/link";
import { FEATURES } from "@/lib/content/features";
import { CtaBand } from "@/components/marketing";
import { Reveal, Spotlight } from "@/components/motion";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Product: AI SEO Audit, Auto-Fix, Rank Tracker & Keyword Battle",
  description: "Everything SEOKaroAI does: AI SEO audits, auto-fixes for WordPress, Shopify and GitHub, competitor keyword analysis, daily rank tracking, AI search optimization and automated reports.",
  alternates: { canonical: "/features" },
};

export default function Features() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-20">
          <h1 className="text-gradient animate-fade-up max-w-3xl break-words text-[2rem] font-semibold leading-[1.06] tracking-[-0.04em] sm:text-6xl">One platform for the whole SEO loop.</h1>
          <p className="muted animate-fade-up mt-4 max-w-2xl text-base sm:mt-5 sm:text-lg" style={{ animationDelay: "100ms" }}>Find what is wrong, see what the winners do, ship the fix, and prove it worked.</p>
        </div>
      </section>
      <section className="mx-auto mt-10 grid max-w-6xl gap-4 px-4 sm:mt-14 sm:px-6 md:grid-cols-2">
        {FEATURES.map((f, i) => (
          <Reveal key={f.slug} delay={(i % 2) * 80}>
            <Spotlight className="panel card-hover h-full">
              <Link href={`/features/${f.slug}`} className="block h-full p-5 sm:p-7">
                <div className="flex items-center gap-2 text-[13px] font-medium text-brand-500"><Icon name={f.icon} size={16} />{f.name}</div>
                <h2 className="mt-4 text-xl font-semibold tracking-[-0.02em]">{f.h1}</h2>
                <p className="muted mt-3 leading-relaxed">{f.intro}</p>
                <ul className="mt-5 space-y-2 text-[14px]">{f.bullets.slice(0, 3).map((b) => <li key={b} className="flex gap-2.5"><Icon name="Check" size={15} className="mt-0.5 shrink-0 text-low" />{b}</li>)}</ul>
              </Link>
            </Spotlight>
          </Reveal>
        ))}
      </section>
      <CtaBand />
    </>
  );
}
