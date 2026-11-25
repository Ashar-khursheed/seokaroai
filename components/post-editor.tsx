"use client";

import { useMemo, useState } from "react";
import { renderMarkdown } from "@/lib/markdown";
import { ActionForm, SubmitButton, type FormState } from "@/components/client";
import type { Post } from "@/lib/db/schema";

interface Check { ok: boolean; warn?: boolean; text: string }

function seoChecks(f: { title: string; metaTitle: string; metaDescription: string; focus: string; content: string; slug: string; excerpt: string }): Check[] {
  const kw = f.focus.trim().toLowerCase();
  const text = f.content.toLowerCase();
  const words = f.content.split(/\s+/).filter(Boolean).length;
  const title = (f.metaTitle || f.title).trim();
  const desc = (f.metaDescription || f.excerpt).trim();
  const h2 = (f.content.match(/^##\s+/gm) ?? []).length;
  const firstPara = text.split(/\n\s*\n/).find((p) => p.trim() && !p.trim().startsWith("#")) ?? "";
  const internal = (f.content.match(/\]\((\/[^)]*)\)/g) ?? []).length;
  const external = (f.content.match(/\]\((https?:\/\/[^)]*)\)/g) ?? []).length;
  const checks: Check[] = [
    { ok: title.length >= 30 && title.length <= 60, warn: title.length > 0, text: `SEO title is ${title.length} characters (aim for 30–60)` },
    { ok: desc.length >= 120 && desc.length <= 160, warn: desc.length > 0, text: `Meta description is ${desc.length} characters (aim for 120–160)` },
    { ok: words >= 900, warn: words >= 500, text: `${words} words (most guides that rank are 900+)` },
    { ok: h2 >= 3, warn: h2 >= 1, text: `${h2} H2 sections (use 3+ to structure the post)` },
    { ok: internal >= 2, warn: internal >= 1, text: `${internal} internal links (link 2+ related pages, e.g. /features/...)` },
    { ok: external >= 1, text: `${external} external sources cited` },
    { ok: /^[a-z0-9-]{3,80}$/.test(f.slug || "x"), text: "URL slug is short and readable" },
  ];
  if (kw) {
    checks.push(
      { ok: title.toLowerCase().includes(kw), text: "Focus keyword in the SEO title" },
      { ok: desc.toLowerCase().includes(kw), text: "Focus keyword in the meta description" },
      { ok: firstPara.includes(kw), text: "Focus keyword in the first paragraph" },
      { ok: (f.content.match(/^##.*$/gm) ?? []).some((h) => h.toLowerCase().includes(kw)), warn: true, text: "Focus keyword in at least one H2" },
      { ok: !f.slug || f.slug.includes(kw.split(" ")[0]), warn: true, text: "Focus keyword in the URL slug" },
    );
  } else {
    checks.push({ ok: false, text: "Add a focus keyword to check keyword placement" });
  }
  return checks;
}

export function PostEditor({ post, action }: { post?: Post | null; action: (s: FormState, fd: FormData) => Promise<FormState> }) {
  const [f, setF] = useState({
    title: post?.title ?? "", slug: post?.slug ?? "", excerpt: post?.excerpt ?? "", content: post?.content ?? "",
    metaTitle: post?.metaTitle ?? "", metaDescription: post?.metaDescription ?? "", focus: post?.focusKeyword ?? "",
  });
  const [tab, setTab] = useState<"write" | "preview">("write");
  const checks = useMemo(() => seoChecks(f), [f]);
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const local = (d: Date | null | undefined) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

  return (
    <ActionForm action={action} className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-4">
        <input type="hidden" name="id" value={post?.id ?? ""} />
        <input name="title" value={f.title} onChange={set("title")} required placeholder="Post title (H1)" className="input !text-lg sm:!text-xl !font-bold" />
        <div className="flex flex-col gap-1.5 text-sm sm:flex-row sm:items-center sm:gap-2"><span className="muted shrink-0">/blog/</span><input name="slug" value={f.slug} onChange={set("slug")} placeholder="auto-from-title" className="input min-w-0 !py-1.5" /></div>
        <textarea name="excerpt" value={f.excerpt} onChange={set("excerpt")} rows={2} maxLength={400} placeholder="Excerpt: one or two sentences shown on the blog list and under the title" className="input" />
        <div className="panel overflow-hidden">
          <div className="flex flex-wrap items-center border-b line text-sm">
            {(["write", "preview"] as const).map((t) => <button key={t} type="button" onClick={() => setTab(t)} className={`px-4 py-2 font-semibold capitalize ${tab === t ? "border-b-2 border-brand-500" : "muted"}`}>{t}</button>)}
            <span className="muted px-3 py-1.5 text-xs sm:ml-auto sm:py-0">Markdown · ## for H2 · [text](/features/rank-tracker) for links</span>
          </div>
          <textarea name="content" value={f.content} onChange={set("content")} rows={28} className={`w-full resize-y bg-transparent p-3.5 sm:p-4 font-mono text-sm outline-none ${tab === "write" ? "" : "hidden"}`} placeholder="Write your post in Markdown…" />
          {tab === "preview" && <div className="md max-h-[70vh] overflow-auto p-4 sm:p-6" dangerouslySetInnerHTML={{ __html: renderMarkdown(f.content || "_Nothing to preview yet._") }} />}
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        <div className="panel space-y-3 p-4">
          <div className="text-sm font-bold">Publish</div>
          <select name="status" defaultValue={post?.status ?? "draft"} className="input"><option value="draft">Draft</option><option value="published">Published</option></select>
          <label className="block text-xs"><span className="muted">Publish date (future = scheduled)</span><input type="datetime-local" name="publishedAt" defaultValue={local(post?.publishedAt)} className="input mt-1" /></label>
          <SubmitButton className="btn btn-primary w-full justify-center" pendingText="Saving…">Save</SubmitButton>
        </div>
        <div className="panel space-y-3 p-4">
          <div className="flex items-center justify-between"><span className="text-sm font-bold">SEO</span><span className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${score >= 80 ? "bg-emerald-600" : score >= 50 ? "bg-amber-500" : "bg-rose-600"}`}>{score}/100</span></div>
          <input name="focusKeyword" value={f.focus} onChange={set("focus")} placeholder="Focus keyword" className="input" />
          <input name="metaTitle" value={f.metaTitle} onChange={set("metaTitle")} maxLength={200} placeholder="SEO title (defaults to post title)" className="input" />
          <textarea name="metaDescription" value={f.metaDescription} onChange={set("metaDescription")} rows={3} maxLength={300} placeholder="Meta description (defaults to excerpt)" className="input" />
          <div className="rounded-lg border line p-3" style={{ background: "var(--panel2)" }}>
            <div className="truncate text-[15px] text-[#1a0dab] dark:text-[#8ab4f8]">{f.metaTitle || f.title || "Post title"}</div>
            <div className="truncate text-xs text-emerald-700">seokaroai.com › blog › {f.slug || "post-url"}</div>
            <div className="muted line-clamp-2 text-xs">{f.metaDescription || f.excerpt || "Meta description preview"}</div>
          </div>
          <ul className="space-y-1.5 text-xs">{checks.map((c) => <li key={c.text} className="flex gap-2"><span className={`shrink-0 ${c.ok ? "text-emerald-600" : c.warn ? "text-amber-500" : "text-rose-600"}`}>{c.ok ? "✓" : c.warn ? "!" : "✗"}</span><span className="min-w-0 break-words">{c.text}</span></li>)}</ul>
        </div>
        <div className="panel space-y-3 p-4">
          <div className="text-sm font-bold">Details</div>
          <input name="tags" defaultValue={post?.tags ?? ""} placeholder="Tags, comma separated" className="input" />
          <input name="authorName" defaultValue={post?.authorName ?? "SEOKaroAI Team"} placeholder="Author name" className="input" />
          <input name="coverImage" defaultValue={post?.coverImage ?? ""} placeholder="Cover image URL (https://…)" className="input" />
        </div>
      </div>
    </ActionForm>
  );
}
