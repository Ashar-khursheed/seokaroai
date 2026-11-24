import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { postBySlug, publishedPosts, readingMinutes, toc, withHeadingIds } from "@/lib/blog";
import { renderMarkdown } from "@/lib/markdown";
import { config } from "@/lib/config";
import { CtaBand, JsonLd } from "@/components/marketing";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await postBySlug((await params).slug);
  if (!p) return { title: "Post not found" };
  const title = p.metaTitle || p.title;
  const description = p.metaDescription || p.excerpt;
  return {
    title, description, alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { type: "article", title, description, publishedTime: p.publishedAt?.toISOString(), modifiedTime: p.updatedAt.toISOString(), images: p.coverImage ? [p.coverImage] : undefined },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await postBySlug((await params).slug);
  if (!p) notFound();
  const html = withHeadingIds(renderMarkdown(p.content));
  const headings = toc(p.content);
  const more = (await publishedPosts(4)).filter((x) => x.id !== p.id).slice(0, 3);
  const url = `${config.appUrl}/blog/${p.slug}`;
  const updated = p.updatedAt.getTime() - (p.publishedAt?.getTime() ?? 0) > 864e5;
  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org", "@type": "BlogPosting", headline: p.title, description: p.metaDescription || p.excerpt,
          datePublished: p.publishedAt?.toISOString(), dateModified: p.updatedAt.toISOString(), mainEntityOfPage: url,
          image: p.coverImage || `${config.appUrl}/opengraph-image`, author: { "@type": "Organization", name: p.authorName, url: config.appUrl },
          publisher: { "@id": `${config.appUrl}/#organization` }, keywords: p.tags || undefined,
        },
        {
          "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${config.appUrl}/` },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${config.appUrl}/blog` },
            { "@type": "ListItem", position: 3, name: p.title },
          ],
        },
      ]} />
      <article className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <nav className="muted text-sm" aria-label="Breadcrumb"><Link href="/">Home</Link> / <Link href="/blog">Blog</Link></nav>
        <header className="mt-6 max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-[-0.02em] leading-tight tracking-tight sm:text-[2.7rem]">{p.title}</h1>
          <p className="muted mt-4 text-lg">{p.excerpt}</p>
          <div className="muted mt-4 text-sm">
            By {p.authorName} · <time dateTime={p.publishedAt?.toISOString()}>{p.publishedAt?.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>
            {updated && <> · Updated {p.updatedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</>}
            {" "}· {readingMinutes(p.content)} min read
          </div>
        </header>
        {p.coverImage && <img src={p.coverImage} alt="" className="mt-8 max-h-[420px] w-full rounded-2xl object-cover" />}
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_240px]">
          <div className="md max-w-3xl !text-[17px]" dangerouslySetInnerHTML={{ __html: html }} />
          {headings.length > 2 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24 text-sm">
                <div className="mb-2 font-bold">On this page</div>
                <ul className="space-y-1.5">{headings.map((h) => <li key={h.id}><a href={`#${h.id}`} className="muted hover:text-brand-500">{h.text}</a></li>)}</ul>
              </div>
            </aside>
          )}
        </div>
      </article>
      {more.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
          <h2 className="text-xl font-bold">Keep reading</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {more.map((m) => <Link key={m.id} href={`/blog/${m.slug}`} className="panel p-5 hover:border-brand-500"><div className="font-semibold">{m.title}</div><p className="muted mt-2 text-sm">{m.excerpt}</p></Link>)}
          </div>
        </section>
      )}
      <CtaBand />
    </>
  );
}
