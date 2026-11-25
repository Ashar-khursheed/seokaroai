import type { Metadata } from "next";
import { config } from "@/lib/config";
import { TUTORIALS } from "@/lib/content/tutorials";
import { CtaBand, JsonLd } from "@/components/marketing";
import { TutorialsHub } from "@/components/tutorial-player";

export const metadata: Metadata = {
  title: "Video Tutorials: Complete SEOKaroAI Walkthroughs",
  description: "Short step-by-step video tutorials covering every SEOKaroAI feature: site audits, AI deep audits, GitHub/WordPress/Shopify auto-fix, keyword battles, daily rank tracking, GEO and automated reports.",
  alternates: { canonical: "/tutorials" },
};

export default async function TutorialsPage({ searchParams }: { searchParams: Promise<{ video?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "SEOKaroAI Video Tutorials",
          url: `${config.appUrl}/tutorials`,
          itemListElement: TUTORIALS.map((t, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            name: t.title,
            description: t.summary,
            url: `${config.appUrl}/tutorials?video=${encodeURIComponent(t.slug)}`,
          })),
        }}
      />

      <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-16">
        <div className="max-w-2xl">
          <div className="mb-3 text-[13px] font-semibold text-brand-500">Video Tutorials</div>
          <h1 className="text-gradient break-words text-[2rem] font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
            Learn the full SEOKaroAI flow in under 3 minutes.
          </h1>
          <p className="muted mt-4 text-[15.5px] leading-relaxed sm:text-[17px]">
            Short, chapter-by-chapter video walkthroughs for every feature — from your first site audit to shipping AI Auto-Fix pull requests and winning Keyword Battles.
          </p>
        </div>

        <div className="mt-8 sm:mt-10">
          <TutorialsHub initialSlug={sp.video} />
        </div>
      </section>

      <CtaBand title="Ready to try it on your own website?" text="Start free on 1 website. No credit card required." />
    </>
  );
}
