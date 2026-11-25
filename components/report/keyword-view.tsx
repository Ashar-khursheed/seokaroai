import path from "node:path";
import { listFiles, readJson, type KeywordInput } from "@/lib/files";
import { CancelRunButton, LiveLog, PrintButton } from "@/components/client";
import { Card, ScoreRing, SevBadge, StatusPill, sevBorder } from "@/components/ui";
import { FileLinks, FileView, MarkdownFile, RunShell, SideGroup, SideLink, href, type ViewProps } from "./shared";

interface Serp { source?: string; note?: string; results?: { position: number; url: string; title?: string; domain?: string }[] }
type Cell = string | number | boolean | null | undefined;
interface Comparison {
  our_position?: number | null;
  score?: number;
  intent?: { serp_intent?: string; winning_page_type?: string; our_page_type?: string; match?: boolean; note?: string };
  pages?: { key: string; label?: string; url?: string; title?: string }[];
  metrics?: ({ key?: string; label?: string; verdict?: string; note?: string } & Record<string, Cell>)[];
  topics?: ({ topic: string } & Record<string, Cell>)[];
}
interface Rec {
  priority?: string; title?: string; action?: string; our_page_now?: string; expected_impact?: string;
  effort?: string; verify?: string; evidence?: { page?: string; observation?: string }[];
}

const COLS = ["target", "c1", "c2", "c3"];
const show = (v: Cell) => (v === true ? "✓" : v === false ? "✗" : v == null || v === "" ? "–" : String(v));
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

