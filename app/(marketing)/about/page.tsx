import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/marketing";

export const metadata: Metadata = {
  title: "About Us: SEO Advice With Evidence",
  description: "Why we built SEOKaroAI: SEO advice with evidence, from a team of AI agents that measure your site against the pages that outrank it.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-4 pt-16 sm:px-6">
        <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">SEO advice should come with evidence</h1>
        <div className="md mt-8 !text-[17px]">
          <p>&ldquo;Karo&rdquo; means &ldquo;do it&rdquo;. We built SEOKaroAI for people who want to know what to <em>do</em> next with their website, not read another list of 300 warnings.</p>
          <h2>The problem</h2>
          <p>Most SEO tools report everything they can measure and leave the thinking to you. Most SEO advice is generic: write better content, build more links, improve speed. Neither tells you why the three pages above you rank and yours does not.</p>
          <h2>Our approach</h2>
          <ul>
            <li><b>Measure, don&apos;t guess.</b> Our agents run real measurement tools on real pages. When something cannot be measured, the report says so.</li>
            <li><b>Compare with the winners.</b> Recommendations are tied to what the pages ranking for your keyword actually do.</li>
            <li><b>Prioritise.</b> Every finding is ranked by impact and by what it unblocks, so the first fix is the right one.</li>
            <li><b>Prove it.</b> Rank tracking, score history and weekly reports show whether the work paid off.</li>
          </ul>
          <h2>Built on open SEO tooling</h2>
          <p>SEOKaroAI runs on the open-source Claude SEO analysis toolkit and a team of specialist AI agents for technical SEO, content, schema, performance, AI search and competitor research.</p>
          <p>Questions or ideas? <Link href="/contact">Get in touch</Link>. We read every message.</p>
        </div>
      </article>
      <CtaBand />
    </>
  );
}
