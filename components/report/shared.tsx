import path from "node:path";
import Link from "next/link";
import { readText, safeJoin, type FileEntry } from "@/lib/files";
import { renderMarkdown } from "@/lib/markdown";
import { fileUrl, kb } from "@/components/ui";
import type { Run } from "@/lib/db/schema";

export interface ViewProps {
  run: Run;
  dir: string;
  view?: string;
  file?: string;
}

export function href(id: string, q: Record<string, string>) {
  return `/app/runs/${encodeURIComponent(id)}?${new URLSearchParams(q).toString()}`;
}

export function Markdown({ src }: { src: string }) {
  return <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(src) }} />;
}

export function MarkdownFile({ dir, rel, fallback }: { dir: string; rel: string; fallback?: React.ReactNode }) {
  const txt = readText(path.join(dir, rel));
  return txt ? <Markdown src={txt} /> : <>{fallback ?? null}</>;
}

/** Render any file from the run folder according to its type. */
export function FileView({ id, dir, rel }: { id: string; dir: string; rel: string }) {
  const abs = safeJoin(dir, rel);
  if (!abs) return <div className="muted">Invalid path.</div>;
  const ext = path.extname(rel).toLowerCase();
  const url = fileUrl(id, rel);
  const toolbar = (
    <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
      <code className="min-w-0 break-all text-sm font-semibold">{rel}</code>
      <a className="btn !py-1 text-xs" href={url} target="_blank" rel="noopener">Open raw</a>
      <a className="btn !py-1 text-xs" href={fileUrl(id, rel, true)}>Download</a>
    </div>
  );
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) return <div>{toolbar}<img src={url} alt={rel} className="max-w-full rounded-lg border line" /></div>;
  if ([".html", ".htm", ".pdf"].includes(ext)) {
    // The files route serves HTML with a CSP `sandbox` header (opaque origin).
    return <div>{toolbar}<iframe src={url} title={rel} className="h-[65vh] w-full rounded-xl border line bg-white sm:h-[80vh]" /></div>;
  }
  const txt = readText(abs);
  if (txt == null) return <div>{toolbar}<div className="muted">File is too large to preview. Use Download.</div></div>;
  if (ext === ".md") return <div>{toolbar}<Markdown src={txt} /></div>;
  let body = txt;
  if (ext === ".json") { try { body = JSON.stringify(JSON.parse(txt), null, 2); } catch { /* raw */ } }
  return <div>{toolbar}<pre className="panel2 max-h-[75vh] max-w-full overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words rounded-xl border line p-3 text-[12.5px] sm:p-4">{body.slice(0, 400_000)}</pre></div>;
}

export function SideLink({ to, active, children }: { to: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link href={to} className={`block truncate border-l-[3px] px-4 py-1.5 text-[13px] ${active ? "border-brand-500 bg-[var(--panel2)] font-semibold" : "border-transparent hover:bg-[var(--panel2)]"}`}>
      {children}
    </Link>
  );
}

export function SideGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mt-4"><h4 className="muted mb-1 px-4 text-[11px] font-bold uppercase tracking-wider">{title}</h4>{children}</div>;
}

export function FileLinks({ id, files, current, strip = "" }: { id: string; files: FileEntry[]; current?: string; strip?: string }) {
  return <>{files.map((f) => (
    <SideLink key={f.path} to={href(id, { file: f.path })} active={current === f.path}>
      {f.path.slice(strip.length)} <span className="muted text-[11px]">{kb(f.size)}</span>
    </SideLink>
  ))}</>;
}

export function RunShell({ side, children }: { side: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="panel h-fit min-w-0 shrink-0 py-3 print:hidden lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:w-72 lg:overflow-y-auto">{side}</aside>
      <div className="min-w-0 flex-1 space-y-5">{children}</div>
    </div>
  );
}
