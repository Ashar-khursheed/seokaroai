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
  const ogImage = p.coverImage || `${config.appUrl}/opengraph-image`;
  return {
    title, description, alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { type: "article", title, description, publishedTime: p.publishedAt?.toISOString(), modifiedTime: p.updatedAt.toISOString(), images: [ogImage] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
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
      <article className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12">
        <nav className="muted text-sm" aria-label="Breadcrumb"><Link href="/">Home</Link> / <Link href="/blog">Blog</Link></nav>
        <header className="mt-5 max-w-3xl sm:mt-6">
          <h1 className="break-words text-[1.85rem] font-semibold leading-tight tracking-[-0.02em] sm:text-[2.7rem]">{p.title}</h1>
          <p className="muted mt-4 text-base sm:text-lg">{p.excerpt}</p>
          <div className="muted mt-4 text-sm">
            By {p.authorName} · <time dateTime={p.publishedAt?.toISOString()}>{p.publishedAt?.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>
            {updated && <> · Updated {p.updatedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</>}
            {" "}· {readingMinutes(p.content)} min read
          </div>
        </header>
        {p.coverImage && <img src={p.coverImage} alt="" className="mt-6 max-h-[260px] w-full rounded-xl object-cover sm:mt-8 sm:max-h-[420px] sm:rounded-2xl" />}
        <div className="mt-8 grid min-w-0 gap-8 sm:mt-10 sm:gap-10 lg:grid-cols-[1fr_240px]">
          <div className="md min-w-0 max-w-3xl !text-[15.5px] sm:!text-[17px]" dangerouslySetInnerHTML={{ __html: html }} />
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
        <section className="mx-auto mt-12 max-w-6xl px-4 sm:mt-16 sm:px-6">
          <h2 className="text-xl font-bold">Keep reading</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3">
            {more.map((m) => <Link key={m.id} href={`/blog/${m.slug}`} className="panel p-5 hover:border-brand-500"><div className="font-semibold">{m.title}</div><p className="muted mt-2 text-sm">{m.excerpt}</p></Link>)}
          </div>
        </section>
      )}
      <CtaBand />
    </>
  );
}
