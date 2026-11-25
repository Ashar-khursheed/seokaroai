import type { Metadata } from "next";
import Link from "next/link";
import { publishedPosts, readingMinutes } from "@/lib/blog";
import { CtaBand } from "@/components/marketing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SEO Blog: Audits, Rankings, Competitors and AI Search",
  description: "Practical SEO guides from SEOKaroAI: how to audit a website, why competitors outrank you, how to track rankings and how to get cited by AI search.",
  alternates: { canonical: "/blog", types: { "application/rss+xml": "/blog/rss.xml" } },
};

export default async function Blog() {
  const posts = await publishedPosts();
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-16">
        <h1 className="break-words text-[2rem] font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">The SEOKaroAI blog</h1>
        <p className="muted mt-4 max-w-2xl text-base sm:text-lg">Practical, evidence-first SEO: what to check, what to fix, and how to tell if it worked.</p>
      </section>
      <section className="mx-auto mt-8 grid max-w-6xl gap-5 px-4 sm:mt-10 sm:gap-6 sm:px-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.length === 0 && <p className="muted">No posts yet.</p>}
        {posts.map((p) => (
          <Link key={p.id} href={`/blog/${p.slug}`} className="panel group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-brand-500">
            {p.coverImage
              ? <img src={p.coverImage} alt="" className="h-44 w-full object-cover" loading="lazy" />
              : <div className="h-2 bg-gradient-to-r from-brand-500 to-teal-400" />}
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              {p.tags && <div className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-500">{p.tags.split(",")[0]}</div>}
              <h2 className="break-words text-lg font-bold leading-snug group-hover:text-brand-500">{p.title}</h2>
              <p className="muted mt-2 flex-1 text-[15px] leading-relaxed">{p.excerpt}</p>
              <div className="muted mt-4 text-xs">{p.publishedAt?.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} · {readingMinutes(p.content)} min read</div>
            </div>
          </Link>
        ))}
      </section>
      <CtaBand />
    </>
  );
}