export function KeywordView({ run, dir, view, file }: ViewProps) {
  const id = run.id;
  const input = JSON.parse(run.input) as KeywordInput;
  const running = run.status === "running" || run.status === "queued";
  const serp = readJson<Serp>(path.join(dir, "serp.json"));
  const cmp = readJson<Comparison>(path.join(dir, "comparison.json"));
  const recsRaw = readJson<Rec[] | { recommendations?: Rec[] }>(path.join(dir, "recommendations.json"));
  const recs: Rec[] = Array.isArray(recsRaw) ? recsRaw : recsRaw?.recommendations ?? [];
  const files = listFiles(dir);
  const pageLabel = (k?: string) => cmp?.pages?.find((p) => p.key === k)?.label ?? (k === "target" ? "Your page" : k ?? "");
  const v = file ? "file" : view || (cmp ? "battle" : "log");

  const side = (
    <>
      <div className="px-4 pb-2">
        <div className="text-xs font-bold uppercase tracking-wider text-brand-600">Keyword battle</div>
        <div className="break-words font-bold">“{input.keyword}”</div>
        <div className="muted truncate text-xs">{input.targetUrl}</div>
        <div className="mt-1"><StatusPill status={run.status} /></div>
      </div>
      <SideGroup title="Battle">
        <SideLink to={href(id, { view: "battle" })} active={v === "battle"}>Side-by-side</SideLink>
        <SideLink to={href(id, { view: "recs" })} active={v === "recs"}>Recommendations ({recs.length})</SideLink>
        <SideLink to={href(id, { view: "report" })} active={v === "report"}>Full report</SideLink>
        <SideLink to={href(id, { view: "log" })} active={v === "log"}>Live activity</SideLink>
      </SideGroup>
      <SideGroup title="Files"><FileLinks id={id} files={files} current={file} /></SideGroup>
    </>
  );

  return (
    <RunShell side={side}>
      {v === "file" && file && <Card><FileView id={id} dir={dir} rel={file} /></Card>}
      {v === "log" && (
        <Card title={<span className="flex flex-wrap items-center gap-3">Live activity {running && <CancelRunButton id={id} />}</span>}>
          {run.error && <div className="mb-3 break-words rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{run.error}</div>}
          <LiveLog id={id} running={running} />
        </Card>
      )}
      {v === "report" && <Card><MarkdownFile dir={dir} rel="REPORT.md" fallback={<div className="muted">REPORT.md is not there yet.</div>} /></Card>}

      {v === "battle" && (
        <>
          <section className="panel flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6 sm:p-6">
            <ScoreRing score={cmp?.score ?? null} size={120} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-600">How competitive your page is today</div>
              <h1 className="break-words text-xl font-bold sm:text-2xl">“{input.keyword}”</h1>
              <div className="muted truncate text-sm">{input.targetUrl} · {input.country}</div>
              <div className="mt-2 text-sm">Your position: <b>{cmp?.our_position ? `#${cmp.our_position}` : "not in the results checked"}</b></div>
            </div>
            <div className="print:hidden">{running ? <CancelRunButton id={id} /> : <PrintButton />}</div>
          </section>
          {running && <Card title="Running now"><LiveLog id={id} running compact /></Card>}

          {serp?.results && (
            <Card title="Who ranks">
              <div className={`mb-3 rounded-lg p-2 text-xs ${serp.source === "dataforseo" ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>{serp.note || (serp.source === "dataforseo" ? "Live Google results" : "Web search results (directional)")}</div>
              <ol className="space-y-1.5 text-sm">{serp.results.slice(0, 10).map((r) => {
                const ours = host(r.url) && host(r.url) === host(input.targetUrl);
                return (
                  <li key={`${r.position}-${r.url}`} className={`flex gap-3 rounded-lg px-2 py-1 ${ours ? "bg-brand-50 font-semibold dark:bg-brand-700/30" : r.position <= 3 ? "panel2" : ""}`}>
                    <b className="w-6 shrink-0 text-right">{r.position}</b>
                    <span className="min-w-0 flex-1"><span className="block truncate">{r.title || r.domain}</span><a className="block truncate text-xs text-brand-500" href={r.url} target="_blank" rel="noopener noreferrer">{r.url}</a></span>
                  </li>
                );
              })}</ol>
            </Card>
          )}

          {cmp?.intent && (
            <Card title="Search intent">
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div className="min-w-0 break-words"><div className="muted text-xs">What Google rewards</div><b>{cmp.intent.serp_intent}</b></div>
                <div className="min-w-0 break-words"><div className="muted text-xs">Page type that wins</div><b>{cmp.intent.winning_page_type}</b></div>
                <div className="min-w-0 break-words"><div className="muted text-xs">Your page type</div><b className={cmp.intent.match ? "text-low" : "text-crit"}>{cmp.intent.our_page_type} {cmp.intent.match ? "✓ match" : "✗ mismatch"}</b></div>
              </div>
              {cmp.intent.note && <p className="muted mt-3 text-sm">{cmp.intent.note}</p>}
            </Card>
          )}

          {cmp?.metrics && (
            <Card title="Side by side: your page vs the top 3">
              <div className="table-wrap">
                <table className="w-full min-w-[760px] border-collapse text-sm">
                  <thead><tr className="panel2">
                    <th className="border line p-2 text-left">Signal</th>
                    {COLS.map((c) => {
                      const p = cmp.pages?.find((x) => x.key === c);
                      return <th key={c} className={`border line p-2 text-left ${c === "target" ? "text-brand-600" : ""}`}>{pageLabel(c)}{p?.url && <a className="block truncate text-[11px] font-normal text-brand-500" href={p.url} target="_blank" rel="noopener noreferrer">{p.url.replace(/^https?:\/\//, "").slice(0, 40)}</a>}</th>;
                    })}
                  </tr></thead>
                  <tbody>{cmp.metrics.map((m, i) => (
                    <tr key={i} className="align-top">
                      <td className="wrap border line p-2"><div className="font-semibold">{m.label ?? m.key}</div>{m.note && <div className="muted text-xs">{m.note}</div>}</td>
                      {COLS.map((c) => (
                        <td key={c} className={`wrap border line p-2 ${c === "target" ? (m.verdict === "gap" ? "bg-rose-50 font-semibold text-rose-900" : m.verdict === "ahead" ? "bg-emerald-50 font-semibold text-emerald-900" : "font-semibold") : ""}`}>{show(m[c])}</td>
                      ))}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <p className="muted mt-2 text-xs">Red: you are behind the top 3. Green: you are ahead.</p>
            </Card>
          )}

          {cmp?.topics && cmp.topics.length > 0 && (
            <Card title="Subtopics the top 3 cover">
              <div className="table-wrap">
                <table className="w-full min-w-[600px] border-collapse text-sm">
                  <thead><tr className="panel2"><th className="border line p-2 text-left">Subtopic</th>{COLS.map((c) => <th key={c} className="border line p-2">{pageLabel(c)}</th>)}</tr></thead>
                  <tbody>{cmp.topics.map((t, i) => {
                    const missing = !t.target && ["c1", "c2", "c3"].filter((c) => t[c] === true).length >= 2;
                    return (
                      <tr key={i} className={missing ? "bg-rose-50 text-rose-900" : ""}>
                        <td className="wrap border line p-2">{t.topic}{missing && <b className="ml-2 text-xs">missing on your page</b>}</td>
                        {COLS.map((c) => <td key={c} className="border line p-2 text-center">{t[c] === true ? "✓" : t[c] === false ? "–" : show(t[c])}</td>)}
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            </Card>
          )}

          {recs.length > 0 && <Card title="Top fixes"><RecList recs={recs.slice(0, 5)} pageLabel={pageLabel} /></Card>}
          {!cmp && !running && <Card><div className="muted">comparison.json was not produced{run.error ? `: ${run.error}` : "."}</div></Card>}
        </>
      )}

      {v === "recs" && <Card title={`Recommendations (${recs.length})`}>{recs.length === 0 ? <div className="muted">recommendations.json is not there yet.</div> : <RecList recs={recs} pageLabel={pageLabel} />}</Card>}
    </RunShell>
  );
}

function RecList({ recs, pageLabel }: { recs: Rec[]; pageLabel: (k?: string) => string }) {
  return (
    <div className="space-y-3">{recs.map((r, i) => (
      <div key={i} className={`panel2 break-words rounded-xl border-l-4 p-3.5 sm:p-4 ${sevBorder(r.priority)}`}>
        <div className="flex flex-wrap items-center gap-2 font-bold"><SevBadge s={r.priority} /> {r.title}{r.effort && <span className="muted text-xs font-normal">effort {r.effort}</span>}</div>
        {r.action && <p className="mt-2 whitespace-pre-wrap text-sm"><b>Do this:</b> {r.action}</p>}
        {(r.evidence ?? []).length > 0 && (
          <div className="mt-2 rounded-lg border line p-2 text-sm" style={{ background: "var(--panel)" }}>
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-brand-600">Competitor evidence</div>
            <ul className="space-y-1">{r.evidence!.map((e, j) => <li key={j}><b>{pageLabel(e.page)}:</b> {e.observation}</li>)}</ul>
          </div>
        )}
        <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
          {r.our_page_now && <div><span className="muted">Your page now: </span>{r.our_page_now}</div>}
          {r.expected_impact && <div><span className="muted">Impact: </span>{r.expected_impact}</div>}
          {r.verify && <div><span className="muted">Check: </span>{r.verify}</div>}
        </div>
      </div>
    ))}</div>
  );
}
