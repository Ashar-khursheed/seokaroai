import path from "node:path";
import { readJson } from "@/lib/files";
import type { QuickReport } from "@/lib/engine/quick";
import { Card, ScoreRing, SevBadge, scoreColor, sevBorder } from "@/components/ui";
import { CancelRunButton, LiveLog, PrintButton } from "@/components/client";
import type { ViewProps } from "./shared";

const FACT_LABELS: Record<string, string> = {
  pages_checked: "Pages checked", avg_word_count: "Average words per page", images_missing_alt: "Images without alt text",
  pages_missing_title: "Pages without a title", pages_missing_meta_description: "Pages without a meta description",
  pages_missing_h1: "Pages without an H1", pages_thin_content: "Thin pages", tls_days_until_expiry: "Days until certificate expires",
  tls_protocol: "TLS version", https_redirect: "HTTP redirects to HTTPS", security_headers_present: "Security headers present",
  sitemaps_found: "Sitemaps found", sitemap_urls: "URLs in sitemaps", robots_status: "robots.txt status",
  agent_checks_passed: "AI readiness checks passed", llms_txt_status: "llms.txt status", performance_score: "Lighthouse performance",
  seo_score: "Lighthouse SEO", lcp_ms: "LCP (ms)", cls: "CLS", tbt_ms: "Total blocking time (ms)",
};

export function QuickView({ run, dir }: ViewProps) {
  const r = readJson<QuickReport>(path.join(dir, "quick-report.json"));
  const running = run.status === "running" || run.status === "queued";
  const input = JSON.parse(run.input) as { url: string };
  return (
    <div className="space-y-5">
      <section className="panel flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6 sm:p-6">
        <ScoreRing score={r?.score ?? null} size={120} />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-600">Site audit</div>
          <h1 className="truncate text-xl font-semibold tracking-[-0.02em] sm:text-2xl">{input.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</h1>
          <div className="muted mt-1 text-sm">{r ? `${r.pages.length} pages checked · ${new Date(r.generated_at).toLocaleString()}` : run.status === "failed" ? run.error : "Running…"}</div>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">{running ? <CancelRunButton id={run.id} /> : <PrintButton />}</div>
      </section>

      {(running || !r) && <Card title={running ? "Running now" : "Activity"}><LiveLog id={run.id} running={running} compact={!running ? false : true} /></Card>}

      {r && (
        <>
          <Card title="Category scores">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
              {r.categories.map((c) => (
                <a key={c.key} href={`#cat-${c.key}`} className="panel2 rounded-xl p-3.5 text-center hover:opacity-80 sm:p-4">
                  <div className="text-3xl font-semibold tracking-[-0.02em]" style={{ color: scoreColor(c.score) }}>{c.score ?? "–"}</div>
                  <div className="mt-1 text-sm font-semibold">{c.label}</div>
                  {c.note && <div className="muted mt-1 text-[11px]">{c.note}</div>}
                </a>
              ))}
            </div>
          </Card>

          {r.categories.map((c) => (
            <section key={c.key} id={`cat-${c.key}`} className="panel scroll-mt-6 p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-4"><ScoreRing score={c.score} size={60} /><h2 className="min-w-0 break-words text-lg font-bold">{c.label}</h2></div>
              {Object.keys(c.facts).length > 0 && (
                <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(c.facts).filter(([, v]) => v != null && v !== "").map(([k, v]) => (
                    <div key={k} className="panel2 flex justify-between gap-2 rounded-lg px-3 py-2"><dt className="muted min-w-0 break-words">{FACT_LABELS[k] ?? k}</dt><dd className="min-w-0 break-all text-right font-semibold">{String(v)}</dd></div>
                  ))}
                </dl>
              )}
              {c.issues.length === 0 ? <p className="text-sm text-low">No issues found{c.score == null ? " (not measured)" : ""}.</p> : (
                <div className="space-y-2">
                  {c.issues.map((i) => (
                    <details key={i.id + i.title} className={`panel2 break-words rounded-lg border-l-4 px-3 py-3 sm:px-4 ${sevBorder(i.severity)}`}>
                      <summary className="cursor-pointer list-none font-semibold"><span className="mr-2"><SevBadge s={i.severity} /></span>{i.title}{i.affected_pages ? <span className="muted ml-2 text-xs font-normal">{i.affected_pages} page{i.affected_pages === 1 ? "" : "s"}</span> : null}</summary>
                      {i.detail && <p className="mt-2 text-sm">{i.detail}</p>}
                      {i.evidence && <p className="muted mt-1 break-words text-xs">Evidence: {i.evidence}</p>}
                      {i.urls && i.urls.length > 0 && <ul className="muted mt-2 list-disc space-y-0.5 pl-5 text-xs">{i.urls.slice(0, 12).map((u) => <li key={u} className="break-all">{u}</li>)}</ul>}
                    </details>
                  ))}
                </div>
              )}
            </section>
          ))}

          <Card title={`Pages (${r.pages.length})`}>
            <div className="table-wrap">
              <table className="w-full min-w-[640px] text-sm">
                <thead><tr className="muted border-b line text-left text-xs"><th className="py-2">Page</th><th>Status</th><th>Score</th><th>Words</th><th>Issues</th></tr></thead>
                <tbody>{r.pages.map((p) => (
                  <tr key={p.url} className="border-b line last:border-0">
                    <td className="max-w-[360px] py-2"><div className="truncate font-medium">{p.title || p.url}</div><div className="muted truncate text-xs">{p.url}</div></td>
                    <td>{p.status ?? "–"}</td><td><b style={{ color: scoreColor(p.score) }}>{p.score ?? "–"}</b></td><td>{p.word_count ?? "–"}</td>
                    <td className="muted text-xs">{p.error ?? `${p.findings.length}`}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
