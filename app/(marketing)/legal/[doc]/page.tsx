import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LEGAL } from "@/lib/content/legal";
import { renderMarkdown } from "@/lib/markdown";

export function generateStaticParams() {
  return Object.keys(LEGAL).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const d = LEGAL[(await params).doc];
  return d ? { title: d.title, description: d.description, alternates: { canonical: `/legal/${(await params).doc}` } } : {};
}

export default async function Legal({ params }: { params: Promise<{ doc: string }> }) {
  const d = LEGAL[(await params).doc];
  if (!d) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 pt-10 sm:px-6 sm:pt-16">
      <h1 className="break-words text-[2rem] font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">{d.title}</h1>
      <div className="md mt-6 sm:mt-8" dangerouslySetInnerHTML={{ __html: renderMarkdown(d.body) }} />
    </article>
  );
}
